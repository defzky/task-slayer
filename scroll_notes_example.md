# Contoh Notes dengan Markdown

Berikut adalah beberapa cara untuk membuat format notes atau konten yang bisa di-scroll dalam Markdown.

## 1. Area Scroll Tertutup (Scrollable Box)
Ini adalah trik yang paling sering dicari. Karena Markdown mendukung HTML, kita bisa menggunakan `div` dengan CSS `overflow-y: scroll`. Ini sangat berguna untuk **Change Log**, **Terms of Service**, atau teks panjang yang tidak ingin memenuhi seluruh halaman.

<div style="height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; background-color: #0d1117; color: #c9d1d9;">
  <h3>📜 Riwayat Perubahan (Changelog)</h3>
  <ul style="padding-left: 20px;">
    <li><strong>v2.1.0</strong> - Update fitur keamanan dan perbaikan bug minor.</li>
    <li><strong>v2.0.9</strong> - Menambahkan dark mode pada halaman pengaturan.</li>
    <li><strong>v2.0.8</strong> - Optimasi database query untuk report bulanan.</li>
    <li><strong>v2.0.7</strong> - Perbaikan typo pada menu navigasi.</li>
    <li><strong>v2.0.6</strong> - Hotfix untuk login error pada iOS.</li>
    <li><strong>v2.0.5</strong> - Update library pihak ketiga.</li>
    <li><strong>v2.0.4</strong> - Penambahan fitur export ke CSV.</li>
    <li><strong>v2.0.3</strong> - Redesign tombol call-to-action.</li>
    <li><strong>v2.0.2</strong> - Integrasi dengan payment gateway baru.</li>
    <li><strong>v2.0.1</strong> - Perbaikan validasi form registrasi.</li>
    <li><strong>v2.0.0</strong> - Rilis major dengan arsitektur baru.</li>
    <li><strong>v1.5.0</strong> - Fitur notifikasi realtime.</li>
    <li><strong>v1.4.0</strong> - Dashboard analitik.</li>
    <li><strong>v1.3.0</strong> - Manajemen role user.</li>
    <li><strong>v1.2.0</strong> - Upload foto profil.</li>
    <li><strong>v1.1.0</strong> - "Lupa Password" flow.</li>
    <li><strong>v1.0.0</strong> - Rilis perdana aplikasi.</li>
  </ul>
  <p><em>(Area ini memiliki tinggi tetap 300px. Jika konten melebihi tinggi tersebut, scrollbar akan muncul di sebelah kanan.)</em></p>
</div>

---

## 2. Tabel Lebar (Horizontal Scroll)
Markdown otomatis menangani tabel yang terlalu lebar dengan memberikan scrollbar horizontal (tergantung pada renderer Markdown yang digunakan, seperti di GitHub).

| ID  | Timestamp | User | Action Type | Resource | Metadata | Status | Duration | IP Address | User Agent |
|-----|-----------|------|-------------|----------|----------|--------|----------|------------|------------|
| 001 | 2024-01-27 10:00:00 | admin | DELETE | /api/v1/users/123 | { reason: "spam", admin_id: 1 } | SUCCESS | 120ms | 192.168.1.1 | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) |
| 002 | 2024-01-27 10:05:00 | user1 | UPDATE | /api/v1/profile | { bio: "updated" } | SUCCESS | 45ms | 192.168.1.2 | Mozilla/5.0 (Windows NT 10.0; Win64; x64) |
| 003 | 2024-01-27 10:10:00 | user2 | POST | /api/v1/orders | { items: [1,2,3], coupon: "SALE" } | PENDING | 200ms | 192.168.1.3 | Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) |

---

## 3. Detail/Summary (Collapsible)
Meskipun bukan "scroll" dalam arti sempit, ini adalah cara terbaik untuk menyembunyikan konten panjang agar halaman tidak terlalu penuh, yang sering menjadi alternatif untuk scroll area.

<details>
  <summary><strong>Klik untuk melihat Log Error Lengkap (Sangat Panjang)</strong></summary>
  
  <br>
  
  ```json
  {
    "error": "NullPointerException",
    "trace": [
      "at com.example.app.Service.process(Service.java:25)",
      "at com.example.app.Controller.handle(Controller.java:10)",
      "at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1000)",
      "... 50 baris lainnya ..."
    ]
  }
  ```
  > Anda bisa menyisipkan apa saja di sini: teks, kode, atau gambar.
</details>
