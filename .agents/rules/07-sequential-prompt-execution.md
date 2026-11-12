---
trigger: always_on
description: "Quy tắc xử lý tuần tự hàng đợi prompt khi người dùng gửi nhiều tin nhắn liên tiếp (FIFO Execution)"
---
# Sequential Prompt Execution & FIFO Queue Handling

## Nguyên tắc hoạt động cốt lõi:
Khi người dùng gửi một yêu cầu (prompt) và tiếp tục gửi thêm các prompt khác trong lúc Agent đang xử lý (User-queued messages):

1. **Tuyệt đối không bỏ dở Task trước (Do not interrupt current task):**
   - Agent phải tập trung hoàn thành 100% mục tiêu, logic, sửa code và kiểm thử (test/verification) của Prompt đầu tiên đang chạy.
   - Không được dừng ngang turn hoặc bỏ qua các tiêu chí chất lượng của Task trước.

2. **Tự động chuyển tiếp liền mạch sang Prompt tiếp theo (Seamless Auto-continuation):**
   - Ngay khi hoàn thành trọn vẹn Task trước, Agent tự động đọc nội dung của Prompt tiếp theo trong hàng đợi (queued message).
   - Tự động bắt tay vào phân tích và thực thi ngay lập tức mà không cần người dùng phải gửi lại hay nhắc nhở.

3. **Báo cáo phân định rõ ràng (Structured Multi-task Reporting):**
   - Trong phản hồi cuối cùng, phân định mạch lạc hai phần:
     - **[PHẦN 1 - HOÀN TẤT TASK TRƯỚC]:** Tóm tắt kết quả xử lý, file thay đổi, kết quả test thực tế.
     - **[PHẦN 2 - TIẾP TỤC TASK SAU]:** Tiến trình thực hiện và kết quả của prompt kế tiếp.
