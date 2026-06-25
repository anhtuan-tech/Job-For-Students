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
            Category = j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác",
            Tags = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
            Budget = j.Budget,
            Deadline = j.Deadline.ToString("dd/MM/yyyy"),
            ApplicantsCount = _context.JobBids.Count(b => b.JobPostId == j.Id),
            IsSaved = savedJobIds.Contains(j.Id),
            IsApplied = appliedJobIds.Contains(j.Id)
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

                // Query active package from transactions
                var wallet = await _context.Wallets
                    .Include(w => w.Transactions)
                    .FirstOrDefaultAsync(w => w.UserId == currentUserId.Value);

                var activePackageName = "Gói Thường";
                var activePackageExpiry = "Vĩnh viễn";
                var activePackageUsedCount = 0;
                var activePackageMaxCount = 1;
                var today = DateTime.UtcNow;

                if (wallet != null)
                {
                    var latestPkgTx = wallet.Transactions
                        .Where(t => t.Type == TransactionType.Holding && t.Status == TransactionStatus.Success && t.Description != null && t.Description.Contains("gói dịch vụ"))
                        .OrderByDescending(t => t.CreatedAt)
                        .FirstOrDefault();

                    if (latestPkgTx != null && latestPkgTx.CreatedAt.AddDays(30) > today)
                    {
                        var isPremium = latestPkgTx.Description.Contains("Premium");
                        var isVip = latestPkgTx.Description.Contains("VIP");

                        if (isPremium)
                        {
                            activePackageName = "Gói Premium";
                            activePackageExpiry = latestPkgTx.CreatedAt.AddDays(30).ToString("dd/MM/yyyy");
                            activePackageMaxCount = 20; // 20 posts
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
                }
                else
                {
                    activePackageUsedCount = await _context.JobPosts
                        .CountAsync(j => j.BusinessId == currentUserId.Value && !j.IsDeleted);
                }

                dashboard.ActivePackageName = activePackageName;
                dashboard.ActivePackageExpiry = activePackageExpiry;
                dashboard.ActivePackageUsedCount = activePackageUsedCount;
                dashboard.ActivePackageMaxCount = activePackageMaxCount;

                // Query Business Dashboard Statistics
                var sevenDaysAgo = today.AddDays(-7);
                var threeDaysSoon = today.AddDays(3);

                // Active Jobs
                dashboard.BusinessActiveJobsCount = await _context.JobPosts
                    .CountAsync(j => j.BusinessId == currentUserId.Value && !j.IsDeleted && j.Status == JobStatus.Open);

                // Soon Expiring Jobs (Open jobs expiring in <= 3 days, but not yet expired)
                dashboard.BusinessRecentJobsSoonExpiringCount = await _context.JobPosts
                    .CountAsync(j => j.BusinessId == currentUserId.Value && !j.IsDeleted && j.Status == JobStatus.Open && j.Deadline > today && j.Deadline <= threeDaysSoon);

                // New Applicants in last 7 days
                dashboard.BusinessNewApplicantsCount = await _context.JobBids
                    .CountAsync(b => b.JobPost.BusinessId == currentUserId.Value && b.CreatedAt >= sevenDaysAgo);

                // Total Applicants
                dashboard.BusinessTotalApplicantsCount = await _context.JobBids
                    .CountAsync(b => b.JobPost.BusinessId == currentUserId.Value);

                // Fetch Recent Job Posts (Tin tuyển dụng gần đây)
                var rawRecentJobs = await _context.JobPosts
                    .Include(j => j.JobPostSkills)
                        .ThenInclude(jps => jps.Skill)
                    .Include(j => j.JobBids)
                    .Where(j => j.BusinessId == currentUserId.Value && !j.IsDeleted)
                    .OrderByDescending(j => j.CreatedAt)
                    .Take(10)
                    .ToListAsync();

                dashboard.BusinessRecentJobs = rawRecentJobs.Select(j => 
                {
                    var isSoonExpiring = j.Status == JobStatus.Open && j.Deadline > today && j.Deadline <= threeDaysSoon;
                    var statusStr = !j.IsApproved ? "Pending" : (j.Status == JobStatus.Closed ? "Paused" : (isSoonExpiring ? "Warning" : "Active"));
                    
                    return new BusinessRecentJobViewModel
                    {
                        Id = j.Id,
                        Title = j.Title,
                        NewApplicantsCount = j.JobBids.Count(b => b.CreatedAt >= sevenDaysAgo),
                        TotalApplicantsCount = j.JobBids.Count,
                        ViewCount = j.ViewCount,
                        Category = j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác",
                        Status = statusStr
                    };
                }).ToList();

                // Fetch Recent Applicants (Ứng viên mới nhất)
                var rawRecentBids = await _context.JobBids
                    .Include(b => b.JobPost)
                    .Include(b => b.StudentProfile)
                        .ThenInclude(sp => sp.StudentSkills)
                            .ThenInclude(ss => ss.Skill)
                    .Where(b => b.JobPost.BusinessId == currentUserId.Value)
                    .OrderByDescending(b => b.CreatedAt)
                    .Take(10)
                    .ToListAsync();

                dashboard.BusinessRecentApplicants = rawRecentBids.Select(b => 
                {
                    var sp = b.StudentProfile;
                    
                    // Time Ago helper
                    var diff = today - b.CreatedAt;
                    string timeAgoStr;
                    if (diff.TotalMinutes < 60)
                        timeAgoStr = $"{(int)Math.Max(1, diff.TotalMinutes)} phút trước";
                    else if (diff.TotalHours < 24)
                        timeAgoStr = $"{(int)diff.TotalHours} giờ trước";
                    else
                        timeAgoStr = $"{(int)diff.TotalDays} ngày trước";

                    // Determine Match level: check if student has skills in common with job skills
                    var jobSkills = b.JobPost.JobPostSkills?.Select(js => js.SkillId).ToList() ?? new List<int>();
                    var studentSkills = sp.StudentSkills?.Select(ss => ss.SkillId).ToList() ?? new List<int>();
                    var matchCount = jobSkills.Intersect(studentSkills).Count();
                    var matchLevel = matchCount >= 1 ? "match-high" : "match-medium";

                    // Initials
                    var initials = "";
                    if (!string.IsNullOrEmpty(sp.FullName))
                    {
                        var parts = sp.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 2)
                        {
                            initials = (parts[parts.Length - 2][0].ToString() + parts[parts.Length - 1][0].ToString()).ToUpper();
                        }
                        else if (parts.Length == 1)
                        {
                            initials = parts[0][0].ToString().ToUpper();
                        }
                    }
                    if (string.IsNullOrEmpty(initials)) initials = "US";

                    return new BusinessRecentApplicantViewModel
                    {
                        Id = sp.UserId,
                        FullName = sp.FullName,
                        Role = sp.StudentSkills.FirstOrDefault()?.Skill.Name ?? "Chương trình viên",
                        AvatarUrl = sp.AvatarUrl ?? string.Empty,
                        TimeAgo = timeAgoStr,
                        MatchLevel = matchLevel,
                        Initials = initials
                    };
                }).ToList();
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
            Category = j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác",
            Tags = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
            Budget = j.Budget,
            Deadline = j.Deadline.ToString("dd/MM/yyyy"),
            ApplicantsCount = _context.JobBids.Count(b => b.JobPostId == j.Id),
            IsSaved = savedJobIds.Contains(j.Id),
            IsApplied = appliedJobIds.Contains(j.Id)
        }).ToList();

        return Json(jobsList);
    }

    // GET: /Home/SearchJobs?searchTerm=poster — Public (allow anonymous browsing)
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> SearchJobs(string searchTerm)
    {
        var currentUserId = GetCurrentUserId();
        var isStudent = User.IsInRole("Student");

        var jobQuery = _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Where(j => !j.IsDeleted);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            var term = searchTerm.ToLower();
            jobQuery = jobQuery.Where(j => 
                j.Title.ToLower().Contains(term) || 
                j.Description.ToLower().Contains(term) ||
                j.JobPostSkills.Any(jps => jps.Skill.Name.ToLower().Contains(term))
            );
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
            Category = j.JobPostSkills.FirstOrDefault()?.Skill.Category ?? "Khác",
            Tags = j.JobPostSkills.Select(jps => jps.Skill.Name).ToList(),
            Budget = j.Budget,
            Deadline = j.Deadline.ToString("dd/MM/yyyy"),
            ApplicantsCount = _context.JobBids.Count(b => b.JobPostId == j.Id),
            IsSaved = savedJobIds.Contains(j.Id),
            IsApplied = appliedJobIds.Contains(j.Id)
        }).ToList();

        return Json(jobsList);
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
                category = j.JobPostSkills.Select(s => s.Skill.Category).FirstOrDefault() ?? "Khac",
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
    public async Task<IActionResult> GetBusinessApplicants(int? jobId)
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

        return Json(new { success = true, applicants });
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
            bid.JobPost.Status = JobStatus.In_Progress;

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
        }
        else if (action == "reject")
        {
            bid.Status = BidStatus.Rejected;
        }
        else
        {
            return Json(new { success = false, message = "Thao tac khong hop le." });
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, status = bid.Status.ToString() });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = System.Diagnostics.Activity.Current?.Id ?? HttpContext.TraceIdentifier });
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
            var completionRate = totalContracts > 0 ? (int)Math.Round((double)completedContracts / totalContracts * 100) : 100;

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
                industry = businessProfile.Industry ?? "",
                isVerified = businessProfile.IsVerified,
                email = user.Email,
                phone = user.Phone,
                completionRate = completionRate,
                completedJobsCount = completedContracts,
                reviews = reviews,
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

            if (!string.IsNullOrEmpty(request.LogoUrl))
            {
                businessProfile.LogoUrl = request.LogoUrl;
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

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Json(new { success = false, message = "Chưa đăng nhập." });
        }



        var notifications = await _context.Notifications
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
            .ToListAsync();

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
    // ============================================
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAdminStats()
    {
        var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
        var totalJobs = await _context.JobPosts.CountAsync(j => !j.IsDeleted);
        var totalContracts = await _context.JobContracts.CountAsync();
        var systemVolume = await _context.Wallets.SumAsync(w => w.Balance);

        return Json(new {
            totalUsers,
            totalJobs,
            totalContracts,
            systemVolume
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
                    ? u.StudentProfile.FullName 
                    : u.BusinessProfile.CompanyName
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
            .Where(t => t.WalletId == wallet.Id && t.Type == TransactionType.Holding && t.Status == TransactionStatus.Success && t.Description != null && t.Description.Contains("gói dịch vụ"))
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (latestPkgTx != null && latestPkgTx.CreatedAt.AddDays(30) > today)
        {
            var isPremium = latestPkgTx.Description.Contains("Premium");
            var isVip = latestPkgTx.Description.Contains("VIP");

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

        if (request.Amount <= 0 || request.Amount % 50000 != 0)
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
            Type = TransactionType.Holding,
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
    public async Task<IActionResult> PostJob([FromForm] string title, [FromForm] string description, [FromForm] decimal budget, [FromForm] DateTime deadline)
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

        try
        {
            var newJob = new JobPost
        {
            BusinessId = businessProfile.UserId,
            Title = title,
            Description = description,
            Budget = budget,
            Deadline = DateTime.SpecifyKind(deadline, DateTimeKind.Utc),
            IsApproved = false,
            Status = JobStatus.Open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

            _context.JobPosts.Add(newJob);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã gửi yêu cầu đăng bài. Vui lòng chờ Admin duyệt!" });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = "Lỗi hệ thống khi lưu bài: " + ex.InnerException?.Message ?? ex.Message });
        }
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
}

public class UpdateBidStatusRequest
{
    public int BidId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public class SaveProfileRequest
{
    public string FullName { get; set; } = string.Empty;
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

public class ConfirmDepositRequest
{
    public int TransactionId { get; set; }
}

public class PurchasePackageRequest
{
    public string PackageName { get; set; } = string.Empty;
}

