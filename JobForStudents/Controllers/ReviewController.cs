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
}
