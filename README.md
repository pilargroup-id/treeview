# 🧩 Git Workflow Guide (Team Version)

Dokumentasi workflow Git untuk tim agar kerja tetap rapi, konsisten, dan tanpa konflik.

---

## 📌 Branch Flow
main → feature/your-feature → main

> Semua pekerjaan dilakukan di branch `feature/...`, bukan di `main`, supaya kode di `main` selalu stabil.

---

## 🚀 1. Clone Project
Clone project dari GitHub ke lokal:

git clone https://github.com/azipiagam/tree-view.git
cd tree-view

---

## 🌱 2. Buat Branch Baru
Sebelum bikin branch, cek dulu daftar branch yang ada:

# Lihat branch lokal
git branch

# Lihat semua branch (lokal + remote)
git branch -a

Kalau belum ada branch untuk fitur yang mau dikerjain, buat branch baru dari `main`:

git switch main
git pull origin main
git switch -c feature/nama-fitur

**Contoh:**
git switch -c feature/tree-view

> 💡 Gunakan format branch yang jelas:
> - feature/login-page
> - fix/api-error
> - hotfix/navbar-layout

---

## 💾 3. Simpan & Upload Perubahan (Push)
Setelah selesai ngoding:

git add .
git commit -m "feat: tambah tree view component"
git push -u origin feature/tree-view

Kalau branch udah pernah di-push sebelumnya, cukup:

git push

---

## 🔄 4. Update Kode Terbaru (Pull)
Kalau mau ambil perubahan dari temen lo:

# Di branch aktif lo sekarang
git pull origin feature/tree-view

Atau kalau mau update dari branch utama:
git switch main
git pull origin main

---

## 🧹 5. Merge ke Main (Kalau Fitur Udah Jadi)
Pastikan kode di-merge cuma setelah fitur udah fix & dites.

git switch main
git pull origin main
git merge feature/tree-view
git push origin main

---

## 🗑️ 6. Hapus Branch yang Udah Selesai
Setelah merge:

git branch -d feature/tree-view
git push origin --delete feature/tree-view

---

## ✍️ Commit Message Guideline
Gunakan format berikut biar konsisten:

<type>: <deskripsi singkat>

**Contoh:**
- feat: tambah halaman login
- fix: perbaiki bug pada komponen navbar
- chore: update dependensi
- style: ubah format kode (tanpa ubah logic)
- refactor: ubah struktur kode tanpa ubah perilaku
- docs: ubah atau nambah dokumentasi

---

## 🧠 Cheat Sheet Perintah Git

| Perintah | Fungsi | Keterangan |
|-----------|---------|------------|
| `git status` | Lihat perubahan di lokal | Menampilkan file yang dimodifikasi |
| `git branch` | Lihat daftar branch lokal | Tambah `-a` untuk lihat semua (remote juga) |
| `git switch <nama-branch>` | Pindah ke branch tertentu | |
| `git switch -c <nama-branch>` | Buat dan langsung pindah ke branch baru | |
| `git add .` | Tambah semua perubahan ke staging | |
| `git commit -m "pesan"` | Simpan perubahan lokal | |
| `git push` | Upload perubahan ke GitHub | |
| `git pull` | Ambil update terbaru dari remote | |
| `git merge <branch>` | Gabungkan branch ke branch aktif | |
| `git branch -d <branch>` | Hapus branch lokal | |
| `git push origin --delete <branch>` | Hapus branch di remote | |

---

## 🧩 Singkatan Penting

| Singkatan | Arti | Contoh |
|------------|------|--------|
| `-c` | create branch baru sekaligus switch | `git switch -c feature/login` |
| `-u` | set upstream (hubungkan ke remote) | `git push -u origin feature/login` |
| `-a` | tampilkan semua (lokal + remote) | `git branch -a` |
| `-d` | delete branch lokal | `git branch -d feature/test` |

---

## ✅ Alur Kerja Singkat

1. `git pull origin main` → ambil update terbaru  
2. `git switch -c feature/nama-fitur` → buat branch baru  
3. Edit kode  
4. `git add .` → simpan perubahan  
5. `git commit -m "feat: deskripsi singkat"`  
6. `git push -u origin feature/nama-fitur`  
7. Setelah fitur selesai → merge ke `main`

---

📘 **Catatan Akhir:**
> Semua kerjaan dikerjain di branch masing-masing.
> Jangan commit langsung ke `main` biar repo aman & rapi.
