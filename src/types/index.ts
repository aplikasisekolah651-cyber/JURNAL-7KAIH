export type UserRole = 'siswa' | 'orangtua' | 'walikelas' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: 'L' | 'P'; // Jenis Kelamin: L = Laki-laki, P = Perempuan
  avatar?: string;
  phone?: string;
  nis?: string; // Nomor Induk Siswa (NIS)
  nisn?: string; // Fallback / legacy alias
  attendanceNumber?: string; // Nomor Absen Siswa
  noAbsen?: string; // Alias Nomor Absen
  classId?: string;
  className?: string;
  parentId?: string; // If siswa, links to Orang Tua
  studentIds?: string[]; // If orangtua, links to Siswa
  assignedClassIds?: string[]; // If walikelas, links to Classes
  schoolName?: string;
  password?: string; // Generated password
  createdAt: string;
}

export type HabitId = 
  | 'bangun_pagi'
  | 'ibadah'
  | 'olahraga'
  | 'makan_sehat'
  | 'membaca'
  | 'bermasyarakat'
  | 'istirahat';

export interface HabitDefinition {
  id: HabitId;
  order: number;
  title: string;
  shortName: string;
  tagline: string;
  description: string;
  iconName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  defaultTime: string;
  subTasks: {
    key: string;
    label: string;
    type: 'checkbox' | 'time' | 'text' | 'number' | 'select';
    options?: string[];
    unit?: string;
    placeholder?: string;
    required?: boolean;
  }[];
}

export interface HabitItemData {
  habitId: HabitId;
  completed: boolean;
  time?: string;
  score: number; // 0 to 100
  note?: string;
  values: Record<string, any>; // custom fields e.g., book title, exercise type, water glasses
}

export type HabitKategoriLevel = 'belum_terbiasa' | 'mulai_terbiasa' | 'sudah_terbiasa';

export interface ParentValidation {
  validated: boolean;
  status: 'valid' | 'invalid' | 'pending'; // Benar / Tidak Benar / Menunggu
  validatedAt?: number;
  parentId?: string;
  parentName?: string;
  notes?: string;
  rating?: number; // 1-5
  signatureStatus?: boolean;
  disputedHabits?: HabitId[]; // Kebiasaan yang ditandai tidak sesuai/belum dilakukan di rumah
}

export interface SchoolSettings {
  name: string;
  fullName: string;
  npsn: string;
  akreditasi: string;
  government: string;
  department: string;
  address: string;
  subDistrict: string;
  regency: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  principalNip: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  customLogoUrl?: string;
}

export interface JournalEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentNis?: string;
  studentNisn?: string; // Legacy / alias
  studentAttendanceNo?: string;
  className: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  habits: Record<HabitId, HabitItemData>;
  overallScore: number; // 0 - 100
  completedCount: number; // 0 - 7
  kategoriLevel: HabitKategoriLevel;
  
  // End-to-End Encryption
  isEncrypted: boolean;
  encryptedReflection?: string; // AES-256 encrypted
  decryptedReflection?: string; // In-memory cached
  
  photoProof?: string;
  status: 'draft' | 'submitted' | 'validated' | 'needs_revision';
  
  // Orang Tua Validation
  parentValidation?: ParentValidation;
  
  // Wali Kelas Feedback
  teacherFeedback?: {
    reviewed: boolean;
    reviewedAt?: number;
    teacherId?: string;
    teacherName?: string;
    notes?: string;
    recommendation?: string;
    badgeAwarded?: string;
  };
}

export interface ReminderSetting {
  habitId: HabitId;
  enabled: boolean;
  time: string; // HH:mm
  sound: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  targetRole?: UserRole;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'validation' | 'journal_submitted' | 'teacher_note' | 'reminder' | 'system';
  linkDate?: string;
  studentId?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  academicYear: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
}

export interface ClassAnalysisSummary {
  classId: string;
  className: string;
  totalStudents: number;
  totalEntries: number;
  averageScore: number;
  habitScores: Record<HabitId, number>; // 0 - 100 for each habit
  categoryDistribution: {
    belum_terbiasa: number;
    mulai_terbiasa: number;
    sudah_terbiasa: number;
  };
  topPerformers: {
    studentId: string;
    studentName: string;
    score: number;
    streak: number;
    level: HabitKategoriLevel;
  }[];
  needsAttention: {
    studentId: string;
    studentName: string;
    score: number;
    missedHabits: string[];
    level: HabitKategoriLevel;
  }[];
}
