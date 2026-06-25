using System;

namespace JobForStudents.Models;

public class JobTemplate
{
    public int Id { get; set; }
    public int BusinessId { get; set; }
    public string Name { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? Category { get; set; }
    public decimal Budget { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public virtual BusinessProfile BusinessProfile { get; set; } = null!;
}