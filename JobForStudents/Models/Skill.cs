using System.Collections.Generic;

namespace JobForStudents.Models;

public class Skill
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;

    // Navigation properties
    public virtual ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
    public virtual ICollection<JobPostSkill> JobPostSkills { get; set; } = new List<JobPostSkill>();
}
