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
    Draft,
    Open,
    In_Progress,
    Paused,
    Closed,
    Rejected
}

public enum BidStatus
{
    Pending,
    Accepted,
    Rejected,
    Hired
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
    Message,
    Payment,
    Review,
    Deadline
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

public enum SubscriptionStatus
{
    Active,
    Expired,
    Cancelled
}

public enum SupportCategory
{
    JobPosting,
    PaymentWallet,
    Account,
    Other
}

public enum SupportRequestStatus
{
    Pending,
    InProgress,
    Resolved
}

public enum FeedbackType
{
    Suggestion,
    BugReport
}

public enum FeedbackStatus
{
    Received,
    InProgress,
    Resolved
}

