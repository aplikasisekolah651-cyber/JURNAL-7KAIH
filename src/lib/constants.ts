import { HabitDefinition, HabitId, User, SchoolClass, ReminderSetting, SchoolSettings } from '../types';
import { 
  DATA_URI_SISWA_PUTRA, 
  DATA_URI_SISWA_PUTRI, 
  DATA_URI_ORANG_TUA, 
  DATA_URI_WALI_KELAS, 
  DATA_URI_ADMIN 
} from './avatarHelper';

export const HABIT_DEFINITIONS: Record<HabitId, HabitDefinition> = {
  bangun_pagi: {
    id: 'bangun_pagi',
    order: 1,
    title: '1. Bangun Pagi',
    shortName: 'Bangun Pagi',
    tagline: 'Memulai hari dengan semangat dan kesegaran jiwa',
    description: 'Membiasakan bangun lebih awal sebelum subuh/fajar untuk mempersiapkan diri dan beribadah.',
    iconName: 'Sun',
    color: 'amber',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    badgeText: 'text-amber-600 dark:text-amber-400',
    defaultTime: '05:00',
    subTasks: [
      { key: 'wakeTime', label: 'Waktu Bangun', type: 'time', required: true },
      { key: 'bedMade', label: 'Merapikan Tempat Tidur Sendiri', type: 'checkbox' },
      { key: 'drinkWater', label: 'Minum Segelas Air Hangat saat Bangun', type: 'checkbox' },
      { key: 'morningMood', label: 'Kondisi Perasaan Pagi', type: 'select', options: ['Sangat Bersemangat 😊', 'Ceria & Segar 😄', 'Cukup Segar 😐', 'Agak Mengantuk 🥱'] }
    ]
  },
  ibadah: {
    id: 'ibadah',
    order: 2,
    title: '2. Beribadah Tepat Waktu',
    shortName: 'Beribadah',
    tagline: 'Membangun ketaatan spiritual dan kedekatan pada Tuhan YME',
    description: 'Menunaikan sholat/ibadah wajib tepat waktu, sholat sunnah/puasa, membaca kitab suci, dan bersedekah.',
    iconName: 'HeartHandshake',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    defaultTime: '05:30',
    subTasks: [
      { key: 'prayerFajr', label: 'Ibadah Pagi / Sholat Subuh Berjamaah', type: 'checkbox' },
      { key: 'prayerDhuhr', label: 'Ibadah Siang / Sholat Dzuhur', type: 'checkbox' },
      { key: 'prayerAsr', label: 'Ibadah Sore / Sholat Ashar', type: 'checkbox' },
      { key: 'prayerMaghrib', label: 'Ibadah Petang / Sholat Maghrib', type: 'checkbox' },
      { key: 'prayerIsha', label: 'Ibadah Malam / Sholat Isya', type: 'checkbox' },
      { key: 'sunnahWorship', label: 'Puasa / Sholat Sunnah (Tahajud / Dhuha / Rawatib)', type: 'checkbox' },
      { key: 'sunnahDetail', label: 'Keterangan Sholat Sunnah / Puasa', type: 'text', placeholder: 'Contoh: Sholat Dhuha 4 Rakaat / Puasa Senin-Kamis' },
      { key: 'holyBookReading', label: 'Membaca Kitab Suci / Tadarus Al-Qur\'an', type: 'checkbox' },
      { key: 'holyBookDetail', label: 'Surat / Ayat / Halaman Kitab Suci', type: 'text', placeholder: 'Contoh: QS. Al-Kahfi Ayat 1-20 / Juz 1 Hlm 1-5' },
      { key: 'almsGiving', label: 'Sedekah / Infaq / Berbagi Kebaikan', type: 'checkbox' },
      { key: 'almsDetail', label: 'Catatan Sedekah / Kebaikan', type: 'text', placeholder: 'Contoh: Infaq kotak amal masjid & berbagi makanan' },
      { key: 'spiritualNote', label: 'Doa/Kebaikan Spiritual Hari Ini', type: 'text', placeholder: 'Tuliskan doa atau rasa syukurmu...' }
    ]
  },
  olahraga: {
    id: 'olahraga',
    order: 3,
    title: '3. Berolahraga & Aktivitas Fisik',
    shortName: 'Berolahraga',
    tagline: 'Menjaga kebugaran jasmani agar kuat dan sehat',
    description: 'Melakukan gerak badan, senam, jalan santai, lari, bersepeda atau olahraga minimal 15-30 menit.',
    iconName: 'Activity',
    color: 'rose',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    badgeText: 'text-rose-600 dark:text-rose-400',
    defaultTime: '06:15',
    subTasks: [
      { key: 'exerciseType', label: 'Jenis Olahraga', type: 'select', options: ['Senam Pagi / Stretching', 'Jalan Kaki / Lari', 'Bersepeda', 'Sepak Bola / Futsal', 'Bulu Tangkis / Basket', 'Lainnya'], required: true },
      { key: 'durationMin', label: 'Durasi (Menit)', type: 'number', unit: 'menit', placeholder: 'contoh: 20' },
      { key: 'stretching', label: 'Pemanasan dan Pendinginan Dilakukan', type: 'checkbox' },
      { key: 'bodyCondition', label: 'Kondisi Tubuh Setelah Olahraga', type: 'select', options: ['Sangat Bugar 💪', 'Berkeringat Sehat 🏃', 'Cukup Bugar 🚶'] }
    ]
  },
  makan_sehat: {
    id: 'makan_sehat',
    order: 4,
    title: '4. Makan Sehat & Bergizi',
    shortName: 'Makan Sehat',
    tagline: 'Memenuhi nutrisi seimbang untuk pertumbuhan optimal',
    description: 'Pola makan teratur (Sarapan, Makan Siang, Makan Malam bergizi), sayur buah, dan minum air putih cukup.',
    iconName: 'Apple',
    color: 'green',
    badgeBg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    badgeText: 'text-green-600 dark:text-green-400',
    defaultTime: '06:45',
    subTasks: [
      { key: 'breakfastEaten', label: 'Sarapan Pagi Bergizi', type: 'checkbox' },
      { key: 'breakfastMenu', label: 'Pilihan Menu Sarapan', type: 'select', options: ['Nasi + Telur Mata Sapi + Tumis Sayur', 'Bubur Ayam Sehat + Kacang & Telur', 'Roti Gandum + Telur Rebus + Susu', 'Nasi Uduk Komplit Sehat', 'Oatmeal Buah + Madu', 'Tulis Menu Lainnya'] },
      { key: 'breakfastCustom', label: 'Menu Sarapan Lainnya', type: 'text', placeholder: 'Tuliskan menu sarapan sehatmu...' },
      { key: 'lunchEaten', label: 'Makan Siang Sehat & Seimbang', type: 'checkbox' },
      { key: 'lunchMenu', label: 'Pilihan Menu Makan Siang', type: 'select', options: ['Nasi + Ikan Bakar / Ayam + Sayur Asam / Bayam', 'Nasi + Tahu Tempe + Sayur Sop Sehat', 'Gado-Gado / Pecel Sayur Telur', 'Soto Sehat Daging & Sayuran', 'Tulis Menu Lainnya'] },
      { key: 'lunchCustom', label: 'Menu Makan Siang Lainnya', type: 'text', placeholder: 'Tuliskan menu makan siang sehatmu...' },
      { key: 'dinnerEaten', label: 'Makan Malam Bergizi (Sebelum Pukul 19.30)', type: 'checkbox' },
      { key: 'dinnerMenu', label: 'Pilihan Menu Makan Malam', type: 'select', options: ['Nasi Porsi Sedang + Sup Ayam Sayuran', 'Tumis Sayur Hijau + Tahu / Tempe / Telur', 'Salad Sayur / Buah + Protein Sehat', 'Menu Ringan Sehat', 'Tulis Menu Lainnya'] },
      { key: 'dinnerCustom', label: 'Menu Makan Malam Lainnya', type: 'text', placeholder: 'Tuliskan menu makan malam sehatmu...' },
      { key: 'hasVegetables', label: 'Makan Sayur-sayuran Hijau / Segar', type: 'checkbox' },
      { key: 'hasFruits', label: 'Makan Buah-buahan', type: 'checkbox' },
      { key: 'waterGlasses', label: 'Jumlah Gelas Air Putih Hari Ini', type: 'number', unit: 'gelas', placeholder: 'Target: 8 gelas' },
      { key: 'avoidJunkFood', label: 'Menghindari Makanan Ringan Cepat Saji / Minuman Manis Berlebih', type: 'checkbox' }
    ]
  },
  membaca: {
    id: 'membaca',
    order: 5,
    title: '5. Gemar Belajar & Literasi',
    shortName: 'Gemar Belajar',
    tagline: 'Membuka jendela ilmu pengetahuan dan wawasan dunia',
    description: 'Belajar dan membaca materi pelajaran atau buku inspiratif dengan jam mulai dan selesai yang teratur.',
    iconName: 'BookOpen',
    color: 'blue',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    badgeText: 'text-blue-600 dark:text-blue-400',
    defaultTime: '16:00',
    subTasks: [
      { key: 'bookTitle', label: 'Judul Buku / Materi Pelajaran', type: 'text', placeholder: 'Contoh: IPA Bab Energi / Kisah Tokoh Sains', required: true },
      { key: 'startTime', label: 'Jam Mulai Belajar', type: 'time', required: true },
      { key: 'endTime', label: 'Jam Berakhir Belajar', type: 'time', required: true },
      { key: 'pageRange', label: 'Halaman / Bab yang Dipelajari', type: 'text', placeholder: 'Contoh: Hlm. 12 - 25' },
      { key: 'summaryInsight', label: 'Pesan / Ilmu Baru yang Didapatkan', type: 'text', placeholder: 'Satu kalimat intisari pelajaran...' }
    ]
  },
  bermasyarakat: {
    id: 'bermasyarakat',
    order: 6,
    title: '6. Bermasyarakat & Tolong Menolong',
    shortName: 'Bermasyarakat',
    tagline: 'Menumbuhkan empati, gotong royong, dan kesantunan sosial',
    description: 'Melakukan kegiatan sosial nyata bersama keluarga, teman, atau tetangga yang bermanfaat bagi lingkungan.',
    iconName: 'Users',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    defaultTime: '17:30',
    subTasks: [
      { key: 'activityName', label: 'Nama Kegiatan Sosial / Tolong Menolong', type: 'text', placeholder: 'Contoh: Membantu membersihkan lingkungan / Membantu kerja kelompok', required: true },
      { key: 'withWhom', label: 'Dengan Siapa Kegiatan Dilakukan', type: 'select', options: ['Keluarga', 'Teman', 'Tetangga'], required: true },
      { key: 'benefits', label: 'Manfaat Kegiatan yang Dirasakan', type: 'text', placeholder: 'Contoh: Lingkungan jadi bersih dan mempererat silaturahmi', required: true },
      { key: 'helpParents', label: 'Membantu Pekerjaan Rumah Orang Tua', type: 'checkbox' },
      { key: 'cleanEnvironment', label: 'Menjaga Kebersihan Lingkungan Sekitar', type: 'checkbox' },
      { key: 'socialNotes', label: 'Catatan / Cerita Kebaikan Hari Ini', type: 'text', placeholder: 'Contoh: Membantu ibu mencuci piring & berbagi cemilan dengan tetangga' }
    ]
  },
  istirahat: {
    id: 'istirahat',
    order: 7,
    title: '7. Istirahat & Tidur Tepat Waktu',
    shortName: 'Istirahat Tepat Waktu',
    tagline: 'Memulihkan energi dan menjaga kesehatan organ tubuh',
    description: 'Tidur tidak larut malam (maksimal pukul 21.00 - 21.30) agar esok hari bangun bugar dan fokus.',
    iconName: 'Moon',
    color: 'purple',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    badgeText: 'text-purple-600 dark:text-purple-400',
    defaultTime: '21:00',
    subTasks: [
      { key: 'targetSleepTime', label: 'Target Waktu Tidur Malam', type: 'time', required: true },
      { key: 'noScreenBeforeBed', label: 'Mematikan Gadget / HP 30 Menit Sebelum Tidur', type: 'checkbox' },
      { key: 'brushTeeth', label: 'Menggosok Gigi & Berwudhu/Cuci Kaki Tangan', type: 'checkbox' },
      { key: 'nightPray', label: 'Berdoa Sebelum Tidur', type: 'checkbox' }
    ]
  }
};

