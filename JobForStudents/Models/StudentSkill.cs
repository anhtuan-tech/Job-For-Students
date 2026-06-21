namespace JobForStudents.Models;

public class StudentSkill
{
    public int StudentId { get; set; }
    public int SkillId { get; set; }
    public int ExperienceMonths { get; set; }
    public SkillLevel SkillLevel { get; set; } = SkillLevel.Beginner;

    // Navigation properties
    public virtual StudentProfile StudentProfile { get; set; } = null!;
    public virtual Skill Skill { get; set; } = null!;
}
