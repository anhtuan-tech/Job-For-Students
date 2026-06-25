using System;

namespace JobForStudents.Models;

public class Feedback
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public FeedbackType Type { get; set; }
    public string Title { get; set; } = null!;
    public string Details { get; set; } = null!;
    public FeedbackStatus Status { get; set; } = FeedbackStatus.Received;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public virtual User User { get; set; } = null!;
}
