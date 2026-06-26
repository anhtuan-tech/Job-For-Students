namespace JobForStudents.Models;

public class JobViewModel
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public decimal Budget { get; set; }
    public string Deadline { get; set; } = string.Empty;
    public int ApplicantsCount { get; set; }
    public int Quantity { get; set; }
    public int HiredCount { get; set; }
    public bool IsSaved { get; set; }
    public bool IsApplied { get; set; }
    public string BudgetType { get; set; } = string.Empty;
    public string ExperienceLevel { get; set; } = string.Empty;
    public System.DateTime CreatedAt { get; set; }
}
