using System.Security.Claims;
using JobForStudents.Data;
using JobForStudents.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Controllers;

[Authorize]
public class ReviewController : Controller
{
    private readonly AppDbContext _context;

    public ReviewController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idStr, out var id)) return id;
        return null;
    }

    [HttpPost]
    public async Task<IActionResult> Reply([FromForm] int parentReviewId, [FromForm] string comment)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(comment))
        {
            return BadRequest(new { success = false, message = "Nội dung phản hồi không được để trống." });
        }

        var parentReview = await _context.Reviews
            .Include(r => r.JobContract)
            .FirstOrDefaultAsync(r => r.Id == parentReviewId);

        if (parentReview == null) return NotFound();

        // Check if current user is part of the contract
        if (parentReview.JobContract.StudentId != currentUserId.Value && parentReview.JobContract.BusinessId != currentUserId.Value)
        {
            return Forbid();
        }

        var reply = new Review
        {
            ContractId = parentReview.ContractId,
            ReviewerId = currentUserId.Value,
            ParentReviewId = parentReview.Id,
            Comment = comment,
            Rating = 0, // Replies don't have a rating
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(reply);

        // Send Notification
        var notifyUserId = parentReview.ReviewerId;
        if (notifyUserId != currentUserId.Value)
        {
            var notification = new Notification
            {
                UserId = notifyUserId,
                Title = "Phản hồi đánh giá",
                Message = $"Ai đó đã phản hồi nhận xét của bạn.",
                Type = NotificationType.System,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã gửi phản hồi thành công." });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyReviews()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập." });

            var reviewsRaw = await _context.Reviews
                .Include(r => r.JobContract)
                    .ThenInclude(jc => jc.JobPost)
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.BusinessProfile)
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.StudentProfile)
                .Include(r => r.Replies)
                .Where(r => r.JobContract.StudentId == currentUserId.Value && r.ReviewerId != currentUserId.Value && r.ParentReviewId == null)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var reviews = reviewsRaw.Select(r => new
            {
                id = r.Id,
                reviewer = r.Reviewer != null 
                    ? (r.Reviewer.BusinessProfile != null 
                        ? r.Reviewer.BusinessProfile.CompanyName 
                        : (r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.FullName : "Người dùng ẩn")) 
                    : "Người dùng ẩn",
                project = r.JobContract != null && r.JobContract.JobPost != null ? r.JobContract.JobPost.Title : "Dự án không xác định",
                rating = r.Rating,
                date = r.CreatedAt.ToString("dd/MM/yyyy"),
                comment = r.Comment ?? "",
                reply = r.Replies != null && r.Replies.Any() 
                    ? (r.Replies.OrderBy(rep => rep.CreatedAt).Select(rep => rep.Comment).FirstOrDefault() ?? "") 
                    : "",
                isReported = r.IsReported
            }).ToList();

            return Json(new { success = true, reviews = reviews });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = "Database Error: " + ex.Message + (ex.InnerException != null ? " | " + ex.InnerException.Message : "") });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Report([FromForm] int id, [FromForm] string reason)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập." });

        var review = await _context.Reviews
            .Include(r => r.JobContract)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null) return NotFound(new { success = false, message = "Không tìm thấy đánh giá." });

        if (review.JobContract.StudentId != currentUserId.Value)
        {
            return Forbid();
        }

        review.IsReported = true;
        
        var adminNotify = new Notification
        {
            UserId = 11, // Admin user ID from seed (admin@j4s.com)
            Title = "Báo cáo đánh giá không phù hợp",
            Message = $"Sinh viên ID {currentUserId.Value} đã báo cáo đánh giá #{id} với lý do: {reason}",
            Type = NotificationType.System,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(adminNotify);

        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã gửi báo cáo đánh giá thành công." });
    }
}
