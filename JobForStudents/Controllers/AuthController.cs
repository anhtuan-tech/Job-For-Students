using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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

    public AuthController(AppDbContext context, IMemoryCache cache, IEmailService emailService)
    {
        _context = context;
        _cache = cache;
        _emailService = emailService;
    }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return RedirectToAction("Index", "Home");
        }
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var passwordHash = PasswordHasher.HashPassword(model.Password);
        var user = await _context.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.BusinessProfile)
            .FirstOrDefaultAsync(u => u.Email == model.Email && u.PasswordHash == passwordHash && !u.IsDeleted);

        if (user == null)
        {
            ModelState.AddModelError(string.Empty, "Email hoặc mật khẩu không chính xác.");
            return View(model);
        }

        if (user.Status == UserStatus.Banned)
        {
            ModelState.AddModelError(string.Empty, "Tài khoản của bạn đã bị khóa.");
            return View(model);
        }

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
        var cacheKey = $"OTP_Reset_{request.Email}";
        _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(5));

        // For development purpose, print to output console and return OTP
        System.Diagnostics.Debug.WriteLine($"[FORGOT PASSWORD] OTP for {request.Email}: {otp}");
        Console.WriteLine($"[FORGOT PASSWORD] OTP for {request.Email}: {otp}");

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
                <p style='color: #ef4444; font-weight: 500;'>Mã OTP này có hiệu lực trong vòng 5 phút.</p>
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
        if (!_cache.TryGetValue(cacheKey, out string? cachedOtp) || cachedOtp != request.Otp)
        {
            return Json(new { success = false, message = "Mã OTP không chính xác hoặc đã hết hạn." });
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
        if (!_cache.TryGetValue(cacheKey, out string? cachedOtp) || cachedOtp != request.Otp)
        {
            return Json(new { success = false, message = "Mã OTP không chính xác hoặc đã hết hạn." });
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

        _cache.Remove(cacheKey);

        return Json(new { success = true, message = "Đặt lại mật khẩu thành công!" });
    }
}
