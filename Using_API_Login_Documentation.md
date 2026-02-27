# Login API Documentation

## Overview
Endpoint untuk autentikasi pengguna dan mendapatkan token akses untuk mengakses resource yang dilindungi dalam aplikasi Tree View.

---

## Endpoint Details

### HTTP Method & URL
```
POST /api/tree-view/login
```

### Description
Melakukan proses login dengan username dan password. Jika berhasil, akan mengembalikan token akses dan data pengguna.

---

## Request

### Content-Type
```
application/json
```

### Request Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| username  | string | Yes      | Username pengguna |
| password  | string | Yes      | Password pengguna |

### Request Example

```json
{
  "username": "john_doe",
  "password": "password123"
}
```

### Validation Rules
- `username`: Wajib diisi, tipe string
- `password`: Wajib diisi, tipe string

---

## Response

### Success Response (200 OK)

**Status Code:** `200`

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "USR001",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "IT",
      "role": "Manager"
    },
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Status keberhasilan login |
| message | string | Pesan login berhasil |
| data.user | object | Data pengguna yang berhasil login |
| data.user.id | string | ID pengguna unik |
| data.user.name | string | Nama lengkap pengguna |
| data.user.email | string | Email pengguna |
| data.user.department | string | Departemen pengguna |
| data.user.role | string | Role/posisi pengguna |
| data.token | string | Token akses untuk request authenticated |

---

### Error Response - Validation Error (422 Unprocessable Entity)

**Status Code:** `422`

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "username": ["The username field is required."],
    "password": ["The password field is required."]
  }
}
```

---

### Error Response - Invalid Credentials (401 Unauthorized)

**Status Code:** `401`

```json
{
  "success": false,
  "message": "Username atau password salah"
}
```

---

## Functionality Details

### What Happens on Successful Login

1. **Validasi Input** - Username dan password divalidasi
2. **Authentikasi** - Credential diverifikasi melalui BigQueryService
3. **Update Last Login** - Timestamp `last_login` diperbarui di database
4. **Generate Token** - Token akses 64 karakter (hex) dibuat secara random
5. **Session** - Token dan user ID disimpan dalam session
6. **Response** - User data dan token dikembalikan ke klien

### Session Storage
Setelah login berhasil, session akan menyimpan:
- `tree_view_auth_token`: Token akses untuk verifikasi request
- `tree_view_auth_user`: ID pengguna yang login

---

## Usage Examples

### cURL

```bash
curl -X POST http://localhost:8000/api/tree-view/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

### JavaScript/Fetch API

```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/tree-view/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (data.success) {
      // Simpan token untuk request ke endpoint protected
      localStorage.setItem('authToken', data.data.token);
      console.log('Login berhasil:', data.data.user);
      return data.data;
    } else {
      console.error('Login gagal:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Penggunaan
login('john_doe', 'password123');
```

### Python/Requests

```python
import requests
import json

url = 'http://localhost:8000/api/tree-view/login'
payload = {
    'username': 'john_doe',
    'password': 'password123'
}

response = requests.post(url, json=payload)
data = response.json()

if data['success']:
    token = data['data']['token']
    user = data['data']['user']
    print(f"Login berhasil: {user['name']}")
    print(f"Token: {token}")
else:
    print(f"Login gagal: {data['message']}")
```

---

## Error Handling

### Possible Error Messages

| Error | HTTP Code | Cause | Solution |
|-------|-----------|-------|----------|
| Validation error | 422 | Username/password tidak diisi | Pastikan kedua field terisi |
| Username atau password salah | 401 | Credential tidak valid | Periksa kembali username dan password |

---

## Security Notes

1. **Token**: Token dibuat dengan `random_bytes(32)` yang di-convert ke hex (64 karakter)
2. **Session**: Token disimpan di session server, bukan di klien
3. **HTTPS**: Gunakan HTTPS untuk production untuk melindungi credential
4. **Password**: Saat pengiriman, pastikan menggunakan HTTPS encrypted connection
5. **Token Storage**: Klien harus menyimpan token dengan aman (tidak di localStorage jika sensitive)

---

## Related Endpoints

- **GET** `/api/tree-view/user` - Dapatkan data user yang sedang login (auth required)
- **GET** `/api/tree-view/permissions` - Dapatkan permission user (auth required)
- **POST** `/api/tree-view/logout` - Logout dan hapus session (auth required)

---

## Implementation Notes

- Menggunakan Laravel Validator untuk validasi input
- BigQueryService menangani logic authentikasi terhadap database
- Token bersifat session-based (server-side storage)
- Last login timestamp otomatis diupdate saat login berhasil

---

**Last Updated:** February 27, 2026  
**API Version:** 1.0  
**Status:** Active
