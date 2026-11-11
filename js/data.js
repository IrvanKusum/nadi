/* NADI mockup - data contoh. Tanpa data pribadi nyata. */
var DATA = {
  nama: 'Mahasiswa Baru (contoh)',

  // Pilihan check-in berupa kata, bukan angka
  mood: ['Berat sekali', 'Kurang baik', 'Biasa saja', 'Baik', 'Baik sekali'],
  energi: ['Rendah', 'Cukup', 'Tinggi'],

  // Tujuh check-in contoh (jam tidur 4,5 - 8 jam)
  checkins: [
    { hari: 'Sen', tidur: 6,   mood: 'Biasa saja',  energi: 'Cukup'  },
    { hari: 'Sel', tidur: 5.5, mood: 'Kurang baik', energi: 'Rendah' },
    { hari: 'Rab', tidur: 4.5, mood: 'Kurang baik', energi: 'Rendah' },
    { hari: 'Kam', tidur: 5,   mood: 'Biasa saja',  energi: 'Rendah' },
    { hari: 'Jum', tidur: 6.5, mood: 'Biasa saja',  energi: 'Cukup'  },
    { hari: 'Sab', tidur: 8,   mood: 'Baik',        energi: 'Tinggi' },
    { hari: 'Min', tidur: 7.5, mood: 'Baik',        energi: 'Cukup'  }
  ],

  // Jadwal kuliah contoh: empat mata kuliah generik, Senin dan Rabu terisi dua kali (minggu padat)
  jadwal: [
    { mk: 'Mata Kuliah A (contoh)', hari: 'Sen', mulai: '08:00', selesai: '09:40' },
    { mk: 'Mata Kuliah B (contoh)', hari: 'Sen', mulai: '13:00', selesai: '14:40' },
    { mk: 'Mata Kuliah C (contoh)', hari: 'Rab', mulai: '10:00', selesai: '11:40' },
    { mk: 'Mata Kuliah D (contoh)', hari: 'Rab', mulai: '13:00', selesai: '14:40' }
  ],

  // Slot janji temu contoh
  slot: ['Selasa, 09.00', 'Selasa, 13.00', 'Rabu, 10.00', 'Kamis, 15.30'],
  topik: ['Tidak perlu menyebut topik', 'Mengatur waktu tidur', 'Penyesuaian di awal kuliah', 'Topik lain'],

  // Data agregat anonim contoh (S10)
  agregat: { n: 48, ambang: 20, tidurMingguan: [6.4, 6.6, 6.3, 6.8] },

  kontakTepercaya: 'Kontak Tepercaya (contoh)'
};