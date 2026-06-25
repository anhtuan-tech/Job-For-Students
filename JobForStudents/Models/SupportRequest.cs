using System;

namespace JobForStudents.Models;

public class SupportRequest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Subject { get; set; } = null!;
    public SupportCategory Category { get; set; }
    public string Message { get; set; } = null!;
    public SupportRequestStatus Status { get; set; } = SupportRequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public virtual User User { get; set; } = null!;
}
