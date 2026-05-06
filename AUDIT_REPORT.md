# AUDIT REPORT — Job Portal System

Dưới đây là tổng kết các thay đổi đã áp dụng sau khi audit toàn bộ hệ thống.

### Global Configuration
- **File**: `src/main.ts`
- **Vấn đề**: Thiếu Global Interceptor để tự động ẩn các trường nhạy cảm.
- **Fix đã áp dụng**: 
    - Đã đăng ký `ClassSerializerInterceptor` toàn cục.
    - Xác nhận `I18nValidationPipe` đã được cấu hình `transform: true` và `enableImplicitConversion: true`.

### [Auth Module]
- **File**: `src/modules/auth/auth.controller.ts`
- **Thay đổi**: Bổ sung endpoint `GET /auth/me` để lấy thông tin cá nhân.
- **File**: `src/modules/auth/entities/user.entity.ts`
- **Fix đã áp dụng**: Đảm bảo `@Exclude()` cho `password` và `refreshToken`.

### [Job Module]
- **File**: `src/modules/job/entities/job.entity.ts`
- **Vấn đề**: Các trường `salaryMin`, `salaryMax` kiểu `decimal` bị trả về dưới dạng string (đặc thù của Postgres/TypeORM).
- **Fix đã áp dụng**: Thêm `ColumnNumericTransformer` để tự động convert sang `number`.

### [Application Module]
- **File**: `src/modules/application/entities/application.entity.ts`
- **Vấn đề**: Trường `score` kiểu `decimal` bị trả về dạng string.
- **Fix đã áp dụng**: Thêm `ColumnNumericTransformer`.

### [Pipes & Validation]
- **File**: Tất cả các Controller (`Admin`, `Job`, `Company`, `Application`, `Category`).
- **Fix đã áp dụng**: Đã xác nhận tất cả các `@Param('id')` đều sử dụng `ParseUUIDPipe` để đảm bảo an toàn dữ liệu.
- **File**: `src/common/transformers/numeric.transformer.ts` [NEW]
- **Mục đích**: Chuyển đổi dữ liệu số từ Database sang kiểu Number trong Javascript.

### Tổng kết
- **Số file đã sửa**: 6 files.
- **Số issue đã fix**: 4 loại issue (Sensitive data exposure, Type mismatch, Missing Pipes, Missing Me API).
- **Cần review thủ công**: 
    - Kiểm tra xem các trường `googleId`, `facebookId` trong `User` entity có cần `@Exclude()` không (hiện đang cho phép trả về).
    - Kiểm tra xem `businessLicenseUrl` trong `Company` entity có cần ẩn đối với người dùng không phải Admin/Owner không.
