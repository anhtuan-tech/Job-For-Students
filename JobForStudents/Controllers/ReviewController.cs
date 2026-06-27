using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
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

    // GET: /Review/GetStudentCompletedContracts - Completed contracts for Student
    [Authorize(Roles = "Student")]
    [HttpGet]
    public async Task<IActionResult> GetStudentCompletedContracts()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập." });

        var contracts = await _context.JobContracts
            .Include(c => c.JobPost)
                .ThenInclude(jp => jp.BusinessProfile)
            .Include(c => c.Reviews)
            .Where(c => c.StudentId == currentUserId.Value && c.Status == ContractStatus.Completed)
            .OrderByDescending(c => c.CompletedAt)
            .ToListAsync();

        var result = contracts.Select(c => {
            var review = c.Reviews.FirstOrDefault(r => r.ReviewerId == currentUserId.Value && r.ParentReviewId == null);
            var canEdit = false;
            if (review != null)
            {
                canEdit = (DateTime.UtcNow - review.CreatedAt).TotalHours <= 24;
            }
            return new {
                contractId = c.Id,
                jobTitle = c.JobPost.Title,
                partnerId = c.BusinessId,
                partnerName = c.JobPost.BusinessProfile != null ? c.JobPost.BusinessProfile.CompanyName : "Doanh nghiệp ẩn",
                partnerAvatar = c.JobPost.BusinessProfile != null ? (c.JobPost.BusinessProfile.LogoUrl ?? "") : "",
                completedAt = c.CompletedAt?.ToString("dd/MM/yyyy HH:mm") ?? "",
                hasReview = review != null,
                review = review == null ? null : new {
                    id = review.Id,
                    rating = review.Rating,
                    comment = review.Comment,
                    createdAt = review.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                    canEdit = canEdit
                }
            };
        }).ToList();

        return Json(new { success = true, contracts = result });
    }

    // GET: /Review/GetBusinessCompletedContracts - Completed contracts for Business
    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetBusinessCompletedContracts()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập." });

        var contracts = await _context.JobContracts
            .Include(c => c.JobPost)
            .Include(c => c.StudentProfile)
            .Include(c => c.Reviews)
            .Where(c => c.BusinessId == currentUserId.Value && c.Status == ContractStatus.Completed)
            .OrderByDescending(c => c.CompletedAt)
            .ToListAsync();

        var result = contracts.Select(c => {
            var review = c.Reviews.FirstOrDefault(r => r.ReviewerId == currentUserId.Value && r.ParentReviewId == null);
            var canEdit = false;
            if (review != null)
            {
                canEdit = (DateTime.UtcNow - review.CreatedAt).TotalHours <= 24;
            }
            return new {
                contractId = c.Id,
                jobTitle = c.JobPost.Title,
                partnerId = c.StudentId,
                partnerName = c.StudentProfile.FullName,
                partnerAvatar = c.StudentProfile.AvatarUrl ?? "",
                completedAt = c.CompletedAt?.ToString("dd/MM/yyyy HH:mm") ?? "",
                hasReview = review != null,
                review = review == null ? null : new {
                    id = review.Id,
                    rating = review.Rating,
                    comment = review.Comment,
                    createdAt = review.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                    canEdit = canEdit
                }
            };
        }).ToList();

        return Json(new { success = true, contracts = result });
    }

    // POST: /Review/SaveReview - Unified Create/Edit 2-Way Review
    [HttpPost]
    public async Task<IActionResult> SaveReview([FromForm] int contractId, [FromForm] int rating, [FromForm] string comment)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập." });

        if (rating < 1 || rating > 5)
        {
            return BadRequest(new { success = false, message = "Đánh giá sao phải từ 1 đến 5." });
        }

        if (string.IsNullOrWhiteSpace(comment) || comment.Trim().Length < 10)
        {
            return BadRequest(new { success = false, message = "Nội dung nhận xét phải tối thiểu 10 ký tự." });
        }

        var contract = await _context.JobContracts
            .Include(c => c.Reviews)
            .FirstOrDefaultAsync(c => c.Id == contractId && (c.StudentId == currentUserId.Value || c.BusinessId == currentUserId.Value) && c.Status == ContractStatus.Completed);

        if (contract == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy hợp đồng đã hoàn thành." });
        }

        var existingReview = contract.Reviews.FirstOrDefault(r => r.ReviewerId == currentUserId.Value && r.ParentReviewId == null);

        if (existingReview != null)
        {
            // Edit existing review, check 24 hours constraint
            if ((DateTime.UtcNow - existingReview.CreatedAt).TotalHours > 24)
            {
                return BadRequest(new { success = false, message = "Đã quá 24 giờ kể từ khi gửi đánh giá, bạn không thể chỉnh sửa nữa." });
            }

            existingReview.Rating = rating;
            existingReview.Comment = comment.Trim();
            _context.Reviews.Update(existingReview);
        }
        else
        {
            // Create new review
            var review = new Review
            {
                ContractId = contract.Id,
                ReviewerId = currentUserId.Value,
                Rating = rating,
                Comment = comment.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Reviews.Add(review);

            // Notify partner
            var partnerId = contract.StudentId == currentUserId.Value ? contract.BusinessId : contract.StudentId;
            var notification = new Notification
            {
                UserId = partnerId,
                Title = "Đánh giá mới",
                Message = $"Bạn nhận được một đánh giá mới cho hợp đồng.",
                Type = NotificationType.System,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, message = "Lưu đánh giá thành công." });
    }

    // POST: /Review/Reply - Create review reply (Rating is NULL)
    [HttpPost]
    public async Task<IActionResult> Reply([FromForm] int parentReviewId, [FromForm] string comment)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập." });

        if (string.IsNullOrWhiteSpace(comment) || comment.Trim().Length < 10)
        {
            return BadRequest(new { success = false, message = "Nội dung phản hồi phải tối thiểu 10 ký tự." });
        }

        var parentReview = await _context.Reviews
            .Include(r => r.JobContract)
            .FirstOrDefaultAsync(r => r.Id == parentReviewId);

        if (parentReview == null) return NotFound(new { success = false, message = "Không tìm thấy đánh giá gốc." });

        // Check if current user is part of the contract
        if (parentReview.JobContract.StudentId != currentUserId.Value && parentReview.JobContract.BusinessId != currentUserId.Value)
        {
            return Forbid();
        }

        var existingReply = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ParentReviewId == parentReviewId && r.ReviewerId == currentUserId.Value);

        if (existingReply != null)
        {
            // Edit existing reply, check 24 hours constraint since it was created
            if ((DateTime.UtcNow - existingReply.CreatedAt).TotalHours > 24)
            {
                return BadRequest(new { success = false, message = "Đã quá 24 giờ kể từ khi gửi phản hồi, bạn không thể chỉnh sửa nữa." });
            }

            existingReply.Comment = comment.Trim();
            _context.Reviews.Update(existingReply);
            await _context.SaveChangesAsync();
            return Json(new { success = true, message = "Cập nhật phản hồi thành công." });
        }

        var reply = new Review
        {
            ContractId = parentReview.ContractId,
            ReviewerId = currentUserId.Value,
            ParentReviewId = parentReview.Id,
            Comment = comment.Trim(),
            Rating = null, // Strictly NULL for replies so database AVG() ignores it!
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
                Message = $"Đối tác đã phản hồi nhận xét của bạn.",
                Type = NotificationType.System,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, message = "Đã gửi phản hồi thành công." });
    }

    // GET: /Review/GetMyReviews - Retrieve reviews and all nested replies
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
                    .ThenInclude(rep => rep.Reviewer)
                        .ThenInclude(u => u.StudentProfile)
                .Include(r => r.Replies)
                    .ThenInclude(rep => rep.Reviewer)
                        .ThenInclude(u => u.BusinessProfile)
                .Where(r => (r.JobContract.StudentId == currentUserId.Value || r.JobContract.BusinessId == currentUserId.Value) 
                            && r.ReviewerId != currentUserId.Value 
                            && r.ParentReviewId == null)
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
                reviewerAvatar = r.Reviewer != null 
                    ? (r.Reviewer.BusinessProfile != null 
                        ? r.Reviewer.BusinessProfile.LogoUrl 
                        : (r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.AvatarUrl : "")) 
                    : "",
                project = r.JobContract != null && r.JobContract.JobPost != null ? r.JobContract.JobPost.Title : "Dự án không xác định",
                rating = r.Rating,
                date = r.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                comment = r.Comment ?? "",
                replies = r.Replies.OrderBy(rep => rep.CreatedAt).Select(rep => new {
                    id = rep.Id,
                    reviewer = rep.Reviewer != null 
                        ? (rep.Reviewer.BusinessProfile != null 
                            ? rep.Reviewer.BusinessProfile.CompanyName 
                            : (rep.Reviewer.StudentProfile != null ? rep.Reviewer.StudentProfile.FullName : "Người dùng ẩn")) 
                        : "Người dùng ẩn",
                    reviewerAvatar = rep.Reviewer != null 
                        ? (rep.Reviewer.BusinessProfile != null 
                            ? rep.Reviewer.BusinessProfile.LogoUrl 
                            : (rep.Reviewer.StudentProfile != null ? rep.Reviewer.StudentProfile.AvatarUrl : "")) 
                        : "",
                    comment = rep.Comment,
                    date = rep.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                    reviewerId = rep.ReviewerId,
                    isOwnReply = rep.ReviewerId == currentUserId.Value,
                    canEdit = rep.ReviewerId == currentUserId.Value && (DateTime.UtcNow - rep.CreatedAt).TotalHours <= 24
                }).ToList(),
                isReported = r.IsReported
            }).ToList();

            return Json(new { success = true, reviews = reviews });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = "Database Error: " + ex.Message });
        }
    }

    // POST: /Review/Report - Report inappropriate review
    [HttpPost]
    public async Task<IActionResult> Report([FromForm] int id, [FromForm] string reason)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập." });

        var review = await _context.Reviews
            .Include(r => r.JobContract)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null) return NotFound(new { success = false, message = "Không tìm thấy đánh giá." });

        if (review.JobContract.StudentId != currentUserId.Value && review.JobContract.BusinessId != currentUserId.Value)
        {
            return Forbid();
        }

        review.IsReported = true;

        var adminNotify = new Notification
        {
            UserId = 11, // Admin user ID
            Title = "Báo cáo đánh giá không phù hợp",
            Message = $"Người dùng ID {currentUserId.Value} đã báo cáo đánh giá #{id} với lý do: {reason}",
            Type = NotificationType.System,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(adminNotify);

        await _context.SaveChangesAsync();
        return Json(new { success = true, message = "Đã gửi báo cáo đánh giá thành công." });
    }
}
