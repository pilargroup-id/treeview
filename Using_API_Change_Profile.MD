# API — Change Profile (Treeview)

**Endpoint**
```
PUT https://treeview.pilargroup.id/api/tree-view/change-profile
```

**Headers**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body** (`new_username` dan `new_password` opsional, minimal 1 diisi)
```json
{
    "current_password": "password_sekarang",
    "new_username": "username_baru",
    "new_password": "password_baru"
}
```

**Response Sukses**
```json
{ "success": true, "message": "Berhasil mengubah username dan password" }
```

**Error**

| Status | Message |
|--------|---------|
| 401 | Password saat ini salah |
| 422 | Username sudah digunakan |
| 422 | Isi minimal new_username atau new_password |
| 404 | User not found |