using System;
using System.Collections.Generic;

namespace JobForStudents.Models;

public class StudentProfile
{
    // One-to-One relation where UserId is both PK and FK to User
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Bio { get; set; }
    public string? University { get; set; }
    public string? Major { get; set; }
    public double? GPA { get; set; }
    public int? GraduationYear { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? CvName { get; set; }
    public string? CvUrl { get; set; }
    public string? Experience { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
    public virtual ICollection<PortfolioProject> PortfolioProjects { get; set; } = new List<PortfolioProject>();
    public virtual ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
    public virtual ICollection<SavedJob> SavedJobs { get; set; } = new List<SavedJob>();
    public virtual ICollection<JobBid> JobBids { get; set; } = new List<JobBid>();
    public virtual ICollection<JobContract> JobContracts { get; set; } = new List<JobContract>();
    public virtual ICollection<SavedCandidate> SavedByBusinesses { get; set; } = new List<SavedCandidate>();
}
