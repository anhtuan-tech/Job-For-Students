using System.Security.Claims;
using JobForStudents.Data;
using JobForStudents.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Controllers;

[Authorize]
public class StudentProfileController : Controller
{
    private readonly AppDbContext _context;

    public StudentProfileController(AppDbContext context)
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
    public async Task<IActionResult> Details(int id) // Here id is UserId
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var profile = await _context.StudentProfiles
            .Include(sp => sp.User)
            .Include(sp => sp.StudentSkills)
                .ThenInclude(ss => ss.Skill)
            .FirstOrDefaultAsync(sp => sp.UserId == id);

        if (profile == null) return NotFound();

        var vm = new StudentProfileViewModel
        {
            StudentId = profile.UserId, // Using UserId as StudentId
            UserId = profile.UserId,
            FullName = profile.FullName ?? "Sinh viên",
            Major = profile.Major ?? "",
            University = profile.University ?? "",
            Bio = profile.Bio ?? "",
            AvatarUrl = profile.AvatarUrl ?? "",
            ResumeUrl = profile.CvUrl ?? "",
            Skills = profile.StudentSkills.Select(ss => ss.Skill.Name).ToList(),
            IsContactMasked = true // default to true
        };

        // Determine if contact should be unmasked
        if (User.IsInRole("Admin") || profile.UserId == currentUserId.Value)
        {
            vm.IsContactMasked = false;
        }
        else if (User.IsInRole("Business"))
        {
            // Check if there is any Contract between this Business and the Student
            var hasContract = await _context.JobContracts
                .Include(c => c.JobPost)
                .AnyAsync(c => c.StudentId == profile.UserId && c.JobPost.BusinessId == currentUserId.Value);

            if (hasContract)
            {
                vm.IsContactMasked = false;
            }
        }

        if (!vm.IsContactMasked)
        {
            vm.PhoneNumber = profile.User.Phone;
            vm.Email = profile.User.Email;
            // Assuming we have fields for these in DB, or we can use generic links.
            // But they are not in the standard model unless added.
            // I will leave Facebook/LinkedIn null for now.
        }

        // Calculate rating
        var reviews = await _context.Reviews
            .Include(r => r.Reviewer)
                .ThenInclude(u => u.StudentProfile)
            .Include(r => r.Reviewer)
                .ThenInclude(u => u.BusinessProfile)
            .Include(r => r.JobContract)
            .Include(r => r.Replies)
                .ThenInclude(rep => rep.Reviewer)
                    .ThenInclude(u => u.StudentProfile)
            .Include(r => r.Replies)
                .ThenInclude(rep => rep.Reviewer)
                    .ThenInclude(u => u.BusinessProfile)
            .Where(r => r.JobContract.StudentId == profile.UserId && r.ReviewerId != profile.UserId && !r.IsReported && r.ParentReviewId == null)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        vm.Reviews = reviews;
        vm.TotalReviews = reviews.Count;
        vm.AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;

        return View(vm);
    }
}
