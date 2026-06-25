using System.Collections.Generic;

namespace JobForStudents.Models;

public class ServicePlan
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationDays { get; set; }
    public int JobPostLimit { get; set; }
    public string Benefits { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<BusinessSubscription> BusinessSubscriptions { get; set; } = new List<BusinessSubscription>();
}
