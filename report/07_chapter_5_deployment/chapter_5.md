# CHƯƠNG V: KẾ HOẠCH TRIỂN KHAI VÀ HƯỚNG DẪN CÀI ĐẶT (DEPLOYMENT PLAN & SETUP GUIDE)

---

## 1. MÔI TRƯỜNG VÀ CHIẾN LƯỢC TRIỂN KHAI

Để đảm bảo khả năng vận hành ổn định từ môi trường phát triển (Development) đến khi đưa sản phẩm vào khai thác thực tế (Production), hệ thống **VAMOS STORE** được hoạch định theo hai kịch bản rõ ràng:

1. **Kịch bản A: Cài đặt và vận hành Local / Docker (Cấu hình đã kiểm tra, chưa xác minh triển khai thực tế).** Toàn bộ file Dockerfile và docker-compose.yml đã được rà soát cú pháp chuẩn mực kết nối Node.js và SQL Server 2022; trên môi trường máy chủ thực tế cần kích hoạt Docker daemon để khởi chạy.
2. **Kịch bản B (Kế hoạch đề xuất vận hành thực tế): Triển khai Production trên Cloud VPS & Tên miền.** Kế hoạch chi tiết phục vụ giai đoạn thương mại hóa: thuê máy chủ ảo riêng (Ubuntu Linux LTS), thiết lập quản lý tiến trình PM2, cấu hình máy chủ web Nginx làm Reverse Proxy và cài đặt chứng chỉ bảo mật SSL Let's Encrypt.

---

## 2. KỊCH BẢN A: CÀI ĐẶT VÀ VẬN HÀNH LOCAL / DOCKER (CẤU HÌNH ĐÃ KIỂM TRA, CHƯA XÁC MINH TRIỂN KHAI THỰC TẾ)

### 2.1. Yêu cầu hệ thống tối thiểu

* **Hệ điều hành:** Windows 10/11 (hỗ trợ WSL2), macOS, hoặc Ubuntu Linux 20.04+.
* **Phần mềm cần cài đặt:**
  * Node.js phiên bản LTS v20.x hoặc v22.x/v24.x (kèm npm).
  * Docker Desktop (hỗ trợ Docker Compose v2+).
  * Trình điều khiển cơ sở dữ liệu: Azure Data Studio hoặc SQL Server Management Studio (SSMS).

### 2.2. Đóng gói ứng dụng với Dockerfile

File `Dockerfile` tại thư mục gốc của dự án chịu trách nhiệm đóng gói ứng dụng Node.js:

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
CMD ["node", "server.js"]
```

### 2.3. Cấu hình điều phối với Docker Compose

File `docker-compose.yml` liên kết hai dịch vụ chính: `app` (Node.js App) và `mssql` (SQL Server 2022):

```yaml
version: "3.8"

services:
  # 1. Dịch vụ Cơ sở dữ liệu Microsoft SQL Server 2022
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: vamos_store_mssql
    restart: always
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "${DB_PASSWORD:-YourStrongPassword123!}"
      MSSQL_PID: "Developer"
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql
    networks:
      - vamos_network

  # 2. Dịch vụ Ứng dụng Web Node.js
  app:
    build: .
    container_name: vamos_store_app
    restart: always
    depends_on:
      - mssql
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_SERVER: mssql
      DB_PORT: 1433
      DB_USER: sa
      DB_PASSWORD: "${DB_PASSWORD:-YourStrongPassword123!}"
      DB_NAME: vamos_store_db
      DB_TRUST_SERVER_CERTIFICATE: "true"
      SESSION_SECRET: "${SESSION_SECRET:-YourSecureRandomSessionSecretKey32CharsMin}"
    ports:
      - "3000:3000"
    networks:
      - vamos_network

volumes:
  mssql_data:

networks:
  vamos_network:
    driver: bridge
```

### 2.4. Quy trình khởi chạy và nạp dữ liệu Local

```bash
# Bước 1: Khởi động container CSDL SQL Server 2022
docker-compose up -d mssql

# Bước 2: Kiểm tra trạng thái container đang chạy
docker ps

# Bước 3: Khởi tạo bảng CSDL và nạp dữ liệu mẫu hạt giống (seed data)
node database/init_mssql.js

