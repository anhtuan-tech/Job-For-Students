using System.ComponentModel.DataAnnotations;

namespace JobForStudents.Models;

public class LoginViewModel
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}

public class RegisterViewModel
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại là bắt buộc.")]
    [Phone(ErrorMessage = "Số điện thoại không hợp lệ.")]
    [RegularExpression(@"^[0-9]{10,11}$", ErrorMessage = "Số điện thoại phải từ 10-11 chữ số.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$", ErrorMessage = "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt.")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc.")]
    [Compare("Password", ErrorMessage = "Mật khẩu xác nhận không khớp.")]
    [DataType(DataType.Password)]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn vai trò.")]
    public UserRole Role { get; set; }

    // Custom profile fields depending on Role
    [Required(ErrorMessage = "Họ và tên hoặc Tên công ty là bắt buộc.")]
    [Display(Name = "Họ và tên / Tên công ty")]
    public string Name { get; set; } = string.Empty;
}

public class SendOtpRequest
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã OTP là bắt buộc.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải có đúng 6 chữ số.")]
    public string Otp { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc.")]
    [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")]
    [DataType(DataType.Password)]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc.")]
    [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp.")]
    [DataType(DataType.Password)]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class VerifyOtpRequest
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã OTP là bắt buộc.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải có đúng 6 chữ số.")]
    public string Otp { get; set; } = string.Empty;
}
