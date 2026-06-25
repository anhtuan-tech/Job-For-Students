using System.Security.Claims;
using JobForStudents.Data;
using JobForStudents.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Controllers;

[Authorize]
public class FeedbackController : Controller
{
    private readonly AppDbContext _context;

    public FeedbackController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idStr, out var id)) return id;
        return null;
    }

    // Map label hiển thị trên form (tiếng Việt) sang enum type
    private static FeedbackType ParseType(string? type)
    {
        return type switch
        {
            "Báo lỗi hệ thống" => FeedbackType.BugReport,
            _ => FeedbackType.Suggestion
        };
    }

    private static string TypeLabel(FeedbackType type) => type switch
    {
        FeedbackType.BugReport => "Báo lỗi hệ thống",
        _ => "Góp ý"
    };

    private static string StatusLabel(FeedbackStatus status) => status switch
    {
        FeedbackStatus.InProgress => "Đang xử lý",
        FeedbackStatus.Resolved => "Đã xử lý",
        _ => "Đã ghi nhận"
    };

    [HttpPost]
    public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackInput input)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(input?.Title) || string.IsNullOrWhiteSpace(input?.Details))
        {
            return Json(new { success = false, message = "Vui lòng nhập đầy đủ tiêu đề và nội dung." });
        }

        var feedback = new Feedback
        {
            UserId = currentUserId.Value,
            Type = ParseType(input.Type),
            Title = input.Title.Trim(),
            Details = input.Details.Trim(),
            Status = FeedbackStatus.Received,
            CreatedAt = DateTime.UtcNow
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            message = "Đã gửi phản hồi.",
            feedback = new
            {
                feedback.Id,
                feedback.Title,
                Type = TypeLabel(feedback.Type),
                Status = StatusLabel(feedback.Status),
                CreatedAt = feedback.CreatedAt.ToString("HH:mm dd/MM/yyyy")
            }
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyFeedback()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var items = await _context.Feedbacks
            .Where(f => f.UserId == currentUserId.Value)
            .OrderByDescending(f => f.CreatedAt)
            .Take(5)
            .Select(f => new
            {
                f.Id,
                f.Title,
                f.Type,
                f.Status,
                f.CreatedAt
            })
            .ToListAsync();

        var result = items.Select(f => new
        {
            f.Id,
            f.Title,
            Type = TypeLabel(f.Type),
            Status = StatusLabel(f.Status),
            CreatedAt = f.CreatedAt.ToString("HH:mm dd/MM/yyyy")
        });

        return Json(new { success = true, items = result });
    }

    // ===== Admin =====

    [HttpGet]
    public async Task<IActionResult> GetAllFeedback()
    {
        if (!User.IsInRole("Admin")) return Forbid();

        var items = await _context.Feedbacks
            .Include(f => f.User)
                .ThenInclude(u => u.StudentProfile)
            .Include(f => f.User)
                .ThenInclude(u => u.BusinessProfile)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                f.Id,
                f.Title,
                f.Type,
                f.Details,
                f.Status,
                f.CreatedAt,
                UserEmail = f.User.Email,
                UserName = f.User.StudentProfile != null ? f.User.StudentProfile.FullName
                    : (f.User.BusinessProfile != null ? f.User.BusinessProfile.CompanyName : f.User.Email)
            })
            .ToListAsync();

        var result = items.Select(f => new
        {
            f.Id,
            f.Title,
            f.Details,
            Type = TypeLabel(f.Type),
            Status = f.Status.ToString(),
            StatusLabel = StatusLabel(f.Status),
            CreatedAt = f.CreatedAt.ToString("HH:mm dd/MM/yyyy"),
            f.UserEmail,
            f.UserName
        });

        return Json(new { success = true, items = result });
    }

    [HttpPost]
    public async Task<IActionResult> UpdateStatus([FromForm] int id, [FromForm] string status)
    {
        if (!User.IsInRole("Admin")) return Forbid();

        if (!Enum.TryParse<FeedbackStatus>(status, out var parsedStatus))
        {
            return Json(new { success = false, message = "Trạng thái không hợp lệ." });
        }

        var feedback = await _context.Feedbacks.FirstOrDefaultAsync(f => f.Id == id);
        if (feedback == null) return NotFound();

        feedback.Status = parsedStatus;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã cập nhật trạng thái.", status = StatusLabel(parsedStatus) });
    }
}

public class FeedbackInput
{
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Details { get; set; } = null!;
}