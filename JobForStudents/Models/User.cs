using System;
using System.Collections.Generic;

namespace JobForStudents.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual StudentProfile? StudentProfile { get; set; }
    public virtual BusinessProfile? BusinessProfile { get; set; }
    public virtual Wallet? Wallet { get; set; }
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
