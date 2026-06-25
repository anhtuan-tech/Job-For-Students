using System.Security.Claims;
using JobForStudents.Data;
using JobForStudents.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Controllers;

public class JobController : Controller
{
    private readonly AppDbContext _context;

    public JobController(AppDbContext context)
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
    public async Task<IActionResult> Index([FromQuery] string? keyword, [FromQuery] string? category, [FromQuery] BudgetType? budgetType, [FromQuery] ExperienceLevel? expLevel)
    {
        var query = _context.JobPosts
            .Include(j => j.BusinessProfile)
                .ThenInclude(b => b.User)
            .Include(j => j.JobPostSkills)
                .ThenInclude(js => js.Skill)
            .Where(j => !j.IsDeleted && j.Status == JobStatus.Open && j.IsApproved);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(j => j.Title.Contains(keyword) || j.Description.Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(j => j.JobPostSkills.Any(js => js.Skill.Category == category));
        }

        if (budgetType.HasValue)
        {
            query = query.Where(j => j.BudgetType == budgetType.Value);
        }

        if (expLevel.HasValue)
        {
            query = query.Where(j => j.ExperienceLevelRequired == expLevel.Value);
        }

        var jobs = await query.OrderByDescending(j => j.CreatedAt).ToListAsync();

        var currentUserId = GetCurrentUserId();
        List<int> savedJobIds = new();
        if (currentUserId.HasValue)
        {
            savedJobIds = await _context.SavedJobs
                .Where(s => s.StudentId == currentUserId.Value)
                .Select(s => s.JobPostId)
                .ToListAsync();
        }

        var vm = new JobSearchViewModel
        {
            Keyword = keyword,
            Category = category,
            BudgetType = budgetType,
            ExperienceLevel = expLevel,
            Jobs = jobs,
            SavedJobIds = savedJobIds
        };

        bool isModal = Request.Query["modal"] == "true";
        ViewBag.IsModal = isModal;

        return View(vm);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> ToggleSaveJob([FromForm] int jobId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var existing = await _context.SavedJobs.FirstOrDefaultAsync(s => s.StudentId == currentUserId.Value && s.JobPostId == jobId);
        if (existing != null)
        {
            _context.SavedJobs.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, saved = false, message = "Đã bỏ lưu việc làm." });
        }
        else
        {
            var newSave = new SavedJob
            {
                StudentId = currentUserId.Value,
                JobPostId = jobId
            };
            _context.SavedJobs.Add(newSave);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, saved = true, message = "Đã lưu việc làm." });
        }
    }
}
