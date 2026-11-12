# TÍCH HỢP DBEAVER & DATABASE DIAGRAM (VAMOS STORE)

Thư mục này chứa toàn bộ cấu hình dự án, profile kết nối và sơ đồ quan hệ thực thể (ERD Diagram) được tích hợp sẵn cho phần mềm quản trị cơ sở dữ liệu **DBeaver**.

---

## 1. THÔNG TIN KẾT NỐI TỰ ĐỘNG (PRE-CONFIGURED)

Hệ thống đã cấu hình sẵn 2 kết nối kết nối trực tiếp đến Microsoft SQL Server:

1. **vamos_store_db (Development):**
   - **Host:** `127.0.0.1` | **Port:** `1433`
   - **Database:** `vamos_store_db`
   - **User:** `sa`
   - **Driver:** Microsoft JDBC Driver for SQL Server
   - **Trust Server Certificate:** `true`

2. **vamos_store_test_db (Test):**
   - **Host:** `127.0.0.1` | **Port:** `1433`
   - **Database:** `vamos_store_test_db`
   - **User:** `sa`
   - **Driver:** Microsoft JDBC Driver for SQL Server
   - **Trust Server Certificate:** `true`

---

## 2. CÁCH MỞ VÀ XEM SƠ ĐỒ DIAGRAM TRONG DBEAVER

### Cách 1: Khởi động 1-Click bằng file Script
- Nhấp đúp chuột vào file `database/dbeaver/open_dbeaver.bat` (hoặc chạy lệnh `.\database\dbeaver\open_dbeaver.ps1` trong PowerShell).
- DBeaver sẽ tự động mở lên với đường dẫn dự án VAMOS STORE.

### Cách 2: Mở trực tiếp từ DBeaver
1. Mở phần mềm **DBeaver Community** (đã được cài đặt tại `C:\Users\Admin\AppData\Local\DBeaver\dbeaver.exe`).
2. Trên thanh menu, chọn **File** → **Open Projects from File System...** (hoặc **Project** → **Import Project**).
3. Chọn thư mục gốc của dự án: `c:\Users\Admin\Desktop\dự án JAV`.
4. Trong cửa sổ **Project Navigator** bên trái:
   - Mục **Connections**: Đã có sẵn 2 kết nối `vamos_store_db` và `vamos_store_test_db`.
   - Mục **Diagrams / Sơ đồ**: Nhấp đúp vào file `vamos_store_erd.erd` để mở giao diện sơ đồ quan hệ 18 bảng trực quan.

---

## 3. TÍNH NĂNG CỦA SƠ ĐỒ DBEAVER ERD
- **Hiển thị trực quan toàn bộ 18 bảng:** Khóa chính (PK), Khóa ngoại (FK), các trường dữ liệu và kiểu dữ liệu (NVARCHAR, INT, DECIMAL, BIT, DATETIME2...).
- **Đường nối quan hệ ràng buộc:** Mối liên kết 1-N giữa Users, Categories, Brands, Products, Variants, Carts, Orders, Vouchers...
- **Xuất ảnh chất lượng cao:** Có thể nhấp chuột phải vào Diagram trong DBeaver → chọn **Export Diagram** → xuất định dạng PNG, SVG, PDF hoặc in trực tiếp.
