using JobForStudents.Models;

namespace JobForStudents.Services;

public class MockJobService
{
    private readonly List<JobViewModel> _jobs;
    private readonly List<UserViewModel> _freelancers;

    public MockJobService()
    {
        _jobs =
        [
            new()
            {
                Id = "job-001",
                Title = "Thiết kế poster workshop",
                Description = "Cần poster cho workshop chủ đề \"AI for Students\" – Kích thước A3, phong cách hiện đại, sáng tạo.",
                Category = "Design",
                Tags = ["Thiết kế", "Poster", "Photoshop"],
                Budget = 150000m,
                Deadline = "Hạn: 24h nữa",
                ApplicantsCount = 5,
                IsSaved = true,
                IsApplied = false
            },
            new()
            {
                Id = "job-002",
                Title = "Dịch tài liệu tiếng Anh 1500 từ",
                Description = "Dịch tài liệu chuyên ngành Marketing từ tiếng Anh sang tiếng Việt, đảm bảo chính xác thuật ngữ.",
                Category = "Translation",
                Tags = ["Dịch thuật", "English", "Marketing"],
                Budget = 200000m,
                Deadline = "Hạn: 2 ngày nữa",
                ApplicantsCount = 8,
                IsSaved = true,
                IsApplied = true
            },
            new()
            {
                Id = "job-003",
                Title = "Làm slide thuyết trình",
                Description = "Slide thuyết trình 15-20 trang về Digital Marketing, yêu cầu thiết kế đẹp, chuyên nghiệp.",
                Category = "Slides",
                Tags = ["Làm slide", "PowerPoint", "Thuyết trình"],
                Budget = 120000m,
                Deadline = "Hạn: 1 ngày nữa",
                ApplicantsCount = 3,
                IsSaved = true,
                IsApplied = false
            },
            new()
            {
                Id = "job-004",
                Title = "Viết bài SEO cho blog công nghệ",
                Description = "Viết 3 bài blog về AI và Machine Learning, mỗi bài 800-1000 từ, chuẩn SEO.",
                Category = "Content",
                Tags = ["Viết content", "SEO", "Blog"],
                Budget = 300000m,
                Deadline = "Hạn: 3 ngày nữa",
                ApplicantsCount = 12,
                IsSaved = false,
                IsApplied = true
            },
            new()
            {
                Id = "job-005",
                Title = "Code landing page giới thiệu sản phẩm",
                Description = "Tạo landing page responsive bằng HTML/CSS/JS cho sản phẩm ứng dụng di động mới.",
                Category = "Code",
                Tags = ["Code web", "HTML/CSS", "Responsive"],
                Budget = 500000m,
                Deadline = "Hạn: 5 ngày nữa",
                ApplicantsCount = 7,
                IsSaved = false,
                IsApplied = false
            },
            new()
            {
                Id = "job-006",
                Title = "Edit video giới thiệu câu lạc bộ",
                Description = "Chỉnh sửa video 3-5 phút giới thiệu CLB Sách của trường, thêm hiệu ứng và nhạc nền.",
                Category = "Video",
                Tags = ["Edit video", "Premiere", "After Effects"],
                Budget = 350000m,
                Deadline = "Hạn: 4 ngày nữa",
                ApplicantsCount = 4,
                IsSaved = false,
                IsApplied = false
            },
            new()
            {
                Id = "job-007",
                Title = "Thiết kế logo cho startup sinh viên",
                Description = "Cần logo hiện đại cho startup về ứng dụng chia sẻ đồ dùng học tập giữa sinh viên.",
                Category = "Design",
                Tags = ["Thiết kế", "Logo", "Illustrator"],
                Budget = 250000m,
                Deadline = "Hạn: 3 ngày nữa",
                ApplicantsCount = 15,
                IsSaved = false,
                IsApplied = false
            },
            new()
            {
                Id = "job-008",
                Title = "Dịch hồ sơ năng lực công ty",
                Description = "Dịch company profile 10 trang từ tiếng Việt sang tiếng Anh, lĩnh vực F&B.",
                Category = "Translation",
                Tags = ["Dịch thuật", "English", "F&B"],
                Budget = 400000m,
                Deadline = "Hạn: 4 ngày nữa",
                ApplicantsCount = 6,
                IsSaved = false,
                IsApplied = false
            }
        ];

        _freelancers =
        [
            new()
            {
                Id = "user-001",
                Name = "Lê Anh Tuấn",
                Skill = "Thiết kế đồ họa / UX-UI",
                MatchPercentage = "98% Match",
                Rating = 5.0,
                ReviewsCount = 32,
                Avatar = "/images/tuan_avatar.jpg"
            },
            new()
            {
                Id = "user-002",
                Name = "Nguyễn Thu Hà",
                Skill = "Làm slide chuyên nghiệp",
                MatchPercentage = "95% Match",
                Rating = 4.9,
                ReviewsCount = 27,
                Avatar = ""
            },
            new()
            {
                Id = "user-003",
                Name = "Lê Minh Anh",
                Skill = "Dịch thuật EN-VI",
                MatchPercentage = "93% Match",
                Rating = 5.0,
                ReviewsCount = 18,
                Avatar = ""
            },
            new()
            {
                Id = "user-004",
                Name = "Phạm Đức Huy",
                Skill = "Lập trình Web Full-stack",
                MatchPercentage = "90% Match",
                Rating = 4.8,
                ReviewsCount = 24,
                Avatar = ""
            },
            new()
            {
                Id = "user-005",
                Name = "Trần Khánh Vy",
                Skill = "Video Editor & Motion Graphics",
                MatchPercentage = "88% Match",
                Rating = 4.7,
                ReviewsCount = 15,
                Avatar = ""
            }
        ];
    }

