using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobForStudents.Data;
using JobForStudents.Models;

namespace JobForStudents.Controllers;

public class HomeController : Controller
{
    private readonly AppDbContext _context;
    private static readonly HttpClient AcbHttpClient = new();
    private const string AcbHistoryUrl = "http://api.dopamind.net/api/ACB/history?token=KHANGDZ"; // Phần API check lịch sử giao dịch ở đây 

    public HomeController(AppDbContext context)
    {
        _context = context;
    }

    // GET: / — Main Dashboard — Public: ai cũng xem được
    public async Task<IActionResult> Index()
    {
        var currentUserId = GetCurrentUserId();
        var isStudent = User.IsInRole("Student");

        // 1. Fetch JobPosts
        var jobPostsQuery = _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Where(j => !j.IsDeleted && j.IsApproved && j.Status == JobStatus.Open);

        if (!User.IsInRole("Admin"))
        {
            jobPostsQuery = jobPostsQuery.Where(j => j.IsApproved);
        }

        var jobPosts = await jobPostsQuery
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();

        // 2. Fetch User's Saved and Applied job IDs (if logged in)
        var savedJobIds = new HashSet<int>();
        var appliedJobIds = new HashSet<int>();

        if (currentUserId.HasValue && isStudent)
        {
            savedJobIds = new HashSet<int>(
                await _context.SavedJobs
                    .Where(sj => sj.StudentId == currentUserId.Value)
                    .Select(sj => sj.JobPostId)
                    .ToListAsync()
            );

            appliedJobIds = new HashSet<int>(
                await _context.JobBids
                    .Where(jb => jb.StudentId == currentUserId.Value)
                    .Select(jb => jb.JobPostId)
                    .ToListAsync()
            );
        }

        // 3. Map to JobViewModel
        var jobsList = jobPosts.Select(j => new JobViewModel
        {
            Id = j.Id.ToString(),
            Title = j.Title,
            Description = j.Description,
            // Use the category of the first skill or a default category
            Category = j.Category ?? (j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác"),
            Tags = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
            Budget = j.Budget,
            Deadline = j.Deadline.ToString("dd/MM/yyyy"),
            ApplicantsCount = _context.JobBids.Count(b => b.JobPostId == j.Id),
            Quantity = j.Quantity,
            HiredCount = _context.JobBids.Count(b => b.JobPostId == j.Id && b.Status == BidStatus.Hired),
            IsSaved = savedJobIds.Contains(j.Id),
            IsApplied = appliedJobIds.Contains(j.Id),
            BudgetType = j.BudgetType.ToString(),
            ExperienceLevel = j.ExperienceLevelRequired.ToString(),
            CreatedAt = j.CreatedAt
        }).ToList();

        // 4. AI Freelancer Recommendation (Dashboard widget for Businesses)
        var freelancers = await _context.StudentProfiles
            .Include(sp => sp.StudentSkills)
                .ThenInclude(ss => ss.Skill)
            .Include(sp => sp.User)
            .Where(sp => !sp.User.IsDeleted && sp.User.Status == UserStatus.Active)
            .ToListAsync();

        var topFreelancers = freelancers.Select((sp, idx) => new UserViewModel
        {
            Id = sp.UserId.ToString(),
            Name = sp.FullName,
            Skill = sp.StudentSkills.FirstOrDefault()?.Skill.Name ?? "Chưa có kỹ năng",
            MatchPercentage = (98 - (idx * 5)) + "%", // Simulate Match %
            Rating = 5.0 - (idx * 0.1),
            ReviewsCount = 15 - idx,
            Avatar = sp.AvatarUrl ?? ""
        }).ToList();

        // 5. Income Overview and User Information
        var dashboard = new DashboardViewModel
        {
            Jobs = jobsList,
            TopFreelancers = topFreelancers,
            TotalEarnings = 2450000m, // default static value
            CompletedJobsCount = 12,    // default static value
            CurrentUserId = currentUserId,
            CurrentUserRole = currentUserId.HasValue ? (User.IsInRole("Student") ? "Student" : User.IsInRole("Business") ? "Business" : User.IsInRole("Admin") ? "Admin" : string.Empty) : string.Empty,
            CurrentUserName = User.Identity?.Name ?? "Khách",
            CurrentUserAvatarUrl = string.Empty
        };

        // If user is logged in, load their stats and avatar/logo
        if (currentUserId.HasValue)
        {
            if (User.IsInRole("Admin"))
            {
                dashboard.CurrentUserName = "Admin J4S";
                dashboard.CurrentUserAvatarUrl = string.Empty;

                // Load pending jobs for Admin
                var pendingJobs = await _context.JobPosts
                    .Include(j => j.BusinessProfile)
                    .Where(j => !j.IsApproved && !j.IsDeleted && j.Status != JobStatus.Rejected)
                    .OrderBy(j => j.CreatedAt)
                    .ToListAsync();

                dashboard.AdminPendingJobs = pendingJobs.Select(j => new AdminPendingJobViewModel
                {
                    Id = j.Id,
                    Title = j.Title,
                    CompanyName = j.BusinessProfile?.CompanyName ?? "Unknown",
                    CreatedAt = j.CreatedAt.ToString("dd/MM/yyyy HH:mm")
                }).ToList();
            }
            else if (isStudent)
            {
                var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);
                if (wallet != null)
                {
                    dashboard.TotalEarnings = wallet.Balance;
                }

                dashboard.CompletedJobsCount = await _context.JobContracts
                    .CountAsync(c => c.StudentId == currentUserId.Value && c.Status == ContractStatus.Completed);

                var studentProfile = await _context.StudentProfiles.FirstOrDefaultAsync(sp => sp.UserId == currentUserId.Value);
                if (studentProfile != null)
                {
                    dashboard.CurrentUserAvatarUrl = studentProfile.AvatarUrl ?? string.Empty;
                    if (!string.IsNullOrEmpty(studentProfile.FullName))
                    {
                        dashboard.CurrentUserName = studentProfile.FullName;
                    }
                }

                // Populate StudentAppliedJobs
                var rawAppliedJobs = await _context.JobBids
                    .Include(b => b.JobPost)
                        .ThenInclude(jp => jp.BusinessProfile)
                    .Where(b => b.StudentId == currentUserId.Value)
                    .OrderByDescending(b => b.CreatedAt)
                    .Take(10)
                    .ToListAsync();

                dashboard.StudentAppliedJobs = rawAppliedJobs.Select(b => new StudentAppliedJobViewModel
                {
                    BidId = b.Id,
                    JobId = b.JobPostId,
                    JobTitle = b.JobPost.Title,
                    CompanyName = b.JobPost.BusinessProfile?.CompanyName ?? "Unknown",
                    Status = b.Status.ToString(), // "Pending", "Accepted", "Rejected"
                    AppliedAt = b.CreatedAt.ToString("dd/MM/yyyy HH:mm")
                }).ToList();

                // Populate StudentActiveContracts
                var rawActiveContracts = await _context.JobContracts
                    .Include(c => c.JobPost)
                        .ThenInclude(jp => jp.BusinessProfile)
                    .Where(c => c.StudentId == currentUserId.Value && c.Status == ContractStatus.Active)
                    .OrderBy(c => c.JobPost.Deadline)
                    .Take(5)
                    .ToListAsync();

                dashboard.StudentActiveContracts = rawActiveContracts.Select(c => new StudentActiveContractViewModel
                {
                    ContractId = c.Id,
                    JobTitle = c.JobPost.Title,
                    CompanyName = c.JobPost.BusinessProfile?.CompanyName ?? "Unknown",
                    Deadline = c.JobPost.Deadline.ToString("dd/MM/yyyy"),
                    BusinessUserId = c.JobPost.BusinessId
                }).ToList();
            }
            else
            {
                var businessProfile = await _context.BusinessProfiles.FirstOrDefaultAsync(bp => bp.UserId == currentUserId.Value);
                if (businessProfile != null)
                {
                    dashboard.CurrentUserAvatarUrl = businessProfile.LogoUrl ?? string.Empty;
                    if (!string.IsNullOrEmpty(businessProfile.CompanyName))
                    {
                        dashboard.CurrentUserName = businessProfile.CompanyName;
                    }
                }
            }
        }

        return View("Dashboard", dashboard);
    }

    // GET: /Home/FilterByCategory?category=Design — Public (allow anonymous browsing)
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> FilterByCategory(string category)
    {
        var currentUserId = GetCurrentUserId();
        var isStudent = User.IsInRole("Student");

        var jobQuery = _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Where(j => !j.IsDeleted && j.IsApproved && j.Status == JobStatus.Open);

        if (!string.Equals(category, "Tất cả danh mục", StringComparison.OrdinalIgnoreCase))
        {
            jobQuery = jobQuery.Where(j => j.JobPostSkills.Any(jps => jps.Skill.Category == category));
        }

        var jobPosts = await jobQuery.OrderByDescending(j => j.CreatedAt).ToListAsync();

        var savedJobIds = new HashSet<int>();
        var appliedJobIds = new HashSet<int>();

        if (currentUserId.HasValue && isStudent)
        {
            savedJobIds = new HashSet<int>(await _context.SavedJobs.Where(sj => sj.StudentId == currentUserId.Value).Select(sj => sj.JobPostId).ToListAsync());
            appliedJobIds = new HashSet<int>(await _context.JobBids.Where(jb => jb.StudentId == currentUserId.Value).Select(jb => jb.JobPostId).ToListAsync());
        }

        var jobsList = jobPosts.Select(j => new JobViewModel
        {
            Id = j.Id.ToString(),
            Title = j.Title,
            Description = j.Description,
            Category = j.Category ?? (j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác"),
            Tags = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
            Budget = j.Budget,
            Deadline = j.Deadline.ToString("dd/MM/yyyy"),
            ApplicantsCount = _context.JobBids.Count(b => b.JobPostId == j.Id),
            Quantity = j.Quantity,
            HiredCount = _context.JobBids.Count(b => b.JobPostId == j.Id && b.Status == BidStatus.Hired),
            IsSaved = savedJobIds.Contains(j.Id),
            IsApplied = appliedJobIds.Contains(j.Id)
        }).ToList();

        return Json(jobsList);
    }

    // GET: /Home/SearchJobs — Public (allow anonymous browsing)
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> SearchJobs(
        string? searchTerm,
        string? category,
        decimal? minBudget,
        decimal? maxBudget,
        int? daysAgo,
        string? experienceLevel,
        string? sortBy)
    {
        var currentUserId = GetCurrentUserId();
        var isStudent = User.IsInRole("Student");

        var jobQuery = _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Where(j => !j.IsDeleted && j.IsApproved && j.Status == JobStatus.Open);

        // Filter: keyword
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var term = searchTerm.ToLower();
            jobQuery = jobQuery.Where(j =>
                j.Title.ToLower().Contains(term) ||
                j.Description.ToLower().Contains(term) ||
                j.JobPostSkills.Any(jps => jps.Skill.Name.ToLower().Contains(term))
            );
        }

        // Filter: category
        if (!string.IsNullOrEmpty(category))
            jobQuery = jobQuery.Where(j => j.Category == category);

        // Filter: budget range
        if (minBudget.HasValue)
            jobQuery = jobQuery.Where(j => j.Budget >= minBudget.Value);
        if (maxBudget.HasValue)
            jobQuery = jobQuery.Where(j => j.Budget <= maxBudget.Value);

        // Filter: posted time
        if (daysAgo.HasValue && daysAgo.Value > 0)
        {
            var cutoff = DateTime.UtcNow.AddDays(-daysAgo.Value);
            jobQuery = jobQuery.Where(j => j.CreatedAt >= cutoff);
        }

        // Filter: experience level
        if (!string.IsNullOrEmpty(experienceLevel) &&
            Enum.TryParse<ExperienceLevel>(experienceLevel, out var expLevel))
        {
            jobQuery = jobQuery.Where(j => j.ExperienceLevelRequired == expLevel);
        }

        // Sort
        jobQuery = (sortBy ?? "newest") switch
        {
            "budget_asc"  => jobQuery.OrderBy(j => j.Budget),
            "budget_desc" => jobQuery.OrderByDescending(j => j.Budget),
            "applicants"  => jobQuery.OrderByDescending(j => j.JobBids.Count),
            _             => jobQuery.OrderByDescending(j => j.CreatedAt)
        };

        var jobPosts = await jobQuery.ToListAsync();

        var savedJobIds = new HashSet<int>();
        var appliedJobIds = new HashSet<int>();

        if (currentUserId.HasValue && isStudent)
        {
            savedJobIds  = new HashSet<int>(await _context.SavedJobs.Where(sj => sj.StudentId == currentUserId.Value).Select(sj => sj.JobPostId).ToListAsync());
            appliedJobIds = new HashSet<int>(await _context.JobBids.Where(jb => jb.StudentId == currentUserId.Value).Select(jb => jb.JobPostId).ToListAsync());
        }

        var jobsList = jobPosts.Select(j => new JobViewModel
        {
            Id = j.Id.ToString(),
            Title = j.Title,
            Description = j.Description,
            Category = j.Category ?? (j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác"),
            Tags = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
            Budget = j.Budget,
            Deadline = j.Deadline.ToString("dd/MM/yyyy"),
            ApplicantsCount = _context.JobBids.Count(b => b.JobPostId == j.Id),
            Quantity = j.Quantity,
            HiredCount = _context.JobBids.Count(b => b.JobPostId == j.Id && b.Status == BidStatus.Hired),
            IsSaved = savedJobIds.Contains(j.Id),
            IsApplied = appliedJobIds.Contains(j.Id),
            BudgetType = j.BudgetType.ToString(),
            ExperienceLevel = j.ExperienceLevelRequired.ToString(),
            CreatedAt = j.CreatedAt
        }).ToList();

        return Json(jobsList);
    }

    // GET: /Home/GetCategories
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.JobPosts
            .Where(j => !j.IsDeleted && j.IsApproved && j.Status == JobStatus.Open && j.Category != null && j.Category != "")
            .Select(j => j.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
        return Json(categories);
    }

    // POST: /Home/ToggleSaveJob
    // POST: /Home/ToggleSaveJob — Requires Student role
    [Authorize(Roles = "Student")]
    [HttpPost]
    public async Task<IActionResult> ToggleSaveJob([FromBody] JobActionRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập để lưu việc làm." });
        }

        if (!User.IsInRole("Student"))
        {
            return Json(new { success = false, message = "Chỉ tài khoản Sinh viên mới có thể lưu việc làm." });
        }

        if (!int.TryParse(request.JobId, out var jobId))
        {
            return Json(new { success = false, message = "Mã công việc không hợp lệ." });
        }

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted && j.IsApproved && j.Status == JobStatus.Open);
        if (job == null)
        {
            return Json(new { success = false, message = "Không tìm thấy việc làm." });
        }

        var savedJob = await _context.SavedJobs
            .FirstOrDefaultAsync(sj => sj.StudentId == currentUserId.Value && sj.JobPostId == jobId);

