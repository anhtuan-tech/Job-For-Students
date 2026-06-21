using System;
using System.Collections.Generic;

namespace JobForStudents.Models;

public class JobContract
{
    public int Id { get; set; }
    public int JobPostId { get; set; }
    public int StudentId { get; set; }
    public int BusinessId { get; set; }
    public decimal FinalPrice { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Active;
    public string? DeliverableContent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public virtual JobPost JobPost { get; set; } = null!;
    public virtual StudentProfile StudentProfile { get; set; } = null!;
    public virtual BusinessProfile BusinessProfile { get; set; } = null!;
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
