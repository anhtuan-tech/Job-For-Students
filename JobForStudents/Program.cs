using JobForStudents.Data;
using JobForStudents.Models;
using JobForStudents.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddMemoryCache();

// Configure EmailSettings and register EmailService
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddTransient<IEmailService, EmailService>();

// Register AppDbContext with Npgsql PostgreSQL provider
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Cookie Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Auth/Login";
        options.LogoutPath = "/Auth/Logout";
        options.AccessDeniedPath = "/Auth/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
    });

var app = builder.Build();

// Automatically apply database migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();

    // Tự động tạo tài khoản Admin mặc định nếu chưa tồn tại
    if (!dbContext.Users.Any(u => u.Email == "admin@j4s.com"))
    {
        var adminUser = new User
        {
            Email = "admin@j4s.com",
            Phone = "0000000000",
            PasswordHash = JobForStudents.Helpers.PasswordHasher.HashPassword("Admin@123"),
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(adminUser);
        dbContext.SaveChanges();

        var wallet = new Wallet
        {
            UserId = adminUser.Id,
            Balance = 0,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Wallets.Add(wallet);
        dbContext.SaveChanges();
    }
}


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

