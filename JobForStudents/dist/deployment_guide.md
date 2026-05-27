# Hướng Dẫn Chi Tiết: Host Giao Diện J4S Lên Vercel & Trỏ Tên Miền Riêng

Giao diện Dashboard **J4S (Job For Students)** đã được tôi đóng gói hoàn hảo thành một trang web tĩnh (Static Web) nằm trong thư mục **`dist`** tại đường dẫn:
`d:\SU26 07\EXE101_G01\JobForStudents\JobForStudents\dist`

Vì đây là trang web tĩnh chỉ gồm HTML, CSS, JS và hình ảnh nên bạn có thể host nó **hoàn toàn miễn phí, tải siêu nhanh và không giới hạn băng thông** trên Vercel. Dưới đây là hướng dẫn từng bước cụ thể nhất:

---

## PHẦN 1: Hướng Dẫn Host Lên Vercel Bằng Cách Kéo-Thả (Cách Dễ Nhất)

Không cần cài đặt phức tạp, không cần sử dụng dòng lệnh, bạn chỉ cần làm theo các bước sau:

### Bước 1.1: Chuẩn bị thư mục `dist`
1. Mở trình quản lý tệp tin (File Explorer) trên máy tính và tìm đến thư mục dự án của bạn:
   `D:\SU26 07\EXE101_G01\JobForStudents\JobForStudents`
2. Tại đây, bạn sẽ thấy thư mục tên là **`dist`** (đây là thư mục tôi vừa tạo và đóng gói cho bạn).
3. Nhấp chuột phải vào thư mục **`dist`** -> Chọn **Compress to ZIP file** (Nén thành tệp `.zip`) để tạo ra tệp **`dist.zip`** (việc nén này giúp quá trình tải lên Vercel diễn ra nhanh và không bị thiếu file).

### Bước 1.2: Tải lên Vercel
1. Mở trình duyệt web và truy cập vào đường dẫn: **[https://vercel.com/deploy](https://vercel.com/deploy)**
2. Đăng nhập bằng tài khoản của bạn (Bạn có thể đăng nhập bằng tài khoản Google, GitHub hoặc email cá nhân rất nhanh chóng).
3. Sau khi đăng nhập, bạn sẽ thấy giao diện **"Deploy a new project"** (Triển khai dự án mới).
4. Bạn chỉ cần kéo tệp **`dist.zip`** mà bạn vừa nén ở Bước 1.1 và **Thả** trực tiếp vào vùng tải lên trên trang web Vercel.
5. Hệ thống sẽ tự động tải lên và triển khai. Quá trình này chỉ mất từ **5 - 10 giây**.
6. Khi hoàn thành, màn hình sẽ bắn pháo hoa kèm theo thông báo **"Congratulations!"** và cung cấp cho bạn một đường liên kết miễn phí có đuôi `.vercel.app` (Ví dụ: `j4s-dashboard.vercel.app`). Bạn có thể bấm vào đó để xem thử giao diện hoạt động ngay lập tức!

---

## PHẦN 2: Hướng Dẫn Trỏ Tên Miền Riêng Của Bạn Vào Vercel

Khi bạn đã có một tên miền riêng (Ví dụ: `j4s.vn` hoặc subdomain như `dashboard.j4s.vn`), hãy làm theo các bước sau để liên kết:

### Bước 2.1: Thêm tên miền trên Vercel
1. Tại giao diện quản lý dự án vừa tạo trên Vercel, bạn bấm vào tab **Settings** (Cài đặt) ở thanh menu trên cùng.
2. Nhìn sang danh mục bên trái, chọn mục **Domains** (Tên miền).
3. Tại ô nhập liệu **Domain**, bạn gõ tên miền của mình vào:
   * Nếu dùng tên miền chính: Gõ `j4s.vn`
   * Nếu dùng tên miền phụ (khuyên dùng nếu web chính của bạn đã chạy ở nơi khác): Gõ `dashboard.j4s.vn`
4. Nhấn nút **Add** (Thêm).
5. Vercel sẽ tự động phân tích và đưa ra hướng dẫn cấu hình DNS (các thông số để trỏ tên miền). Bạn hãy giữ nguyên tab này để sao chép thông số cấu hình ở bước tiếp theo.

### Bước 2.2: Cấu hình DNS tại nhà cung cấp tên miền của bạn
Bạn hãy mở một tab mới trên trình duyệt, đăng nhập vào trang quản trị tên miền nơi bạn đã mua (như Mắt Bão, Nhân Hòa, Tenten, Cloudflare, GoDaddy, Namecheap...) và thêm các bản ghi tương ứng:

#### LỰA CHỌN A: Nếu bạn dùng tên miền chính (Ví dụ: `j4s.vn`)
Hãy thêm 2 bản ghi sau vào bảng quản lý DNS:
1. **Bản ghi A (dành cho tên miền gốc)**:
   * **Loại (Type)**: `A`
   * **Tên (Name/Host)**: `@`
   * **Giá trị (Value/Points to)**: `76.76.21.21`
   * **TTL**: Mặc định (hoặc `3600`)
2. **Bản ghi CNAME (để hỗ trợ gõ www)**:
   * **Loại (Type)**: `CNAME`
   * **Tên (Name/Host)**: `www`
   * **Giá trị (Value/Points to)**: `cname.vercel-dns.com.`
   * **TTL**: Mặc định

#### LỰA CHỌN B: Nếu bạn dùng tên miền phụ (Ví dụ: `dashboard.j4s.vn`)
Bạn chỉ cần thêm duy nhất **1 bản ghi CNAME**:
1. **Bản ghi CNAME**:
   * **Loại (Type)**: `CNAME`
   * **Tên (Name/Host)**: `dashboard` (hoặc subdomain bất kỳ mà bạn muốn)
   * **Giá trị (Value/Points to)**: `cname.vercel-dns.com.`
   * **TTL**: Mặc định

---

## PHẦN 3: Xác Nhận Và Hoàn Tất

1. Sau khi cấu hình các bản ghi ở Bước 2.2 xong, bạn quay trở lại trang **Domains** trên Vercel và bấm nút **Refresh** (hoặc đợi khoảng 1 - 2 phút để hệ thống tự động cập nhật bản ghi DNS toàn cầu).
2. Khi các bản ghi được nhận diện chính xác, Vercel sẽ chuyển trạng thái của tên miền sang màu **Xanh lá cây (Valid)**.
3. Vercel sẽ **tự động cấp và cài đặt chứng chỉ bảo mật SSL (HTTPS)** cho tên miền của bạn hoàn toàn miễn phí.
4. Từ lúc này, bất kỳ ai cũng có thể truy cập trực tiếp vào tên miền của bạn để xem giao diện Dashboard J4S tuyệt đẹp và hoạt động mượt mà!
