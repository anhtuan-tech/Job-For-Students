using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using JobForStudents.Data;
using JobForStudents.Helpers;
using JobForStudents.Models;
using JobForStudents.Services;

namespace JobForStudents.Controllers;

public class AuthController : Controller
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    private const int MaxLoginFailures = 5;
    private const int LoginLockWindowMinutes = 15;

    public AuthController(AppDbContext context, IMemoryCache cache, IEmailService emailService,
        IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _cache = cache;
        _emailService = emailService;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "Home");
        }
        ViewData["ReturnUrl"] = returnUrl;
        ViewData["RecaptchaSiteKey"] = _configuration["GoogleReCaptcha:SiteKey"];
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        ViewData["RecaptchaSiteKey"] = _configuration["GoogleReCaptcha:SiteKey"];

        if (!ModelState.IsValid)
        {
            var fails0 = GetLoginFailCount(model.Email);
            ViewData["ShowCaptcha"] = fails0 >= MaxLoginFailures;
            return View(model);
        }

        var failCacheKey = $"Login_Fail_{model.Email.ToLower().Trim()}";
        var currentFailCount = GetLoginFailCount(model.Email);

        // Require reCAPTCHA verification after MaxLoginFailures failures
        if (currentFailCount >= MaxLoginFailures)
        {
            ViewData["ShowCaptcha"] = true;
            if (string.IsNullOrWhiteSpace(model.RecaptchaToken))
            {
                ModelState.AddModelError(string.Empty, "Vui lòng xác nhận bạn không phải robot trước khi đăng nhập.");
                return View(model);
            }

            var captchaValid = await VerifyReCaptchaAsync(model.RecaptchaToken);
            if (!captchaValid)
            {
                ModelState.AddModelError(string.Empty, "Xác minh reCAPTCHA không hợp lệ. Vui lòng thử lại.");
                return View(model);
            }
        }

        var passwordHash = PasswordHasher.HashPassword(model.Password);
        var user = await _context.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.BusinessProfile)
            .FirstOrDefaultAsync(u => u.Email == model.Email && u.PasswordHash == passwordHash && !u.IsDeleted);

        if (user == null)
        {
            // Increment failure counter
            var newCount = currentFailCount + 1;
            _cache.Set(failCacheKey, newCount, TimeSpan.FromMinutes(LoginLockWindowMinutes));

            var remaining = MaxLoginFailures - newCount;
            if (remaining > 0)
            {
                ModelState.AddModelError(string.Empty, $"Email hoặc mật khẩu không chính xác. Bạn còn {remaining} lần thử trước khi cần xác minh captcha.");
            }
            else
            {
                ModelState.AddModelError(string.Empty, "Email hoặc mật khẩu không chính xác. Vui lòng xác minh captcha để tiếp tục.");
                ViewData["ShowCaptcha"] = true;
            }
            return View(model);
        }

        if (user.Status == UserStatus.Banned)
        {
            ModelState.AddModelError(string.Empty, "Tài khoản của bạn đã bị khóa.");
            return View(model);
        }

        // Success — clear failure counter
        _cache.Remove(failCacheKey);

        var userName = user.Role == UserRole.Student 
            ? user.StudentProfile?.FullName ?? user.Email 
            : user.BusinessProfile?.CompanyName ?? user.Email;

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.Name, userName)
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

        var authProperties = new AuthenticationProperties
        {
            IsPersistent = model.RememberMe,
            ExpiresUtc = System.DateTimeOffset.UtcNow.AddDays(7)
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(claimsIdentity),
            authProperties);

        TempData["SuccessMessage"] = "Đăng nhập thành công! Chào mừng trở lại, " + userName;

        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
        {
            return Redirect(returnUrl);
        }
        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "Home");
        }
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        // Check for disposable email domains
        var emailParts = model.Email.Split('@');
        if (emailParts.Length == 2)
        {
            var domain = emailParts[1].ToLower().Trim();
            string[] disposableDomains = { 
                "mailinator.com", "yopmail.com", "tempmail.com", "guerrillamail.com", 
                "sharklasers.com", "dispostable.com", "getairmail.com", "burnermail.io", 
                "10minutemail.com", "trashmail.com", "temp-mail.org", "maildrop.cc" 
            };
            if (disposableDomains.Contains(domain))
            {
                ModelState.AddModelError("Email", "Không chấp nhận đăng ký tài khoản bằng địa chỉ email tạm thời.");
                return View(model);
            }
        }

        // Check for dangerous characters/links in Name
        if (ContainsDangerousCharactersOrLinks(model.Name))
        {
            ModelState.AddModelError("Name", "Họ tên hoặc tên công ty không được chứa các ký tự đặc biệt nguy hiểm hoặc đường dẫn liên kết.");
            return View(model);
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Email == model.Email);
        if (emailExists)
        {
            ModelState.AddModelError("Email", "Email đã tồn tại trên hệ thống.");
            return View(model);
        }

        var phoneExists = await _context.Users.AnyAsync(u => u.Phone == model.Phone);
        if (phoneExists)
        {
            ModelState.AddModelError("Phone", "Số điện thoại đã tồn tại trên hệ thống.");
            return View(model);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = new User
            {
                Email = model.Email,
                Phone = model.Phone,
                PasswordHash = PasswordHasher.HashPassword(model.Password),
                Role = model.Role,
                Status = UserStatus.Active,
                IsDeleted = false,
                CreatedAt = System.DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create Profile
            if (model.Role == UserRole.Student)
            {
                var studentProfile = new StudentProfile
                {
                    UserId = user.Id,
                    FullName = model.Name,
                    Gender = "Khác"
                };
                _context.StudentProfiles.Add(studentProfile);
            }
            else if (model.Role == UserRole.Business)
            {
                var businessProfile = new BusinessProfile
                {
                    UserId = user.Id,
                    CompanyName = model.Name,
                    IsVerified = false
                };
                _context.BusinessProfiles.Add(businessProfile);
            }

            // Initialize Wallet
            var wallet = new Wallet
            {
                UserId = user.Id,
                Balance = 0,
                UpdatedAt = System.DateTime.UtcNow
            };
            _context.Wallets.Add(wallet);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            TempData["SuccessMessage"] = "Đăng ký tài khoản thành công! Hãy đăng nhập.";
            return RedirectToAction("Login");
        }
        catch (System.Exception)
        {
            await transaction.RollbackAsync();
            ModelState.AddModelError(string.Empty, "Đã xảy ra lỗi hệ thống khi đăng ký. Vui lòng thử lại sau.");
            return View(model);
        }
    }

    [HttpGet]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        TempData["SuccessMessage"] = "Bạn đã đăng xuất thành công.";
        return RedirectToAction("Index", "Home");
    }


    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> LogoutPost()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        TempData["SuccessMessage"] = "Bạn đã đăng xuất thành công.";
        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public IActionResult AccessDenied()
    {
        return View();
    }

    [HttpGet]
    public IActionResult ForgotPassword()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "Home");
        }
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return Json(new { success = false, message = "Email không hợp lệ." });
        }

        // Rate limiting: block if a request was already sent in the last 60 seconds
        var rateLimitKey = $"OTP_RateLimit_{request.Email.ToLower().Trim()}";
        if (_cache.TryGetValue(rateLimitKey, out _))
        {
            return Json(new { success = false, message = "Bạn vừa yêu cầu gửi mã OTP. Vui lòng chờ ít nhất 60 giây trước khi thử lại." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (user == null)
        {
            return Json(new { success = false, message = "Email không tồn tại trên hệ thống." });
        }

        if (user.Status == UserStatus.Banned)
        {
            return Json(new { success = false, message = "Tài khoản này đã bị khóa." });
        }

        var otp = new Random().Next(100000, 999999).ToString();
        var sentAt = DateTime.UtcNow;

        // Store OTP with timestamp (expires from cache after 5 minutes as a safety net)
        var cacheKey = $"OTP_Reset_{request.Email}";
        _cache.Set(cacheKey, (Otp: otp, SentAt: sentAt), TimeSpan.FromMinutes(5));

        // Set rate limit: block re-send for 60 seconds
        _cache.Set(rateLimitKey, true, TimeSpan.FromSeconds(60));


        // Send OTP email
        var subject = "Mã xác thực khôi phục mật khẩu J4S";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;'>
                <h2 style='color: #2563eb; text-align: center;'>Khôi phục mật khẩu tài khoản J4S</h2>
                <p>Chào bạn,</p>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản J4S của mình. Dưới đây là mã OTP xác thực của bạn:</p>
                <div style='background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b; border-radius: 6px; margin: 20px 0;'>
                    {otp}
                </div>
                <p style='color: #ef4444; font-weight: 500;'>Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>.</p>
                <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này để bảo vệ tài khoản.</p>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />
                <p style='font-size: 12px; color: #64748b; text-align: center;'>Đây là email tự động từ hệ thống J4S Platform. Vui lòng không phản hồi email này.</p>
            </div>";
        await _emailService.SendEmailAsync(request.Email, subject, body);

        return Json(new { success = true, message = "Mã OTP đã được gửi đến email của bạn." });
    }

    [HttpPost]
    public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join(" ", System.Linq.Enumerable.Select(
                System.Linq.Enumerable.SelectMany(ModelState.Values, v => v.Errors), 
                e => e.ErrorMessage));
            return Json(new { success = false, message = errors });
        }

        var cacheKey = $"OTP_Reset_{request.Email}";
        if (!_cache.TryGetValue(cacheKey, out (string Otp, DateTime SentAt) record))
        {
            return Json(new { success = false, message = "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng yêu cầu mã mới." });
        }

        // Check OTP value
        if (record.Otp != request.Otp)
        {
            return Json(new { success = false, message = "Mã OTP không chính xác." });
        }

        // Check explicit 5-minute expiry
        if ((DateTime.UtcNow - record.SentAt).TotalMinutes > 5)
        {
            _cache.Remove(cacheKey);
            return Json(new { success = false, message = "Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới." });
        }

        return Json(new { success = true, message = "Mã OTP xác thực thành công!" });
    }

    [HttpPost]
    public async Task<IActionResult> VerifyOtpAndResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join(" ", System.Linq.Enumerable.Select(
                System.Linq.Enumerable.SelectMany(ModelState.Values, v => v.Errors), 
                e => e.ErrorMessage));
            return Json(new { success = false, message = errors });
        }

        var cacheKey = $"OTP_Reset_{request.Email}";
        if (!_cache.TryGetValue(cacheKey, out (string Otp, DateTime SentAt) record))
        {
            return Json(new { success = false, message = "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng yêu cầu mã mới." });
        }

        // Check OTP value
        if (record.Otp != request.Otp)
        {
            return Json(new { success = false, message = "Mã OTP không chính xác." });
        }

        // Check explicit 5-minute expiry
        if ((DateTime.UtcNow - record.SentAt).TotalMinutes > 5)
        {
            _cache.Remove(cacheKey);
            return Json(new { success = false, message = "Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);
        if (user == null)
        {
            return Json(new { success = false, message = "Không tìm thấy người dùng." });
        }

        var newPasswordHash = PasswordHasher.HashPassword(request.NewPassword);
        if (user.PasswordHash == newPasswordHash)
        {
            return Json(new { success = false, message = "Mật khẩu mới không được trùng với mật khẩu cũ." });
        }

        user.PasswordHash = newPasswordHash;
        await _context.SaveChangesAsync();

        // Clean up both OTP and rate limit entries after successful reset
        _cache.Remove(cacheKey);
        _cache.Remove($"OTP_RateLimit_{request.Email.ToLower().Trim()}");

        return Json(new { success = true, message = "Đặt lại mật khẩu thành công!" });
    }

    private bool ContainsDangerousCharactersOrLinks(string text)
    {
        if (string.IsNullOrEmpty(text)) return false;

        // Check for links (http://, https://, www., .com, etc.)
        var linkPattern = new System.Text.RegularExpressions.Regex(@"(https?:\/\/|www\.|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (linkPattern.IsMatch(text)) return true;

        // Check for dangerous characters
        char[] dangerousChars = { '<', '>', '{', '}', '[', ']', '\\', '^', '$', '*', '+', '|', '?' };
        if (text.Any(c => dangerousChars.Contains(c))) return true;

        return false;
    }

    private int GetLoginFailCount(string email)
    {
        var key = $"Login_Fail_{email.ToLower().Trim()}";
        return _cache.TryGetValue(key, out int count) ? count : 0;
    }

    private async Task<bool> VerifyReCaptchaAsync(string token)
    {
        try
        {
            var secretKey = _configuration["GoogleReCaptcha:SecretKey"];
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsync(
                $"https://www.google.com/recaptcha/api/siteverify?secret={secretKey}&response={token}",
                null);

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json);
            return result.TryGetProperty("success", out var successProp) && successProp.GetBoolean();
        }
        catch
        {
            return false;
        }
    }
}
