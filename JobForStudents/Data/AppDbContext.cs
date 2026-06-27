using System;
using JobForStudents.Models;
using Microsoft.EntityFrameworkCore;

namespace JobForStudents.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<StudentProfile> StudentProfiles { get; set; } = null!;
    public DbSet<BusinessProfile> BusinessProfiles { get; set; } = null!;
    public DbSet<Skill> Skills { get; set; } = null!;
    public DbSet<StudentSkill> StudentSkills { get; set; } = null!;
    public DbSet<PortfolioProject> PortfolioProjects { get; set; } = null!;
    public DbSet<Certificate> Certificates { get; set; } = null!;
    public DbSet<JobPost> JobPosts { get; set; } = null!;
    public DbSet<JobPostSkill> JobPostSkills { get; set; } = null!;
    public DbSet<SavedJob> SavedJobs { get; set; } = null!;
    public DbSet<JobBid> JobBids { get; set; } = null!;
    public DbSet<JobContract> JobContracts { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<Message> Messages { get; set; } = null!;
    public DbSet<Review> Reviews { get; set; } = null!;
    public DbSet<Wallet> Wallets { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<ServicePlan> ServicePlans { get; set; } = null!;
    public DbSet<BusinessSubscription> BusinessSubscriptions { get; set; } = null!;
    public DbSet<SavedCandidate> SavedCandidates { get; set; } = null!;
    public DbSet<SupportRequest> SupportRequests { get; set; } = null!;
    public DbSet<Feedback> Feedbacks { get; set; } = null!;
    public DbSet<JobTemplate> JobTemplates { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Configurations
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Phone).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
            entity.Property(u => u.Status).HasConversion<string>();
        });

        // One-to-One: User <-> StudentProfile
        modelBuilder.Entity<StudentProfile>(entity =>
        {
            entity.HasKey(sp => sp.UserId);
            entity.HasOne(sp => sp.User)
                  .WithOne(u => u.StudentProfile)
                  .HasForeignKey<StudentProfile>(sp => sp.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // One-to-One: User <-> BusinessProfile
        modelBuilder.Entity<BusinessProfile>(entity =>
        {
            entity.HasKey(bp => bp.UserId);
            entity.HasOne(bp => bp.User)
                  .WithOne(u => u.BusinessProfile)
                  .HasForeignKey<BusinessProfile>(bp => bp.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // StudentSkill Composite Key
        modelBuilder.Entity<StudentSkill>(entity =>
        {
            entity.HasKey(ss => new { ss.StudentId, ss.SkillId });

            entity.Property(ss => ss.SkillLevel).HasConversion<string>();

            entity.HasOne(ss => ss.StudentProfile)
                  .WithMany(s => s.StudentSkills)
                  .HasForeignKey(ss => ss.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ss => ss.Skill)
                  .WithMany(sk => sk.StudentSkills)
                  .HasForeignKey(ss => ss.SkillId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PortfolioProject FK
        modelBuilder.Entity<PortfolioProject>()
            .HasOne(pp => pp.StudentProfile)
            .WithMany(s => s.PortfolioProjects)
            .HasForeignKey(pp => pp.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Certificate FK
        modelBuilder.Entity<Certificate>()
            .HasOne(c => c.StudentProfile)
            .WithMany(s => s.Certificates)
            .HasForeignKey(c => c.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // JobPost FK & Conversions
        modelBuilder.Entity<JobPost>(entity =>
        {
            entity.Property(j => j.BudgetType).HasConversion<string>();
            entity.Property(j => j.ExperienceLevelRequired).HasConversion<string>();
            entity.Property(j => j.Status).HasConversion<string>();

            entity.HasOne(j => j.BusinessProfile)
                  .WithMany(b => b.JobPosts)
                  .HasForeignKey(j => j.BusinessId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // JobPostSkill Composite Key
        modelBuilder.Entity<JobPostSkill>(entity =>
        {
            entity.HasKey(jps => new { jps.JobPostId, jps.SkillId });

            entity.HasOne(jps => jps.JobPost)
                  .WithMany(jp => jp.JobPostSkills)
                  .HasForeignKey(jps => jps.JobPostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(jps => jps.Skill)
                  .WithMany(sk => sk.JobPostSkills)
                  .HasForeignKey(jps => jps.SkillId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // SavedJob Composite Key
        modelBuilder.Entity<SavedJob>(entity =>
        {
            entity.HasKey(sj => new { sj.StudentId, sj.JobPostId });

            entity.HasOne(sj => sj.StudentProfile)
                  .WithMany(s => s.SavedJobs)
                  .HasForeignKey(sj => sj.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sj => sj.JobPost)
                  .WithMany(jp => jp.SavedJobs)
                  .HasForeignKey(sj => sj.JobPostId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // JobBid FK
        modelBuilder.Entity<JobBid>(entity =>
        {
            entity.Property(b => b.Status).HasConversion<string>();

            entity.HasOne(jb => jb.JobPost)
                  .WithMany(jp => jp.JobBids)
                  .HasForeignKey(jb => jb.JobPostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(jb => jb.StudentProfile)
                  .WithMany(s => s.JobBids)
                  .HasForeignKey(jb => jb.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // JobContract FK
        modelBuilder.Entity<JobContract>(entity =>
        {
            entity.Property(c => c.Status).HasConversion<string>();

            entity.HasOne(jc => jc.JobPost)
                  .WithMany(jp => jp.JobContracts)
                  .HasForeignKey(jc => jc.JobPostId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(jc => jc.StudentProfile)
                  .WithMany(s => s.JobContracts)
                  .HasForeignKey(jc => jc.StudentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(jc => jc.BusinessProfile)
                  .WithMany(b => b.JobContracts)
                  .HasForeignKey(jc => jc.BusinessId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification FK
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(n => n.Type).HasConversion<string>();

            entity.HasOne(n => n.User)
                  .WithMany(u => u.Notifications)
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Message FKs
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasOne(m => m.Sender)
                  .WithMany()
                  .HasForeignKey(m => m.SenderId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.Receiver)
                  .WithMany()
                  .HasForeignKey(m => m.ReceiverId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Review FKs and self-referencing reply
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasOne(r => r.JobContract)
                  .WithMany(jc => jc.Reviews)
                  .HasForeignKey(r => r.ContractId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.Reviewer)
                  .WithMany()
                  .HasForeignKey(r => r.ReviewerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.ParentReview)
                  .WithMany(pr => pr.Replies)
                  .HasForeignKey(r => r.ParentReviewId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Wallet One-to-One and FKs
        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.HasOne(w => w.User)
                  .WithOne(u => u.Wallet)
                  .HasForeignKey<Wallet>(w => w.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Transaction FKs
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.Property(t => t.Type).HasConversion<string>();
            entity.Property(t => t.Status).HasConversion<string>();

            entity.HasOne(t => t.Wallet)
                  .WithMany(w => w.Transactions)
                  .HasForeignKey(t => t.WalletId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServicePlan>(entity =>
        {
            entity.HasData(
                new ServicePlan
                {
                    Id = 2,
                    Name = "Business Premium",
                    Description = "Gói tối ưu cho doanh nghiệp vừa và nhỏ, nâng cao hiển thị.",
                    Price = 99000,
                    DurationDays = 30,
                    JobPostLimit = 10,
                    Benefits = "10 tin tuyển dụng;Xem duyệt ứng viên;Truy cập hồ sơ ứng viên không giới hạn",
                    IsActive = true
                },
                new ServicePlan
                {
                    Id = 3,
                    Name = "Business VIP",
                    Description = "Đăng 1 bài với độ ưu tiên cao nhất, giới hạn trong 7 ngày.",
                    Price = 30000,
                    DurationDays = 7,
                    JobPostLimit = 1,
                    Benefits = "1 tin tuyển dụng với độ ưu tiên cao nhất;Bài đăng giới hạn 7 ngày;Sử dụng 1 lần",
                    IsActive = true
                });
        });

        modelBuilder.Entity<BusinessSubscription>(entity =>
        {
            entity.Property(bs => bs.Status).HasConversion<string>();

            entity.HasOne(bs => bs.BusinessProfile)
                  .WithMany(bp => bp.BusinessSubscriptions)
                  .HasForeignKey(bs => bs.BusinessId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(bs => bs.ServicePlan)
                  .WithMany(sp => sp.BusinessSubscriptions)
                  .HasForeignKey(bs => bs.ServicePlanId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // SupportRequest FK & Conversions
        modelBuilder.Entity<SupportRequest>(entity =>
        {
            entity.Property(sr => sr.Category).HasConversion<string>();
            entity.Property(sr => sr.Status).HasConversion<string>();

            entity.HasOne(sr => sr.User)
                  .WithMany()
                  .HasForeignKey(sr => sr.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Feedback FK & Conversions
        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.Property(f => f.Type).HasConversion<string>();
            entity.Property(f => f.Status).HasConversion<string>();

            entity.HasOne(f => f.User)
                  .WithMany()
                  .HasForeignKey(f => f.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // SavedCandidate Composite-like unique constraint & FKs
        modelBuilder.Entity<SavedCandidate>(entity =>
        {
            entity.HasKey(sc => new { sc.BusinessId, sc.StudentId });
            entity.HasIndex(sc => new { sc.BusinessId, sc.StudentId }).IsUnique();

            entity.HasOne(sc => sc.BusinessProfile)
                  .WithMany(bp => bp.SavedCandidates)
                  .HasForeignKey(sc => sc.BusinessId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sc => sc.StudentProfile)
                  .WithMany(sp => sp.SavedByBusinesses)
                  .HasForeignKey(sc => sc.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // JobTemplate FK
        modelBuilder.Entity<JobTemplate>(entity =>
        {
            entity.HasOne(jt => jt.BusinessProfile)
                  .WithMany()
                  .HasForeignKey(jt => jt.BusinessId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}