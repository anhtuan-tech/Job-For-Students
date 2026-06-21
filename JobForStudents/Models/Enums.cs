namespace JobForStudents.Models;

public enum UserRole
{
    Student,
    Business,
    Admin
}

public enum UserStatus
{
    Active,
    Banned
}

public enum SkillLevel
{
    Beginner,
    Intermediate,
    Expert
}

public enum BudgetType
{
    Fixed,
    Hourly
}

public enum ExperienceLevel
{
    No_Experience,
    Mid_Level,
    Expert
}

public enum JobStatus
{
    Open,
    In_Progress,
    Closed,
    Rejected
}

public enum BidStatus
{
    Pending,
    Accepted,
    Rejected
}

public enum ContractStatus
{
    Active,
    Submitted,
    Completed,
    Disputed
}

public enum NotificationType
{
    System,
    JobStatus,
    Message
}

public enum TransactionType
{
    Deposit,
    Withdraw,
    Holding,
    Release
}

public enum TransactionStatus
{
    Pending,
    Success,
    Failed
}
