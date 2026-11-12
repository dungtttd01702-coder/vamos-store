# VAMOS STORE — STITCH DESIGN TOKENS SPECIFICATION
**Hệ thống thiết kế:** Antigravity Design Protocol / Google Stitch System  
**Phiên bản:** v2.0 Production Tokens  
**Tương thích:** Tailwind CSS v3, PostCSS, Google Fonts (`Space Grotesk`, `Be Vietnam Pro`)

---

## 1. HỆ THỐNG MÀU SẮC (COLOR PALETTE)

### 1.1. Brand Primary & Accent Colors (Kinetic Red 10%)
| Token Name | Hex Code | Ứng Dụng |
|---|---|---|
| `primary-container` | `#E11B22` | Màu chủ đạo nhận diện VAMOS, nút CTA chuyển đổi cao, badge ưu đãi |
| `primary` | `#B70013` | Trạng thái hover của nút chính, viền active, điểm nhấn biểu tượng |
| `on-primary` | `#FFFFFF` | Chữ và icon hiển thị trên nền `primary` hoặc `primary-container` |
| `primary-fixed` | `#FFDAD6` | Nền nhạt cho tag trạng thái, badge thông báo nhẹ |
| `primary-fixed-dim` | `#FFB4AB` | Viền nhạt hoặc trạng thái focus phụ |

