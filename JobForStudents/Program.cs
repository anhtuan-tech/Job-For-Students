using JobForStudents.Data;
using JobForStudents.Models;
using JobForStudents.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient(); // Required for reCAPTCHA verification
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "RequestVerificationToken";
    options.Cookie.Name = builder.Environment.IsDevelopment() ? "J4S-AF" : "__Host-J4S-AF";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        if (HttpMethods.IsGet(context.Request.Method) ||
            HttpMethods.IsHead(context.Request.Method) ||
            HttpMethods.IsOptions(context.Request.Method))
        {
            return RateLimitPartition.GetNoLimiter("read-requests");
        }

        var key = context.User.Identity?.IsAuthenticated == true
            ? $"user:{context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value}"
            : $"ip:{context.Connection.RemoteIpAddress}";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
    options.OnRejected = async (context, cancellationToken) =>
{
    var http = context.HttpContext;

    http.Response.StatusCode = StatusCodes.Status429TooManyRequests;
    http.Response.Headers.RetryAfter = "60";

    var accept = http.Request.Headers.Accept.ToString();
    var isAjax =
        accept.Contains("application/json") ||
        http.Request.Headers.XRequestedWith == "XMLHttpRequest";

    if (isAjax)
    {
        await http.Response.WriteAsJsonAsync(new
        {
            success = false,
            message = "Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại."
        }, cancellationToken);

        return;
    }

    http.Response.ContentType = "text/html; charset=utf-8";

    var html = """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>J4S - Tạm thời bị giới hạn</title>

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
                radial-gradient(circle at top left, rgba(59, 130, 246, .28), transparent 35%),
                radial-gradient(circle at bottom right, rgba(14, 165, 233, .25), transparent 35%),
                linear-gradient(135deg, #eff6ff 0%, #f8fafc 45%, #e0f2fe 100%);
            color: #0f172a;
            padding: 24px;
        }

        .block-card {
            width: 100%;
            max-width: 520px;
            background: rgba(255, 255, 255, .88);
            border: 1px solid rgba(148, 163, 184, .35);
            border-radius: 28px;
            padding: 38px 34px;
            text-align: center;
            box-shadow: 0 30px 80px rgba(15, 23, 42, .16);
            backdrop-filter: blur(18px);
            animation: fadeUp .45s ease;
        }

        .logo {
            width: 72px;
            height: 72px;
            margin: 0 auto 22px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #2563eb, #38bdf8);
            color: white;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -1px;
            box-shadow: 0 18px 35px rgba(37, 99, 235, .35);
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 999px;
            background: #dbeafe;
            color: #1d4ed8;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 18px;
        }

        h1 {
            font-size: 30px;
            line-height: 1.2;
            margin-bottom: 12px;
            color: #0f172a;
        }

        p {
            font-size: 16px;
            line-height: 1.7;
            color: #475569;
            margin-bottom: 26px;
        }

        .countdown-box {
            background: #f8fafc;
            border: 1px dashed #93c5fd;
            border-radius: 18px;
            padding: 16px;
            margin-bottom: 26px;
            color: #334155;
            font-weight: 600;
        }

        .countdown {
            color: #2563eb;
            font-size: 22px;
            font-weight: 900;
        }

        .actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn {
            border: none;
            outline: none;
            border-radius: 14px;
            padding: 13px 20px;
            cursor: pointer;
            font-weight: 800;
            text-decoration: none;
            transition: .2s ease;
            font-size: 15px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #2563eb, #0ea5e9);
            color: white;
            box-shadow: 0 12px 26px rgba(37, 99, 235, .28);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(37, 99, 235, .36);
        }

        .btn-light {
            background: #eef6ff;
            color: #2563eb;
        }

        .btn-light:hover {
            background: #dbeafe;
        }

        .hint {
            margin-top: 24px;
            font-size: 13px;
            color: #94a3b8;
        }

        @keyframes fadeUp {
            from {
                opacity: 0;
                transform: translateY(18px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 520px) {
            .block-card {
                padding: 30px 22px;
                border-radius: 22px;
            }

            h1 {
                font-size: 25px;
            }

            .actions {
                flex-direction: column;
            }

            .btn {
                width: 100%;
            }
        }
    </style>
</head>

<body>
    <main class="block-card">
        <div class="logo">J4S</div>

        <div class="badge">
            ⚠️ Tạm thời bị giới hạn
        </div>

        <h1>Bạn thao tác hơi nhanh</h1>

        <p>
            Hệ thống J4S đã tạm chặn yêu cầu để bảo vệ website khỏi spam hoặc truy cập bất thường.
            Vui lòng chờ một lát rồi thử lại.
        </p>

        <div class="countdown-box">
            Có thể thử lại sau 
            <span class="countdown" id="countdown">60</span>
            giây
        </div>

        <div class="actions">
            <button class="btn btn-primary" onclick="location.reload()">
                Tải lại trang
            </button>

            <a class="btn btn-light" href="/">
                Về trang chủ
            </a>
        </div>

        <div class="hint">
            HTTP ERROR 429 - Too Many Requests
        </div>
    </main>

    <script>
        let seconds = 60;
        const countdown = document.getElementById("countdown");

        const timer = setInterval(() => {
            seconds--;
            countdown.textContent = seconds;

            if (seconds <= 0) {
                clearInterval(timer);
                location.reload();
            }
        }, 1000);
    </script>
</body>
</html>
""";

    await http.Response.WriteAsync(html, cancellationToken);
};
    options.AddFixedWindowLimiter("auth", limiterOptions =>
    {
        limiterOptions.PermitLimit = 12;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
    options.AddFixedWindowLimiter("payment", limiterOptions =>
    {
        limiterOptions.PermitLimit = 20;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
});

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
        options.Cookie.Name = builder.Environment.IsDevelopment() ? "J4S-Auth" : "__Host-J4S-Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.LoginPath = "/Auth/Login";
        options.LogoutPath = "/Auth/Logout";
        options.AccessDeniedPath = "/Auth/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
    });

