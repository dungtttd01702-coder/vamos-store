# CHƯƠNG V: TRIỂN KHAI HỆ THỐNG (SYSTEM DEPLOYMENT)

---

## 1. MÔI TRƯỜNG VÀ CHIẾN LƯỢC TRIỂN KHAI

Để đưa hệ thống website thương mại điện tử **VAMOS STORE** từ môi trường phát triển (Development) lên môi trường vận hành thực tế (Production), hệ thống được thiết kế theo hai phương án triển khai linh hoạt:

1. **Phương án 1 (Khuyến nghị chuẩn hóa): Triển khai Container hóa bằng Docker & Docker Compose.** Toàn bộ ứng dụng Node.js và cơ sở dữ liệu MySQL 8.0 được đóng gói thành các container độc lập, tự động liên kết mạng nội bộ và ánh xạ dữ liệu ra ổ cứng ngoài (Docker Volume).
2. **Phương án 2 (Mô hình máy chủ đám mây Cloud VPS & Tên miền theo chuẩn đồ án):** Thuê máy chủ ảo riêng (Virtual Private Server - VPS) chạy hệ điều hành Ubuntu Linux, kết hợp với tên miền quốc tế và máy chủ web Nginx làm Reverse Proxy.

---

## 2. TRIỂN KHAI VỚI DOCKER & DOCKER COMPOSE

### 2.1. Xây dựng Dockerfile cho ứng dụng Node.js

File `Dockerfile` đặt tại thư mục gốc của dự án, chịu trách nhiệm đóng gói mã nguồn và môi trường Node.js:

```dockerfile
# Sử dụng base image Node.js LTS chính thức
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install --production

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Biên dịch stylesheet Tailwind CSS cho production
RUN npm run build:css

# Mở cổng 3000 cho ứng dụng
EXPOSE 3000

# Lệnh khởi chạy ứng dụng chính thức
CMD ["node", "src/app.js"]
```

### 2.2. Cấu hình điều phối với Docker Compose

File `docker-compose.yml` liên kết hai dịch vụ chính: `web` (Node.js App) và `db` (MySQL 8.0):

```yaml
version: "3.8"

services:
  # 1. Dịch vụ Cơ sở dữ liệu MySQL 8.0
  db:
    image: mysql:8.0
    container_name: vamos_mysql_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: RootSecurePassword2026!
      MYSQL_DATABASE: vamos_store_db
      MYSQL_USER: vamos_user
      MYSQL_PASSWORD: VamosPassword2026!
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - vamos_network

  # 2. Dịch vụ Ứng dụng Web Node.js
  web:
    build: .
    container_name: vamos_web_app
    restart: always
    depends_on:
      - db
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: db
      DB_PORT: 3306
      DB_USER: vamos_user
      DB_PASSWORD: VamosPassword2026!
      DB_NAME: vamos_store_db
      SESSION_SECRET: VamosSuperSecretKey2026!
    ports:
      - "3000:3000"
    networks:
      - vamos_network

volumes:
  mysql_data:

networks:
  vamos_network:
    driver: bridge
```

### 2.3. Lệnh khởi chạy và xác nhận hoạt động

Để khởi chạy toàn bộ hệ thống trên bất kỳ máy chủ nào đã cài đặt Docker:

```bash
# Khởi động toàn bộ các dịch vụ dưới dạng chạy ngầm (detached mode)
docker-compose up -d --build

# Kiểm tra trạng thái hoạt động của các container
docker-compose ps

# Xem nhật ký khởi động để đảm bảo kết nối CSDL thành công
docker-compose logs -f web
```

---

## 3. QUY TRÌNH TRIỂN KHAI TRÊN CLOUD VPS & TÊN MIỀN

_(Quy trình triển khai từng bước chi tiết theo chuẩn mẫu đồ án thực tế)._

### 3.1. Đăng ký Tên miền (Domain Registration)

- **Bước 1:** Truy cập vào nhà cung cấp dịch vụ tên miền (ví dụ: Hostinger, Namecheap hoặc Inet).
- **Bước 2:** Nhập tên miền thương hiệu mong muốn (ví dụ: `vamosstore.shop` hoặc `vamos-footwear.vn`) và tiến hành thanh toán kích hoạt.
- **Bước 3:** Truy cập Bảng điều khiển quản lý DNS (DNS Management) để chuẩn bị trỏ bản ghi về địa chỉ IP của máy chủ VPS.

