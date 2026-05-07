# Tài liệu API Company

Tài liệu này hướng dẫn cách sử dụng các endpoint liên quan đến Công ty (Company) cho Frontend.

**Base URL:** `/v1/companies`

---

## 1. Lấy thông tin công ty hiện tại
Dùng để lấy profile của công ty mà người dùng hiện tại đang quản lý.

- **URL:** `/me`
- **Method:** `GET`
- **Auth:** Required (Bearer Token)
- **Roles:** `EMPLOYER`, `CANDIDATE`, `ADMIN`
- **Response:** `200 OK`
    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "Success",
      "data": {
        "id": "uuid",
        "companyName": "ABC Tech",
        "logo": "https://cloudinary.com/...",
        "website": "https://abc.com",
        "address": "123 Street",
        "industry": "IT",
        "description": {
          "vi": "Mô tả tiếng Việt",
          "en": "English description"
        },
        "status": "active",
        "isVerified": true
      }
    }
    ```

---

## 2. Lấy thông tin công ty theo ID
Lấy thông tin công khai của một công ty.

- **URL:** `/:id`
- **Method:** `GET`
- **Auth:** Optional
- **Response:** `200 OK`
    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "Success",
      "data": {
        "id": "uuid",
        "companyName": "ABC Tech",
        "logo": "...",
        "website": "...",
        "description": { ... }
      }
    }
    ```

---

## 3. Đăng ký Công ty mới
Dành cho người dùng có role `candidate` muốn nâng cấp lên `employer` bằng cách đăng ký công ty.

- **URL:** `/`
- **Method:** `POST`
- **Auth:** Required (Bearer Token)
- **Roles:** `CANDIDATE`
- **Content-Type:** `multipart/form-data`

### Body Parameters:
| Key | Type | Required | Description |
|---|---|---|---|
| `companyName` | string | Yes | Tên công ty |
| `website` | string | No | URL website |
| `address` | string | No | Địa chỉ |
| `industry` | string | No | Lĩnh vực kinh doanh |
| `description` | string (JSON) | No | VD: `{"vi": "...", "en": "..."}` |
| `logo` | File | No | Ảnh logo (jpg, png) |
| `businessLicense` | File | Yes | Giấy phép kinh doanh (pdf, jpg, png) |

---

## 4. Cập nhật Profile Công ty
Cập nhật thông tin công ty của chính mình.

- **URL:** `/me`
- **Method:** `PATCH`
- **Auth:** Required (Bearer Token)
- **Roles:** `EMPLOYER`, `ADMIN`
- **Content-Type:** `multipart/form-data`

### Body Parameters:
Giống với endpoint Đăng ký, nhưng tất cả các trường đều là Optional.

| Key | Type | Description |
|---|---|---|
| `companyName` | string | Tên công ty |
| `website` | string | URL website |
| `description` | string (JSON) | VD: `{"vi": "...", "en": "..."}` |
| `logo` | File | Cập nhật logo mới |
| `businessLicense` | File | Cập nhật giấy phép mới |

---

## Lưu ý chung

1. **i18n cho trường `description`**: 
   - Khi gửi qua `multipart/form-data`, trường `description` phải là một chuỗi JSON hợp lệ.
   - Ví dụ: `formData.append('description', JSON.stringify({ vi: '...', en: '...' }))`.

2. **Xử lý File**:
   - Backend sử dụng Cloudinary để lưu trữ.
   - `logo` và `businessLicense` sẽ được trả về dưới dạng URL tuyệt đối.

3. **Phản hồi Lỗi**:
   - Tuân theo cấu trúc lỗi chuẩn của hệ thống:
     ```json
     {
       "success": false,
       "statusCode": 400,
       "message": "Validation failed",
       "errors": {
         "companyName": ["companyName should not be empty"]
       }
     }
     ```
