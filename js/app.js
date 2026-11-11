/* NADI mockup rancangan. Logika demo: state, render layar, panel demo.
   Tanpa jaringan, tanpa modul, tanpa pustaka. */
(function () {
  'use strict';

  var D = window.DATA;
  var LAYAR = ['menu', 'sso', 'privasi', 'opsi', 'checkin', 'rekomendasi', 'janji',
               'ringkasan', 'bantuan', 'pengaturan', 'agregat', 'akhir'];
  var HARI = [['Sen', 'Senin'], ['Sel', 'Selasa'], ['Rab', 'Rabu'],
              ['Kam', 'Kamis'], ['Jum', 'Jumat'], ['Sab', 'Sabtu']];

  /* ---------- Keadaan (hanya di memori) ---------- */
  var state = {
    layar: 'menu',
    hist: [],
    peran: 'mahasiswa',
    offline: false,
    waGagal: false,
    tingkat: 0,
    opsi: opsiDefault(),
    opsiStep: 0,
    checkins: clone(D.checkins),
    ck: { tidur: 7, mood: null, energi: null, saved: false },
    janji: { slot: null, topik: D.topik[0], izin: false, terkirim: false, pesan: '' },
    respRek: '',
    bantuanInfo: '',
    hapusKonfirm: false,
    akhirTeks: 'Tidak ada data yang tersimpan.'
  };

  /* ---------- Util ---------- */
  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function fmt(n) { return String(n).replace('.', ','); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function emptyRows() {
    var r = [];
    for (var i = 0; i < 4; i++) { r.push({ mk: '', hari: '', mulai: '', selesai: '' }); }
    return r;
  }
  function opsiDefault() {
    return { wa: false, nomor: '', kodeKirim: false, kode: '', verif: false,
             agregat: false, jadwal: false, rows: emptyRows(),
             frek: 'mingguan', jam: '19:00' };
  }
  function setJadwal(on) {
    state.opsi.jadwal = !!on;
    state.opsi.rows = on ? clone(D.jadwal) : emptyRows();
  }
  // Hari padat = hari dengan 2 kuliah atau lebih (aturan contoh untuk ilustrasi)
  function padatHari() {
    var o = state.opsi, n = {}, out = [], k;
    if (!o.jadwal) { return out; }
    o.rows.forEach(function (r) { if (r.hari) { n[r.hari] = (n[r.hari] || 0) + 1; } });
    for (k in n) { if (n[k] >= 2) { out.push(k); } }
    return out;
  }
  function setPath(path, val) {
    var p = path.split('.'), o = state, i;
    for (i = 0; i < p.length - 1; i++) { o = o[p[i]]; }
    o[p[p.length - 1]] = val;
  }

  /* ---------- Panel demo: simpan ke localStorage (hanya keadaan panel) ---------- */
  function savePanel() {
    try {
      localStorage.setItem('nadiPanel', JSON.stringify({
        offline: state.offline, waGagal: state.waGagal,
        tingkat: state.tingkat, jadwal: state.opsi.jadwal
      }));
    } catch (e) { /* abaikan */ }
  }
  function loadPanel() {
    try {
      var s = localStorage.getItem('nadiPanel');
      if (!s) { return; }
      var o = JSON.parse(s);
      state.offline = !!o.offline;
      state.waGagal = !!o.waGagal;
      if (o.tingkat === 0 || o.tingkat === 1 || o.tingkat === 2) { state.tingkat = o.tingkat; }
      if (o.jadwal) { setJadwal(true); }
    } catch (e) { /* abaikan */ }
  }

  /* ---------- Komponen kecil ---------- */
  function sw(id, path, checked, label) {
    return '<label class="switch" for="' + id + '"><input type="checkbox" role="switch" id="' + id +
      '" data-bind="' + path + '"' + (checked ? ' checked' : '') +
      '><span class="track" aria-hidden="true"></span><span>' + label + '</span></label>';
  }
  function radio(name, path, val, checked, label) {
    return '<label class="radio"><input type="radio" name="' + name + '" data-bind="' + path +
      '" value="' + esc(val) + '"' + (checked ? ' checked' : '') + '><span>' + label + '</span></label>';
  }
  function chips(name, path, list, current) {
    return list.map(function (w) {
      return '<label class="chip"><input type="radio" name="' + name + '" data-bind="' + path +
        '" value="' + esc(w) + '"' + (current === w ? ' checked' : '') + '><span>' + esc(w) + '</span></label>';
    }).join('');
  }
  function barChart(items, label) {
    var h = '<div class="chart" role="img" aria-label="' + esc(label) + '">';
    items.forEach(function (it) {
      var pct = Math.round(it.val / 12 * 100);
      h += '<div class="col"><span class="val">' + fmt(it.val) + '</span>' +
        '<div class="trk"><div class="bar" style="height:' + pct + '%"></div></div>' +
        '<span class="day">' + esc(it.lab) + '</span>' +
        '<span class="tag">' + (it.tag ? esc(it.tag) : '') + '</span></div>';
    });
    return h + '</div>';
  }

  /* ---------- Blok opsi (dipakai S3 satu per satu dan S9 sekaligus) ---------- */
  function optBlock(i, p) {
    var o = state.opsi, h = '<div class="blk">';
    if (i === 0) {
      h += '<h2>WhatsApp</h2><p>Terima pengingat lewat WhatsApp (simulasi).</p>';
      h += sw(p + 'wa', 'opsi.wa', o.wa, 'Aktifkan pengingat WhatsApp');
      if (o.wa) {
        h += '<label class="lbl" for="' + p + 'nomor">Nomor WhatsApp</label>' +
          '<input id="' + p + 'nomor" type="tel" inputmode="tel" autocomplete="off" ' +
          'placeholder="[nomor WhatsApp kamu]" value="' + esc(o.nomor) + '" data-bind="opsi.nomor">';
        if (o.verif) {
          h += '<p class="okline">Nomor terverifikasi (simulasi).</p>';
        } else {
          h += '<div class="btnrow"><button type="button" class="btn sec" data-act="kirimKode">Kirim kode verifikasi (simulasi)</button></div>';
          if (o.kodeKirim) {
            h += '<p class="note">Kode simulasi sudah dikirim. Ketik angka apa saja untuk mencoba.</p>' +
              '<label class="lbl" for="' + p + 'kode">Kode verifikasi</label>' +
              '<input id="' + p + 'kode" inputmode="numeric" maxlength="6" autocomplete="off" value="' +
              esc(o.kode) + '" data-bind="opsi.kode">' +
              '<div class="btnrow"><button type="button" class="btn sec" data-act="verifikasi">Verifikasi</button></div>';
          }
        }
      }
      h += '<p class="note">Nomor disimpan terpisah dari catatan check-in.</p>';
    } else if (i === 1) {
      h += '<h2>Data agregat anonim untuk kemahasiswaan</h2>';
      h += sw(p + 'agg', 'opsi.agregat', o.agregat, 'Bagikan data agregat anonim');
      h += '<p class="note">Hanya ditampilkan jika kelompok mencapai ambang minimum.</p>';
    } else if (i === 2) {
      h += '<h2>Jadwal akademik</h2>';
      h += sw(p + 'jdw', 'opsi.jadwal', o.jadwal, 'Gunakan jadwal akademik');
      if (o.jadwal) {
        o.rows.forEach(function (r, k) {
          h += '<div class="row3"><span class="lbl">' + esc(r.mk || ('Kuliah ' + (k + 1))) + '</span>' +
            '<select aria-label="Hari kuliah ' + (k + 1) + '" data-bind="opsi.rows.' + k + '.hari">' +
            '<option value="">Hari</option>' +
            HARI.map(function (x) {
              return '<option value="' + x[0] + '"' + (r.hari === x[0] ? ' selected' : '') + '>' + x[1] + '</option>';
            }).join('') + '</select>' +
            '<input type="time" aria-label="Jam mulai kuliah ' + (k + 1) + '" value="' + esc(r.mulai) +
            '" data-bind="opsi.rows.' + k + '.mulai">' +
            '<input type="time" aria-label="Jam selesai kuliah ' + (k + 1) + '" value="' + esc(r.selesai) +
            '" data-bind="opsi.rows.' + k + '.selesai"></div>';
        });
        h += '<div class="btnrow"><button type="button" class="btn sec" data-act="unggahJadwal">Unggah jadwal (simulasi)</button></div>';
      }
      h += '<p class="note">Dipakai untuk menandai minggu padat dan menghindari pengingat saat jam kuliah. Tidak dikirim ke kemahasiswaan.</p>';
    } else {
      h += '<h2>Frekuensi pengingat</h2>';
      h += radio(p + 'frek', 'opsi.frek', 'mingguan', o.frek === 'mingguan', 'Seminggu sekali (bawaan)');
      h += radio(p + 'frek', 'opsi.frek', 'sering', o.frek === 'sering', '2–3 kali seminggu');
      h += radio(p + 'frek', 'opsi.frek', 'butuh', o.frek === 'butuh', 'Hanya saat aku merasa butuh');
      h += '<label class="lbl" for="' + p + 'jam">Jam pengingat</label>' +
        '<input id="' + p + 'jam" type="time" value="' + esc(o.jam) + '" data-bind="opsi.jam"' +
        (o.frek === 'butuh' ? ' disabled' : '') + '>';
    }
    return h + '</div>';
  }

  /* ---------- Renderer per layar ---------- */
  function renderOpsiWiz() {
    var s = state.opsiStep, last = (s === 3);
    $('opsi-wiz').innerHTML =
      '<p class="step">Opsi ' + (s + 1) + ' dari 4. Semuanya opsional dan boleh dilewati.</p>' +
      optBlock(s, 'w-') +
      '<div class="btnrow">' +
      (s > 0 ? '<button type="button" class="btn sec" data-act="opsiSebelum">Sebelumnya</button>' : '') +
      (!last ? '<button type="button" class="btn sec" data-act="opsiLanjut">Lewati</button>' : '') +
      '<button type="button" class="btn" data-act="opsiLanjut">' + (last ? 'Selesai' : 'Simpan dan lanjut') + '</button>' +
      '</div>';
  }
  function renderOpsiAll() {
    var h = '';
    for (var i = 0; i < 4; i++) { h += '<div class="card">' + optBlock(i, 'a-') + '</div>'; }
    $('opsi-all').innerHTML = h;
  }
  function renderHapus() { $('hapus-konfirm').hidden = !state.hapusKonfirm; }

  function renderCheckin() {
    var c = state.ck;
    $('tidur-val').textContent = fmt(c.tidur) + ' jam';
    $('mood-choices').innerHTML = chips('mood', 'ck.mood', D.mood, c.mood);
    $('energi-choices').innerHTML = chips('energi', 'ck.energi', D.energi, c.energi);
    $('ck-form').hidden = c.saved;
    $('ck-done').hidden = !c.saved;
    $('ck-done-offline').hidden = !(c.saved && state.offline);
    $('ck-to-rek').hidden = !(state.tingkat > 0);
  }

  function renderRek() {
    var t = state.tingkat, txt, judul, tombol, h = '';
    if (t === 0) {
      judul = 'Pengingat';
      txt = 'Halo, ini pengingat dari NADI. Mau mencatat kondisimu hari ini? Butuh sekitar 30 detik. Kamu bisa mengubah atau menghentikan pengingat kapan saja.';
      tombol = '<button type="button" class="btn" data-go="checkin">Mulai check-in</button>';
    } else if (t === 1) {
      judul = 'Saran umum';
      txt = 'Beberapa hari terakhir catatanmu menunjukkan waktu tidur yang lebih singkat. Sebagian mahasiswa merasa terbantu dengan jam tidur yang lebih teratur atau jeda singkat di sela tugas. Ini saran umum, bukan penilaian tentang kondisimu.';
      tombol = '<button type="button" class="btn" data-act="cobaSaran">Coba saran ini</button>' +
               '<button type="button" class="btn sec" data-act="rekTidak">Tidak sekarang</button>';
    } else {
      judul = 'Tawaran konseling';
      txt = 'Jika kamu ingin berbicara dengan konselor kampus, NADI bisa membantu membuat janji temu. Pilihan ini sepenuhnya milikmu.';
      tombol = '<button type="button" class="btn" data-act="hubungiKonselor">Hubungi konselor</button>' +
               '<button type="button" class="btn sec" data-act="rekTidak">Tidak sekarang</button>';
    }
    h += '<h2>Di dalam aplikasi</h2><div class="card"><h2>' + judul + '</h2><p>' + esc(txt) + '</p>' +
         '<div class="btnrow">' + tombol + '</div></div>';
    if (state.respRek) { h += '<p class="notice" role="status">' + esc(state.respRek) + '</p>'; }
    h += '<h2>WhatsApp (simulasi)</h2>';
    if (state.waGagal) {
      h += '<p class="notice" role="status">Pesan WhatsApp gagal terkirim. Pengingat dialihkan ke web.</p>';
    } else {
      h += '<div class="wa"><div class="wa-head">WhatsApp (simulasi) &middot; NADI</div><p class="bubble">' + esc(txt) + '</p></div>';
    }
    if (t > 0) {
      h += '<p class="note"><strong>Jika tidak merespons:</strong> Maks. satu tindak lanjut, lalu NADI berhenti dan menurunkan frekuensi pengingat.</p>';
    }
    $('rek-body').innerHTML = h;
  }

  function renderJanji() {
    var j = state.janji, h = '';
    if (j.terkirim) {
      h = '<div class="card ok" role="status"><p><strong>Permintaan dikirim: ' + esc(j.slot) + '.</strong></p>' +
          '<p>Konselor akan menindaklanjuti. NADI tidak menghubungi siapa pun atas namamu.</p></div>';
    } else {
      h += '<fieldset class="field"><legend>Pilih hari dan jam (slot contoh)</legend><div class="choices">' +
           chips('slot', 'janji.slot', D.slot, j.slot) + '</div></fieldset>';
      h += '<div class="field"><label class="lbl" for="topik">Topik (opsional)</label>' +
           '<select id="topik" data-bind="janji.topik">' +
           D.topik.map(function (t) {
             return '<option' + (j.topik === t ? ' selected' : '') + '>' + esc(t) + '</option>';
           }).join('') + '</select></div>';
      h += sw('izin', 'janji.izin', j.izin, 'Izinkan NADI membagikan nama dan kontakku kepada konselor untuk janji temu ini');
      if (!j.izin) {
        h += '<p class="notice">Tanpa izin ini, janji temu tidak bisa diproses. Kamu bisa menghubungi layanan konseling kampus langsung.</p>';
      }
      if (j.pesan) { h += '<p class="notice" role="status">' + esc(j.pesan) + '</p>'; }
      h += '<button type="button" class="btn block" data-act="kirimJanji"' + (j.izin ? '' : ' disabled') + '>Kirim permintaan janji temu</button>';
    }
    $('janji-body').innerHTML = h;
  }

  function renderSum() {
    var c = state.checkins.slice(-7), h = '', padat = padatHari(), items;
    if (c.length < 3) {
      h += '<p class="empty">Data belum cukup untuk menampilkan pola.</p>';
    } else {
      if (padat.length) {
        h += '<p class="notice">Minggu ini ditandai padat berdasarkan jadwal yang kamu isi (contoh).</p>';
      }
      items = c.map(function (x) {
        return { lab: x.hari, val: x.tidur, tag: padat.indexOf(x.hari) >= 0 ? 'padat' : '' };
      });
      h += '<div class="dark-panel"><h2>Jam tidur per hari</h2>' +
           barChart(items, 'Grafik batang jam tidur per hari') + '</div>';
      h += '<h2>Suasana hati dan energi</h2><table class="tbl"><thead><tr><th>Hari</th><th>Suasana hati</th><th>Energi</th></tr></thead><tbody>';
      c.forEach(function (x) {
        h += '<tr><th scope="row">' + esc(x.hari) +
          (padat.indexOf(x.hari) >= 0 ? ' <span class="tag-padat">(padat)</span>' : '') +
          '</th><td>' + esc(x.mood) + '</td><td>' + esc(x.energi) + '</td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '<p class="note">Ringkasan ini bukan diagnosis.</p>';
    $('sum-body').innerHTML = h;
  }

  function renderAgregat() {
    $('agg-chart').innerHTML = barChart(D.agregat.tidurMingguan.map(function (v, i) {
      return { lab: 'Mgg ' + (i + 1), val: v, tag: '' };
    }), 'Grafik batang rata-rata jam tidur kelompok per minggu');
  }

  /* ---------- Render utama ---------- */
  function syncPanel() {
    var els = document.querySelectorAll('[data-panel]'), i, el, k;
    for (i = 0; i < els.length; i++) {
      el = els[i]; k = el.getAttribute('data-panel');
      if (k === 'offline') { el.checked = state.offline; }
      else if (k === 'waGagal') { el.checked = state.waGagal; }
      else if (k === 'jadwal') { el.checked = state.opsi.jadwal; }
      else if (k === 'tingkat') { el.checked = (Number(el.value) === state.tingkat); }
      else if (k === 'peran') { el.value = state.peran; }
    }
  }

  function render() {
    LAYAR.forEach(function (n) { $('s-' + n).hidden = (n !== state.layar); });
    var siswa = (state.layar !== 'agregat');
    document.body.setAttribute('data-layar', state.layar);
    $('btn-back').hidden = (state.hist.length === 0);
    $('help-fab').hidden = !siswa;
    $('foot').hidden = !siswa;
    $('foot2').hidden = !siswa;
    $('banner-offline').hidden = !state.offline;
    switch (state.layar) {
      case 'opsi': renderOpsiWiz(); break;
      case 'pengaturan': renderOpsiAll(); renderHapus(); break;
      case 'checkin': renderCheckin(); break;
      case 'rekomendasi': renderRek(); break;
      case 'janji': renderJanji(); break;
      case 'ringkasan': renderSum(); break;
      case 'bantuan':
        $('bantuan-info').textContent = state.bantuanInfo;
        $('bantuan-info').hidden = !state.bantuanInfo;
        break;
      case 'agregat': renderAgregat(); break;
      case 'akhir': $('akhir-teks').textContent = state.akhirTeks; break;
    }
    syncPanel();
  }

  // Atur ulang isian saat masuk ke sebuah layar
  function enter(n) {
    if (n === 'checkin') { state.ck = { tidur: 7, mood: null, energi: null, saved: false }; $('note').value = ''; }
    if (n === 'opsi') { state.opsiStep = 0; }
    if (n === 'janji') { state.janji = { slot: null, topik: D.topik[0], izin: false, terkirim: false, pesan: '' }; }
    if (n === 'rekomendasi') { state.respRek = ''; }
    if (n === 'bantuan') { state.bantuanInfo = ''; }
    if (n === 'pengaturan') { state.hapusKonfirm = false; }
  }

  function goto(name, tanpaRiwayat) {
    if (LAYAR.indexOf(name) < 0) { name = 'menu'; }
    if (!tanpaRiwayat && state.layar && state.layar !== name) { state.hist.push(state.layar); }
    state.layar = name;
    state.peran = (name === 'agregat') ? 'kemahasiswaan' : 'mahasiswa';
    enter(name);
    render();
    var h = $('s-' + name).querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  /* ---------- Aksi tombol ---------- */
  var ACT = {
    back: function () { var p = state.hist.pop(); if (p) { goto(p, true); } },
    setuju: function () { goto('opsi'); },
    tidakSekarang: function () { state.akhirTeks = 'Tidak ada data yang tersimpan.'; goto('akhir'); },
    opsiLanjut: function () { if (state.opsiStep < 3) { state.opsiStep++; render(); } else { goto('checkin'); } },
    opsiSebelum: function () { if (state.opsiStep > 0) { state.opsiStep--; render(); } },
    kirimKode: function () { state.opsi.kodeKirim = true; render(); },
    verifikasi: function () { if (String(state.opsi.kode).trim()) { state.opsi.verif = true; } render(); },
    unggahJadwal: function () { state.opsi.rows = clone(D.jadwal); render(); },
    tidurKurang: function () { state.ck.tidur = Math.max(0, state.ck.tidur - 0.5); $('tidur-val').textContent = fmt(state.ck.tidur) + ' jam'; },
    tidurTambah: function () { state.ck.tidur = Math.min(12, state.ck.tidur + 0.5); $('tidur-val').textContent = fmt(state.ck.tidur) + ' jam'; },
    simpan: function () {
      var c = state.ck;
      state.checkins.push({ hari: 'Baru', tidur: c.tidur, mood: c.mood || '–', energi: c.energi || '–' });
      c.saved = true; // catatan tidak disimpan atau dibaca
      render();
    },
    cobaSaran: function () { state.respRek = 'Terima kasih. Saran ini bisa dicoba kapan saja, tanpa kewajiban.'; render(); },
    rekTidak: function () { state.respRek = 'Baik, tidak apa-apa.'; render(); },
    hubungiKonselor: function () { goto('janji'); },
    kirimJanji: function () {
      var j = state.janji;
      if (!j.izin) { return; }
      if (!j.slot) { j.pesan = 'Pilih salah satu hari dan jam dulu.'; render(); return; }
      j.pesan = ''; j.terkirim = true; render();
    },
    bantuan1: function () { state.bantuanInfo = 'Mockup: di sini NADI akan menampilkan tautan panggilan ke konselor kampus [kontak diisi sesuai kampus]. Tidak ada panggilan sungguhan.'; render(); },
    bantuan2: function () { state.bantuanInfo = 'Mockup: di sini NADI akan menampilkan tautan panggilan ke layanan krisis resmi [nomor resmi diisi sesuai ketentuan yang berlaku]. Tidak ada panggilan sungguhan.'; render(); },
    bantuan3: function () { state.bantuanInfo = 'Mockup: di sini NADI akan menampilkan tautan panggilan ke ' + D.kontakTepercaya + ' yang pernah kamu simpan. Tidak ada panggilan sungguhan.'; render(); },
    berhenti: function () {
      state.akhirTeks = 'Kamu sudah berhenti memakai NADI. Pengingat dihentikan. Kamu tetap bisa menghapus datamu lewat Pengaturan dan privasi.';
      goto('akhir');
    },
    hapus: function () { state.hapusKonfirm = true; render(); },
    hapusBatal: function () { state.hapusKonfirm = false; render(); },
    hapusYa: function () {
      state.checkins = [];
      state.opsi = opsiDefault();
      state.akhirTeks = 'Semua data kamu sudah dihapus. Tidak ada data yang tersimpan.';
      savePanel();
      goto('akhir');
    }
  };

  /* ---------- Event (delegasi) ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act],[data-go],[data-jump]') : null;
    if (!el || el.disabled) { return; }
    if (el.getAttribute('data-jump')) { state.hist = []; goto(el.getAttribute('data-jump'), true); return; }
    if (el.getAttribute('data-go')) { goto(el.getAttribute('data-go')); return; }
    var fn = ACT[el.getAttribute('data-act')];
    if (fn) { fn(); }
  });

  function onBind(e) {
    var el = e.target, path = el.getAttribute ? el.getAttribute('data-bind') : null;
    if (!path) { return; }
    setPath(path, el.type === 'checkbox' ? el.checked : el.value);
    // Toggle dan radio bisa mengubah isi layar: gambar ulang, lalu kembalikan fokus
    if (e.type === 'change' && (el.type === 'checkbox' || el.type === 'radio') && path.indexOf('ck.') !== 0) {
      var sel = '[data-bind="' + path + '"]' + (el.type === 'radio' ? '[value="' + el.value + '"]' : '');
      savePanel();
      render();
      var again = $('s-' + state.layar).querySelector(sel);
      if (again) { again.focus(); }
    }
  }
  document.addEventListener('input', onBind);
  document.addEventListener('change', onBind);

  // Panel demo
  document.addEventListener('change', function (e) {
    var el = e.target, k = el.getAttribute ? el.getAttribute('data-panel') : null;
    if (!k) { return; }
    if (k === 'offline') { state.offline = el.checked; }
    else if (k === 'waGagal') { state.waGagal = el.checked; }
    else if (k === 'jadwal') { setJadwal(el.checked); }
    else if (k === 'tingkat') { state.tingkat = Number(el.value); }
    else if (k === 'peran') { state.hist = []; goto(el.value === 'kemahasiswaan' ? 'agregat' : 'menu', true); }
    savePanel();
    render();
  });

  /* ---------- Mulai ---------- */
  function init() {
    var q = new URLSearchParams(window.location.search);
    // Jika layar dibuka lewat URL, pakai data contoh bawaan (abaikan keadaan panel yang tersimpan)
    if (!q.has('layar')) { loadPanel(); }
    if (q.get('bersih') === '1') { document.body.classList.add('bersih'); }
    var t = q.get('tingkat');
    if (t === '0' || t === '1' || t === '2') { state.tingkat = Number(t); }
    if (q.get('jadwal') === '1') { setJadwal(true); }
    var l = q.get('layar');
    goto(LAYAR.indexOf(l) >= 0 ? l : 'menu', true);
  }
  init();
})();