# TÀI LIỆU TOÀN DIỆN VỀ TOÀN BỘ CÁC LỚP VALIDATE & BẢO MẬT DỰ ÁN J4S (JOB FOR STUDENTS)

Tài liệu này bao gồm **100% tất cả các quy tắc kiểm tra (Validation Rules)**, **ràng buộc nghiệp vụ (Business Constraints)**, **thông báo lỗi (Error Messages)** và **cơ chế an ninh bảo mật (Security Layers)** từ Frontend đến Backend trong mã nguồn hệ thống **J4S**.

---

## MỤC LỤC
1. [Xác thực, Đăng ký & Đăng nhập (Auth & Security)](#1-xác-thực-đăng-ký--đăng-nhập)
2. [Hồ sơ Cá nhân, CV & Portfolio (Profiles, CV & Projects)](#2-hồ-sơ-cá-nhân-cv--portfolio)
3. [Đăng tin tuyển dụng & Mẫu tin (Job Posting & Templates)](#3-đăng-tin-tuyển-dụng--mẫu-tin)
4. [Ứng tuyển & Báo giá (Job Bidding)](#4-ứng-tuyển--báo-giá)
5. [Hợp đồng, Nghiệm thu & Escrow (Contracts & Deliverables)](#5-hợp-đồng-nghiệm-thu--escrow)
6. [Ví điện tử, Nạp & Rút tiền (Wallet & Transactions)](#6-ví-điện-tử-nạp--rút-tiền)
7. [Gói dịch vụ & Đăng ký cước (Service Plans & Subscriptions)](#7-gói-dịch-vụ--đăng-ký-cước)
8. [Đánh giá, Phản hồi & Báo cáo (Reviews & Reports)](#8-đánh-giá-phản-hồi--báo-cáo)
9. [Tin nhắn trực tuyến (Real-time Messaging)](#9-tin-nhắn-trực-tuyến)
10. [Hỗ trợ & Góp ý (Support Tickets & Feedback)](#10-hỗ-trợ--góp-ý)
11. [Bảo mật Hệ thống & Cơ sở dữ liệu (System-Level Security)](#11-bảo-mật-hệ-thống--cơ-sở-dữ-liệu)

---

## 1. XÁC THỰC, ĐĂNG KÝ & ĐĂNG NHẬP

### 1.1. Đăng ký tài khoản (`Register`)
| Đối tượng | Quy tắc kiểm tra (Validation Rule) | Chi tiết kỹ thuật / Regex | Thông báo lỗi |
| :--- | :--- | :--- | :--- |
| **Email** | Bắt buộc nhập | `[Required]` | *"Email là bắt buộc."* |
| **Email** | Đúng chuẩn định dạng email | `[EmailAddress]` | *"Địa chỉ email không hợp lệ."* |
| **Email** | Chặn email ảo / tạm thời (Disposable Domain) | Whitelist domain blacklist: `mailinator.com`, `yopmail.com`, `tempmail.com`, `guerrillamail.com`, `sharklasers.com`, `dispostable.com`, `getairmail.com`, `burnermail.io`, `10minutemail.com`, `trashmail.com`, `temp-mail.org`, `maildrop.cc` | *"Không chấp nhận đăng ký tài khoản bằng địa chỉ email tạm thời."* |
| **Email** | Không được trùng lặp trong hệ thống | Database Unique Index & Query AnyAsync | *"Email đã tồn tại trên hệ thống."* |
| **Họ tên / Tên Cty** | Bắt buộc nhập | `[Required]` | *"Họ và tên hoặc Tên công ty là bắt buộc."* |
| **Họ tên / Tên Cty** | Chặn link độc hại / XSS / Ký tự đặc biệt | Regex kiểm tra `https?://`, `www.`, `.com` và ký tự `<`, `>`, `{`, `}`, `[`, `]`, `\`, `^`, `$`, `*`, `+`, `|`, `?` | *"Họ tên hoặc tên công ty không được chứa các ký tự đặc biệt nguy hiểm hoặc đường dẫn liên kết."* |
| **Số điện thoại** | Bắt buộc nhập | `[Required]` | *"Số điện thoại là bắt buộc."* |
| **Số điện thoại** | Đúng định dạng SĐT Việt Nam | Regex: `^0[0-9]{9,10}$` | *"Số điện thoại phải bắt đầu bằng số 0 và có từ 10-11 chữ số."* |
| **Số điện thoại** | Không được trùng lặp | Database Unique Index & Query AnyAsync | *"Số điện thoại đã tồn tại trên hệ thống."* |
| **Mật khẩu** | Bắt buộc, tối thiểu 6 ký tự | `[Required]`, `[MinLength(6)]` | *"Mật khẩu phải có ít nhất 6 ký tự."* |
| **Mật khẩu** | Chính sách mật khẩu mạnh (Độ phức tạp) | Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$` | *"Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt."* |
| **Xác nhận mật khẩu** | Trùng khớp với mật khẩu | `[Compare("Password")]` | *"Mật khẩu xác nhận không khớp."* |
| **Vai trò (Role)** | Bắt buộc chọn vai trò | `UserRole.Student` hoặc `UserRole.Business` | *"Vui lòng chọn vai trò."* |

---

### 1.2. Đăng nhập (`Login`)
| Đối tượng | Quy tắc kiểm tra | Cơ chế & Xử lý |
| :--- | :--- | :--- |
| **Email & Mật khẩu** | Bắt buộc nhập | Báo lỗi form nếu để trống. |
| **Kiểm tra sai thông tin** | So khớp mật khẩu đã băm SHA256 | Nếu sai, tăng biến đếm `Login_Fail_{email}` trong bộ nhớ Cache (thời hạn 15 phút). |
| **Cảnh báo số lần thử** | Khi sai từ 1 - 4 lần | Thông báo: *"Email hoặc mật khẩu không chính xác. Bạn còn {remaining} lần thử trước khi cần xác minh captcha."* |
| **Google reCAPTCHA v2** | Khi sai từ lần thứ 5 trở lên | Bắt buộc hiển thị widget **"Tôi không phải là người máy"**. Kiểm tra `RecaptchaToken` gửi lên Google API (`https://www.google.com/recaptcha/api/siteverify`). Chặn nếu token không hợp lệ. |
| **Khóa tài khoản** | `user.Status == UserStatus.Banned` | Thông báo: *"Tài khoản của bạn đã bị khóa."* |
| **Xác thực 2 lớp (2FA OTP)** | Áp dụng cho `Student` & `Business` | - Sinh mã OTP 6 chữ số ngẫu nhiên.<br>- Gửi email OTP bảo mật qua Gmail SMTP.<br>- Lưu cache `Login_OTP_{email}` với thời hạn **5 phút**.<br>- Chuyển hướng sang giao diện 6 ô PIN OTP (`/Auth/VerifyLoginOtp`). |
| **Miễn xác thực 2FA** | Áp dụng cho `Admin` | Đăng nhập trực tiếp, cấp Cookie ngay lập tức. |
| **Gửi lại mã OTP (Resend)** | Giới hạn tần suất (Rate Limit) | Bộ nhớ Cache `Login_OTP_Cooldown_{email}`: Phải đợi **60 giây** giữa 2 lần gửi lại. |

---

### 1.3. Quên mật khẩu & Đổi mật khẩu
- **Gửi OTP Quên mật khẩu**:
  - Rate limit: 60s cooldown chống spam email.
  - Kiểm tra email có tồn tại và tài khoản không bị Banned.
  - Gửi mã OTP 6 số qua email, mã tự hủy sau 5 phút.
- **Xác thực OTP**: Kiểm tra chính xác mã OTP và thời gian sống (`<= 5 phút`).
- **Thiết lập mật khẩu mới**:
  - Mật khẩu mới tối thiểu 6 ký tự, đúng regex độ phức tạp.
  - Khớp với mật khẩu xác nhận.
  - **Mật khẩu mới không được trùng với mật khẩu cũ**: *"Mật khẩu mới không được trùng với mật khẩu cũ."*
- **Đổi mật khẩu trong hồ sơ**:
  - Xác thực đúng mật khẩu hiện tại trong DB.
  - Mật khẩu mới khác mật khẩu cũ và đáp ứng độ phức tạp.

---

## 2. HỒ SƠ CÁ NHÂN, CV & PORTFOLIO

### 2.1. Hồ sơ Sinh viên (`StudentProfile`)
- **Điểm trung bình (GPA)**: Bắt buộc từ `0.0` đến `4.0` (*"GPA phải nằm trong khoảng từ 0.0 đến 4.0."*).
- **Độ tuổi / Ngày sinh**: Tuổi hợp lệ từ **15 đến 70 tuổi** (*"Tuổi không hợp lệ. Tuổi phải từ 15 đến 70."*).
- **Tải lên File CV**:
  - Định dạng cho phép (Whitelist): `.pdf`, `.doc`, `.docx`.
  - Dung lượng file tối đa: **5MB**.
- **Ảnh đại diện (Avatar)**: Định dạng `.jpg`, `.jpeg`, `.png`, `.webp`, dung lượng tối đa 2MB.
- **Cập nhật Kỹ năng (Skills)**:
  - Cấp độ kỹ năng thuộc Enum: `Beginner`, `Intermediate`, `Expert`.
  - Không cho phép gán trùng 1 kỹ năng nhiều lần cho 1 sinh viên (Khóa chính phức hợp `StudentId + SkillId`).
- **Dự án Portfolio (`PortfolioProject`)**:
  - Tiêu đề dự án bắt buộc, mô tả, đường dẫn liên kết (URL).
  - Tải lên hình ảnh dự án (định dạng ảnh hợp lệ).
- **Chứng chỉ (`Certificate`)**:
  - Tên chứng chỉ bắt buộc.
  - Tổ chức cấp và ngày cấp hợp lệ.

### 2.2. Hồ sơ Doanh nghiệp (`BusinessProfile`)
- **Thông tin pháp lý**: Tên công ty, ngành nghề, địa chỉ, mã số thuế bắt buộc.
- **Tài liệu xác thực (`IsVerified`)**: Phải được Admin kiểm duyệt hồ sơ doanh nghiệp.

---

## 3. ĐĂNG TIN TUYỂN DỤNG & MẪU TIN

- **Kiểm tra Hạn mức Gói dịch vụ (Subscription Quota)**:
  - Kiểm tra số bài đã đăng trong tháng so với giới hạn `JobPostLimit` của gói cước (`ServicePlan`).
  - Nếu hết lượt đăng: Báo lỗi và yêu cầu nâng cấp gói cước (`Business Premium` hoặc `Business VIP`).
- **Tiêu đề công việc**: Độ dài từ 5 đến 200 ký tự, không chứa link/mã độc.
- **Ngân sách (Budget)**:
  - Bắt buộc `> 0`.
  - Loại ngân sách hợp lệ: `BudgetType.Fixed` (Cố định) hoặc `BudgetType.Hourly` (Theo giờ).
- **Hạn chót ứng tuyển (Deadline)**: Phải lớn hơn thời gian hiện tại (`Deadline > DateTime.UtcNow`).
- **Kỹ năng yêu cầu**: Bắt buộc chọn ít nhất **1 kỹ năng** từ danh mục.
- **Lưu Mẫu tin tuyển dụng (`JobTemplate`)**: Tên mẫu và nội dung công việc bắt buộc.

---

## 4. ỨNG TUYỂN & BÁO GIÁ (JOB BIDDING)

- **Phân quyền người dùng**: Chỉ tài khoản `UserRole.Student` mới có quyền nộp hồ sơ báo giá.
- **Trạng thái bài đăng**: Công việc phải đang ở trạng thái `JobStatus.Open`.
- **Thời hạn ứng tuyển**: Chặn ứng tuyển nếu ngày hiện tại vượt quá `Deadline`.
- **Chống nộp trùng lặp (Unique Bid)**: Mỗi sinh viên chỉ được gửi duy nhất **1 báo giá** cho mỗi tin tuyển dụng.
- **Số tiền đề xuất**: Bắt buộc `> 0`.
- **Thời gian hoàn thành**: Số ngày thực hiện dự kiến `> 0`.
- **Thư giới thiệu (Proposal)**: Bắt buộc nhập nội dung bày tỏ nguyện vọng và giải pháp.

---

## 5. HỢP ĐỒNG, NGHIỆM THU & ESCROW

- **Quyền tạo hợp đồng**: Chỉ Doanh nghiệp đăng bài mới có quyền duyệt báo giá và tạo hợp đồng (`JobContract`).
- **Số dư bảo đảm (Escrow Balance)**: Doanh nghiệp phải có đủ số dư trong Ví nội bộ để ký quỹ hợp đồng.
- **Nộp kết quả công việc (`Submit Deliverable`)**:
  - Chỉ Sinh viên nhận việc mới có quyền nộp kết quả.
  - Hợp đồng phải đang ở trạng thái `Active`.
  - Không cho phép nộp lại nếu đã nộp trước đó hoặc hợp đồng đã xong.
- **Nghiệm thu & Giải ngân**:
  - Chỉ Doanh nghiệp thuê mới có quyền bấm Nghiệm thu.
  - Khi hoàn thành (`Completed`), tiền tự động chuyển sang Ví của sinh viên.

---

## 6. VÍ ĐIỆN TỬ, NẠP & RÚT TIỀN

### 6.1. Nạp tiền (`Deposit`)
- Số tiền nạp phải `> 0`.
- Số tiền nạp **không được chứa phần thập phân**.
- Số tiền nạp **phải là bội số của 50.000 VNĐ** (Ví dụ: 50k, 100k, 200k, 500k,...).
- Kiểm tra mã nội dung chuyển khoản tự động và kiểm tra lịch sử biến động số dư qua API ACB.

### 6.2. Rút tiền (`Withdraw`)
- Kiểm tra số dư ví khả dụng: `Amount <= Wallet.Balance`.
- Số tiền rút tối thiểu theo quy định (>= 50.000 VNĐ).
- Bắt buộc điền đúng và đủ: Tên ngân hàng, Số tài khoản, Họ tên chủ tài khoản thụ hưởng.

---

## 7. GÓI DỊCH VỤ & ĐĂNG KÝ CƯỚC (SUBSCRIPTIONS)

- Chỉ tài khoản `Business` mới được mua gói cước dịch vụ.
- Kiểm tra số dư ví của doanh nghiệp có đủ thanh toán giá gói cước (`ServicePlan.Price`) hay không.
- Tự động trừ tiền ví và kích hoạt thời hạn sử dụng (`DurationDays`).

---

## 8. ĐÁNH GIÁ, PHẢN HỒI & BÁO CÁO (REVIEWS & REPORTS)

- **Điều kiện đánh giá**: Chỉ các bên trong hợp đồng đã hoàn thành (`ContractStatus.Completed`) mới được đánh giá lẫn nhau.
- **Thang điểm sao**: Bắt buộc từ **1 đến 5 sao** (`1 <= Rating <= 5`).
- **Độ dài nhận xét**: Nội dung nhận xét tối thiểu **10 ký tự** (*"Nội dung nhận xét phải tối thiểu 10 ký tự."*).
- **Chống Spam Review**: Mỗi người chỉ được tạo **1 đánh giá** cho mỗi hợp đồng.
- **Giới hạn chỉnh sửa**: Chỉ được phép chỉnh sửa đánh giá hoặc phản hồi trong vòng **24 giờ** kể từ lúc gửi.
- **Báo cáo vi phạm (`ReportReview`)**: Phải cung cấp lý do báo cáo rõ ràng.

---

## 9. TIN NHẮN TRỰC TUYẾN (MESSAGING)

- **Độ dài tin nhắn**: Tối đa **4000 ký tự** (*"Độ dài tin nhắn không được vượt quá 4000 ký tự."*).
- **Trạng thái người nhận**: Người nhận phải tồn tại và không bị khóa tài khoản.
- **Chống Spam tin nhắn (Flood Protection)**: Tối đa **30 tin nhắn / 1 phút / 1 người dùng**.
- Chặn gửi tin nhắn rỗng / khoảng trắng.

---

## 10. HỖ TRỢ & GÓP Ý (SUPPORT & FEEDBACK)

- **Yêu cầu hỗ trợ (`SupportRequest`)**:
  - Tiêu đề và nội dung bắt buộc.
  - Phân loại danh mục hợp lệ (`SupportCategory`: JobPosting, PaymentWallet, Account, Other).
  - **Giới hạn gửi ticket**: Tối đa **3 lần / 10 phút** để chống spam.
- **Góp ý (`Feedback`)**: Bắt buộc chọn loại (`Suggestion` hoặc `BugReport`) và nhập nội dung.

---

## 11. BẢO MẬT HỆ THỐNG & CƠ SỞ DỮ LIỆU

1. **Chống tấn công CSRF**: Bắt buộc `[ValidateAntiForgeryToken]` trên 100% các action POST.
2. **Chống nghẽn & DoS (Rate Limiting)**: Áp dụng `[EnableRateLimiting("auth")]` trên toàn bộ các cổng xác thực và API nhạy cảm.
3. **Chống SQL Injection**: Sử dụng Entity Framework Core với Parametrized LINQ Queries, loại bỏ hoàn toàn việc ghép chuỗi SQL.
4. **Mã hóa Mật khẩu**: Băm bằng SHA256 an toàn (`PasswordHasher`).
5. **Cơ chế Tự hủy Token & Session tạm**: Tự động thu hồi mã OTP, mã phiên đăng nhập tạm sau 5 phút để bảo vệ bộ nhớ RAM.
6. **Môi trường & Target Framework**: Biên dịch trên nền tảng **.NET 8 (LTS)** với độ ổn định và hiệu năng cao nhất.

---
*Tài liệu kiểm tra và rà soát tự động 100% mã nguồn dự án J4S.*
