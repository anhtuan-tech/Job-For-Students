using System.Security.Claims;
using JobForStudents.Data;
using JobForStudents.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Controllers;

[Authorize]
public class SupportController : Controller
{
    private readonly AppDbContext _context;

    public SupportController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idStr, out var id)) return id;
        return null;
    }

    // Map label hiển thị trên form (tiếng Việt) sang enum category
    private static SupportCategory ParseCategory(string? category)
    {
        return category switch
        {
            "Đăng tin tuyển dụng" => SupportCategory.JobPosting,
            "Thanh toán & ví" => SupportCategory.PaymentWallet,
            "Tài khoản" => SupportCategory.Account,
            _ => SupportCategory.Other
        };
    }

    private static string CategoryLabel(SupportCategory category) => category switch
    {
        SupportCategory.JobPosting => "Đăng tin tuyển dụng",
        SupportCategory.PaymentWallet => "Thanh toán & ví",
        SupportCategory.Account => "Tài khoản",
        _ => "Khác"
    };

    private static string StatusLabel(SupportRequestStatus status) => status switch
    {
        SupportRequestStatus.InProgress => "Đang xử lý",
        SupportRequestStatus.Resolved => "Đã xử lý",
        _ => "Đã tiếp nhận"
    };

    [HttpPost]
    public async Task<IActionResult> SubmitRequest([FromBody] SupportRequestInput input)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(input?.Subject) || string.IsNullOrWhiteSpace(input?.Message))
        {
            return Json(new { success = false, message = "Vui lòng nhập đầy đủ tiêu đề và nội dung." });
        }

        var supportRequest = new SupportRequest
        {
            UserId = currentUserId.Value,
            Subject = input.Subject.Trim(),
            Category = ParseCategory(input.Category),
            Message = input.Message.Trim(),
            Status = SupportRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.SupportRequests.Add(supportRequest);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            message = "Đã gửi yêu cầu hỗ trợ.",
            request = new
            {
                supportRequest.Id,
                supportRequest.Subject,
                Category = CategoryLabel(supportRequest.Category),
                Status = StatusLabel(supportRequest.Status),
                CreatedAt = supportRequest.CreatedAt.ToString("HH:mm dd/MM/yyyy")
            }
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyRequests()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var requests = await _context.SupportRequests
            .Where(sr => sr.UserId == currentUserId.Value)
            .OrderByDescending(sr => sr.CreatedAt)
            .Take(5)
            .Select(sr => new
            {
                sr.Id,
                sr.Subject,
                sr.Category,
                sr.Status,
                sr.CreatedAt
            })
            .ToListAsync();

        var result = requests.Select(sr => new
        {
            sr.Id,
            sr.Subject,
            Category = CategoryLabel(sr.Category),
            Status = StatusLabel(sr.Status),
            CreatedAt = sr.CreatedAt.ToString("HH:mm dd/MM/yyyy")
        });

        return Json(new { success = true, requests = result });
    }

    // ===== Admin =====

    [HttpGet]
    public async Task<IActionResult> GetAllRequests()
    {
        if (!User.IsInRole("Admin")) return Forbid();

        var requests = await _context.SupportRequests
            .Include(sr => sr.User)
                .ThenInclude(u => u.StudentProfile)
            .Include(sr => sr.User)
                .ThenInclude(u => u.BusinessProfile)
            .OrderByDescending(sr => sr.CreatedAt)
            .Select(sr => new
            {
                sr.Id,
                sr.Subject,
                sr.Category,
                sr.Message,
                sr.Status,
                sr.CreatedAt,
                UserEmail = sr.User.Email,
                UserName = sr.User.StudentProfile != null ? sr.User.StudentProfile.FullName
                    : (sr.User.BusinessProfile != null ? sr.User.BusinessProfile.CompanyName : sr.User.Email)
            })
            .ToListAsync();

        var result = requests.Select(sr => new
        {
            sr.Id,
            sr.Subject,
            sr.Message,
            Category = CategoryLabel(sr.Category),
            Status = sr.Status.ToString(),
            StatusLabel = StatusLabel(sr.Status),
            CreatedAt = sr.CreatedAt.ToString("HH:mm dd/MM/yyyy"),
            sr.UserEmail,
            sr.UserName
        });

        return Json(new { success = true, requests = result });
    }

    [HttpPost]
    public async Task<IActionResult> UpdateStatus([FromForm] int id, [FromForm] string status)
    {
        if (!User.IsInRole("Admin")) return Forbid();

        if (!Enum.TryParse<SupportRequestStatus>(status, out var parsedStatus))
        {
            return Json(new { success = false, message = "Trạng thái không hợp lệ." });
        }

        var request = await _context.SupportRequests.FirstOrDefaultAsync(sr => sr.Id == id);
        if (request == null) return NotFound();

        request.Status = parsedStatus;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã cập nhật trạng thái.", status = StatusLabel(parsedStatus) });
    }
}

public class SupportRequestInput
{
    public string Subject { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Message { get; set; } = null!;
}