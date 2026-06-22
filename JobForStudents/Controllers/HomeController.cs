using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
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
        var jobPosts = await _context.JobPosts
            .Include(j => j.JobPostSkills)
                .ThenInclude(jps => jps.Skill)
            .Where(j => !j.IsDeleted)
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
            if (isStudent)
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
            .Where(j => !j.IsDeleted);

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

        var job = await _context.JobPosts.FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted);
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
}

public class JobActionRequest
{
    public string JobId { get; set; } = string.Empty;
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