var app = builder.Build();


app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});



// Automatically apply database migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();

    // Tự động tạo tài khoản Admin mặc định nếu chưa tồn tại
    if (app.Environment.IsDevelopment() && !dbContext.Users.Any(u => u.Email == "admin@j4s.com"))
    {
        var adminPassword = app.Configuration["DevSeed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            throw new InvalidOperationException("Missing DevSeed:AdminPassword for development admin seeding.");
        }

        var adminUser = new User
        {
            Email = "admin@j4s.com",
            Phone = "0000000000",
            PasswordHash = JobForStudents.Helpers.PasswordHasher.HashPassword(adminPassword),
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

    // Đồng bộ quyền lợi mới cho Business Premium
    var premiumPlan = dbContext.ServicePlans.Find(2);
    if (premiumPlan != null)
    {
        premiumPlan.Benefits = "10 tin tuyển dụng;Xem duyệt ứng viên;Truy cập hồ sơ ứng viên không giới hạn";
        dbContext.SaveChanges();
    }
}


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
    context.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin";
    context.Response.Headers["Cross-Origin-Resource-Policy"] = "same-origin";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://api.dopamind.net https://api.dopamind.net; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

    if (context.User.Identity?.IsAuthenticated == true)
    {
        context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
        context.Response.Headers["Pragma"] = "no-cache";
        context.Response.Headers["Expires"] = "0";
    }

    await next();
});

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.Use(async (context, next) =>
{
    if (HttpMethods.IsPost(context.Request.Method) ||
        HttpMethods.IsPut(context.Request.Method) ||
        HttpMethods.IsPatch(context.Request.Method) ||
        HttpMethods.IsDelete(context.Request.Method))
    {
        var host = $"{context.Request.Scheme}://{context.Request.Host}";
        var origin = context.Request.Headers.Origin.ToString();
        var referer = context.Request.Headers.Referer.ToString();
        var sameOrigin = string.IsNullOrWhiteSpace(origin) || origin.Equals(host, StringComparison.OrdinalIgnoreCase);
        var sameReferer = string.IsNullOrWhiteSpace(referer) || referer.StartsWith(host, StringComparison.OrdinalIgnoreCase);

        if (!sameOrigin || !sameReferer)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Request origin is not allowed." });
            return;
        }
    }

    await next();
});

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