    public List<JobViewModel> GetAllJobs() => _jobs;

    public List<UserViewModel> GetFreelancers() => _freelancers;

    public List<JobViewModel> FilterByCategory(string category)
    {
        if (string.IsNullOrWhiteSpace(category) || category.Equals("all", StringComparison.OrdinalIgnoreCase))
            return _jobs;

        // Map Vietnamese display names to internal category codes
        var categoryMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Thiết kế"] = "Design",
            ["Làm slide"] = "Slides",
            ["Dịch thuật"] = "Translation",
            ["Viết content"] = "Content",
            ["Code web"] = "Code",
            ["Edit video"] = "Video",
            // Also accept internal names directly
            ["Design"] = "Design",
            ["Slides"] = "Slides",
            ["Translation"] = "Translation",
            ["Content"] = "Content",
            ["Code"] = "Code",
            ["Video"] = "Video"
        };

        var mapped = categoryMap.TryGetValue(category, out var internalCategory) ? internalCategory : category;
        return _jobs.Where(j => j.Category.Equals(mapped, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    public List<JobViewModel> SearchJobs(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return _jobs;

        var term = searchTerm.ToLower();
        return _jobs.Where(j =>
            j.Title.Contains(term, StringComparison.OrdinalIgnoreCase) ||
            j.Description.Contains(term, StringComparison.OrdinalIgnoreCase) ||
            j.Tags.Any(t => t.Contains(term, StringComparison.OrdinalIgnoreCase))
        ).ToList();
    }

    public JobViewModel? ToggleSave(string jobId)
    {
        var job = _jobs.FirstOrDefault(j => j.Id == jobId);
        if (job is not null)
            job.IsSaved = !job.IsSaved;
        return job;
    }

    public JobViewModel? ApplyJob(string jobId)
    {
        var job = _jobs.FirstOrDefault(j => j.Id == jobId);
        if (job is not null && !job.IsApplied)
        {
            job.IsApplied = true;
            job.ApplicantsCount++;
        }
        return job;
    }

    public DashboardViewModel GetDashboard() => new()
    {
        Jobs = _jobs,
        TopFreelancers = _freelancers
    };
}
