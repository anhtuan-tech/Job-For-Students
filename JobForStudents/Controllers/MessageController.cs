using System.Security.Claims;
using JobForStudents.Data;
using JobForStudents.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Controllers;

[Authorize]
public class MessageController : Controller
{
    private readonly AppDbContext _context;

    public MessageController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idStr, out var id)) return id;
        return null;
    }

    public async Task<IActionResult> Index(int? userId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        // Load distinct users who have chatted with the current user
        var sentUserIds = await _context.Messages
            .Where(m => m.SenderId == currentUserId.Value)
            .Select(m => m.ReceiverId)
            .Distinct()
            .ToListAsync();

        var receivedUserIds = await _context.Messages
            .Where(m => m.ReceiverId == currentUserId.Value)
            .Select(m => m.SenderId)
            .Distinct()
            .ToListAsync();

        var contactUserIds = sentUserIds.Union(receivedUserIds).ToList();
        
        // If userId is provided but not in the list (e.g. first time messaging), add it
        if (userId.HasValue && !contactUserIds.Contains(userId.Value))
        {
            contactUserIds.Add(userId.Value);
        }

        var contacts = await _context.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.BusinessProfile)
            .Where(u => contactUserIds.Contains(u.Id))
            .Select(u => new 
            {
                Id = u.Id,
                FullName = u.Role == UserRole.Student ? (u.StudentProfile != null ? u.StudentProfile.FullName : "Sinh viên") : (u.BusinessProfile != null ? u.BusinessProfile.CompanyName : "Doanh nghiệp"),
                Role = u.Role.ToString()
            })
            .ToListAsync();

        ViewBag.CurrentUserId = currentUserId.Value;
        ViewBag.SelectedUserId = userId;
        ViewBag.Contacts = contacts;

        return View();
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages(int contactId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var messages = await _context.Messages
            .Where(m => (m.SenderId == currentUserId.Value && m.ReceiverId == contactId) ||
                        (m.SenderId == contactId && m.ReceiverId == currentUserId.Value))
            .OrderBy(m => m.SentAt)
            .Select(m => new
            {
                m.Id,
                m.SenderId,
                m.ReceiverId,
                m.Content,
                SentAt = m.SentAt.ToString("HH:mm dd/MM/yyyy"),
                IsMine = m.SenderId == currentUserId.Value
            })
            .ToListAsync();

        // Mark as read
        var unreadMessages = await _context.Messages
            .Where(m => m.SenderId == contactId && m.ReceiverId == currentUserId.Value && !m.IsRead)
            .ToListAsync();

        if (unreadMessages.Any())
        {
            foreach (var msg in unreadMessages) msg.IsRead = true;
            await _context.SaveChangesAsync();
        }

        return Json(new { success = true, messages });
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromForm] int receiverId, [FromForm] string content)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(content)) return BadRequest();

        var message = new Message
        {
            SenderId = currentUserId.Value,
            ReceiverId = receiverId,
            Content = content,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = new {
            message.Id,
            message.SenderId,
            message.ReceiverId,
            message.Content,
            SentAt = message.SentAt.ToString("HH:mm dd/MM/yyyy"),
            IsMine = true
        }});
    }
}
