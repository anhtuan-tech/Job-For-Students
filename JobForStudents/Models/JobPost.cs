using System;
using System.Collections.Generic;

namespace JobForStudents.Models;

public class JobPost
{
    public int Id { get; set; }
    public int BusinessId { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? Requirements { get; set; }
    public string? Benefits { get; set; }
    public BudgetType BudgetType { get; set; } = BudgetType.Fixed;
    public decimal Budget { get; set; }
    public ExperienceLevel ExperienceLevelRequired { get; set; } = ExperienceLevel.No_Experience;
    public string? Location { get; set; }
    public int Quantity { get; set; } = 1;
    public DateTime Deadline { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Open;
    public bool IsDeleted { get; set; }
    public bool IsApproved { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public int ViewCount { get; set; } = 0;

    // Navigation properties
    public virtual BusinessProfile BusinessProfile { get; set; } = null!;
    public virtual ICollection<JobPostSkill> JobPostSkills { get; set; } = new List<JobPostSkill>();
    public virtual ICollection<SavedJob> SavedJobs { get; set; } = new List<SavedJob>();
    public virtual ICollection<JobBid> JobBids { get; set; } = new List<JobBid>();
    public virtual ICollection<JobContract> JobContracts { get; set; } = new List<JobContract>();
}
