# TÀI LIỆU API & ENDPOINTS HỆ THỐNG VAMOS CLUB
## REST API & Web Endpoints Documentation

---

## 1. DANH SÁCH ENDPOINTS

| STT | Phương Thức | Đường Dẫn (Route) | Middleware Bảo Vệ | Mô Tả Chức Năng |
| :---: | :---: | :--- | :--- | :--- |
| 1 | `GET` | `/account/rewards` | `requireCustomer` | Trang Trung tâm đổi thưởng & Quản lý ví điểm VAMOS Club. |
| 2 | `POST` | `/account/rewards/redeem` | `requireCustomer`, `verifyCsrf` | Thực hiện đổi điểm lấy voucher cá nhân (JSON/HTML). |
| 3 | `GET` | `/account/orders/:orderId/review-status` | `requireCustomer` | Lấy danh sách sản phẩm đủ điều kiện đánh giá trong đơn hàng. |
| 4 | `POST` | `/account/orders/:orderId/reviews` | `requireCustomer`, `verifyCsrf`, `upload.array('media', 5)` | Gửi đánh giá sản phẩm kèm ảnh và nhận điểm thưởng. |
| 5 | `GET` | `/api/products/:productId/reviews` | Public | Lấy danh sách đánh giá công khai và thống kê sao của sản phẩm. |

---

## 2. CHI TIẾT TỪNG ENDPOINT

### 2.1. Đổi Điểm Lấy Voucher Cá Nhân
- **Endpoint:** `POST /account/rewards/redeem`
- **Headers:** `Content-Type: application/json` hoặc `application/x-www-form-urlencoded`
- **Yêu cầu bảo mật:** Bắt buộc đăng nhập (`requireCustomer`) và có mã token CSRF (`_csrf`).
- **Request Body:**
  ```json
  {
    "reward_rule_id": 1,
    "_csrf": "f8a9e2c4b1..."
  }
  ```
- **Response Thành Công (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Đổi voucher thành công!",
    "voucherCode": "VAMOSCLUB-8F2A1C",
    "pointsSpent": 500,
    "balanceAfter": 1200,
    "expiresInDays": 30
  }
  ```
- **Response Lỗi (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Số dư điểm không đủ. Bạn đang có 200 điểm, cần 500 điểm để đổi phần thưởng này."
  }
  ```

---

### 2.2. Kiểm Tra Trạng Thái Đánh Giá Sản Phẩm Trong Đơn Hàng
- **Endpoint:** `GET /account/orders/:orderId/review-status`
- **Mục đích:** Cung cấp dữ liệu động cho Modal đánh giá sản phẩm tại trang Đơn hàng của tôi (`/account/orders`).
- **Response Thành Công (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "order": {
      "id": 105,
      "order_code": "VAM261121-1234",
      "order_status": "COMPLETED"
    },
    "isCompleted": true,
    "items": [
      {
        "product_id": 1,
        "product_name": "VAMOS Classic Runner",
        "product_slug": "vamos-classic-runner",
        "image_url": "/images/products/classic-runner.png",
        "size_snapshot": "41",
        "color_snapshot": "Đen",
        "unit_price": 650000,
        "has_reviewed": false
      }
    ]
  }
  ```

---

### 2.3. Gửi Đánh Giá Sản Phẩm & Nhận Điểm Thưởng
- **Endpoint:** `POST /account/orders/:orderId/reviews`
- **Content-Type:** `multipart/form-data`
- **Form Data Fields:**
  * `product_id`: `1` (bắt buộc, integer)
  * `rating`: `5` (bắt buộc, 1-5 sao)
  * `comment`: `"Giày đi rất êm chân, form dáng chuẩn đẹp, giao hàng cực nhanh!"` (tùy chọn)
  * `quick_tags`: `["Vừa vặn chuẩn size", "Đế Phylon cực êm"]` (JSON string hoặc array)
  * `media`: Tệp ảnh đính kèm (tối đa 5 tệp, JPG/PNG/WEBP, mỗi tệp <= 5MB)
  * `_csrf`: Mã token CSRF hợp lệ
- **Response Thành Công (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "reviewId": 42,
    "pointsEarned": 300,
    "newBalance": 800,
    "tierCode": "MEMBER",
    "message": "Đánh giá thành công! Bạn đã nhận được +300 điểm VAMOS Club."
  }
  ```
- **Response Lỗi Trùng Lặp (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng rồi. Mỗi sản phẩm trong một đơn hàng chỉ được nhận thưởng đánh giá 1 lần."
  }
  ```

---

### 2.4. Lấy Đánh Giá Công Khai Cho Trang Chi Tiết Sản Phẩm
- **Endpoint:** `GET /api/products/:productId/reviews`
- **Public Endpoint:** Không yêu cầu đăng nhập.
- **Response Thành Công (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "summary": {
      "avgRating": 4.8,
      "totalReviews": 15,
      "starCounts": { "1": 0, "2": 0, "3": 1, "4": 2, "5": 12 },
      "starPercentages": { "1": 0, "2": 0, "3": 7, "4": 13, "5": 80 }
    },
    "reviews": [
      {
        "id": 1,
        "full_name": "Nguyễn Văn A",
        "rating": 5,
        "comment": "Giày đi rất êm và nhẹ!",
        "quick_tags": "[\"Vừa vặn chuẩn size\",\"Đế Phylon cực êm\"]",
        "points_earned": 300,
        "created_at": "2026-11-21T08:30:00.000Z",
        "media": [
          {
            "id": 10,
            "media_url": "/uploads/reviews/8f1c2b3a.jpg"
          }
        ]
      }
    ]
  }
  ```
