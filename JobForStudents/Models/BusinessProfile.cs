using System.Collections.Generic;

namespace JobForStudents.Models;

public class BusinessProfile
{
    // One-to-One relation where UserId is both PK and FK to User
    public int UserId { get; set; }
    public string CompanyName { get; set; } = null!;
    public string? TaxCode { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? CompanySize { get; set; }
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Industry { get; set; }
    public bool IsVerified { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<JobPost> JobPosts { get; set; } = new List<JobPost>();
    public virtual ICollection<JobContract> JobContracts { get; set; } = new List<JobContract>();
    public virtual ICollection<BusinessSubscription> BusinessSubscriptions { get; set; } = new List<BusinessSubscription>();
    public virtual ICollection<SavedCandidate> SavedCandidates { get; set; } = new List<SavedCandidate>();
}
