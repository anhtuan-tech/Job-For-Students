using System.Security.Claims;
using JobForStudents.Data;
using JobForStudents.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Controllers;

[Authorize]
public class NotificationController : Controller
{
    private readonly AppDbContext _context;

    public NotificationController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idStr, out var id)) return id;
        return null;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var notifications = await _context.Notifications
            .Where(n => n.UserId == currentUserId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Message,
                Type = n.Type.ToString(),
                n.IsRead,
                TimeAgo = GetTimeAgo(n.CreatedAt)
            })
            .ToListAsync();

        var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == currentUserId.Value && !n.IsRead);

        return Ok(new { success = true, notifications, unreadCount });
    }

    [HttpPost]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == currentUserId.Value);
        if (notif != null && !notif.IsRead)
        {
            notif.IsRead = true;
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }

    [HttpPost]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var unreadNotifs = await _context.Notifications
            .Where(n => n.UserId == currentUserId.Value && !n.IsRead)
            .ToListAsync();

        if (unreadNotifs.Any())
        {
            foreach (var n in unreadNotifs) n.IsRead = true;
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }

    private static string GetTimeAgo(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;
        if (span.Days > 365) return $"{span.Days / 365} năm trước";
        if (span.Days > 30) return $"{span.Days / 30} tháng trước";
        if (span.Days > 0) return $"{span.Days} ngày trước";
        if (span.Hours > 0) return $"{span.Hours} giờ trước";
        if (span.Minutes > 0) return $"{span.Minutes} phút trước";
        return "Vừa xong";
    }
}
