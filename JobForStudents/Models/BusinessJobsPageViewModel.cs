namespace JobForStudents.Models;

public class BusinessJobsPageViewModel
{
    public int BusinessId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? WebsiteUrl { get; set; }
    public string? CompanySize { get; set; }
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Industry { get; set; }
    public bool IsVerified { get; set; }
    public decimal AverageRating { get; set; }
    public int ReviewsCount { get; set; }
    public int OpenJobsCount { get; set; }
    public List<BusinessPublicJobViewModel> OpenJobs { get; set; } = [];
    public List<BusinessPublicReviewViewModel> Reviews { get; set; } = [];
}

public class BusinessPublicJobViewModel
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Benefits { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public string BudgetType { get; set; } = string.Empty;
    public string ExperienceLevel { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Deadline { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = [];
}

public class BusinessPublicReviewViewModel
{
    public string ReviewerName { get; set; } = string.Empty;
    public string ReviewerAvatar { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}