export const HABIT_LIST = Object.values(HABIT_DEFINITIONS);

export const DEFAULT_REMINDERS: ReminderSetting[] = [
  { habitId: 'bangun_pagi', enabled: true, time: '05:00', sound: true },
  { habitId: 'ibadah', enabled: true, time: '05:30', sound: true },
  { habitId: 'olahraga', enabled: true, time: '06:15', sound: true },
  { habitId: 'makan_sehat', enabled: true, time: '07:00', sound: true },
  { habitId: 'membaca', enabled: true, time: '16:00', sound: true },
  { habitId: 'bermasyarakat', enabled: true, time: '17:30', sound: true },
  { habitId: 'istirahat', enabled: true, time: '21:00', sound: true }
];

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: 'SMP Negeri 2 Kasihan',
  fullName: 'SMP NEGERI 2 KASIHAN',
  npsn: '20400342',
  akreditasi: 'A (Unggul)',
  government: 'PEMERINTAH KABUPATEN BANTUL',
  department: 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
  address: 'Jl. Bibis, Jetis, Tamantirto, Kasihan, Bantul',
  subDistrict: 'Kasihan',
  regency: 'Bantul',
  province: 'D.I. Yogyakarta',
  postalCode: '55183',
  phone: '(0274) 379348',
  email: 'smpn2kasihan@gmail.com',
  website: 'www.smpn2kasihan.sch.id',
  principalName: 'Sugiyarto, S.Pd., M.Pd.',
  principalNip: '19700512 199512 1 002',
  academicYear: '2025/2026',
  semester: 'Genap',
  customLogoUrl: ''
};

