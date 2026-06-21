using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobForStudents.Data;
using JobForStudents.Helpers;
using JobForStudents.Models;

namespace JobForStudents.Controllers;

public class AuthController : Controller
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
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
}