# Bước 4: Khởi động ứng dụng Node.js tại local
npm start
# Ứng dụng sẽ lắng nghe tại: http://localhost:3000
```

---

## 3. KỊCH BẢN B: KẾ HOẠCH TRIỂN KHAI PRODUCTION TRÊN CLOUD VPS & TÊN MIỀN

Dưới đây là kế hoạch chi tiết từng bước được đề xuất để đưa hệ thống VAMOS STORE lên môi trường Internet khi triển khai kinh doanh chính thức:

### 3.1. Đăng ký Tên miền và Thiết lập Bản ghi DNS

- **Bước 1:** Đăng ký tên miền thương hiệu (ví dụ: `vamosstore.shop` hoặc `vamos-footwear.vn`) tại nhà cung cấp tên miền (Inet, Namecheap, v.v.).
- **Bước 2:** Cấu hình trỏ bản ghi A (Address Record) từ tên miền về địa chỉ IP Public của máy chủ Cloud VPS:
  * Host `@` $\rightarrow$ Points to: `<IP_ADDRESS_VPS>`
  * Host `www` $\rightarrow$ Points to: `<IP_ADDRESS_VPS>`

### 3.2. Cấu hình Máy chủ ảo Cloud VPS (Ubuntu Linux)

- **Bước 1:** Thuê máy chủ Cloud VPS chạy Ubuntu 22.04 LTS (cấu hình tối thiểu: 2 vCPU, 4GB RAM, 40GB SSD để đáp ứng Microsoft SQL Server on Linux).
- **Bước 2:** Kết nối SSH bảo mật và cập nhật hệ điều hành:
  ```bash
  ssh deploy@<IP_ADDRESS_VPS>
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y ufw curl git
  ```
- **Bước 3:** Cấu hình tường lửa bảo vệ máy chủ (chỉ mở các cổng cần thiết):
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp    # Cổng SSH
  sudo ufw allow 80/tcp    # Cổng HTTP
  sudo ufw allow 443/tcp   # Cổng HTTPS
  sudo ufw enable
  ```
- **Bước 4:** Cài đặt Node.js LTS và trình quản lý tiến trình PM2:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  sudo npm install -g pm2
  ```

### 3.3. Cài đặt CSDL Microsoft SQL Server 2022 on Linux

Triển khai Microsoft SQL Server 2022 qua container Docker chuyên dụng để cô lập tài nguyên:

```bash
docker run -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=<STRONG_PRODUCTION_PASSWORD>" \
  -p 1433:1433 \
  --name vamos_mssql_prod \
  --restart always \
  -v /var/opt/mssql_prod:/var/opt/mssql \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

### 3.4. Triển khai Ứng dụng Web bằng PM2

- **Bước 1:** Clone mã nguồn dự án vào thư mục `/var/www/vamos-store`:
  ```bash
  cd /var/www
  git clone <REPO_URL> vamos-store
  cd vamos-store
  npm install --production
  npm run build:css
  ```
- **Bước 2:** Tạo file biến môi trường bảo mật `.env` (không lưu mật khẩu trong git):
  ```bash
  cat <<EOT >> .env
  NODE_ENV=production
  PORT=3000
  APP_URL=https://vamosstore.shop
  DB_SERVER=127.0.0.1
  DB_PORT=1433
  DB_USER=sa
  DB_PASSWORD=<STRONG_PRODUCTION_PASSWORD>
  DB_NAME=vamos_store_db
  DB_ENCRYPT=false
  DB_TRUST_SERVER_CERTIFICATE=true
  SESSION_SECRET=<RANDOM_GENERATED_32_CHAR_SECRET>
  EOT
  ```
- **Bước 3:** Nạp schema và khởi động tiến trình bằng PM2:
  ```bash
  node database/init_mssql.js
  pm2 start server.js --name "vamos-store"
  pm2 save
  pm2 startup systemd
  ```

### 3.5. Cấu hình Reverse Proxy Nginx và Chứng chỉ SSL Let's Encrypt

- **Bước 1:** Cài đặt máy chủ web Nginx:
  ```bash
  sudo apt install -y nginx
  ```
- **Bước 2:** Cấu hình Virtual Host `/etc/nginx/sites-available/vamosstore.shop`:
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
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```
- **Bước 3:** Kích hoạt Virtual Host và kiểm tra cấu hình:
  ```bash
  sudo ln -s /etc/nginx/sites-available/vamosstore.shop /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl restart nginx
  ```
- **Bước 4:** Cài đặt chứng chỉ SSL tự động gia hạn với Certbot:
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d vamosstore.shop -d www.vamosstore.shop
  ```

### 3.6. Đánh giá tính khả thi và an toàn sau triển khai

Kế hoạch triển khai Kịch bản B đảm bảo hệ thống đạt tính sẵn sàng cao (High Availability), bảo mật toàn diện với HTTPS/SSL mã hóa đường truyền, cô lập tài khoản cơ sở dữ liệu và tự động phục hồi dịch vụ sau sự cố khởi động lại máy chủ nhờ PM2 daemon.
