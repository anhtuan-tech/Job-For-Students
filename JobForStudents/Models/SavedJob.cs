using System;

namespace JobForStudents.Models;

public class SavedJob
{
    public int StudentId { get; set; }
    public int JobPostId { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual StudentProfile StudentProfile { get; set; } = null!;
    public virtual JobPost JobPost { get; set; } = null!;
}
