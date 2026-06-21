using System;

namespace JobForStudents.Models;

public class PortfolioProject
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? ProjectUrl { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? RoleInProject { get; set; }

    // Navigation property
    public virtual StudentProfile StudentProfile { get; set; } = null!;
}
