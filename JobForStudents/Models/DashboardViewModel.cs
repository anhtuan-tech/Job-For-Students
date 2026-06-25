namespace JobForStudents.Models;

public class DashboardViewModel
{
    public List<JobViewModel> Jobs { get; set; } = [];
    public List<UserViewModel> TopFreelancers { get; set; } = [];
    public decimal TotalEarnings { get; set; } = 2450000m;
    public int CompletedJobsCount { get; set; } = 12;
    public int? CurrentUserId { get; set; }
    public string CurrentUserRole { get; set; } = string.Empty;
    public string CurrentUserName { get; set; } = "Khách";
    public string CurrentUserAvatarUrl { get; set; } = string.Empty;

    // Business Dashboard statistics
    public int BusinessActiveJobsCount { get; set; }
    public int BusinessRecentJobsSoonExpiringCount { get; set; }
    public int BusinessNewApplicantsCount { get; set; }
    public int BusinessTotalApplicantsCount { get; set; }
    public List<BusinessRecentJobViewModel> BusinessRecentJobs { get; set; } = [];
    public List<BusinessRecentApplicantViewModel> BusinessRecentApplicants { get; set; } = [];
    public string ActivePackageName { get; set; } = "Gói Thường";
    public string ActivePackageExpiry { get; set; } = "Vĩnh viễn";
    public int ActivePackageUsedCount { get; set; }
    public int ActivePackageMaxCount { get; set; } = 1;

    // Student Dashboard statistics
    public List<StudentAppliedJobViewModel> StudentAppliedJobs { get; set; } = [];
    public List<StudentActiveContractViewModel> StudentActiveContracts { get; set; } = [];

    // Admin Dashboard statistics
    public List<AdminPendingJobViewModel> AdminPendingJobs { get; set; } = [];
}

public class StudentAppliedJobViewModel
{
    public int BidId { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Pending, Accepted, Rejected
    public string AppliedAt { get; set; } = string.Empty;
}

public class StudentActiveContractViewModel
{
    public int ContractId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Deadline { get; set; } = string.Empty;
    public int BusinessUserId { get; set; } // for chat
}

public class AdminPendingJobViewModel
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class BusinessRecentJobViewModel
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int NewApplicantsCount { get; set; }
    public int TotalApplicantsCount { get; set; }
    public int ViewCount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "Active", "Warning", "Paused"
}

public class BusinessRecentApplicantViewModel
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string TimeAgo { get; set; } = string.Empty;
    public string MatchLevel { get; set; } = string.Empty; // "match-high", "match-medium"
    public string Initials { get; set; } = string.Empty;
}
