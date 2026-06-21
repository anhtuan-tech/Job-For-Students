using System;

namespace JobForStudents.Models;

public class JobBid
{
    public int Id { get; set; }
    public int JobPostId { get; set; }
    public int StudentId { get; set; }
    public decimal BidAmount { get; set; }
    public int EstimatedDays { get; set; }
    public string Proposal { get; set; } = null!;
    public BidStatus Status { get; set; } = BidStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual JobPost JobPost { get; set; } = null!;
    public virtual StudentProfile StudentProfile { get; set; } = null!;
}
