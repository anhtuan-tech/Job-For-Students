using System;

namespace JobForStudents.Models;

public class SavedCandidate
{
    public int BusinessId { get; set; }
    public int StudentId { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    public virtual BusinessProfile BusinessProfile { get; set; } = null!;
    public virtual StudentProfile StudentProfile { get; set; } = null!;
}