        bool isSavedNow;
        if (savedJob != null)
        {
            _context.SavedJobs.Remove(savedJob);
            isSavedNow = false;
        }
        else
        {
            _context.SavedJobs.Add(new SavedJob
            {
                StudentId = currentUserId.Value,
                JobPostId = jobId,
                SavedAt = DateTime.UtcNow
            });
            isSavedNow = true;
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, isSaved = isSavedNow, jobId = request.JobId });
    }

    // POST: /Home/ApplyJob — Requires Student role
    [Authorize(Roles = "Student")]
    [HttpPost]
    public async Task<IActionResult> ApplyJob([FromBody] JobActionRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập để ứng tuyển." });
        }

        if (!User.IsInRole("Student"))
        {
            return Json(new { success = false, message = "Chỉ tài khoản Sinh viên mới có thể ứng tuyển." });
        }

        if (!int.TryParse(request.JobId, out var jobId))
        {
            return Json(new { success = false, message = "Mã công việc không hợp lệ." });
        }

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted);
        if (job == null)
        {
            return Json(new { success = false, message = "Không tìm thấy việc làm." });
        }

        // Validate Job Status: Must be Open
        if (job.Status != JobStatus.Open)
        {
            return Json(new { success = false, message = "Tin tuyển dụng này hiện không ở trạng thái mở ứng tuyển." });
        }

        // Validate Deadline: Cannot apply if deadline has passed
        if (job.Deadline < DateTime.UtcNow)
        {
            return Json(new { success = false, message = "Thời hạn ứng tuyển của công việc này đã kết thúc." });
        }

        var existingBid = await _context.JobBids
            .FirstOrDefaultAsync(jb => jb.StudentId == currentUserId.Value && jb.JobPostId == jobId);

        bool isAppliedNow;
        if (existingBid != null)
        {
            _context.JobBids.Remove(existingBid);
            isAppliedNow = false;
        }
        else
        {
            // Create a default bid/proposal
            _context.JobBids.Add(new JobBid
            {
                StudentId = currentUserId.Value,
                JobPostId = jobId,
                BidAmount = job.Budget,
                EstimatedDays = 5,
                Proposal = "Tôi muốn ứng tuyển vào công việc này. Tôi có kỹ năng phù hợp.",
                Status = BidStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });

            _context.Notifications.Add(new Notification
            {
                UserId = job.BusinessId,
                Title = "Có ứng viên mới ứng tuyển",
                Message = $"Một ứng viên vừa ứng tuyển vào tin tuyển dụng \"{job.Title}\".",
                Type = NotificationType.JobStatus,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            isAppliedNow = true;
        }

        await _context.SaveChangesAsync();

        var applicantsCount = await _context.JobBids.CountAsync(b => b.JobPostId == jobId);

        return Json(new
        {
            success = true,
            isApplied = isAppliedNow,
            applicantsCount = applicantsCount,
            jobId = request.JobId
        });
    }

    // GET: /Home/GetStudentAppliedJobs — Requires Student role
    [Authorize(Roles = "Student")]
    [HttpGet]
    public async Task<IActionResult> GetStudentAppliedJobs()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập." });
        }

        var bids = await _context.JobBids
            .Include(b => b.JobPost)
                .ThenInclude(jp => jp.BusinessProfile)
            .Where(b => b.StudentId == currentUserId.Value)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                bidId = b.Id,
                jobId = b.JobPostId,
                jobTitle = b.JobPost.Title,
                companyName = b.JobPost.BusinessProfile != null ? b.JobPost.BusinessProfile.CompanyName : "Unknown",
                status = b.Status.ToString(), // "Pending", "Accepted", "Rejected", "Hired"
                appliedAt = b.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                bidAmount = b.BidAmount,
                proposal = b.Proposal ?? "",
                estimatedDays = b.EstimatedDays
            })
            .ToListAsync();

        return Json(new { success = true, bids = bids });
    }

    // GET: /Home/GetSavedJobs — Returns saved jobs for current student
    [Authorize(Roles = "Student")]
    [HttpGet]
    public async Task<IActionResult> GetSavedJobs()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
            return Json(new List<object>());

        var appliedJobIds = new HashSet<int>(
            await _context.JobBids
                .Where(jb => jb.StudentId == currentUserId.Value)
                .Select(jb => jb.JobPostId)
                .ToListAsync());

        var savedJobs = await _context.SavedJobs
            .Include(sj => sj.JobPost)
                .ThenInclude(jp => jp.JobPostSkills)
                    .ThenInclude(jps => jps.Skill)
            .Where(sj => sj.StudentId == currentUserId.Value && !sj.JobPost.IsDeleted)
            .OrderByDescending(sj => sj.SavedAt)
            .Select(sj => new
            {
                id = sj.JobPost.Id.ToString(),
                title = sj.JobPost.Title,
                description = sj.JobPost.Description,
                category = sj.JobPost.Category ?? (sj.JobPost.JobPostSkills.Select(jps => jps.Skill.Category).FirstOrDefault() ?? "Khác"),
                budget = sj.JobPost.Budget,
                deadline = sj.JobPost.Deadline.ToString("dd/MM/yyyy"),
                applicantsCount = _context.JobBids.Count(b => b.JobPostId == sj.JobPostId),
                quantity = sj.JobPost.Quantity,
                hiredCount = _context.JobBids.Count(b => b.JobPostId == sj.JobPostId && b.Status == BidStatus.Hired),
                isSaved = true,
                isApplied = appliedJobIds.Contains(sj.JobPostId),
                tags = sj.JobPost.JobPostSkills.Select(jps => jps.Skill.Name).ToList()
            })
            .ToListAsync();

        return Json(savedJobs);
    }

    // GET: /Home/GetAppliedJobs — Returns jobs the student applied to
    [Authorize(Roles = "Student")]
    [HttpGet]
    public async Task<IActionResult> GetAppliedJobs()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
            return Json(new List<object>());

        var appliedJobs = await _context.JobBids
            .Include(b => b.JobPost)
                .ThenInclude(jp => jp.BusinessProfile)
            .Where(b => b.StudentId == currentUserId.Value && !b.JobPost.IsDeleted)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                id = b.JobPost.Id.ToString(),
                title = b.JobPost.Title,
                description = b.JobPost.Description,
                category = b.JobPost.Category ?? "Khác",
                budget = b.JobPost.Budget,
                deadline = b.JobPost.Deadline.ToString("dd/MM/yyyy"),
                applicantsCount = _context.JobBids.Count(jb => jb.JobPostId == b.JobPostId),
                quantity = b.JobPost.Quantity,
                hiredCount = _context.JobBids.Count(jb => jb.JobPostId == b.JobPostId && jb.Status == BidStatus.Hired),
                isSaved = false,
                isApplied = true,
                status = b.Status.ToString(),
                appliedDate = b.CreatedAt,
                businessName = b.JobPost.BusinessProfile != null ? b.JobPost.BusinessProfile.CompanyName : ""
            })
            .ToListAsync();

        return Json(appliedJobs);
    }

    // GET: /Home/GetJobDetail/{id} — Returns job details for modal
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetJobDetail(int id)
    {
        var currentUserId = GetCurrentUserId();
        var isStudent = User.IsInRole("Student");

        var job = await _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .FirstOrDefaultAsync(j => j.Id == id && !j.IsDeleted);

        if (job == null)
            return Json(new { error = "Không tìm thấy công việc." });

        bool isSaved = false, isApplied = false;
        if (currentUserId.HasValue && isStudent)
        {
            isSaved = await _context.SavedJobs.AnyAsync(sj => sj.StudentId == currentUserId.Value && sj.JobPostId == id);
            isApplied = await _context.JobBids.AnyAsync(jb => jb.StudentId == currentUserId.Value && jb.JobPostId == id);
        }

        return Json(new
        {
            id = job.Id.ToString(),
            title = job.Title,
            description = job.Description,
            category = job.Category ?? (job.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác"),
            budget = job.Budget,
            deadline = job.Deadline.ToString("dd/MM/yyyy"),
            applicantsCount = await _context.JobBids.CountAsync(b => b.JobPostId == id),
            quantity = job.Quantity,
            hiredCount = await _context.JobBids.CountAsync(b => b.JobPostId == id && b.Status == BidStatus.Hired),
            isSaved,
            isApplied,
            tags = job.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
            budgetType = job.BudgetType.ToString(),
            experienceLevel = job.ExperienceLevelRequired.ToString(),
            requirements = job.Requirements
        });
    }

    // GET: /Home/GetStudentActiveContracts — Requires Student role
    [Authorize(Roles = "Student")]
    [HttpGet]
    public async Task<IActionResult> GetStudentActiveContracts()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập." });
        }

        var contracts = await _context.JobContracts
            .Include(c => c.JobPost)
                .ThenInclude(jp => jp.BusinessProfile)
            .Where(c => c.StudentId == currentUserId.Value && (c.Status == ContractStatus.Active || c.Status == ContractStatus.Submitted || c.Status == ContractStatus.Completed))
            .OrderBy(c => c.Status == ContractStatus.Completed ? 1 : 0)
            .ThenByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                id = c.Id,
                title = c.JobPost.Title,
                client = c.BusinessProfile != null ? c.BusinessProfile.CompanyName : "Unknown",
                clientId = c.BusinessId,
                status = c.Status == ContractStatus.Completed ? "Hoàn thành" : (c.Status == ContractStatus.Submitted ? "Đang xác nhận" : "Đang thực hiện"),
                deadline = c.JobPost.Deadline.ToString("dd/MM/yyyy"),
                budget = (double)c.FinalPrice,
                studentCompleted = c.DeliverableContent != null && c.DeliverableContent.Contains("StudentCompleted"),
                businessCompleted = c.DeliverableContent != null && c.DeliverableContent.Contains("BusinessCompleted"),
                contractStatus = c.Status.ToString()
            })
            .ToListAsync();

        return Json(new { success = true, contracts = contracts });
    }

    [Authorize(Roles = "Student")]
    [HttpPost]
    public async Task<IActionResult> CompleteContract([FromForm] int contractId)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập." });
        }

        var contract = await _context.JobContracts
            .Include(c => c.JobPost)
            .FirstOrDefaultAsync(c => c.Id == contractId && c.StudentId == currentUserId.Value);

        if (contract == null)
        {
            return Json(new { success = false, message = "Không tìm thấy hợp đồng hợp lệ hoặc bạn không có quyền." });
        }

        if (contract.Status == ContractStatus.Completed)
        {
            return Json(new { success = false, message = "Hợp đồng đã hoàn thành trước đó." });
        }

        if (contract.DeliverableContent != null && contract.DeliverableContent.Contains("StudentCompleted"))
        {
            return Json(new { success = false, message = "Bạn đã xác nhận hoàn thành trước đó, vui lòng đợi doanh nghiệp xác nhận." });
        }

        // Update DeliverableContent flag
        contract.DeliverableContent = string.IsNullOrEmpty(contract.DeliverableContent)
            ? "StudentCompleted"
            : contract.DeliverableContent + ",StudentCompleted";

        bool isFullyCompleted = contract.DeliverableContent.Contains("BusinessCompleted");
        if (isFullyCompleted)
        {
            contract.Status = ContractStatus.Completed;
            contract.CompletedAt = DateTime.UtcNow;
            contract.JobPost.Status = JobStatus.Closed;

            // Notify Business
            _context.Notifications.Add(new Notification
            {
                UserId = contract.BusinessId,
                Title = "Dự án đã hoàn thành",
                Message = $"Sinh viên đã xác nhận hoàn thành dự án \"{contract.JobPost.Title}\". Trạng thái hợp đồng hiện tại là Hoàn thành.",
                Type = NotificationType.JobStatus,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            contract.Status = ContractStatus.Submitted;
        }

        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            message = isFullyCompleted
                ? "Chúc mừng! Cả hai bên đã xác nhận hoàn thành dự án thành công."
                : "Xác nhận thành công. Đang đợi doanh nghiệp xác nhận hoàn thành."
        });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetBusinessJobs()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chua dang nhap." });
        }

        var jobs = await _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Include(j => j.JobBids)
            .Where(j => j.BusinessId == currentUserId.Value && !j.IsDeleted)
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new
            {
                id = j.Id,
                title = j.Title,
                description = j.Description,
                budget = j.Budget,
                deadline = j.Deadline.ToString("dd/MM/yyyy"),
                createdAt = j.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                category = j.Category ?? (j.JobPostSkills.Select(s => s.Skill.Category).FirstOrDefault() ?? "Khac"),
                tags = j.JobPostSkills.Select(s => s.Skill.Name).ToList(),
                applicantsCount = j.JobBids.Count,
                pendingApplicantsCount = j.JobBids.Count(b => b.Status == BidStatus.Pending),
                viewCount = j.ViewCount,
                status = j.Status.ToString(),
                isApproved = j.IsApproved
            })
            .ToListAsync();

        return Json(new { success = true, jobs });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetBusinessApplicants(int? jobId, string? searchTerm, string? status, bool? savedOnly)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chua dang nhap." });
        }

        var query = _context.JobBids
            .Include(b => b.JobPost)
            .Include(b => b.StudentProfile)
                .ThenInclude(sp => sp.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
            .Where(b => b.JobPost.BusinessId == currentUserId.Value && !b.JobPost.IsDeleted);

        if (jobId.HasValue)
        {
            query = query.Where(b => b.JobPostId == jobId.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(b =>
                b.StudentProfile.FullName.ToLower().Contains(term) ||
                (b.StudentProfile.University != null && b.StudentProfile.University.ToLower().Contains(term)) ||
                (b.StudentProfile.Major != null && b.StudentProfile.Major.ToLower().Contains(term)) ||
                b.StudentProfile.StudentSkills.Any(ss => ss.Skill.Name.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<BidStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(b => b.Status == parsedStatus);
        }

        var savedStudentIds = new HashSet<int>(
            await _context.SavedCandidates
                .Where(sc => sc.BusinessId == currentUserId.Value)
                .Select(sc => sc.StudentId)
                .ToListAsync());

        if (savedOnly == true)
        {
            query = query.Where(b => savedStudentIds.Contains(b.StudentId));
        }

        var applicants = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                bidId = b.Id,
                jobId = b.JobPostId,
                jobTitle = b.JobPost.Title,
                studentId = b.StudentId,
                fullName = b.StudentProfile.FullName,
                avatarUrl = b.StudentProfile.AvatarUrl,
                university = b.StudentProfile.University,
                major = b.StudentProfile.Major,
                proposal = b.Proposal,
                bidAmount = b.BidAmount,
                estimatedDays = b.EstimatedDays,
                status = b.Status.ToString(),
                appliedAt = b.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                role = b.StudentProfile.StudentSkills.Select(s => s.Skill.Name).FirstOrDefault() ?? "Ung vien",
                skills = b.StudentProfile.StudentSkills.Select(s => s.Skill.Name).ToList()
            })
            .ToListAsync();

        var result = applicants.Select(a => new
        {
            a.bidId,
            a.jobId,
            a.jobTitle,
            a.studentId,
            a.fullName,
            a.avatarUrl,
            a.university,
            a.major,
            a.proposal,
            a.bidAmount,
            a.estimatedDays,
            a.status,
            a.appliedAt,
            a.role,
            a.skills,
            isSaved = savedStudentIds.Contains(a.studentId)
        });

        return Json(new { success = true, applicants = result });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> UpdateBidStatus([FromBody] UpdateBidStatusRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chua dang nhap." });
        }

        var bid = await _context.JobBids
            .Include(b => b.JobPost)
            .FirstOrDefaultAsync(b => b.Id == request.BidId && b.JobPost.BusinessId == currentUserId.Value && !b.JobPost.IsDeleted);

        if (bid == null)
        {
            return Json(new { success = false, message = "Khong tim thay ung vien." });
        }

        var action = (request.Action ?? string.Empty).Trim().ToLowerInvariant();
        if (action == "accept")
        {
            bid.Status = BidStatus.Accepted;
            _context.Notifications.Add(new Notification
            {
                UserId = bid.StudentId,
                Title = "Hồ sơ ứng tuyển được chấp nhận",
                Message = $"Hồ sơ ứng tuyển của bạn cho công việc \"{bid.JobPost.Title}\" đã được chấp nhận.",
                Type = NotificationType.JobStatus,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
        else if (action == "hire")
        {
            var existingContract = await _context.JobContracts
                .AnyAsync(c => c.JobPostId == bid.JobPostId && c.StudentId == bid.StudentId && c.BusinessId == currentUserId.Value);

            if (!existingContract)
            {
                _context.JobContracts.Add(new JobContract
                {
                    JobPostId = bid.JobPostId,
                    StudentId = bid.StudentId,
                    BusinessId = currentUserId.Value,
                    FinalPrice = bid.BidAmount,
                    Status = ContractStatus.Active,
                    CreatedAt = DateTime.UtcNow
                });
            }

            bid.Status = BidStatus.Hired;

            var alreadyHiredCount = await _context.JobBids.CountAsync(b => b.JobPostId == bid.JobPostId && b.Status == BidStatus.Hired && b.Id != bid.Id);
            var hiredCount = alreadyHiredCount + 1;

            if (hiredCount >= bid.JobPost.Quantity)
            {
                bid.JobPost.Status = JobStatus.In_Progress;

                // Tự động từ chối các ứng viên khác (chưa bị từ chối/hired) của cùng job này
                var otherBids = await _context.JobBids
                    .Where(b => b.JobPostId == bid.JobPostId && b.Id != bid.Id && b.Status != BidStatus.Rejected && b.Status != BidStatus.Hired)
                    .ToListAsync();

                foreach (var other in otherBids)
                {
                    other.Status = BidStatus.Rejected;
                    _context.Notifications.Add(new Notification
                    {
                        UserId = other.StudentId,
                        Title = "Kết quả ứng tuyển công việc",
                        Message = $"Hồ sơ ứng tuyển của bạn cho công việc \"{bid.JobPost.Title}\" không được chọn.",
                        Type = NotificationType.JobStatus,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            _context.Notifications.Add(new Notification
            {
                UserId = bid.StudentId,
                Title = "Bạn đã được tuyển dụng",
                Message = $"Chúc mừng! Bạn đã được chọn để làm việc cho dự án \"{bid.JobPost.Title}\".",
                Type = NotificationType.JobStatus,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
        else if (action == "reject")
        {
            bid.Status = BidStatus.Rejected;
            _context.Notifications.Add(new Notification
            {
                UserId = bid.StudentId,
                Title = "Kết quả ứng tuyển công việc",
                Message = $"Đề xuất ứng tuyển của bạn cho công việc \"{bid.JobPost.Title}\" đã bị từ chối.",
                Type = NotificationType.JobStatus,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            return Json(new { success = false, message = "Thao tac khong hop le." });
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, status = bid.Status.ToString() });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> ToggleSaveCandidate([FromBody] ToggleSaveCandidateRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chua dang nhap." });
        }

        var existing = await _context.SavedCandidates
            .FirstOrDefaultAsync(sc => sc.BusinessId == currentUserId.Value && sc.StudentId == request.StudentId);

        bool isSavedNow;
        if (existing != null)
        {
            _context.SavedCandidates.Remove(existing);
            isSavedNow = false;
        }
        else
        {
            _context.SavedCandidates.Add(new SavedCandidate
            {
                BusinessId = currentUserId.Value,
                StudentId = request.StudentId,
                SavedAt = DateTime.UtcNow
            });
            isSavedNow = true;
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, isSaved = isSavedNow });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = System.Diagnostics.Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }

    [AllowAnonymous]
    [HttpGet("/business/{id:int}/jobs")]
    public async Task<IActionResult> BusinessJobs(int id)
    {
        var business = await _context.BusinessProfiles
            .Include(bp => bp.User)
            .FirstOrDefaultAsync(bp => bp.UserId == id && !bp.User.IsDeleted && bp.User.Status == UserStatus.Active);

        if (business == null)
        {
            return NotFound();
        }

        var openJobEntities = await _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Where(j => j.BusinessId == id && !j.IsDeleted && j.Status == JobStatus.Open)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();

        var openJobs = openJobEntities.Select(j => new BusinessPublicJobViewModel
            {
                Id = j.Id,
                Title = j.Title,
                Description = j.Description,
                Requirements = j.Requirements ?? string.Empty,
                Benefits = j.Benefits ?? string.Empty,
                Budget = j.Budget,
                BudgetType = j.BudgetType.ToString(),
                ExperienceLevel = j.ExperienceLevelRequired.ToString().Replace("_", " "),
                Location = j.Location ?? "Linh hoạt",
                Quantity = j.Quantity,
                Deadline = j.Deadline.ToString("dd/MM/yyyy"),
                Skills = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList()
            })
            .ToList();

        var reviewEntities = await _context.Reviews
            .Include(r => r.Reviewer)
                .ThenInclude(u => u.StudentProfile)
            .Include(r => r.Reviewer)
                .ThenInclude(u => u.BusinessProfile)
            .Where(r => r.JobContract.BusinessId == id && r.ReviewerId != id)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var reviews = reviewEntities.Select(r => new BusinessPublicReviewViewModel
            {
                ReviewerName = r.Reviewer.StudentProfile != null
                    ? r.Reviewer.StudentProfile.FullName
                    : r.Reviewer.BusinessProfile != null
                        ? r.Reviewer.BusinessProfile.CompanyName
                        : r.Reviewer.Email,
                ReviewerAvatar = r.Reviewer.StudentProfile != null
                    ? r.Reviewer.StudentProfile.AvatarUrl ?? string.Empty
                    : r.Reviewer.BusinessProfile != null
                        ? r.Reviewer.BusinessProfile.LogoUrl ?? string.Empty
                        : string.Empty,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt.ToString("dd/MM/yyyy")
            })
            .ToList();

        var model = new BusinessJobsPageViewModel
        {
            BusinessId = business.UserId,
            CompanyName = business.CompanyName,
            Email = business.User.Email,
            Phone = business.User.Phone,
            WebsiteUrl = business.WebsiteUrl,
            CompanySize = business.CompanySize,
            Address = business.Address,
            LogoUrl = business.LogoUrl,
            CoverImageUrl = business.CoverImageUrl,
            Description = business.Description,
            Industry = business.Industry,
            IsVerified = business.IsVerified,
            AverageRating = reviews.Count > 0 ? Convert.ToDecimal(Math.Round(reviews.Average(r => r.Rating), 1)) : 5m,
            ReviewsCount = reviews.Count,
            OpenJobsCount = openJobs.Count,
            OpenJobs = openJobs,
            Reviews = reviews
        };

        return View(model);
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> GenerateDepositQr([FromBody] DepositQrRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập để nạp tiền." });
        }

        if (request.Amount <= 0)
        {
            return Json(new { success = false, message = "Số tiền nạp phải lớn hơn 0." });
        }

        if (request.Amount % 1 != 0)
        {
            return Json(new { success = false, message = "Số tiền nạp không được chứa phần thập phân." });
        }

        if (request.Amount < 50000m || request.Amount % 50000m != 0m)
        {
            return Json(new { success = false, message = "Số tiền nạp phải là bội của 50.000 đ." });
        }

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                UserId = currentUserId.Value,
                Balance = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
        }

        var transactionCode = $"DEP-{DateTime.UtcNow:yyyyMMddHHmmss}-{currentUserId.Value}-{Random.Shared.Next(1000, 9999)}";
        var expiresAt = DateTime.UtcNow.AddMinutes(15);
        var qrPayload = $"J4S|DEPOSIT|{transactionCode}|USER:{currentUserId.Value}|AMOUNT:{request.Amount:0}|EXPIRES:{expiresAt:O}";

        _context.Transactions.Add(new Transaction
        {
            WalletId = wallet.Id,
            Amount = request.Amount,
            Type = TransactionType.Deposit,
            TransactionCode = transactionCode,
            PaymentMethod = "QR_TRANSFER",
            Status = TransactionStatus.Pending,
            Description = $"Yêu cầu nạp tiền qua mã QR dùng một lần, hết hạn {expiresAt:dd/MM/yyyy HH:mm} UTC.",
            CreatedAt = DateTime.UtcNow
        });
        _context.Notifications.Add(new Notification
        {
            UserId = currentUserId.Value,
            Title = "Thông báo thanh toán",
            Message = $"Mã QR nạp {request.Amount:N0} đ đã được tạo. Giao dịch sẽ chuyển sang thành công sau khi được xác nhận.",
            Type = NotificationType.Payment,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            amount = request.Amount,
            transactionCode,
            expiresAt = expiresAt.ToString("dd/MM/yyyy HH:mm"),
            qrPayload
        });
    }

    // GET: /Home/GetProfile — Requires login
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập để xem thông tin." });
        }

        var user = await _context.Users
            .Include(u => u.Wallet)
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value && !u.IsDeleted);

        if (user == null)
        {
            return Json(new { success = false, message = "Không tìm thấy người dùng." });
        }

        if (user.Role == UserRole.Student)
        {
            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Include(sp => sp.PortfolioProjects)
                .Include(sp => sp.Certificates)
                .FirstOrDefaultAsync(sp => sp.UserId == currentUserId.Value);

            if (studentProfile == null)
            {
                return Json(new { success = false, message = "Không tìm thấy hồ sơ sinh viên." });
            }

            // Calculate Completion Rate from JobContracts
            var totalContracts = await _context.JobContracts.CountAsync(c => c.StudentId == currentUserId.Value);
            var completedContracts = await _context.JobContracts.CountAsync(c => c.StudentId == currentUserId.Value && c.Status == ContractStatus.Completed);
            var completionRate = totalContracts > 0 ? (int)Math.Round((double)completedContracts / totalContracts * 100) : 0;
            var level = 1 + (completedContracts / 2); // Level calculation: +1 level per 2 completed jobs

            // Retrieve Customer Reviews written for the student
            var reviews = await _context.Reviews
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.StudentProfile)
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.BusinessProfile)
                .Where(r => r.JobContract.StudentId == currentUserId.Value && r.ReviewerId != currentUserId.Value)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    reviewerName = r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.FullName : (r.Reviewer.BusinessProfile != null ? r.Reviewer.BusinessProfile.CompanyName : r.Reviewer.Email),
                    reviewerAvatar = r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.AvatarUrl : (r.Reviewer.BusinessProfile != null ? r.Reviewer.BusinessProfile.LogoUrl : ""),
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt.ToString("dd/MM/yyyy")
                })
                .ToListAsync();

            return Json(new
            {
                success = true,
                role = "Student",
                fullName = studentProfile.FullName,
                email = user.Email,
                phone = user.Phone,
                university = studentProfile.University ?? "",
                major = studentProfile.Major ?? "",
                gpa = studentProfile.GPA,
                graduationYear = studentProfile.GraduationYear,
                bio = studentProfile.Bio ?? "",
                experience = studentProfile.Experience ?? "",
                avatarUrl = studentProfile.AvatarUrl ?? "",
                coverImageUrl = studentProfile.CoverImageUrl ?? "",
                gender = studentProfile.Gender ?? "Khác",
                dateOfBirth = studentProfile.DateOfBirth?.ToString("yyyy-MM-dd") ?? "",
                cvName = studentProfile.CvName ?? "",
                cvUrl = studentProfile.CvUrl ?? "",
                skills = studentProfile.StudentSkills.Select(ss => ss.Skill.Name).ToList(),
                portfolio = studentProfile.PortfolioProjects.Select(p => new
                {
                    title = p.Title,
                    description = p.Description ?? "",
                    projectUrl = p.ProjectUrl ?? ""
                }).ToList(),
                certificates = studentProfile.Certificates.Select(c => new
                {
                    certificateName = c.CertificateName,
                    organization = c.Organization,
                    issuedDate = c.IssuedDate.ToString("yyyy-MM-dd"),
                    expiryDate = c.ExpiryDate.HasValue ? c.ExpiryDate.Value.ToString("yyyy-MM-dd") : "",
                    credentialUrl = c.CredentialUrl ?? ""
                }).ToList(),
                completedJobsCount = completedContracts,
                completionRate = completionRate,
                level = level,
                reviews = reviews,
                balance = user.Wallet?.Balance ?? 0m
            });
        }
        else if (user.Role == UserRole.Business)
        {
            var businessProfile = await _context.BusinessProfiles
                .FirstOrDefaultAsync(bp => bp.UserId == currentUserId.Value);

            if (businessProfile == null)
            {
                return Json(new { success = false, message = "Không tìm thấy hồ sơ doanh nghiệp." });
            }

            // Calculate business stats
            var totalContracts = await _context.JobContracts.CountAsync(c => c.BusinessId == currentUserId.Value);
            var completedContracts = await _context.JobContracts.CountAsync(c => c.BusinessId == currentUserId.Value && c.Status == ContractStatus.Completed);
            var completionRate = totalContracts > 0 ? (int)Math.Round((double)completedContracts / totalContracts * 100) : 100;

            // Retrieve Customer Reviews written for the business
            var reviews = await _context.Reviews
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.StudentProfile)
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.BusinessProfile)
                .Where(r => r.JobContract.BusinessId == currentUserId.Value && r.ReviewerId != currentUserId.Value)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    reviewerName = r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.FullName : (r.Reviewer.BusinessProfile != null ? r.Reviewer.BusinessProfile.CompanyName : r.Reviewer.Email),
                    reviewerAvatar = r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.AvatarUrl : (r.Reviewer.BusinessProfile != null ? r.Reviewer.BusinessProfile.LogoUrl : ""),
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt.ToString("dd/MM/yyyy")
                })
                .ToListAsync();

            return Json(new
            {
                success = true,
                role = "Business",
                companyName = businessProfile.CompanyName,
                taxCode = businessProfile.TaxCode ?? "",
                websiteUrl = businessProfile.WebsiteUrl ?? "",
                companySize = businessProfile.CompanySize ?? "",
                address = businessProfile.Address ?? "",
                logoUrl = businessProfile.LogoUrl ?? "",
                coverImageUrl = businessProfile.CoverImageUrl ?? "",
                description = businessProfile.Description ?? "",
                industry = businessProfile.Industry ?? "",
                isVerified = businessProfile.IsVerified,
                email = user.Email,
                phone = user.Phone,
                completionRate = completionRate,
                completedJobsCount = completedContracts,
                openJobsCount = await _context.JobPosts.CountAsync(j => j.BusinessId == currentUserId.Value && !j.IsDeleted && j.Status == JobStatus.Open),
                reviews = reviews,
                balance = user.Wallet?.Balance ?? 0m
            });
        }
        else if (user.Role == UserRole.Admin)
        {
            var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
            var totalJobs = await _context.JobPosts.CountAsync(j => !j.IsDeleted);
            var totalContracts = await _context.JobContracts.CountAsync();
            var systemVolume = await _context.Wallets.Where(w => w.User.Role == UserRole.Business).SumAsync(w => w.Balance);

            var reviews = await _context.Reviews
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.StudentProfile)
                .Include(r => r.Reviewer)
                    .ThenInclude(u => u.BusinessProfile)
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new
                {
                    reviewerName = r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.FullName : (r.Reviewer.BusinessProfile != null ? r.Reviewer.BusinessProfile.CompanyName : r.Reviewer.Email),
                    reviewerAvatar = r.Reviewer.StudentProfile != null ? r.Reviewer.StudentProfile.AvatarUrl : (r.Reviewer.BusinessProfile != null ? r.Reviewer.BusinessProfile.LogoUrl : ""),
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt.ToString("dd/MM/yyyy")
                })
                .ToListAsync();

            return Json(new
            {
                success = true,
                role = "Admin",
                displayName = user.Email,
                email = user.Email,
                phone = user.Phone,
                avatarUrl = string.Empty,
                joinedAt = user.CreatedAt.ToString("dd/MM/yyyy"),
                totalUsers,
                totalJobs,
                totalContracts,
                systemVolume,
                reviews,
                balance = user.Wallet?.Balance ?? 0m
            });
        }

        return Json(new { success = false, message = "Quyền truy cập không hợp lệ." });
    }

    // POST: /Home/SaveProfile — Requires login
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> SaveProfile([FromBody] SaveProfileRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập để lưu hồ sơ." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value && !u.IsDeleted);

        if (user == null)
        {
            return Json(new { success = false, message = "Không tìm thấy người dùng." });
        }

        if (!string.IsNullOrEmpty(request.Email))
        {
            var emailExists = await _context.Users.AnyAsync(u => u.Id != currentUserId.Value && u.Email == request.Email);
            if (emailExists)
            {
                return Json(new { success = false, message = "Email đã được sử dụng bởi tài khoản khác." });
            }
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.Phone))
        {
            var phoneExists = await _context.Users.AnyAsync(u => u.Id != currentUserId.Value && u.Phone == request.Phone);
            if (phoneExists)
            {
                return Json(new { success = false, message = "Số điện thoại đã được sử dụng bởi tài khoản khác." });
            }
            user.Phone = request.Phone;
        }

        if (user.Role == UserRole.Student)
        {
            // Validate GPA range [0.0 - 4.0]
            if (request.GPA.HasValue && (request.GPA.Value < 0.0 || request.GPA.Value > 4.0))
            {
                return Json(new { success = false, message = "GPA phải nằm trong khoảng từ 0.0 đến 4.0." });
            }

            // Validate age from DateOfBirth [15 - 70]
            if (!string.IsNullOrEmpty(request.DateOfBirth) && DateTime.TryParse(request.DateOfBirth, out var dobValidation))
            {
                var age = DateTime.Today.Year - dobValidation.Year;
                if (dobValidation.Date > DateTime.Today.AddYears(-age)) age--;
                if (age < 15 || age > 70)
                {
                    return Json(new { success = false, message = "Tuổi không hợp lệ. Tuổi phải từ 15 đến 70." });
                }
            }

            // Validate CV file extension
            if (!string.IsNullOrEmpty(request.CvName))
            {
                var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
                var ext = System.IO.Path.GetExtension(request.CvName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                {
                    return Json(new { success = false, message = "File CV chỉ chấp nhận định dạng .pdf, .doc hoặc .docx." });
                }
            }

            // Validate CV file size (max 5MB, stored as base64)
            if (!string.IsNullOrEmpty(request.CvUrl))
            {
                var base64Data = request.CvUrl.Contains(",") ? request.CvUrl.Split(',')[1] : request.CvUrl;
                var estimatedBytes = (long)(base64Data.Length * 0.75);
                const long maxCvBytes = 5 * 1024 * 1024; // 5MB
                if (estimatedBytes > maxCvBytes)
                {
                    return Json(new { success = false, message = "File CV không được vượt quá 5MB." });
                }
            }

            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.StudentSkills)
                .Include(sp => sp.PortfolioProjects)
                .Include(sp => sp.Certificates)
                .FirstOrDefaultAsync(sp => sp.UserId == currentUserId.Value);

            if (studentProfile == null)
            {
                return Json(new { success = false, message = "Không tìm thấy hồ sơ sinh viên." });
            }

            studentProfile.FullName = request.FullName;
            studentProfile.Bio = request.Bio;
            studentProfile.Experience = request.Experience;
            studentProfile.University = request.University;
            studentProfile.Major = request.Major;
            studentProfile.GPA = request.GPA;
            studentProfile.GraduationYear = request.GraduationYear;
            studentProfile.Gender = request.Gender;

            if (DateTime.TryParse(request.DateOfBirth, out var dob))
            {
                studentProfile.DateOfBirth = DateTime.SpecifyKind(dob, DateTimeKind.Utc);
            }
            else
            {
                studentProfile.DateOfBirth = null;
            }

            if (!string.IsNullOrEmpty(request.AvatarUrl))
            {
                studentProfile.AvatarUrl = request.AvatarUrl;
            }
            if (!string.IsNullOrEmpty(request.CoverImageUrl))
            {
                studentProfile.CoverImageUrl = request.CoverImageUrl;
            }

            studentProfile.CvName = request.CvName;
            studentProfile.CvUrl = request.CvUrl;

            // Sync Skills
            _context.StudentSkills.RemoveRange(studentProfile.StudentSkills);
            await _context.SaveChangesAsync();

            if (request.Skills != null)
            {
                foreach (var skillName in request.Skills)
                {
                    var trimmedName = skillName.Trim();
                    if (string.IsNullOrEmpty(trimmedName)) continue;

                    var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Name.ToLower() == trimmedName.ToLower());
                    if (skill == null)
                    {
                        skill = new Skill { Name = trimmedName, Category = "Khác" };
                        _context.Skills.Add(skill);
                        await _context.SaveChangesAsync();
                    }

                    _context.StudentSkills.Add(new StudentSkill
                    {
                        StudentId = studentProfile.UserId,
                        SkillId = skill.Id,
                        ExperienceMonths = 6,
                        SkillLevel = SkillLevel.Intermediate
                    });
                }
            }

            // Sync Portfolio
            _context.PortfolioProjects.RemoveRange(studentProfile.PortfolioProjects);
            await _context.SaveChangesAsync();

            if (request.Portfolio != null)
            {
                foreach (var item in request.Portfolio)
                {
                    if (string.IsNullOrEmpty(item.Title)) continue;

                    _context.PortfolioProjects.Add(new PortfolioProject
                    {
                        StudentId = studentProfile.UserId,
                        Title = item.Title,
                        Description = item.Description,
                        ProjectUrl = item.ProjectUrl
                    });
                }
            }

            // Sync Certificates
            _context.Certificates.RemoveRange(studentProfile.Certificates);
            await _context.SaveChangesAsync();

            if (request.Certificates != null)
            {
                foreach (var cert in request.Certificates)
                {
                    if (string.IsNullOrEmpty(cert.CertificateName)) continue;

                    DateTime.TryParse(cert.IssuedDate, out var issued);
                    DateTime? expiry = null;
                    if (!string.IsNullOrEmpty(cert.ExpiryDate) && DateTime.TryParse(cert.ExpiryDate, out var exp))
                    {
                        expiry = DateTime.SpecifyKind(exp, DateTimeKind.Utc);
                    }

                    _context.Certificates.Add(new Certificate
                    {
                        StudentId = studentProfile.UserId,
                        CertificateName = cert.CertificateName,
                        Organization = cert.Organization ?? "",
                        IssuedDate = DateTime.SpecifyKind(issued, DateTimeKind.Utc),
                        ExpiryDate = expiry,
                        CredentialUrl = cert.CredentialUrl
                    });
                }
            }
        }
        else if (user.Role == UserRole.Business)
        {
            var businessProfile = await _context.BusinessProfiles
                .FirstOrDefaultAsync(bp => bp.UserId == currentUserId.Value);

            if (businessProfile == null)
            {
                return Json(new { success = false, message = "Không tìm thấy hồ sơ doanh nghiệp." });
            }

            businessProfile.CompanyName = request.CompanyName;
            businessProfile.TaxCode = request.TaxCode;
            businessProfile.WebsiteUrl = request.WebsiteUrl;
            businessProfile.CompanySize = request.CompanySize;
            businessProfile.Address = request.Address;
            businessProfile.Industry = request.Industry;
            businessProfile.Description = request.BusinessDescription;

            if (!string.IsNullOrEmpty(request.LogoUrl))
            {
                businessProfile.LogoUrl = request.LogoUrl;
            }
            if (!string.IsNullOrEmpty(request.CoverImageUrl))
            {
                businessProfile.CoverImageUrl = request.CoverImageUrl;
            }
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, message = "Hồ sơ đã được lưu thành công!" });
    }

    // POST: /Home/ChangePassword — Requires login
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập để đổi mật khẩu." });
        }

        if (string.IsNullOrEmpty(request.OldPassword) || string.IsNullOrEmpty(request.NewPassword))
        {
            return Json(new { success = false, message = "Vui lòng điền đầy đủ thông tin mật khẩu." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value && !u.IsDeleted);
        if (user == null)
        {
            return Json(new { success = false, message = "Không tìm thấy người dùng." });
        }

        var oldPasswordHash = JobForStudents.Helpers.PasswordHasher.HashPassword(request.OldPassword);
        if (user.PasswordHash != oldPasswordHash)
        {
            return Json(new { success = false, message = "Mật khẩu cũ không chính xác." });
        }

        var newPasswordHash = JobForStudents.Helpers.PasswordHasher.HashPassword(request.NewPassword);
        if (user.PasswordHash == newPasswordHash)
        {
            return Json(new { success = false, message = "Mật khẩu mới không được trùng với mật khẩu cũ." });
        }

        user.PasswordHash = newPasswordHash;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đổi mật khẩu thành công!" });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetBusinessServicePackage()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var subscription = await GetCurrentBusinessSubscription(currentUserId.Value, createFreePlanIfMissing: true);
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);
        var plans = await _context.ServicePlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.Price)
            .ToListAsync();

        return Json(new
        {
            success = true,
            balance = wallet?.Balance ?? 0m,
            currentPackage = subscription == null ? null : new
            {
                id = subscription.Id,
                planId = subscription.ServicePlanId,
                planName = subscription.ServicePlan.Name,
                description = subscription.ServicePlan.Description,
                price = subscription.ServicePlan.Price,
                jobPostLimit = subscription.ServicePlan.JobPostLimit,
                startDate = subscription.StartDate.ToString("dd/MM/yyyy"),
                endDate = subscription.EndDate.ToString("dd/MM/yyyy"),
                daysLeft = Math.Max(0, (int)Math.Ceiling((subscription.EndDate - DateTime.UtcNow).TotalDays)),
                remainingJobPosts = subscription.RemainingJobPosts,
                status = subscription.Status.ToString(),
                benefits = SplitBenefits(subscription.ServicePlan.Benefits)
            },
            plans = plans.Select(p => new
            {
                id = p.Id,
                name = p.Name,
                description = p.Description,
                price = p.Price,
                durationDays = p.DurationDays,
                jobPostLimit = p.JobPostLimit,
                benefits = SplitBenefits(p.Benefits)
            }).ToList()
        });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> PurchaseServicePlan([FromBody] PurchaseServicePlanRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var plan = await _context.ServicePlans.FirstOrDefaultAsync(p => p.Id == request.PlanId && p.IsActive);
        if (plan == null)
        {
            return Json(new { success = false, message = "Không tìm thấy gói dịch vụ." });
        }

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);
        if (wallet == null)
        {
            return Json(new { success = false, message = "Không tìm thấy ví doanh nghiệp." });
        }

        var currentSubscription = await GetCurrentBusinessSubscription(currentUserId.Value, createFreePlanIfMissing: false);
        if (currentSubscription != null)
        {
            var currentPlan = currentSubscription.ServicePlan;
            var isSamePlan = currentPlan.Id == plan.Id;
            var isLowerOrEqualPlan = plan.Price < currentPlan.Price
                || (plan.Price == currentPlan.Price && plan.JobPostLimit <= currentPlan.JobPostLimit);

            if (isSamePlan)
            {
                return Json(new { success = false, message = "Bạn đang sử dụng gói này. Nếu muốn thêm thời hạn hoặc lượt đăng, hãy dùng chức năng gia hạn gói." });
            }

            if (isLowerOrEqualPlan)
            {
                return Json(new { success = false, message = "Không thể chuyển xuống gói thấp hơn hoặc ngang cấp. Doanh nghiệp chỉ có thể nâng cấp lên gói cao hơn." });
            }
        }

        if (wallet.Balance < plan.Price)
        {
            return Json(new { success = false, message = "Số dư ví không đủ để thanh toán gói này. Vui lòng nạp thêm tiền." });
        }

        var now = DateTime.UtcNow;
        wallet.Balance -= plan.Price;
        wallet.UpdatedAt = now;

        if (currentSubscription != null)
        {
            currentSubscription.Status = SubscriptionStatus.Expired;
            currentSubscription.UpdatedAt = now;
        }

        var subscription = new BusinessSubscription
        {
            BusinessId = currentUserId.Value,
            ServicePlanId = plan.Id,
            StartDate = now,
            EndDate = now.AddDays(plan.DurationDays),
            RemainingJobPosts = plan.JobPostLimit,
            Status = SubscriptionStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        };
        _context.BusinessSubscriptions.Add(subscription);

        AddServicePlanTransaction(wallet.Id, plan.Price, plan.Name, "Thanh toán nâng cấp gói dịch vụ");
        _context.Notifications.Add(new Notification
        {
            UserId = currentUserId.Value,
            Title = "Thanh toán gói dịch vụ thành công",
            Message = $"Bạn đã kích hoạt gói {plan.Name}. Gói có hiệu lực đến {subscription.EndDate:dd/MM/yyyy}.",
            Type = NotificationType.Payment,
            IsRead = false,
            CreatedAt = now
        });

        await _context.SaveChangesAsync();
        return Json(new { success = true, message = $"Đã nâng cấp lên gói {plan.Name}." });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> RenewServicePlan([FromBody] RenewServicePlanRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var subscription = await GetCurrentBusinessSubscription(currentUserId.Value, createFreePlanIfMissing: true);
        if (subscription == null)
        {
            return Json(new { success = false, message = "Doanh nghiệp chưa có gói dịch vụ." });
        }

        var plan = subscription.ServicePlan;
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);
        if (wallet == null)
        {
            return Json(new { success = false, message = "Không tìm thấy ví doanh nghiệp." });
        }

        if (wallet.Balance < plan.Price)
        {
            return Json(new { success = false, message = "Số dư ví không đủ để gia hạn gói. Vui lòng nạp thêm tiền." });
        }

        var now = DateTime.UtcNow;
        wallet.Balance -= plan.Price;
        wallet.UpdatedAt = now;

        subscription.EndDate = (subscription.EndDate > now ? subscription.EndDate : now).AddDays(plan.DurationDays);
        subscription.RemainingJobPosts += plan.JobPostLimit;
        subscription.Status = SubscriptionStatus.Active;
        subscription.UpdatedAt = now;

        AddServicePlanTransaction(wallet.Id, plan.Price, plan.Name, request.IsAutoRenew ? "Tự động gia hạn gói dịch vụ" : "Gia hạn gói dịch vụ");
        _context.Notifications.Add(new Notification
        {
            UserId = currentUserId.Value,
            Title = "Gia hạn gói dịch vụ thành công",
            Message = $"Gói {plan.Name} đã được gia hạn đến {subscription.EndDate:dd/MM/yyyy}.",
            Type = NotificationType.Payment,
            IsRead = false,
            CreatedAt = now

        });

        await _context.SaveChangesAsync();
        return Json(new { success = true, message = $"Đã gia hạn gói {plan.Name}." });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetServicePlanPaymentHistory()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);
        if (wallet == null)
        {
            return Json(new { success = true, payments = Array.Empty<object>() });
        }

        var payments = await _context.Transactions
            .Where(t => t.WalletId == wallet.Id && t.PaymentMethod == "SERVICE_PLAN")
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                id = t.Id,
                code = t.TransactionCode,
                amount = t.Amount,
                status = t.Status.ToString(),
                description = t.Description ?? "",
                createdAt = t.CreatedAt.ToString("dd/MM/yyyy HH:mm")
            })
            .ToListAsync();

        return Json(new { success = true, payments });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetBusinessJobPosts()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var jobs = await _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Include(j => j.JobBids)
            .Include(j => j.JobContracts)
            .Where(j => j.BusinessId == currentUserId.Value && !j.IsDeleted)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();

        var allBids = jobs.SelectMany(j => j.JobBids).ToList();

        return Json(new
        {
            success = true,
            summary = new
            {
                totalApplicants = allBids.Count,
                totalReceivedProfiles = allBids.Select(b => b.StudentId).Distinct().Count()
            },
            jobs = jobs.Select(j => new
            {
                id = j.Id,
                title = j.Title,
                description = j.Description,
                requirements = j.Requirements ?? "",
                benefits = j.Benefits ?? "",
                budget = j.Budget,
                budgetType = j.BudgetType.ToString(),
                experienceLevel = j.ExperienceLevelRequired.ToString(),
                location = j.Location ?? "",
                quantity = j.Quantity,
                deadline = j.Deadline.ToString("yyyy-MM-dd"),
                deadlineText = j.Deadline.ToString("dd/MM/yyyy"),
                status = j.Status.ToString(),
                statusText = GetJobStatusText(j.Status, j.IsApproved),
                isApproved = j.IsApproved,
                applicantsCount = j.JobBids.Count,
                hiredCount = j.JobBids.Count(b => b.Status == BidStatus.Hired),
                skills = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
                category = j.Category ?? (j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác"),
                createdAt = j.CreatedAt.ToString("dd/MM/yyyy"),
                contracts = j.JobContracts.Select(c => new {
                    id = c.Id,
                    status = c.Status.ToString(),
                    studentCompleted = c.DeliverableContent != null && c.DeliverableContent.Contains("StudentCompleted"),
                    businessCompleted = c.DeliverableContent != null && c.DeliverableContent.Contains("BusinessCompleted")
                }).ToList()
            }).ToList()
        });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> SaveBusinessJobPost([FromBody] BusinessJobPostRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length < 10 || request.Title.Length > 150)
        {
            return Json(new { success = false, message = "Tiêu đề tin tuyển dụng phải có độ dài từ 10 đến 150 ký tự." });
        }

        if (request.Quantity < 1)
        {
            return Json(new { success = false, message = "Số lượng ứng viên cần tuyển phải lớn hơn hoặc bằng 1." });
        }

        var hasDeadline = DateTime.TryParse(request.Deadline, out var parsedDeadline);
        if (!request.SaveAsDraft && !hasDeadline)
        {
            return Json(new { success = false, message = "Deadline không hợp lệ." });
        }

        if (!request.SaveAsDraft && hasDeadline)
        {
            var tomorrow = DateTime.Today.AddDays(1);
            var maxFutureDate = DateTime.Today.AddDays(90);
            if (parsedDeadline.Date < tomorrow)
            {
                return Json(new { success = false, message = "Hạn chót ứng tuyển phải từ ngày mai trở đi." });
            }
            if (parsedDeadline.Date > maxFutureDate)
            {
                return Json(new { success = false, message = "Hạn chót ứng tuyển không được vượt quá 90 ngày kể từ ngày đăng." });
            }
        }

        if (!request.SaveAsDraft && string.IsNullOrWhiteSpace(request.Description))
        {
            return Json(new { success = false, message = "Vui lòng nhập mô tả công việc." });
        }

        if (!request.SaveAsDraft && (request.Budget < 10000 || request.Budget > 10000000000))
        {
            return Json(new { success = false, message = "Mức lương hợp lệ phải từ 10,000đ đến 10,000,000,000đ (10 tỷ đồng)." });
        }

        if (!hasDeadline)
        {
            parsedDeadline = DateTime.UtcNow.AddDays(14);
        }

        var deadline = DateTime.SpecifyKind(parsedDeadline.Date.AddHours(23).AddMinutes(59), DateTimeKind.Utc);
        JobPost job;
        BusinessSubscription? activeSubscription = null;
        var shouldConsumeJobPost = false;

        if (request.Id.HasValue)
        {
            var existingJob = await _context.JobPosts
                .Include(j => j.JobPostSkills)
                .FirstOrDefaultAsync(j => j.Id == request.Id.Value && j.BusinessId == currentUserId.Value && !j.IsDeleted);

            if (existingJob == null)
            {
                return Json(new { success = false, message = "Không tìm thấy tin tuyển dụng." });
            }

            job = existingJob;
            shouldConsumeJobPost = !request.SaveAsDraft && existingJob.Status == JobStatus.Draft;
        }
        else
        {
            shouldConsumeJobPost = !request.SaveAsDraft;
            activeSubscription = shouldConsumeJobPost
                ? await GetCurrentBusinessSubscription(currentUserId.Value, createFreePlanIfMissing: true)
                : null;
            if (shouldConsumeJobPost && (activeSubscription == null || activeSubscription.RemainingJobPosts <= 0))
            {
                return Json(new { success = false, message = "Gói dịch vụ hiện tại đã hết số lượng tin đăng. Vui lòng nâng cấp hoặc gia hạn gói." });
            }

            job = new JobPost
            {
                BusinessId = currentUserId.Value,
                CreatedAt = DateTime.UtcNow,
                Status = request.SaveAsDraft ? JobStatus.Draft : JobStatus.Open
            };
            _context.JobPosts.Add(job);
        }

        job.Title = request.Title.Trim();
        job.Description = string.IsNullOrWhiteSpace(request.Description) ? "Bản nháp" : request.Description.Trim();
        job.Requirements = request.Requirements?.Trim();
        job.Benefits = request.Benefits?.Trim();
        job.Budget = Math.Max(0, request.Budget);
        job.BudgetType = request.BudgetType == "Hourly" ? BudgetType.Hourly : BudgetType.Fixed;
        job.ExperienceLevelRequired = request.ExperienceLevel == "Expert"
            ? ExperienceLevel.Expert
            : request.ExperienceLevel == "Mid_Level"
                ? ExperienceLevel.Mid_Level
                : ExperienceLevel.No_Experience;
        job.Location = request.Location?.Trim();
        job.Quantity = Math.Max(1, request.Quantity);
        job.Deadline = deadline;
        job.Status = request.SaveAsDraft ? JobStatus.Draft : JobStatus.Open;
        job.Category = request.Category?.Trim();
        job.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await SyncJobSkills(job.Id, request.Category ?? "Khác", request.Skills);

        if (shouldConsumeJobPost && activeSubscription != null)
        {
            activeSubscription.RemainingJobPosts = Math.Max(0, activeSubscription.RemainingJobPosts - 1);
            activeSubscription.UpdatedAt = DateTime.UtcNow;
        }

        _context.Notifications.Add(new Notification
        {
            UserId = currentUserId.Value,
            Title = request.Id.HasValue ? "Tin tuyển dụng đã được cập nhật" : "Tin tuyển dụng đã được tạo",
            Message = $"Tin \"{job.Title}\" đang ở trạng thái {GetJobStatusText(job.Status, job.IsApproved)}.",
            Type = NotificationType.JobStatus,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Json(new { success = true, message = request.Id.HasValue ? "Đã cập nhật tin tuyển dụng." : "Đã tạo tin tuyển dụng." });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> ChangeBusinessJobStatus([FromBody] ChangeJobStatusRequest request)
    {
        var job = await GetOwnedJobPost(request.JobId);
        if (job == null)
        {
            return Json(new { success = false, message = "Không tìm thấy tin tuyển dụng." });
        }

        job.Status = request.Status switch
        {
            "Draft" => JobStatus.Draft,
            "Open" => JobStatus.Open,
            "Paused" => JobStatus.Paused,
            "Closed" => JobStatus.Closed,
            "Rejected" => JobStatus.Rejected,
            _ => job.Status
        };
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã chuyển tin sang trạng thái {GetJobStatusText(job.Status, job.IsApproved)}." });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> ExtendBusinessJobPost([FromBody] ExtendJobPostRequest request)
    {
        var job = await GetOwnedJobPost(request.JobId);
        if (job == null)
        {
            return Json(new { success = false, message = "Không tìm thấy tin tuyển dụng." });
        }

        var days = Math.Clamp(request.Days, 1, 90);
        job.Deadline = DateTime.SpecifyKind(job.Deadline.AddDays(days), DateTimeKind.Utc);
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã gia hạn tin thêm {days} ngày." });
    }



    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetJobApplicants(int jobId)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập." });
        }

        var job = await GetOwnedJobPost(jobId);
        if (job == null)
        {
            return Json(new { success = false, message = "Không tìm thấy tin tuyển dụng." });
        }

        var applicants = await _context.JobBids
            .Include(b => b.StudentProfile)
                .ThenInclude(sp => sp.User)
            .Include(b => b.StudentProfile)
                .ThenInclude(sp => sp.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
            .Where(b => b.JobPostId == jobId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var contracts = await _context.JobContracts
            .Where(c => c.JobPostId == jobId && c.BusinessId == currentUserId.Value)
            .ToListAsync();

        return Json(new
        {
            success = true,
            jobTitle = job.Title,
            applicants = applicants.Select(b => {
                var contract = contracts.FirstOrDefault(c => c.StudentId == b.StudentId);
                return new
                {
                    id = b.Id,
                    studentId = b.StudentId,
                    name = b.StudentProfile.FullName,
                    avatarUrl = b.StudentProfile.AvatarUrl ?? "",
                    email = b.StudentProfile.User.Email,
                    phone = b.StudentProfile.User.Phone,
                    bidAmount = b.BidAmount,
                    estimatedDays = b.EstimatedDays,
                    proposal = b.Proposal,
                    status = b.Status.ToString(),
                    createdAt = b.CreatedAt.ToString("dd/MM/yyyy"),
                    skills = b.StudentProfile.StudentSkills.Select(ss => ss.Skill.Name).ToList(),
                    contractId = contract?.Id,
                    contractStatus = contract?.Status.ToString(),
                    studentCompleted = contract?.DeliverableContent != null && contract.DeliverableContent.Contains("StudentCompleted"),
                    businessCompleted = contract?.DeliverableContent != null && contract.DeliverableContent.Contains("BusinessCompleted")
                };
            }).ToList()
        });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> CompleteContractBusiness([FromForm] int contractId)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Vui lòng đăng nhập." });
        }

        var contract = await _context.JobContracts
            .Include(c => c.JobPost)
            .FirstOrDefaultAsync(c => c.Id == contractId && c.BusinessId == currentUserId.Value);

        if (contract == null)
        {
            return Json(new { success = false, message = "Không tìm thấy hợp đồng hợp lệ hoặc bạn không có quyền." });
        }

        if (contract.Status == ContractStatus.Completed)
        {
            return Json(new { success = false, message = "Hợp đồng đã hoàn thành trước đó." });
        }

        if (contract.DeliverableContent != null && contract.DeliverableContent.Contains("BusinessCompleted"))
        {
            return Json(new { success = false, message = "Bạn đã xác nhận hoàn thành trước đó, vui lòng đợi sinh viên xác nhận." });
        }

        // Update DeliverableContent flag
        contract.DeliverableContent = string.IsNullOrEmpty(contract.DeliverableContent)
            ? "BusinessCompleted"
            : contract.DeliverableContent + ",BusinessCompleted";

        bool isFullyCompleted = contract.DeliverableContent.Contains("StudentCompleted");
        if (isFullyCompleted)
        {
            contract.Status = ContractStatus.Completed;
            contract.CompletedAt = DateTime.UtcNow;
            contract.JobPost.Status = JobStatus.Closed;

            // Notify Student
            _context.Notifications.Add(new Notification
            {
                UserId = contract.StudentId,
                Title = "Dự án đã hoàn thành",
                Message = $"Doanh nghiệp đã xác nhận hoàn thành dự án \"{contract.JobPost.Title}\". Trạng thái hợp đồng hiện tại là Hoàn thành.",
                Type = NotificationType.JobStatus,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            contract.Status = ContractStatus.Submitted;
        }

        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            message = isFullyCompleted
                ? "Chúc mừng! Cả hai bên đã xác nhận hoàn thành dự án thành công."
                : "Xác nhận thành công. Đang đợi sinh viên xác nhận hoàn thành."
        });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetNewBusinessApplicants()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var applicants = await _context.JobBids
            .Include(b => b.JobPost)
            .Include(b => b.StudentProfile)
                .ThenInclude(sp => sp.User)
            .Include(b => b.StudentProfile)
                .ThenInclude(sp => sp.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
            .Where(b => b.JobPost.BusinessId == currentUserId.Value
                && !b.JobPost.IsDeleted)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Json(new
        {
            success = true,
            totalNewApplicants = applicants.Count,
            applicants = applicants.Select(b => new
            {
                id = b.Id,
                studentId = b.StudentId,
                name = b.StudentProfile.FullName,
                avatarUrl = b.StudentProfile.AvatarUrl ?? "",
                jobId = b.JobPostId,
                jobTitle = b.JobPost.Title,
                bidAmount = b.BidAmount,
                estimatedDays = b.EstimatedDays,
                proposal = b.Proposal,
                appliedAt = b.CreatedAt.ToString("dd/MM/yyyy"),
                appliedAgo = GetTimeAgo(b.CreatedAt),
                status = b.Status.ToString(),
                skills = b.StudentProfile.StudentSkills.Select(ss => ss.Skill.Name).Take(6).ToList()
            }).ToList()
        });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> StartCandidateChat([FromBody] StartCandidateChatRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var candidate = await _context.StudentProfiles
            .Include(sp => sp.User)
            .FirstOrDefaultAsync(sp => sp.UserId == request.StudentId && !sp.User.IsDeleted && sp.User.Status == UserStatus.Active);

        if (candidate == null)
        {
            return Json(new { success = false, message = "Không tìm thấy ứng viên." });
        }

        var hasConversation = await _context.Messages.AnyAsync(m =>
            (m.SenderId == currentUserId.Value && m.ReceiverId == request.StudentId)
            || (m.SenderId == request.StudentId && m.ReceiverId == currentUserId.Value));

        if (!hasConversation)
        {
            _context.Messages.Add(new Message
            {
                SenderId = currentUserId.Value,
                ReceiverId = request.StudentId,
                Content = string.IsNullOrWhiteSpace(request.Message)
                    ? "Chào bạn, doanh nghiệp muốn trao đổi thêm về hồ sơ ứng tuyển của bạn."
                    : request.Message.Trim(),
                IsRead = false,
                SentAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        return Json(new
        {
            success = true,
            conversationUserId = request.StudentId,
            candidateName = candidate.FullName,
            message = "Đã mở box chat với ứng viên."
        });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetMessageConversations()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var messages = await _context.Messages
            .Include(m => m.Sender)
                .ThenInclude(u => u.StudentProfile)
            .Include(m => m.Sender)
                .ThenInclude(u => u.BusinessProfile)
            .Include(m => m.Receiver)
                .ThenInclude(u => u.StudentProfile)
            .Include(m => m.Receiver)
                .ThenInclude(u => u.BusinessProfile)
            .Where(m => m.SenderId == currentUserId.Value || m.ReceiverId == currentUserId.Value)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();

        var conversations = messages
            .GroupBy(m => m.SenderId == currentUserId.Value ? m.Receiver : m.Sender)
            .Select(g =>
            {
                var last = g.OrderByDescending(m => m.SentAt).First();
                var other = g.Key;
                return new
                {
                    userId = other.Id,
                    name = GetDisplayName(other),
                    avatarUrl = GetDisplayAvatar(other),
                    lastMsg = last.Content,
                    time = GetTimeAgo(last.SentAt),
                    unread = g.Count(m => m.ReceiverId == currentUserId.Value && !m.IsRead)
                };
            })
            .ToList();

        return Json(new { success = true, conversations });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetConversationMessages(int userId)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var otherUser = await _context.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.BusinessProfile)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (otherUser == null)
        {
            return Json(new { success = false, message = "Không tìm thấy người dùng." });
        }

        var messages = await _context.Messages
            .Where(m => (m.SenderId == currentUserId.Value && m.ReceiverId == userId)
                || (m.SenderId == userId && m.ReceiverId == currentUserId.Value))
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        var unreadMessages = messages.Where(m => m.ReceiverId == currentUserId.Value && !m.IsRead).ToList();
        if (unreadMessages.Count > 0)
        {
            foreach (var message in unreadMessages)
            {
                message.IsRead = true;
            }
            await _context.SaveChangesAsync();
        }

        return Json(new
        {
            success = true,
            user = new
            {
                id = otherUser.Id,
                name = GetDisplayName(otherUser),
                avatarUrl = GetDisplayAvatar(otherUser)
            },
            messages = messages.Select(m => new
            {
                fromMe = m.SenderId == currentUserId.Value,
                text = m.Content,
                time = m.SentAt.ToString("HH:mm")
            }).ToList()
        });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetUnreadMessagesCount()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, count = 0 });
        }

        var count = await _context.Messages
            .CountAsync(m => m.ReceiverId == currentUserId.Value && !m.IsRead);

        return Json(new { success = true, count });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> SendConversationMessage([FromBody] SendConversationMessageRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return Json(new { success = false, message = "Vui lòng nhập tin nhắn." });
        }

        if (request.Content.Length > 4000)
        {
            return Json(new { success = false, message = "Nội dung tin nhắn không được vượt quá 4000 ký tự." });
        }

        var receiver = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.ReceiverId && !u.IsDeleted);
        if (receiver == null)
        {
            return Json(new { success = false, message = "Người nhận không tồn tại hoặc đã bị xóa." });
        }

        if (receiver.Status == UserStatus.Banned)
        {
            return Json(new { success = false, message = "Không thể gửi tin nhắn vì tài khoản người nhận đã bị khóa." });
        }

        if (receiver.Status != UserStatus.Active)
        {
            return Json(new { success = false, message = "Tài khoản người nhận hiện không hoạt động." });
        }

        var message = new Message
        {
            SenderId = currentUserId.Value,
            ReceiverId = request.ReceiverId,
            Content = request.Content.Trim(),
            IsRead = false,
            SentAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            message = new
            {
                fromMe = true,
                text = message.Content,
                time = message.SentAt.ToString("HH:mm")
            }
        });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> SearchCandidateProfiles(string? keyword, string? skill, string? major, decimal? maxSalary, string? experience, double? minRating)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "ChÆ°a Ä‘Äƒng nháº­p." });
        }

        var candidatesQuery = _context.StudentProfiles
            .Include(sp => sp.User)
            .Include(sp => sp.StudentSkills)
                .ThenInclude(ss => ss.Skill)
            .Include(sp => sp.JobBids)
            .Where(sp => !sp.User.IsDeleted && sp.User.Status == UserStatus.Active);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim().ToLower();
            candidatesQuery = candidatesQuery.Where(sp =>
                sp.FullName.ToLower().Contains(term)
                || (sp.Bio != null && sp.Bio.ToLower().Contains(term))
                || (sp.University != null && sp.University.ToLower().Contains(term))
                || (sp.Major != null && sp.Major.ToLower().Contains(term))
                || sp.StudentSkills.Any(ss => ss.Skill.Name.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(skill))
        {
            var skillTerm = skill.Trim().ToLower();
            candidatesQuery = candidatesQuery.Where(sp => sp.StudentSkills.Any(ss => ss.Skill.Name.ToLower().Contains(skillTerm)));
        }

        if (!string.IsNullOrWhiteSpace(major))
        {
            var majorTerm = major.Trim().ToLower();
            candidatesQuery = candidatesQuery.Where(sp => sp.Major != null && sp.Major.ToLower().Contains(majorTerm));
        }

        if (!string.IsNullOrWhiteSpace(experience))
        {
            var expTerm = experience.Trim().ToLower();
            candidatesQuery = candidatesQuery.Where(sp =>
                (sp.Experience != null && sp.Experience.ToLower().Contains(expTerm))
                || sp.StudentSkills.Any(ss => ss.SkillLevel.ToString().ToLower().Contains(expTerm)));
        }

        var candidates = await candidatesQuery
            .OrderBy(sp => sp.FullName)
            .Take(80)
            .ToListAsync();

        var candidateIds = candidates.Select(c => c.UserId).ToList();
        var savedIds = new HashSet<int>(await _context.SavedCandidates
            .Where(sc => sc.BusinessId == currentUserId.Value)
            .Select(sc => sc.StudentId)
            .ToListAsync());

        var reviewStats = await _context.Reviews
            .Where(r => candidateIds.Contains(r.JobContract.StudentId) && r.ReviewerId != r.JobContract.StudentId)
            .GroupBy(r => r.JobContract.StudentId)
            .Select(g => new
            {
                StudentId = g.Key,
                AverageRating = g.Average(r => r.Rating),
                ReviewsCount = g.Count()
            })
            .ToDictionaryAsync(r => r.StudentId);

        var results = candidates.Select(sp =>
        {
            var averageBid = sp.JobBids.Any() ? sp.JobBids.Average(b => b.BidAmount) : 0m;
            reviewStats.TryGetValue(sp.UserId, out var stat);

            return new
            {
                id = sp.UserId,
                name = sp.FullName,
                avatarUrl = sp.AvatarUrl ?? "",
                major = sp.Major ?? "",
                university = sp.University ?? "",
                bio = sp.Bio ?? "",
                experience = sp.Experience ?? "",
                expectedSalary = averageBid,
                rating = stat?.AverageRating ?? 0,
                reviewsCount = stat?.ReviewsCount ?? 0,
                skills = sp.StudentSkills.Select(ss => ss.Skill.Name).ToList(),
                isSaved = savedIds.Contains(sp.UserId)
            };
        });

        if (maxSalary.HasValue)
        {
            results = results.Where(c => c.expectedSalary > 0 && c.expectedSalary <= maxSalary.Value);
        }

        if (minRating.HasValue)
        {
            results = results.Where(c => c.rating >= minRating.Value);
        }

        return Json(new { success = true, candidates = results.ToList() });
    }

    [Authorize(Roles = "Business")]
    [HttpGet]
    public async Task<IActionResult> GetCandidateProfile(int studentId)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "ChÆ°a Ä‘Äƒng nháº­p." });
        }

        var profile = await _context.StudentProfiles
            .Include(sp => sp.User)
            .Include(sp => sp.StudentSkills)
                .ThenInclude(ss => ss.Skill)
            .Include(sp => sp.PortfolioProjects)
            .Include(sp => sp.Certificates)
            .Include(sp => sp.JobBids)
            .FirstOrDefaultAsync(sp => sp.UserId == studentId && !sp.User.IsDeleted && sp.User.Status == UserStatus.Active);

        if (profile == null)
        {
            return Json(new { success = false, message = "KhÃ´ng tÃ¬m tháº¥y há»“ sÆ¡ á»©ng viÃªn." });
        }

        var reviews = await _context.Reviews
            .Include(r => r.Reviewer)
            .Include(r => r.JobContract)
            .Where(r => r.JobContract.StudentId == studentId && r.ReviewerId != studentId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(8)
            .ToListAsync();

        var isSaved = await _context.SavedCandidates
            .AnyAsync(sc => sc.BusinessId == currentUserId.Value && sc.StudentId == studentId);
        var averageBid = profile.JobBids.Any() ? profile.JobBids.Average(b => b.BidAmount) : 0m;

        return Json(new
        {
            success = true,
            candidate = new
            {
                id = profile.UserId,
                name = profile.FullName,
                avatarUrl = profile.AvatarUrl ?? "",
                coverImageUrl = profile.CoverImageUrl ?? "",
                email = profile.User.Email,
                phone = profile.User.Phone,
                university = profile.University ?? "",
                major = profile.Major ?? "",
                gpa = profile.GPA,
                graduationYear = profile.GraduationYear,
                bio = profile.Bio ?? "",
                experience = profile.Experience ?? "",
                cvName = profile.CvName ?? "",
                cvUrl = profile.CvUrl ?? "",
                expectedSalary = averageBid,
                rating = reviews.Any() ? reviews.Average(r => r.Rating) : 0,
                reviewsCount = reviews.Count,
                isSaved,
                skills = profile.StudentSkills.Select(ss => new
                {
                    name = ss.Skill.Name,
                    level = ss.SkillLevel.ToString(),
                    months = ss.ExperienceMonths
                }).ToList(),
                portfolio = profile.PortfolioProjects.Select(p => new
                {
                    title = p.Title,
                    description = p.Description ?? "",
                    projectUrl = p.ProjectUrl ?? ""
                }).ToList(),
                certificates = profile.Certificates.Select(c => new
                {
                    name = c.CertificateName,
                    organization = c.Organization,
                    issuedDate = c.IssuedDate.ToString("dd/MM/yyyy"),
                    expiryDate = c.ExpiryDate.HasValue ? c.ExpiryDate.Value.ToString("dd/MM/yyyy") : ""
                }).ToList(),
                reviews = reviews.Select(r => new
                {
                    reviewer = r.Reviewer.Email,
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt.ToString("dd/MM/yyyy")
                }).ToList()
            }
        });
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> ToggleSaveCandidate([FromBody] SaveCandidateRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "ChÆ°a Ä‘Äƒng nháº­p." });
        }

        var exists = await _context.StudentProfiles.AnyAsync(sp => sp.UserId == request.StudentId && !sp.User.IsDeleted);
        if (!exists)
        {
            return Json(new { success = false, message = "KhÃ´ng tÃ¬m tháº¥y á»©ng viÃªn." });
        }

        var saved = await _context.SavedCandidates
            .FirstOrDefaultAsync(sc => sc.BusinessId == currentUserId.Value && sc.StudentId == request.StudentId);

        if (saved == null)
        {
            _context.SavedCandidates.Add(new SavedCandidate
            {
                BusinessId = currentUserId.Value,
                StudentId = request.StudentId,
                SavedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Json(new { success = true, isSaved = true, message = "ÄÃ£ lÆ°u á»©ng viÃªn." });
        }

        _context.SavedCandidates.Remove(saved);
        await _context.SaveChangesAsync();
        return Json(new { success = true, isSaved = false, message = "ÄÃ£ bá» lÆ°u á»©ng viÃªn." });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }



        var notifications = (await _context.Notifications
            .Where(n => n.UserId == currentUserId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                id = n.Id,
                title = n.Title,
                desc = n.Message,
                type = n.Type.ToString(),
                time = GetTimeAgo(n.CreatedAt),
                unread = !n.IsRead,
                icon = GetIconForType(n.Type),
                color = GetColorForType(n.Type)
            })
            .ToListAsync())
            .Cast<object>()
            .ToList();

        if (User.IsInRole("Business"))
        {
            var soonDeadlineJobs = await _context.JobPosts
                .Where(j => j.BusinessId == currentUserId.Value
                    && !j.IsDeleted
                    && j.Status == JobStatus.Open
                    && j.Deadline <= DateTime.UtcNow.AddDays(3)
                    && j.Deadline >= DateTime.UtcNow)
                .OrderBy(j => j.Deadline)
                .Take(3)
                .ToListAsync();

            foreach (var job in soonDeadlineJobs)
            {
                notifications.Add(new
                {
                    id = -job.Id,
                    title = "Tin tuyển dụng sắp hết hạn",
                    desc = $"Tin \"{job.Title}\" sẽ hết hạn vào {job.Deadline:dd/MM/yyyy}.",
                    type = NotificationType.Deadline.ToString(),
                    time = "Sắp hết hạn",
                    unread = false,
                    icon = GetIconForType(NotificationType.Deadline),
                    color = GetColorForType(NotificationType.Deadline)
                });
            }

            var subscription = await _context.BusinessSubscriptions
                .Include(bs => bs.ServicePlan)
                .Where(bs => bs.BusinessId == currentUserId.Value && bs.Status == SubscriptionStatus.Active)
                .OrderByDescending(bs => bs.EndDate)
                .FirstOrDefaultAsync();

            if (subscription != null && subscription.EndDate >= DateTime.UtcNow && subscription.EndDate <= DateTime.UtcNow.AddDays(7))
            {
                notifications.Add(new
                {
                    id = -100000 - subscription.Id,
                    title = "Gói dịch vụ sắp hết hạn",
                    desc = $"Gói {subscription.ServicePlan.Name} sẽ hết hạn vào {subscription.EndDate:dd/MM/yyyy}.",
                    type = NotificationType.System.ToString(),
                    time = "Sắp hết hạn",
                    unread = false,
                    icon = GetIconForType(NotificationType.System),
                    color = GetColorForType(NotificationType.System)
                });
            }
        }

        return Json(notifications);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> MarkNotificationsAsRead()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == currentUserId.Value && !n.IsRead)
            .ToListAsync();

        foreach (var noti in unreadNotifications)
        {
            noti.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true });
    }

    private static string GetIconForType(NotificationType type)
    {
        return type switch
        {
            NotificationType.Payment => "💰",
            NotificationType.Review => "⭐",
            NotificationType.Message => "💬",
            NotificationType.Deadline => "⏰",
            _ => "🔔"
        };
    }

    private static string GetColorForType(NotificationType type)
    {
        return type switch
        {
            NotificationType.Payment => "#3b82f6", // Blue
            NotificationType.Review => "#10b981",  // Green
            NotificationType.Message => "#8b5cf6", // Purple
            NotificationType.Deadline => "#f59e0b", // Orange
            _ => "inherit"
        };
    }

    private static string GetTimeAgo(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;
        if (span.TotalMinutes < 1) return "vừa xong";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} phút trước";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} giờ trước";
        return $"{(int)span.TotalDays} ngày trước";
    }

    private async Task<JobPost?> GetOwnedJobPost(int jobId)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return null;
        }

        return await _context.JobPosts
            .FirstOrDefaultAsync(j => j.Id == jobId && j.BusinessId == currentUserId.Value && !j.IsDeleted);
    }

    private async Task<BusinessSubscription?> GetCurrentBusinessSubscription(int businessId, bool createFreePlanIfMissing)
    {
        var now = DateTime.UtcNow;
        var subscription = await _context.BusinessSubscriptions
            .Include(bs => bs.ServicePlan)
            .Where(bs => bs.BusinessId == businessId && bs.Status == SubscriptionStatus.Active)
            .OrderByDescending(bs => bs.EndDate)
            .FirstOrDefaultAsync();

        if (subscription != null && subscription.EndDate < now)
        {
            subscription.Status = SubscriptionStatus.Expired;
            subscription.UpdatedAt = now;
            await _context.SaveChangesAsync();
            subscription = null;
        }

        if (subscription == null && createFreePlanIfMissing)
        {
            var freePlan = await _context.ServicePlans.FirstOrDefaultAsync(p => p.Price == 0 && p.IsActive);
            if (freePlan != null)
            {
                subscription = new BusinessSubscription
                {
                    BusinessId = businessId,
                    ServicePlanId = freePlan.Id,
                    ServicePlan = freePlan,
                    StartDate = now,
                    EndDate = now.AddDays(freePlan.DurationDays),
                    RemainingJobPosts = freePlan.JobPostLimit,
                    Status = SubscriptionStatus.Active,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _context.BusinessSubscriptions.Add(subscription);
                await _context.SaveChangesAsync();
            }
        }

        return subscription;
    }

    private void AddServicePlanTransaction(int walletId, decimal amount, string planName, string description)
    {
        _context.Transactions.Add(new Transaction
        {
            WalletId = walletId,
            Amount = amount,
            Type = TransactionType.Withdraw,
            TransactionCode = $"PLAN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}",
            PaymentMethod = "SERVICE_PLAN",
            Status = TransactionStatus.Success,
            Description = $"{description}: {planName}",
            CreatedAt = DateTime.UtcNow
        });
    }

    private static List<string> SplitBenefits(string benefits)
    {
        return benefits
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
    }

    private async Task SyncJobSkills(int jobId, string category, List<string>? skills)
    {
        var existing = await _context.JobPostSkills
            .Where(jps => jps.JobPostId == jobId)
            .ToListAsync();
        _context.JobPostSkills.RemoveRange(existing);
        await _context.SaveChangesAsync();

        var cleanedSkills = (skills ?? new List<string>())
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (cleanedSkills.Count == 0 && !string.IsNullOrWhiteSpace(category))
        {
            cleanedSkills.Add(category.Trim());
        }

        foreach (var skillName in cleanedSkills)
        {
            var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Name.ToLower() == skillName.ToLower());
            if (skill == null)
            {
                skill = new Skill
                {
                    Name = skillName,
                    Category = string.IsNullOrWhiteSpace(category) ? "Khác" : category.Trim()
                };
                _context.Skills.Add(skill);
                await _context.SaveChangesAsync();
            }

            _context.JobPostSkills.Add(new JobPostSkill
            {
                JobPostId = jobId,
                SkillId = skill.Id
            });
        }
    }

    private static string GetJobStatusText(JobStatus status, bool isApproved = true)
    {
        return status switch
        {
            JobStatus.Draft => "Bản nháp",
            JobStatus.Open => isApproved ? "Đã duyệt đăng" : "Chưa được duyệt",
            JobStatus.In_Progress => "Đang thực hiện",
            JobStatus.Paused => "Tạm dừng",
            JobStatus.Closed => "Đã đóng",
            JobStatus.Rejected => "Bị từ chối",
            _ => status.ToString()
        };
    }

    private static string GetDisplayName(User user)
    {
        if (user.StudentProfile != null)
        {
            return user.StudentProfile.FullName;
        }

        if (user.BusinessProfile != null)
        {
            return user.BusinessProfile.CompanyName;
        }

        return user.Email;
    }

    private static string GetDisplayAvatar(User user)
    {
        if (user.StudentProfile != null)
        {
            return user.StudentProfile.AvatarUrl ?? "";
        }

        if (user.BusinessProfile != null)
        {
            return user.BusinessProfile.LogoUrl ?? "";
        }

        return "";
    }

    private int? GetCurrentUserId()
    {
        var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(nameIdentifier, out var userId))
        {
            return userId;
        }
        return null;
    }

    // ============================================
    // ADMIN ACTIONS (AJAX Endpoints)
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAdminStats()
    {
        var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
        var totalJobs = await _context.JobPosts.CountAsync(j => !j.IsDeleted);
        var totalContracts = await _context.JobContracts.CountAsync();
        var systemVolume = await _context.Wallets.Where(w => w.User.Role == UserRole.Business).SumAsync(w => w.Balance);
        var systemRevenue = await _context.Transactions
            .Where(t => t.Type == TransactionType.Withdraw && t.Status == TransactionStatus.Success && t.Description != null && (t.Description.Contains("gói") || t.Description.Contains("PLAN")))
            .SumAsync(t => t.Amount);

        return Json(new
        {
            totalUsers,
            totalJobs,
            totalContracts,
            systemVolume,
            systemRevenue
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAdminUsers()
    {
        var users = await _context.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.BusinessProfile)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new {
                id = u.Id,
                email = u.Email,
                phone = u.Phone,
                role = u.Role.ToString(),
                status = u.Status.ToString(),
                createdAt = u.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                displayName = u.Role == UserRole.Student
                    ? (u.StudentProfile != null ? u.StudentProfile.FullName : null)
                    : (u.BusinessProfile != null ? u.BusinessProfile.CompanyName : null)
            })
            .ToListAsync();

        return Json(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> ToggleUserStatus(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        // Prevent self-banning
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(currentUserIdStr, out int currentUserId) && currentUserId == userId)
        {
            return BadRequest(new { success = false, message = "Bạn không thể tự khóa tài khoản của chính mình." });
        }

        user.Status = user.Status == UserStatus.Banned ? UserStatus.Active : UserStatus.Banned;
        await _context.SaveChangesAsync();

        return Json(new { success = true, newStatus = user.Status.ToString() });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAdminJobs()
    {
        var jobs = await _context.JobPosts
            .Include(j => j.BusinessProfile)
            .Where(j => !j.IsDeleted)
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new {
                id = j.Id,
                title = j.Title,
                businessName = j.BusinessProfile.CompanyName ?? "N/A",
                budget = j.Budget,
                deadline = j.Deadline.ToString("dd/MM/yyyy"),
                status = j.Status.ToString(),
                createdAt = j.CreatedAt.ToString("dd/MM/yyyy HH:mm")
            })
            .ToListAsync();

        return Json(jobs);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> DeleteJobPost(int jobId)
    {
        var job = await _context.JobPosts.FindAsync(jobId);
        if (job == null) return NotFound();

        job.IsDeleted = true;
        await _context.SaveChangesAsync();

        return Json(new { success = true });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAdminTransactions()
    {
        var txs = await _context.Transactions
            .Include(t => t.Wallet)
                .ThenInclude(w => w.User)
            .Where(t => t.Wallet.User.Role == UserRole.Business)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new {
                id = t.Id,
                userEmail = t.Wallet.User.Email,
                amount = t.Amount,
                type = t.Type.ToString(),
                status = t.Status.ToString(),
                createdAt = t.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                description = t.Description
            })
            .ToListAsync();

        return Json(txs);
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetWalletInfo()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);

        if (wallet == null)
        {
            // Auto-create wallet if missing
            wallet = new Wallet
            {
                UserId = currentUserId.Value,
                Balance = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
        }

        // Fetch transactions for this wallet
        var transactions = await _context.Transactions
            .Where(t => t.WalletId == wallet.Id)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                id = t.Id,
                amount = t.Amount,
                type = t.Type.ToString(),
                transactionCode = t.TransactionCode,
                status = t.Status.ToString(),
                description = t.Description,
                createdAt = t.CreatedAt.ToString("dd/MM/yyyy HH:mm")
            })
            .ToListAsync();

        // Calculate active package info
        var activePackageName = "Gói Thường";
        var activePackageExpiry = "Vĩnh viễn";
        var activePackageUsedCount = 0;
        var activePackageMaxCount = 1;
        var today = DateTime.UtcNow;

        var latestPkgTx = await _context.Transactions
            .Where(t => t.WalletId == wallet.Id && t.Type == TransactionType.Withdraw && t.Status == TransactionStatus.Success && t.Description != null && t.Description.Contains("gói dịch vụ"))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (latestPkgTx != null && latestPkgTx.CreatedAt.AddDays(30) > today)
        {
            var isPremium = latestPkgTx.Description?.Contains("Premium") ?? false;
            var isVip = latestPkgTx.Description?.Contains("VIP") ?? false;

            if (isPremium)
            {
                activePackageName = "Gói Premium";
                activePackageExpiry = latestPkgTx.CreatedAt.AddDays(30).ToString("dd/MM/yyyy");
                activePackageMaxCount = 20;
            }
            else if (isVip)
            {
                activePackageName = "Gói VIP";
                activePackageExpiry = latestPkgTx.CreatedAt.AddDays(30).ToString("dd/MM/yyyy");
                activePackageMaxCount = 5;
            }

            activePackageUsedCount = await _context.JobPosts
                .CountAsync(j => j.BusinessId == currentUserId.Value && !j.IsDeleted && j.CreatedAt >= latestPkgTx.CreatedAt);
        }
        else
        {
            activePackageUsedCount = await _context.JobPosts
                .CountAsync(j => j.BusinessId == currentUserId.Value && !j.IsDeleted);
        }

        return Json(new
        {
            success = true,
            balance = wallet.Balance,
            transactions = transactions,
            activePackageName = activePackageName,
            activePackageExpiry = activePackageExpiry,
            activePackageUsedCount = activePackageUsedCount,
            activePackageMaxCount = activePackageMaxCount
        });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> DepositMoney([FromBody] DepositRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        if (request.Amount <= 0)
        {
            return Json(new { success = false, message = "Số tiền nạp phải lớn hơn 0." });
        }

        if (request.Amount % 1 != 0)
        {
            return Json(new { success = false, message = "Số tiền nạp không được chứa phần thập phân." });
        }

        if (request.Amount % 50000 != 0)
        {
            return Json(new { success = false, message = "Số tiền nạp phải là bội số của 50.000 đ." });
        }

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);

        if (wallet == null)
        {
            wallet = new Wallet
            {
                UserId = currentUserId.Value,
                Balance = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
        }

        var txCode = await GenerateDepositTransferCodeAsync();
        var transaction = new Transaction
        {
            WalletId = wallet.Id,
            Amount = request.Amount,
            Type = TransactionType.Deposit,
            TransactionCode = txCode,
            Status = TransactionStatus.Pending,
            PaymentMethod = "ACB",
            BankAccountNumber = "14875441",
            BankAccountName = "HUYNH KHANG",
            BankName = "ACB",
            Description = $"Nạp tiền vào ví J4S qua QR code. Mã GD: {txCode}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            transactionId = transaction.Id,
            transactionCode = txCode,
            transferContent = txCode,
            amount = request.Amount
        });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> ConfirmDepositTransfer([FromBody] ConfirmDepositRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var transaction = await _context.Transactions
            .Include(t => t.Wallet)
            .FirstOrDefaultAsync(t => t.Id == request.TransactionId && t.Wallet.UserId == currentUserId.Value);

        if (transaction == null)
        {
            return Json(new { success = false, message = "Không tìm thấy giao dịch." });
        }

        if (transaction.Status == TransactionStatus.Success)
        {
            return Json(new { success = false, message = "Giao dịch đã được hoàn thành trước đó." });
        }

        if (transaction.CreatedAt.AddMinutes(5) < DateTime.UtcNow)
        {
            if (transaction.Status == TransactionStatus.Pending)
            {
                transaction.Status = TransactionStatus.Failed;
                transaction.Description += " (Đã quá hạn 5 phút - Hủy)";
                await _context.SaveChangesAsync();
            }
            return Json(new { success = false, message = "Hóa đơn nạp tiền này đã hết hạn 5 phút và đã bị hủy." });
        }

        AcbBankTransaction? matchedBankTx;
        try
        {
            matchedBankTx = await FindMatchingAcbTransactionAsync(transaction.TransactionCode, transaction.Amount);
        }
        catch
        {
            return Json(new { success = false, message = "Khong the kiem tra lich su ACB. Vui long thu lai sau." });
        }

        if (matchedBankTx == null)
        {
            return Json(new
            {
                success = false,
                message = $"Chưa tìm thấy giao dịch {transaction.TransactionCode} và số tiền {transaction.Amount:N0} đ. Vui lòng thử lại."
            });
        }

        var usedBankTransaction = await _context.Transactions.AnyAsync(t =>
            t.Id != transaction.Id &&
            t.Type == TransactionType.Deposit &&
            t.Status == TransactionStatus.Success &&
            t.AdminNote == matchedBankTx.Reference);

        if (usedBankTransaction)
        {
            return Json(new { success = false, message = "Giao dich ngan hang nay da duoc ghi nhan truoc do." });
        }

        transaction.Status = TransactionStatus.Success;
        transaction.Wallet.Balance += transaction.Amount;
        transaction.Wallet.UpdatedAt = DateTime.UtcNow;
        transaction.AdminNote = matchedBankTx.Reference;

        await _context.SaveChangesAsync();

        return Json(new { success = true, newBalance = transaction.Wallet.Balance, amount = transaction.Amount });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> PurchasePackage([FromBody] PurchasePackageRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);

        if (wallet == null)
        {
            return Json(new { success = false, message = "Không tìm thấy ví." });
        }

        decimal price = request.PackageName.ToLower() switch
        {
            "vip" => 30000m,
            "premium" => 99000m,
            _ => 0m
        };


        if (price == 0)
        {
            return Json(new { success = false, message = "Gói dịch vụ không hợp lệ." });
        }

        if (wallet.Balance < price)
        {
            return Json(new { success = false, message = "Số dư tài khoản không đủ. Vui lòng nạp thêm tiền." });
        }

        // Deduct balance
        wallet.Balance -= price;
        wallet.UpdatedAt = DateTime.UtcNow;

        // Add transaction
        var txCode = "PKG" + DateTime.UtcNow.Ticks.ToString().Substring(10);
        var transaction = new Transaction
        {
            WalletId = wallet.Id,
            Amount = price,
            Type = TransactionType.Withdraw,
            TransactionCode = txCode,
            Status = TransactionStatus.Success,
            Description = $"Thanh toán mua gói dịch vụ {request.PackageName}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Json(new { success = true, newBalance = wallet.Balance, packageName = request.PackageName });
    }

    private async Task<string> GenerateDepositTransferCodeAsync()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        for (var attempt = 0; attempt < 20; attempt++)
        {
            var suffix = new string(Enumerable.Range(0, 4)
                .Select(_ => chars[Random.Shared.Next(chars.Length)])
                .ToArray());
            var code = $"J4S {suffix}";
            var exists = await _context.Transactions.AnyAsync(t =>
                t.Type == TransactionType.Deposit &&
                t.TransactionCode == code &&
                t.Status != TransactionStatus.Failed);

            if (!exists)
            {
                return code;
            }
        }

        return $"J4S {DateTime.UtcNow.Ticks.ToString()[^4..]}";
    }

    private static async Task<AcbBankTransaction?> FindMatchingAcbTransactionAsync(string transferCode, decimal expectedAmount)
    {
        using var response = await AcbHttpClient.GetAsync(AcbHistoryUrl);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);

        foreach (var item in EnumerateObjects(doc.RootElement))
        {
            var description = GetFirstString(item, "description", "desc", "content", "remark", "memo", "transactionContent");
            if (string.IsNullOrWhiteSpace(description) || !ContainsTransferCode(description, transferCode))
            {
                continue;
            }

            var amount = GetFirstAmount(item, "amount", "creditAmount", "credit", "money", "transactionAmount", "value");
            if (!amount.HasValue || amount.Value != expectedAmount)
            {
                continue;
            }

            if (LooksLikeDebit(item))
            {
                continue;
            }

            var reference = GetFirstString(item, "transactionID", "transactionId", "transactionNumber", "refNo", "reference", "trace", "traceNo", "id")
                ?? $"ACB:{NormalizeBankText(description)}:{amount.Value.ToString(CultureInfo.InvariantCulture)}";

            return new AcbBankTransaction(reference);
        }

        return null;
    }

    private static IEnumerable<JsonElement> EnumerateObjects(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            yield return element;

            foreach (var property in element.EnumerateObject())
            {
                foreach (var child in EnumerateObjects(property.Value))
                {
                    yield return child;
                }
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var childElement in element.EnumerateArray())
            {
                foreach (var child in EnumerateObjects(childElement))
                {
                    yield return child;
                }
            }
        }
    }

    private static string? GetFirstString(JsonElement item, params string[] names)
    {
        foreach (var property in item.EnumerateObject())
        {
            if (!names.Any(n => string.Equals(n, property.Name, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            if (property.Value.ValueKind == JsonValueKind.String)
            {
                return property.Value.GetString();
            }

            if (property.Value.ValueKind == JsonValueKind.Number)
            {
                return property.Value.ToString();
            }
        }

        return null;
    }

    private static decimal? GetFirstAmount(JsonElement item, params string[] names)
    {
        foreach (var property in item.EnumerateObject())
        {
            if (!names.Any(n => string.Equals(n, property.Name, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            if (TryReadAmount(property.Value, out var amount))
            {
                return amount;
            }
        }

        return null;
    }

    private static bool TryReadAmount(JsonElement value, out decimal amount)
    {
        amount = 0;
        if (value.ValueKind == JsonValueKind.Number)
        {
            return value.TryGetDecimal(out amount);
        }

        if (value.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        var raw = value.GetString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        var normalized = Regex.Replace(raw, @"[^0-9\-]", "");
        return decimal.TryParse(normalized, NumberStyles.Integer, CultureInfo.InvariantCulture, out amount);
    }

    private static bool ContainsTransferCode(string description, string transferCode)
    {
        return NormalizeBankText(description).Contains(NormalizeBankText(transferCode), StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeBankText(string value)
    {
        return Regex.Replace(value ?? string.Empty, @"\s+", "").ToUpperInvariant();
    }

    private static bool LooksLikeDebit(JsonElement item)
    {
        var type = GetFirstString(item, "type", "transactionType", "dcSign", "cd", "sign");
        if (string.IsNullOrWhiteSpace(type))
        {
            return false;
        }

        var normalized = type.Trim().ToLowerInvariant();
        return normalized.Contains("debit") || normalized.Contains("withdraw") || normalized == "out" || normalized == "d" || normalized == "-";
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> PostJob([FromForm] string title, [FromForm] string description, [FromForm] decimal budget, [FromForm] DateTime deadline, [FromForm] string? category, [FromForm] string? saveMode)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Ok(new { success = false, message = "Lỗi dữ liệu: " + string.Join(", ", errors) });
        }

        var businessProfile = await _context.BusinessProfiles.FirstOrDefaultAsync(b => b.UserId == currentUserId.Value);
        if (businessProfile == null) return Ok(new { success = false, message = "Lỗi hồ sơ doanh nghiệp." });

        bool isDraft = (saveMode ?? string.Empty).Trim().ToLowerInvariant() == "draft";

        if (string.IsNullOrWhiteSpace(title) || title.Length < 10 || title.Length > 150)
        {
            return Ok(new { success = false, message = "Tiêu đề tin tuyển dụng phải có độ dài từ 10 đến 150 ký tự." });
        }

        if (!isDraft && string.IsNullOrWhiteSpace(description))
        {
            return Ok(new { success = false, message = "Vui lòng nhập mô tả công việc." });
        }

        if (!isDraft)
        {
            var tomorrow = DateTime.Today.AddDays(1);
            var maxFutureDate = DateTime.Today.AddDays(90);
            if (deadline.Date < tomorrow)
            {
                return Ok(new { success = false, message = "Hạn chót ứng tuyển phải từ ngày mai trở đi." });
            }
            if (deadline.Date > maxFutureDate)
            {
                return Ok(new { success = false, message = "Hạn chót ứng tuyển không được quá 90 ngày kể từ ngày đăng." });
            }
        }

        if (!isDraft && (budget < 10000 || budget > 10000000000))
        {
            return Ok(new { success = false, message = "Mức lương hợp lệ phải từ 10,000đ đến 10,000,000,000đ (10 tỷ đồng)." });
        }

        try
        {
            var newJob = new JobPost
            {
                BusinessId = businessProfile.UserId,
                Title = title,
                Description = description,
                Category = category,
                Budget = budget,
                Deadline = DateTime.SpecifyKind(deadline, DateTimeKind.Utc),
                IsApproved = false,
                Status = isDraft ? JobStatus.Draft : JobStatus.Open,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.JobPosts.Add(newJob);
            await _context.SaveChangesAsync();

            var message = isDraft
                ? "Đã lưu tin tuyển dụng vào mục Nháp."
                : "Đã gửi yêu cầu đăng bài. Vui lòng chờ Admin duyệt!";

            return Ok(new { success = true, message });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = "Lỗi hệ thống khi lưu bài: " + ex.InnerException?.Message ?? ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> UpdateJobPost([FromForm] int jobId, [FromForm] string title, [FromForm] string description, [FromForm] decimal budget, [FromForm] DateTime deadline, [FromForm] string? category, [FromForm] string? saveMode)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && j.BusinessId == currentUserId.Value && !j.IsDeleted);
        if (job == null) return Ok(new { success = false, message = "Không tìm thấy tin đăng." });

        bool isDraft = (saveMode ?? string.Empty).Trim().ToLowerInvariant() == "draft";

        if (string.IsNullOrWhiteSpace(title) || title.Length < 10 || title.Length > 150)
        {
            return Ok(new { success = false, message = "Tiêu đề tin tuyển dụng phải có độ dài từ 10 đến 150 ký tự." });
        }

        if (!isDraft && string.IsNullOrWhiteSpace(description))
        {
            return Ok(new { success = false, message = "Vui lòng nhập mô tả công việc." });
        }

        if (!isDraft)
        {
            var tomorrow = DateTime.Today.AddDays(1);
            var maxFutureDate = DateTime.Today.AddDays(90);
            if (deadline.Date < tomorrow)
            {
                return Ok(new { success = false, message = "Hạn chót ứng tuyển phải từ ngày mai trở đi." });
            }
            if (deadline.Date > maxFutureDate)
            {
                return Ok(new { success = false, message = "Hạn chót ứng tuyển không được quá 90 ngày kể từ ngày đăng." });
            }
        }

        if (!isDraft && (budget < 10000 || budget > 10000000000))
        {
            return Ok(new { success = false, message = "Mức lương hợp lệ phải từ 10,000đ đến 10,000,000,000đ (10 tỷ đồng)." });
        }

        job.Title = title;
        job.Description = description;
        job.Category = category;
        job.Budget = budget;
        job.Deadline = DateTime.SpecifyKind(deadline, DateTimeKind.Utc);
        job.IsApproved = false;
        job.Status = isDraft ? JobStatus.Draft : JobStatus.Open;
        job.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var message = isDraft ? "Đã lưu nháp." : "Đã cập nhật và gửi tin tuyển dụng để duyệt.";
        return Ok(new { success = true, message });
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> PublishDraftJob([FromForm] int jobId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && j.BusinessId == currentUserId.Value && !j.IsDeleted);
        if (job == null) return Ok(new { success = false, message = "Không tìm thấy tin đăng." });

        if (job.Status != JobStatus.Draft)
        {
            return Ok(new { success = false, message = "Tin này không ở trạng thái nháp." });
        }

        job.Status = JobStatus.Open;
        job.IsApproved = false;
        job.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Đã gửi yêu cầu đăng bài. Vui lòng chờ Admin duyệt!" });
    }

    // ===== Job Templates (mẫu tin tuyển dụng) =====

    [HttpGet]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> GetJobTemplates()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var templates = await _context.JobTemplates
            .Where(t => t.BusinessId == currentUserId.Value)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Title,
                t.Description,
                t.Category,
                t.Budget
            })
            .ToListAsync();

        return Json(new { success = true, templates });
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> SaveJobTemplate([FromBody] SaveJobTemplateRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.Title) || string.IsNullOrWhiteSpace(request?.Description))
        {
            return Json(new { success = false, message = "Vui lòng nhập đầy đủ tên mẫu, tiêu đề và mô tả." });
        }

        var template = new JobTemplate
        {
            BusinessId = currentUserId.Value,
            Name = request.Name.Trim(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category,
            Budget = request.Budget,
            CreatedAt = DateTime.UtcNow
        };

        _context.JobTemplates.Add(template);
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã lưu mẫu tin.", templateId = template.Id });
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> DeleteJobTemplate([FromForm] int templateId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var template = await _context.JobTemplates.FirstOrDefaultAsync(t => t.Id == templateId && t.BusinessId == currentUserId.Value);
        if (template == null) return Json(new { success = false, message = "Không tìm thấy mẫu tin." });

        _context.JobTemplates.Remove(template);
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã xóa mẫu tin." });
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> ExtendJobPost([FromForm] int jobId, [FromForm] int extraDays = 30)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && j.BusinessId == currentUserId.Value && !j.IsDeleted);
        if (job == null) return Ok(new { success = false, message = "Không tìm thấy tin đăng." });

        if (job.Status == JobStatus.Closed)
        {
            return Ok(new { success = false, message = "Tin đã đóng, không thể gia hạn." });
        }

        job.Deadline = job.Deadline.AddDays(extraDays);
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = $"Đã gia hạn tin thêm {extraDays} ngày." });
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> CloseJobPost([FromForm] int jobId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && j.BusinessId == currentUserId.Value && !j.IsDeleted);
        if (job == null) return Ok(new { success = false, message = "Không tìm thấy tin đăng." });

        job.Status = JobStatus.Closed;
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã đóng tin tuyển dụng." });
    }

    [HttpPost]
    [Authorize(Roles = "Business")]
    public async Task<IActionResult> DeleteBusinessJobPost([FromForm] int jobId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && j.BusinessId == currentUserId.Value && !j.IsDeleted);
        if (job == null) return Ok(new { success = false, message = "Không tìm thấy tin đăng." });

        job.IsDeleted = true;
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã xóa tin tuyển dụng." });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveJob(int id)
    {
        var job = await _context.JobPosts.FindAsync(id);
        if (job == null) return NotFound();

        job.IsApproved = true;
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã duyệt bài đăng thành công." });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectJob(int id)
    {
        var job = await _context.JobPosts.FindAsync(id);
        if (job == null) return NotFound();

        job.Status = JobStatus.Rejected;
        job.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã từ chối bài đăng." });
    }
}

public record AcbBankTransaction(string Reference);

public class JobActionRequest
{
    public string JobId { get; set; } = string.Empty;
    public decimal? BidAmount { get; set; }
}

public class UpdateBidStatusRequest
{
    public int BidId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public class ToggleSaveCandidateRequest
{
    public int StudentId { get; set; }
}

public class SaveJobTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Category { get; set; }
    public decimal Budget { get; set; }
}

public class SaveProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Major { get; set; } = string.Empty;
    public double? GPA { get; set; }
    public int? GraduationYear { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string DateOfBirth { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Experience { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public string CvName { get; set; } = string.Empty;
    public string CvUrl { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
    public List<SavePortfolioItem> Portfolio { get; set; } = new();
    public List<SaveCertificateItem> Certificates { get; set; } = new();

    // Business fields
    public string CompanyName { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public string CompanySize { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string BusinessDescription { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
}

public class SavePortfolioItem
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ProjectUrl { get; set; } = string.Empty;
}

public class SaveCertificateItem
{
    public string CertificateName { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public string IssuedDate { get; set; } = string.Empty;
    public string ExpiryDate { get; set; } = string.Empty;
    public string CredentialUrl { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class DepositRequest
{
    public decimal Amount { get; set; }
}

public class DepositQrRequest
{
    public decimal Amount { get; set; }
}

public class ConfirmDepositRequest
{
    public int TransactionId { get; set; }
}

public class PurchasePackageRequest
{
    public string PackageName { get; set; } = string.Empty;
}

public class PurchaseServicePlanRequest
{
    public int PlanId { get; set; }
}

public class RenewServicePlanRequest
{
    public bool IsAutoRenew { get; set; }
}

public class BusinessJobPostRequest
{
    public int? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Requirements { get; set; }
    public string? Benefits { get; set; }
    public string Category { get; set; } = "Khác";
    public List<string>? Skills { get; set; }
    public decimal Budget { get; set; }
    public string BudgetType { get; set; } = "Fixed";
    public string ExperienceLevel { get; set; } = "No_Experience";
    public string? Location { get; set; }
    public int Quantity { get; set; } = 1;
    public string Deadline { get; set; } = string.Empty;
    public bool SaveAsDraft { get; set; }
}

public class ChangeJobStatusRequest
{
    public int JobId { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ExtendJobPostRequest
{
    public int JobId { get; set; }
    public int Days { get; set; } = 7;
}

public class JobPostIdRequest
{
    public int JobId { get; set; }
}

public class SaveCandidateRequest
{
    public int StudentId { get; set; }
}

public class StartCandidateChatRequest
{
    public int StudentId { get; set; }
    public string? Message { get; set; }
}

public class SendConversationMessageRequest
{
    public int ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
}

