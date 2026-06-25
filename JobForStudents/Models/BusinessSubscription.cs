using System;

namespace JobForStudents.Models;

public class BusinessSubscription
{
    public int Id { get; set; }
    public int BusinessId { get; set; }
    public int ServicePlanId { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; }
    public int RemainingJobPosts { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual BusinessProfile BusinessProfile { get; set; } = null!;
    public virtual ServicePlan ServicePlan { get; set; } = null!;
}