export const SCHOOL_CONFIG = DEFAULT_SCHOOL_SETTINGS;

export const DEMO_CLASSES: SchoolClass[] = [
  {
    id: 'class-7a',
    name: '7A (Unggulan)',
    academicYear: '2025/2026',
    teacherId: 'usr-walikelas-1',
    teacherName: 'Ibu Siti Rahmawati, S.Pd.',
    studentCount: 32
  },
  {
    id: 'class-7b',
    name: '7B',
    academicYear: '2025/2026',
    teacherId: 'usr-walikelas-2',
    teacherName: 'Bpk. Budi Santoso, M.Pd.',
    studentCount: 30
  },
  {
    id: 'class-8a',
    name: '8A',
    academicYear: '2025/2026',
    teacherId: 'usr-walikelas-1',
    teacherName: 'Ibu Siti Rahmawati, S.Pd.',
    studentCount: 28
  }
];

export const DEMO_USERS: User[] = [
  {
    id: 'usr-siswa-1',
    name: 'Ahmad Rizky Pratama',
    email: '8923',
    role: 'siswa',
    gender: 'L',
    nis: '8923',
    nisn: '8923',
    attendanceNumber: '01',
    noAbsen: '01',
    classId: 'class-7a',
    className: '7A',
    parentId: 'usr-ortu-1',
    phone: '081234567890',
    avatar: DATA_URI_SISWA_PUTRA,
    password: 'siswa8923',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-siswa-2',
    name: 'Nadia Salsabila Putri',
    email: '8924',
    role: 'siswa',
    gender: 'P',
    nis: '8924',
    nisn: '8924',
    attendanceNumber: '02',
    noAbsen: '02',
    classId: 'class-7a',
    className: '7A',
    parentId: 'usr-ortu-2',
    phone: '081234567891',
    avatar: DATA_URI_SISWA_PUTRI,
    password: 'siswa8924',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-siswa-3',
    name: 'Dimas Bagus Wicaksono',
    email: '8925',
    role: 'siswa',
    gender: 'L',
    nis: '8925',
    nisn: '8925',
    attendanceNumber: '03',
    noAbsen: '03',
    classId: 'class-7a',
    className: '7A',
    parentId: 'usr-ortu-3',
    phone: '081234567892',
    avatar: DATA_URI_SISWA_PUTRA,
    password: 'siswa8925',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-siswa-4',
    name: 'Kirana Zahra Larasati',
    email: '8926',
    role: 'siswa',
    gender: 'P',
    nis: '8926',
    nisn: '8926',
    attendanceNumber: '04',
    noAbsen: '04',
    classId: 'class-7a',
    className: '7A',
    parentId: 'usr-ortu-4',
    phone: '081234567893',
    avatar: DATA_URI_SISWA_PUTRI,
    password: 'siswa8926',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-ortu-1',
    name: 'Bpk. Hendra Pratama (Ortu Ahmad Rizky)',
    email: 'ortu.8923',
    role: 'orangtua',
    studentIds: ['usr-siswa-1'],
    phone: '081398765432',
    avatar: DATA_URI_ORANG_TUA,
    password: 'ortu8923',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-ortu-2',
    name: 'Ibu Ratna Dewi S. (Ortu Nadia Salsabila)',
    email: 'ortu.8924',
    role: 'orangtua',
    studentIds: ['usr-siswa-2'],
    phone: '081398765433',
    avatar: DATA_URI_ORANG_TUA,
    password: 'ortu8924',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-ortu-3',
    name: 'Bpk. Wicaksono (Ortu Dimas Bagus)',
    email: 'ortu.8925',
    role: 'orangtua',
    studentIds: ['usr-siswa-3'],
    phone: '081398765434',
    avatar: DATA_URI_ORANG_TUA,
    password: 'ortu8925',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-ortu-4',
    name: 'Ibu Larasati (Ortu Kirana Zahra)',
    email: 'ortu.8926',
    role: 'orangtua',
    studentIds: ['usr-siswa-4'],
    phone: '081398765435',
    avatar: DATA_URI_ORANG_TUA,
    password: 'ortu8926',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-walikelas-1',
    name: 'Ibu Siti Rahmawati, S.Pd.',
    email: 'wali.7a',
    role: 'walikelas',
    assignedClassIds: ['class-7a', 'class-8a'],
    className: '7A (Wali Kelas)',
    phone: '081122334455',
    avatar: DATA_URI_WALI_KELAS,
    password: 'wali123#Secure',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  },
  {
    id: 'usr-admin-1',
    name: 'Administrator IT Sekolah',
    email: 'admin',
    role: 'admin',
    phone: '081299887766',
    avatar: DATA_URI_ADMIN,
    password: 'admin123#Master',
    schoolName: 'SMP Negeri 2 Kasihan',
    createdAt: '2025-07-15T08:00:00.000Z'
  }
];

export const KATEGORI_CONFIG = {
  belum_terbiasa: {
    label: 'Belum Terbiasa',
    minScore: 0,
    maxScore: 49.9,
    color: 'rose',
    badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    textClass: 'text-rose-600 dark:text-rose-400',
    description: 'Memerlukan pendampingan intensif dari orang tua dan bimbingan wali kelas.'
  },
  mulai_terbiasa: {
    label: 'Mulai Terbiasa',
    minScore: 50,
    maxScore: 79.9,
    color: 'amber',
    badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    textClass: 'text-amber-600 dark:text-amber-400',
    description: 'Menunjukkan perkembangan baik, perlu menjaga konsistensi pada beberapa kebiasaan.'
  },
  sudah_terbiasa: {
    label: 'Sudah Terbiasa / Sangat Terbiasa',
    minScore: 80,
    maxScore: 100,
    color: 'emerald',
    badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    description: 'Pola 7 Kebiasaan Anak Indonesia Hebat telah tertanam kuat dan konsisten setiap hari.'
  }
};
