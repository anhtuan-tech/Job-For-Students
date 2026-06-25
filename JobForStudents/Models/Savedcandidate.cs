using System;

namespace JobForStudents.Models;

public class SavedCandidate
{
    public int Id { get; set; }
    public int BusinessId { get; set; }
    public int StudentId { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual BusinessProfile BusinessProfile { get; set; } = null!;
    public virtual StudentProfile StudentProfile { get; set; } = null!;
}