### 1.2. Dark Carbon & Surface Structure (Dark 30%)
| Token Name | Hex Code | Ứng Dụng |
|---|---|---|
| `on-surface` | `#0B1C30` | Màu chữ chính (Heading, Body Text), Sidebar Admin (#111111), Footer |
| `inverse-surface` | `#213145` | Nền Top Announcement Bar, Tooltip, Khối tương phản cao |
| `surface-container-lowest`| `#FFFFFF` | Nền Card sản phẩm, Khung nhập liệu, Hộp tóm tắt đơn hàng |
| `surface` / `background` | `#F8F9FF` | Nền trang tổng thể (60% Off-white hiện đại, sạch sẽ) |
| `surface-container-low` | `#EFF4FF` | Nền các khối phụ, dải thông báo phụ, ô tìm kiếm |
| `surface-container` | `#E5EEFF` | Nền phân cách, dải trạng thái |
| `surface-container-high` | `#DCE9FF` | Viền hover, dải tab không kích hoạt |
| `surface-container-highest`| `#D3E4FE` | Đường kẻ viền chia cắt (`border`), đường ngăn cách bảng |

### 1.3. Secondary & Neutral Accent Colors
| Token Name | Hex Code | Ứng Dụng |
|---|---|---|
| `secondary` | `#3C5BA9` | Text phụ, mô tả ngắn, nhãn trường nhập liệu |
| `secondary-container` | `#8EABFF` | Nền icon, badge thông tin hệ thống |
| `outline` | `#926E6B` | Viền các nút outline, đường viền thứ cấp |
| `outline-variant` | `#E7BDB8` | Viền phụ mờ |

### 1.4. Semantic Feedback Colors (Thành công, Cảnh báo, Lỗi)
| Trạng thái | Nền Badge | Viền / Chữ | Ý nghĩa |
|---|---|---|---|
| **Success / Active** | `#DCFCE7` (emerald-100) | `#166534` (emerald-800) | Đơn hàng hoàn thành, hàng có sẵn, voucher hợp lệ |
| **Warning / Pending** | `#FEF3C7` (amber-100) | `#92400E` (amber-800) | Đơn hàng chờ duyệt (PENDING), sắp hết hàng |
| **Error / Cancelled** | `#FEE2E2` (red-100) | `#991B1B` (red-800) | Đơn hàng đã hủy (CANCELLED), lỗi validate, hết hàng |
| **Processing / Ship** | `#DBEAFE` (blue-100) | `#1E40AF` (blue-800) | Đơn đang đóng gói hoặc đang vận chuyển |

---

## 2. HỆ THỐNG TYPOGRAPHY

### 2.1. Phông chữ Chuẩn hóa
1. **Tiêu đề & Nhãn thương hiệu (`fontFamily.headline` / `fontFamily.display`):**
   - Phông: `'Space Grotesk', sans-serif`
   - Đặc tính: Hiện đại, thể thao, năng động, tracking hẹp nhẹ (`-0.01em` đến `-0.03em`).
2. **Nội dung văn bản & Nhãn nhập liệu (`fontFamily.body` / `fontFamily.label`):**
   - Phông: `'Be Vietnam Pro', sans-serif`
   - Đặc tính: Tối ưu đọc tiếng Việt có dấu, khoảng cách ký tự thoáng, rõ ràng trên mọi màn hình.

### 2.2. Bảng Phân cấp Kích thước & Trọng lượng (Type Scale)
| Token Name | Font Size | Line Height | Letter Spacing | Font Weight | Ứng Dụng |
|---|---|---|---|---|---|
| `display-hero` | 56px | 64px | -0.03em | 700 (Bold) | Hero Banner trang chủ, Giá tổng thanh toán lớn |
| `display-hero-mobile` | 36px | 44px | -0.02em | 700 (Bold) | Hero Banner trên điện thoại di động |
| `headline-xl` | 40px | 48px | -0.02em | 700 (Bold) | Tiêu đề trang chính, số liệu KPI lớn |
| `headline-lg` | 28px | 36px | -0.015em | 600 (Semibold) | Tiêu đề phân mục, tên trang quản trị |
| `headline-md` | 22px | 28px | -0.01em | 600 (Semibold) | Tên mục giỏ hàng, tiêu đề modal, tên sản phẩm |
| `headline-sm` | 18px | 24px | 0em | 600 (Semibold) | Tên sản phẩm trên card, tiêu đề bảng con |
| `body-lg` | 18px | 28px | 0em | 400 (Regular) | Đoạn văn mở đầu, mô tả giới thiệu |
| `body-md` | 15px | 22px | 0em | 400 (Regular) | Nội dung chính, chi tiết bảng dữ liệu |
| `body-sm` | 13px | 18px | 0em | 400 (Regular) | Mô tả phụ, hướng dẫn trường nhập liệu |
| `label-lg` | 14px | 20px | 0.01em | 600 (Semibold) | Nút bấm chính, tab điều hướng |
| `label-md` | 12px | 16px | 0.02em | 600 (Semibold) | Nhãn trường form, breadcrumb |
| `label-badge` | 11px | 14px | 0.05em | 700 (Bold) | Tag trạng thái, mã đơn hàng, badge phân loại |
| `price-lg` | 20px | 24px | -0.01em | 700 (Bold) | Giá tiền nổi bật tại trang chi tiết / giỏ hàng |
| `price-md` | 16px | 20px | -0.01em | 700 (Bold) | Giá tiền trong bảng đơn hàng, danh sách phụ |

---

## 3. BO GÓC & BÓNG ĐỔ (RADIUS & SHADOWS)

- **Bo góc (`borderRadius`):**
  - Nhỏ (`DEFAULT`): `4px` - Badge mini, tag nhỏ.
  - Vừa (`lg`): `8px` - Nút bấm (`button`), ô nhập liệu (`input`), select.
  - Lớn (`xl`): `12px` - Card sản phẩm, hộp tóm tắt giỏ hàng, bảng dữ liệu.
  - Rất lớn (`2xl`): `16px` - Banner quảng cáo, Drawer giỏ hàng, Modal.
  - Tròn tuyệt đối (`full`): `9999px` - Nút tròn icon, badge số lượng, avatar.
- **Bóng đổ (`boxShadow`):**
  - `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
  - `shadow-vamos-cta`: `0 10px 25px -5px rgba(225, 27, 34, 0.4), 0 8px 10px -6px rgba(225, 27, 34, 0.2)`

