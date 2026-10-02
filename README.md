# SITTA - Tugas Praktik 1 Pemrograman Berbasis Web

Prototype front-end SITTA Universitas Terbuka menggunakan HTML, CSS, dan JavaScript DOM.

## Struktur

```text
tugas-satu-pbw-sitta/
├── index.html
├── login.html
├── dashboard.html
├── tracking.html
├── stok.html
├── css/
│   └── style.css
├── js/
│   ├── data.js
│   ├── auth.js
│   ├── store.js
│   └── script.js
└── img/
    ├── ut-logo.png
    └── ...cover bahan ajar...
```

## Demo login dari data.js

- `admin@ut.ac.id` / `admin123`
- `rina@ut.ac.id` / `rina123`
- `agus@ut.ac.id` / `agus123`
- `siti@ut.ac.id` / `siti123`
- `doni@ut.ac.id` / `doni123`

## Authentication guard

`dashboard.html`, `tracking.html`, dan `stok.html` dilindungi oleh `auth.js`.
Jika halaman dibuka sebelum login, pengguna diarahkan kembali ke login. Setelah login, halaman yang sebelumnya diminta akan dibuka kembali. Logout akan menghapus sesi.

## Data pengguna dan data stok yang bisa berubah

`data.js` digunakan sebagai **seed / data awal** sesuai file yang diberikan.
Karena aplikasi ini berjalan sebagai front-end statis tanpa backend, browser tidak memiliki hak untuk menulis atau mengubah file `js/data.js` dan folder `img/` secara otomatis.

Sebagai gantinya, `store.js` menggunakan `localStorage` sebagai persistence layer untuk prototype:

- Registrasi akun menambah data pengguna ke `localStorage`.
- Lupa password memperbarui password pengguna di `localStorage`.
- Tambah/hapus stok memperbarui data stok di `localStorage`.
- Setelah refresh halaman, perubahan tetap tersedia pada browser yang sama.

Dengan demikian alurnya tetap dapat didemonstrasikan sebagai aplikasi front-end tanpa database. Saat menjelaskan tugas, sebutkan bahwa `data.js` adalah data awal/dummy sedangkan `store.js` mensimulasikan persistence di sisi client.

## Upload cover bahan ajar

Pada form **Tambah Stok**, pengguna dapat memilih file JPG/PNG/WebP melalui `input type="file"`.
File dikompresi di browser menggunakan Canvas API dan disimpan sebagai Data URL di `localStorage`, lalu langsung ditampilkan kembali pada tabel.

Ini adalah simulasi storage di client. Untuk menyimpan file fisik benar-benar ke folder `img/`, diperlukan backend/server atau File System Access API dengan izin pengguna. Hal tersebut sengaja tidak ditambahkan karena tugas praktik berfokus pada front-end tanpa backend.

## Menjalankan

Buka `index.html` atau gunakan Live Server di VS Code agar pengalaman pengujian lebih stabil.

## Reset data hasil perubahan

Jika ingin kembali ke data awal dari `data.js`, buka DevTools Console dan jalankan:

```javascript
SittaStore.resetDemoData();
location.reload();
```

## Catatan keamanan

Authentication pada project ini adalah simulasi front-end. Credential dan data pengguna berada di client, sehingga mekanisme ini **bukan authentication production** dan tidak dimaksudkan sebagai kontrol keamanan server-side.