### 3.2. Cấu hình Máy chủ ảo Cloud VPS (Ubuntu Linux)

- **Bước 1:** Khởi tạo Cloud VPS chạy hệ điều hành Ubuntu 22.04 LTS (RAM tối thiểu 2GB, 1 vCPU, 25GB SSD).
- **Bước 2:** Kết nối SSH vào máy chủ từ xa thông qua terminal hoặc Visual Studio Code Remote-SSH:
  ```bash
  ssh root@<IP_ADDRESS_VPS>
  ```
- **Bước 3:** Cập nhật các gói phần mềm hệ điều hành và bật tường lửa UFW:
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y ufw curl git
  sudo ufw allow OpenSSH
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- **Bước 4:** Cài đặt Node.js LTS, trình quản lý tiến trình PM2 và Git:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  sudo npm install -g pm2
  ```

### 3.3. Cài đặt và cấu hình Cơ sở dữ liệu MySQL 8.0

- **Bước 1:** Cài đặt MySQL Server trên Ubuntu:
  ```bash
  sudo apt install -y mysql-server
  sudo systemctl start mysql
  sudo systemctl enable mysql
  ```
- **Bước 2:** Tạo cơ sở dữ liệu `vamos_store_db` và tạo user truy cập:
  ```sql
  CREATE DATABASE vamos_store_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'vamos_user'@'localhost' IDENTIFIED BY 'VamosPassword2026!';
  GRANT ALL PRIVILEGES ON vamos_store_db.* TO 'vamos_user'@'localhost';
  FLUSH PRIVILEGES;
  EXIT;
  ```
- **Bước 3:** Nạp kịch bản cơ sở dữ liệu `schema.sql`:
  ```bash
  mysql -u vamos_user -p vamos_store_db < database/schema.sql
  ```

### 3.4. Triển khai mã nguồn và Quản lý tiến trình bằng PM2

- **Bước 1:** Clone mã nguồn dự án từ repository GitHub về thư mục `/var/www/vamos-store`:
  ```bash
  cd /var/www
  git clone https://github.com/dungtttd01702-coder/vamos-store.git
  cd vamos-store
  npm install --production
  ```
- **Bước 2:** Tạo file biến môi trường bảo mật `.env`:
  ```bash
  cat <<EOT >> .env
  NODE_ENV=production
  PORT=3000
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=vamos_user
  DB_PASSWORD=VamosPassword2026!
  DB_NAME=vamos_store_db
  SESSION_SECRET=A_Very_Long_Random_Secret_String_2026
  EOT
  ```
- **Bước 3:** Khởi động ứng dụng bằng PM2 và cấu hình tự động bật khi máy chủ reboot:
  ```bash
  pm2 start src/app.js --name "vamos-store"
  pm2 save
  pm2 startup systemd
  ```

### 3.5. Cấu hình Reverse Proxy Nginx và Chứng chỉ bảo mật SSL (HTTPS)

- **Bước 1:** Cài đặt máy chủ web Nginx:
  ```bash
  sudo apt install -y nginx
  ```
- **Bước 2:** Cấu hình file Virtual Host Nginx trỏ cổng 80 vào ứng dụng Node.js chạy tại cổng 3000:

  ```nginx
  server {
      listen 80;
      server_name vamosstore.shop www.vamosstore.shop;

      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      }
  }
  ```

- **Bước 3:** Kiểm tra cấu hình và khởi động lại Nginx:
  ```bash
  sudo nginx -t
  sudo systemctl restart nginx
  ```
- **Bước 4:** Cài đặt chứng chỉ SSL miễn phí Let's Encrypt qua Certbot:
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d vamosstore.shop -d www.vamosstore.shop
  ```

### 3.6. Kết quả sau triển khai

Hệ thống VAMOS STORE sau khi hoàn tất các bước trên sẽ hoạt động chính thức trên môi trường Internet tại giao thức bảo mật `https://vamosstore.shop`, kết nối ổn định, dữ liệu phân lớp an toàn và tự động phục hồi khi máy chủ khởi động lại.
