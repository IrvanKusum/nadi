NADI - Mockup Web Interaktif (rancangan untuk esai lomba)
==========================================================
Ini mockup rancangan, belum diuji, BUKAN produk jadi dan BUKAN alat diagnosis.
Semua data adalah data contoh. Tanpa backend, database, autentikasi, atau AI.
Hanya HTML, CSS, JavaScript biasa. Berjalan offline.

CARA MENJALANKAN (Laragon, Windows)
1. Taruh folder "nadi" di C:\laragon\www\nadi
   (isi: index.html, css\style.css, js\data.js, js\app.js, README.txt)
2. Jalankan Laragon, klik "Start All".
3. Buka salah satu alamat ini di Chrome atau Edge:
   - http://localhost/nadi/
   - http://nadi.test
   Catatan: nadi.test butuh "Auto virtual hosts" aktif di Laragon
   (Menu > Preferences > General), lalu Reload.
4. Alternatif tanpa server: klik ganda index.html (tetap jalan karena
   tidak memakai ES modules dan semua path relatif).

PARAMETER URL
?layar=menu | sso | privasi | opsi | checkin | rekomendasi | janji |
        ringkasan | bantuan | pengaturan | agregat
&bersih=1       menyembunyikan Panel Demo
&tingkat=0|1|2  tingkat rekomendasi (0 = pengingat biasa)
&jadwal=1       mengaktifkan data jadwal contoh
Contoh: http://localhost/nadi/?layar=rekomendasi&tingkat=2&bersih=1
        http://localhost/nadi/?layar=ringkasan&jadwal=1

PANEL DEMO (kotak bergaris putus-putus di samping bingkai ponsel)
- Loncat ke layar: tombol S0 sampai S10.
- Saklar: Offline, WhatsApp gagal, Jadwal diisi.
- Ambang terpenuhi: Tidak / Tingkat 1 / Tingkat 2 (hanya simulasi,
  aturan ambang sungguhan tidak diimplementasikan).
- Peran: Mahasiswa atau Kemahasiswaan (membuka tampilan agregat).
- Keadaan panel disimpan di localStorage browser (hanya itu).
- Untuk melihat "Data belum cukup untuk menampilkan pola" (S7),
  buka Pengaturan dan privasi > Hapus semua data saya (dua langkah),
  lalu loncat ke S7.

BERKAS
index.html     kerangka semua layar
css/style.css  gaya (font sistem, tanpa sumber luar)
js/data.js     data contoh
js/app.js      state, render layar, logika demo