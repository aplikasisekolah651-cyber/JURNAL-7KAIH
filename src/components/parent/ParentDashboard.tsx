import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  CheckCircle2, 
  Star, 
  Calendar, 
  FileDown, 
  Send, 
  MessageSquare, 
  Award, 
  Clock, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  BarChart3,
  CheckCheck,
  AlertCircle,
  BookOpen,
  Apple,
  Users,
  Moon,
  Sun,
  Dumbbell,
  HeartHandshake,
  ShieldCheck,
  Filter,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import { HABIT_LIST, KATEGORI_CONFIG } from '../../lib/constants';
import { HabitIcon } from '../common/HabitIcon';
import { E2EEBadge } from '../common/E2EEBadge';
import { PDFReportGenerator } from '../../lib/pdfGenerator';
import { audioNotifier } from '../../lib/audioNotifier';
import { getDateString } from '../../lib/mockData';
import { HabitId } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

export const ParentDashboard: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const { 
    journals, 
    validateByParent, 
    getStudentJournals, 
    getStudentStats,
    getStudentJournalByDate
  } = useJournal();

  // Active Tab: 'validation' (Daily Verification) vs 'progress' (Child Progress & Analytics) vs 'history' (Past Logs)
  const [activeTab, setActiveTab] = useState<'validation' | 'progress' | 'history'>('validation');

  // Find students linked to this parent
  const linkedStudents = allUsers.filter(u => 
    u.role === 'siswa' && (u.parentId === currentUser.id || currentUser.studentIds?.includes(u.id))
  );
  
  // Default to first student or first available student if unlinked demo
  const fallbackStudent = allUsers.find(u => u.role === 'siswa');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    linkedStudents[0]?.id || fallbackStudent?.id || ''
  );

  const currentStudent = allUsers.find(u => u.id === selectedStudentId) || fallbackStudent;
  const studentEntries = useMemo(() => {
    return currentStudent ? getStudentJournals(currentStudent.id) : [];
  }, [currentStudent, journals]);

  const stats = useMemo(() => {
    return currentStudent ? getStudentStats(currentStudent.id) : null;
  }, [currentStudent, journals]);

  // Selected date for daily review (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => getDateString(0));
  const currentJournal = useMemo(() => {
    if (!currentStudent) return undefined;
    return getStudentJournalByDate(currentStudent.id, selectedDate) || 
      studentEntries.find(e => e.date === selectedDate);
  }, [currentStudent, selectedDate, studentEntries]);

  // Validation Form State
  const [confirmationMode, setConfirmationMode] = useState<'valid' | 'invalid'>('valid');
  const [validationNote, setValidationNote] = useState('Bagus sekali ananda! Ayah/Ibu sangat bangga dengan kedisiplinan 7 KAIH hari ini.');
  const [rating, setRating] = useState<number>(5);
  const [agreeAllHabits, setAgreeAllHabits] = useState<boolean>(true);
  const [disputedHabits, setDisputedHabits] = useState<HabitId[]>([]);
  const [verifiedHabitMap, setVerifiedHabitMap] = useState<Record<string, boolean>>({
    bangun_pagi: true,
    ibadah: true,
    olahraga: true,
    makan_sehat: true,
    membaca: true,
    bermasyarakat: true,
    istirahat: true
  });
  const [isValidating, setIsValidating] = useState(false);

  // Quick preset feedback messages for VALID (Benar)
  const presetNotesValid = [
    'Bagus sekali ananda! Pertahankan kebiasaan bangun pagi dan ibadah tepat waktu.',
    'Alhamdulillah sangat membanggakan. Terus rajin belajar dan berbuat baik ya!',
    'Ayah/Ibu konfirmasi semua kebiasaan sudah dilakukan dengan jujur dan tertib.',
    'Hebat! Tingkatkan lagi membaca buku dan makan sayur segarnya ya ananda.'
  ];

  // Quick preset feedback messages for INVALID (Tidak Sesuai / Perlu Perbaikan)
  const presetNotesInvalid = [
    'Ananda masih tidur larut malam lewat jam 21.30 dan main gadget, perlu ditingkatkan disiplinnya.',
    'Ibadah subuh dan bangun pagi masih harus dibangunkan berkali-kali, ayo lebih mandiri!',
    'Waktu membaca buku dan belajar belum terpenuhi dengan baik hari ini.',
    'Catatan menu makan belum sesuai dengan yang dimakan di rumah hari ini.'
  ];

  // Pending validation entries
  const pendingEntries = studentEntries.filter(e => e.status === 'submitted' || !e.parentValidation?.validated);

  // Toggle disputed habit
  const toggleDisputedHabit = (hId: HabitId) => {
    setDisputedHabits(prev => 
      prev.includes(hId) ? prev.filter(id => id !== hId) : [...prev, hId]
    );
  };

  // Handle Parent Validation / Approval
  const handleApproveJournal = async (journalId: string) => {
    if (!currentStudent) return;
    setIsValidating(true);
    try {
      if (confirmationMode === 'valid') {
        await validateByParent(
          journalId,
          currentUser,
          validationNote || 'Bagus sekali ananda! Ayah/Ibu konfirmasi kebenaran kebiasaan 7 KAIH hari ini.',
          rating,
          'valid'
        );
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        audioNotifier.playSuccessChime();
      } else {
        await validateByParent(
          journalId,
          currentUser,
          validationNote || 'Ada catatan kebiasaan yang perlu diperbaiki di rumah.',
          0,
          'invalid',
          disputedHabits
        );
        audioNotifier.playReminderChime();
      }
    } catch (e) {
      console.error('Validation error:', e);
    } finally {
      setIsValidating(false);
    }
  };

  // WhatsApp Reminder Link Generator for Parents
  const generateWhatsAppReminderUrl = () => {
    if (!currentStudent) return '#';
    const text = encodeURIComponent(
      `Halo Bapak/Ibu Wali Murid dari ananda ${currentStudent.name} (${currentStudent.className}).\n\n` +
      `Mohon kesediaannya untuk memeriksa & mengonfirmasi Jurnal 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) tanggal ${selectedDate}.\n\n` +
      `Silakan buka aplikasi 7 KAIH di ponsel Bapak/Ibu dan pilih menu "Konfirmasi 7 KAIH Harian".\n\n` +
      `Terima kasih atas kerja sama dan pendampingan karakter ananda di rumah 🙏\n` +
      `SMP Negeri 2 Kasihan, Bantul`
    );
    return `https://wa.me/?text=${text}`;
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!currentStudent) return;
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonth = monthNames[new Date().getMonth()] + ' ' + new Date().getFullYear();
    PDFReportGenerator.generateStudentReport(currentStudent, studentEntries, currentMonth);
  };

  const toggleHabitVerify = (habitId: string) => {
    setVerifiedHabitMap(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                Dashboard Orang Tua / Wali Murid
              </span>
              <E2EEBadge />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, {currentUser.name}! 👨‍👩‍👧
            </h2>
            <p className="text-slate-300 text-xs max-w-xl">
              Lihat 7 Kebiasaan Anak Indonesia Hebat yang telah dilaksanakan ananda, berikan konfirmasi persetujuan/kebenaran, tuliskan catatan bimbingan, dan pantau perkembangan karakternya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {linkedStudents.length > 1 && (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold border border-white/20 outline-none backdrop-blur-md"
              >
                {linkedStudents.map(s => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    Ananda: {s.name}
                  </option>
                ))}
              </select>
            )}

            <button
              id="parent-export-pdf-btn"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all shadow-xs active:scale-95"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-300" />
              <span>Cetak Laporan Perkembangan (PDF)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        {currentStudent && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10 flex items-center gap-2.5">
              <UserAvatar user={currentStudent} gender={currentStudent.gender} size="sm" className="w-9 h-9 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-300 font-medium">Ananda yang Dipantau</span>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">{currentStudent.name}</p>
                <p className="text-[9px] text-rose-200 mt-0.5 truncate">
                  {currentStudent.className} • NIS: {currentStudent.nis || currentStudent.nisn || '-'}
                  {(currentStudent.attendanceNumber || currentStudent.noAbsen) && ` • Absen: ${currentStudent.attendanceNumber || currentStudent.noAbsen}`}
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium">Status Pembiasaan</span>
              <p className="text-xs sm:text-sm font-bold text-emerald-300 mt-0.5">
                {KATEGORI_CONFIG[stats.kategoriLevel].label}
              </p>
              <p className="text-[9px] text-slate-300 mt-0.5">{stats.avgScore}% Kepatuhan Rata-rata</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium">Streak Konsistensi</span>
              <p className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">
                {stats.streak} Hari Beruntun 🔥
              </p>
              <p className="text-[9px] text-slate-300 mt-0.5">Total {stats.completedEntries} jurnal terisi</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-300 font-medium">Menunggu Validasi</span>
              <p className="text-base sm:text-lg font-bold text-rose-300 mt-0.5">
                {pendingEntries.length} Jurnal
              </p>
              <p className="text-[9px] text-rose-200 mt-0.5">Perlu konfirmasi orang tua</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'validation'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Konfirmasi 7 KAIH Harian</span>
          {pendingEntries.length > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] bg-white text-rose-600 font-black rounded-full">
              {pendingEntries.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'progress'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Perkembangan Ananda</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Riwayat ({studentEntries.length})</span>
        </button>
      </div>

      {/* TAB 1: VALIDATION & DAILY 7 KAIH REVIEW */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          {/* Date Selector & Pending Alert Row */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Pilih Tanggal Jurnal:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(getDateString(0))}
                className="px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getDateString(-1))}
                className="px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              >
                Kemarin
              </button>
            </div>

            {/* Quick jump to pending entries if any */}
            {pendingEntries.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  Jurnal Menunggu:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {pendingEntries.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedDate(p.date)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        selectedDate === p.date
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                      }`}
                    >
                      {p.date}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!currentJournal ? (
            <div className="p-8 text-center bg-white dark:bg-[#1E293B] rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Belum Ada Jurnal pada Tanggal {selectedDate}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Ananda {currentStudent?.name} belum menginput jurnal 7 KAIH pada tanggal ini. Silakan pilih tanggal lain atau ingatkan ananda untuk mengisi jurnal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column (2 Cols): 7 Habits Execution Details */}
              <div className="lg:col-span-2 space-y-3">
                {/* Journal Status Header */}
                <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Laporan 7 Kebiasaan Ananda ({currentJournal.date})
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        currentJournal.status === 'validated'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}>
                        {currentJournal.status === 'validated' ? '✓ Telah Divalidasi' : '⏳ Menunggu Validasi'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Keterisian: <span className="font-bold text-slate-800 dark:text-slate-200">{currentJournal.completedCount} dari 7 Kebiasaan Selesai</span> • Skor: <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentJournal.overallScore}%</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Kategori Hasil</span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {KATEGORI_CONFIG[currentJournal.kategoriLevel].label}
                    </span>
                  </div>
                </div>

                {/* 7 Habits Execution Cards */}
                <div className="space-y-2.5">
                  {HABIT_LIST.map((habit) => {
                    const habitData = currentJournal.habits[habit.id] || { completed: false, values: {} };
                    const isDone = habitData.completed;
                    const vals = habitData.values || {};
                    const isVerified = verifiedHabitMap[habit.id];

                    return (
                      <div
                        key={habit.id}
                        className={`rounded-xl border p-3 transition-all ${
                          isDone 
                            ? 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-xs'
                            : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-90'
                        }`}
                      >
                        {/* Habit Title Row */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${habit.badgeBg}`}>
                              <HabitIcon habitId={habit.id} size={15} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {habit.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {habit.tagline}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDone 
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {isDone ? '✓ Dilaksanakan' : '✕ Belum Dilaksanakan'}
                            </span>

                            {/* Individual Verification Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleHabitVerify(habit.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                isVerified
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                              }`}
                              title="Klik untuk konfirmasi kebenaran kebiasaan ini"
                            >
                              <CheckCircle2 className={`w-3 h-3 ${isVerified ? 'text-rose-600' : 'text-slate-400'}`} />
                              <span>{isVerified ? 'Dikonfirmasi Benar' : 'Belum Dicek'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Detailed Execution Output per Habit */}
                        <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                          {/* 1. Bangun Pagi */}
                          {habit.id === 'bangun_pagi' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px]">⏰ Jam Bangun Subuh:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.wakeTime || '04:45'} WIB</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">🙏 Ibadah Pagi / Subuh:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.morningPrayer ? '✓ Dilakukan' : 'Tidak'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">🛏️ Rapikan Tempat Tidur:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.tidyBed ? '✓ Rapi' : 'Belum'}</span>
                              </div>
                            </div>
                          )}

                          {/* 2. Beribadah */}
                          {habit.id === 'ibadah' && (
                            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px] mb-1">🕌 Sholat 5 Waktu:</span>
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    { key: 'prayerFajr', label: 'Subuh' },
                                    { key: 'prayerDhuhr', label: 'Dzuhur' },
                                    { key: 'prayerAsr', label: 'Ashar' },
                                    { key: 'prayerMaghrib', label: 'Maghrib' },
                                    { key: 'prayerIsha', label: 'Isya' }
                                  ].map(p => (
                                    <span 
                                      key={p.key} 
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        vals[p.key] 
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {vals[p.key] ? '✓ ' : ''}{p.label}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">🌙 Puasa / Sholat Sunnah:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {vals.sunnahWorship ? (vals.sunnahDetail || 'Dilaksanakan') : 'Tidak ada'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">📖 Baca Kitab Suci / Tadarus:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {vals.holyBookReading ? (vals.holyBookDetail || 'Dibaca') : 'Tidak ada'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">🤲 Sedekah / Berbagi:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {vals.almsGiving ? (vals.almsDetail || 'Bersedekah') : 'Tidak ada'}
                                  </span>
                                </div>
                              </div>

                              {vals.spiritualNote && (
                                <p className="text-[10px] text-slate-500 italic pt-0.5">
                                  "Doa/Syukur: {vals.spiritualNote}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* 3. Berolahraga */}
                          {habit.id === 'olahraga' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px]">🏃 Jenis Olahraga:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.exerciseType || 'Senam / Jalan Pagi'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">⏱️ Durasi:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.durationMin || 15} Menit</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">💧 Pemanasan & Air:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {vals.warmupDone ? '✓ Pemanasan' : '-'} • {vals.drinkWaterAfter ? '✓ Cukup Air' : '-'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 4. Makan Sehat */}
                          {habit.id === 'makan_sehat' && (
                            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg text-[11px]">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400 block">🌅 Sarapan:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {vals.breakfastCustom || vals.breakfastMenu || (vals.breakfastEaten ? 'Sarapan Sehat' : 'Tidak Sarapan')}
                                  </span>
                                </div>
                                <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400 block">☀️ Makan Siang:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {vals.lunchCustom || vals.lunchMenu || (vals.lunchEaten ? 'Makan Siang Sehat' : 'Belum')}
                                  </span>
                                </div>
                                <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400 block">🌙 Makan Malam:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {vals.dinnerCustom || vals.dinnerMenu || (vals.dinnerEaten ? 'Makan Malam Sehat' : 'Belum')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-600 dark:text-slate-300">
                                <span>🥦 Sayur: <strong className="text-slate-800 dark:text-slate-200">{vals.hasVegetables ? '✓ Ya' : 'Tidak'}</strong></span>
                                <span>🍎 Buah: <strong className="text-slate-800 dark:text-slate-200">{vals.hasFruits ? '✓ Ya' : 'Tidak'}</strong></span>
                                <span>💧 Air Putih: <strong className="text-slate-800 dark:text-slate-200">{vals.waterGlasses || 8} Gelas</strong></span>
                              </div>
                            </div>
                          )}

                          {/* 5. Gemar Belajar */}
                          {habit.id === 'membaca' && (
                            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg text-[11px]">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">📚 Materi / Buku:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{vals.bookTitle || 'Pelajaran Sekolah'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">⏱️ Jam Belajar:</span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">{vals.startTime || '16:00'} - {vals.endTime || '16:45'} WIB</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">📄 Halaman / Bab:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{vals.pageRange || 'Bab 1 - 2'}</span>
                                </div>
                              </div>
                              {vals.summaryInsight && (
                                <p className="text-[10px] text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                  "Intisari: {vals.summaryInsight}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* 6. Bermasyarakat */}
                          {habit.id === 'bermasyarakat' && (
                            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg text-[11px]">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">🤝 Kegiatan Sosial:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{vals.activityName || 'Membantu di Rumah / Lingkungan'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">👥 Dengan Siapa:</span>
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                                    {vals.withWhom || 'Keluarga'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">🌱 Manfaat Kegiatan:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{vals.benefits || 'Mempererat hubungan & lingkungan bersih'}</span>
                                </div>
                              </div>
                              {vals.socialNotes && (
                                <p className="text-[10px] text-slate-500 italic pt-0.5">
                                  "Catatan Kebaikan: {vals.socialNotes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* 7. Istirahat */}
                          {habit.id === 'istirahat' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px]">🌙 Jam Tidur Malam:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.targetSleepTime || '21:00'} WIB</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">📵 Tanpa Gadget 30 Mnt:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.noScreenBeforeBed ? '✓ Patuh' : 'Tidak'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">🙏 Berdoa Sebelum Tidur:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{vals.sleepPrayerDone ? '✓ Berdoa' : 'Tidak'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Child Reflection Card */}
                {currentJournal.decryptedReflection && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                      💬 Catatan Refleksi & Kejujuran Ananda:
                    </span>
                    <p className="italic text-slate-800 dark:text-slate-200">
                      "{currentJournal.decryptedReflection}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column (1 Col): Parent Confirmation & Notes Form */}
              <div className="space-y-3">
                <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sticky top-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Form Konfirmasi Orang Tua / Wali
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Validasi resmi 7 KAIH di lingkungan keluarga
                      </p>
                    </div>
                  </div>

                  {/* Previous Validation Details if already processed */}
                  {currentJournal.parentValidation?.validated && (
                    <div className={`p-2.5 rounded-lg border space-y-1 ${
                      currentJournal.parentValidation.status === 'invalid'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={currentJournal.parentValidation.status === 'invalid' ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}>
                          {currentJournal.parentValidation.status === 'invalid' ? '⚠️ Ditandai Perlu Perbaikan' : '✓ Telah Dikonfirmasi Benar'}
                        </span>
                        {currentJournal.parentValidation.status !== 'invalid' && (
                          <div className="flex items-center text-amber-400">
                            {Array.from({ length: currentJournal.parentValidation.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-800 dark:text-slate-200 italic">
                        "{currentJournal.parentValidation.notes}"
                      </p>
                      <span className="text-[9px] text-slate-500 block pt-0.5">
                        Oleh: {currentJournal.parentValidation.parentName}
                      </span>
                    </div>
                  )}

                  {/* MODE SELECTOR: BENAR vs TIDAK BENAR */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Pilihan Konfirmasi Pelaksanaan:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmationMode('valid');
                          setValidationNote('Bagus sekali ananda! Ayah/Ibu sangat bangga dengan kedisiplinan 7 KAIH hari ini.');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          confirmationMode === 'valid'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>BENAR (Disetujui)</span>
                        <span className="text-[9px] font-normal opacity-90">Sesuai fakta di rumah</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmationMode('invalid');
                          setValidationNote('Ada beberapa kebiasaan yang belum sesuai di rumah dan perlu bimbingan.');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          confirmationMode === 'invalid'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>TIDAK (Perlu Koreksi)</span>
                        <span className="text-[9px] font-normal opacity-90">Ada yang tidak sesuai</span>
                      </button>
                    </div>
                  </div>

                  {/* FORM BODY FOR 'BENAR' */}
                  {confirmationMode === 'valid' && (
                    <div className="space-y-3 pt-1">
                      {/* Confirmation Statement Checkbox */}
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={agreeAllHabits}
                            onChange={(e) => setAgreeAllHabits(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-0.5"
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            Saya menyatakan bahwa 7 kebiasaan di atas benar telah dilaksanakan ananda di rumah secara jujur.
                          </span>
                        </label>
                      </div>

                      {/* Rating Stars Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Beri Apresiasi Bintang:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-1">
                            {rating === 5 ? 'Sangat Membanggakan! 🌟' : rating >= 4 ? 'Bagus Sekali! 👍' : 'Cukup Baik'}
                          </span>
                        </div>
                      </div>

                      {/* Preset Feedback Chips */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Pilihan Cepat Catatan Apresiasi:
                        </label>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                          {presetNotesValid.map((note, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setValidationNote(note)}
                              className="w-full text-left p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              💬 {note}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORM BODY FOR 'TIDAK' (INVALID / CORRECTION) */}
                  {confirmationMode === 'invalid' && (
                    <div className="space-y-3 pt-1">
                      <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                          Pilih Kebiasaan yang Belum Sesuai di Rumah:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                          {HABIT_LIST.map((h) => {
                            const isDisputed = disputedHabits.includes(h.id);
                            return (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => toggleDisputedHabit(h.id)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold text-left border flex items-center justify-between transition-all ${
                                  isDisputed
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <span>{h.title}</span>
                                <span>{isDisputed ? '✕ Belum' : '+'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Preset Feedback Chips for Correction */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Pilihan Cepat Catatan Evaluasi:
                        </label>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                          {presetNotesInvalid.map((note, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setValidationNote(note)}
                              className="w-full text-left p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              ⚠️ {note}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes Textarea */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {confirmationMode === 'valid' ? 'Catatan Apresiasi Orang Tua:' : 'Catatan Bimbingan / Koreksi:'}
                    </label>
                    <textarea
                      rows={3}
                      value={validationNote}
                      onChange={(e) => setValidationNote(e.target.value)}
                      placeholder={confirmationMode === 'valid' ? "Tuliskan apresiasi orang tua..." : "Jelaskan hal yang perlu diperbaiki ananda..."}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  {/* Submit Confirmation Button */}
                  <button
                    id="btn-submit-parent-validation"
                    type="button"
                    disabled={isValidating || (confirmationMode === 'valid' && !agreeAllHabits)}
                    onClick={() => handleApproveJournal(currentJournal.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] ${
                      confirmationMode === 'valid' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {confirmationMode === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                      {isValidating 
                        ? 'Menyimpan Konfirmasi...' 
                        : confirmationMode === 'valid'
                          ? 'Konfirmasi BENAR (Disetujui)'
                          : 'Kirim Catatan TIDAK SESUAI / PERBAIKAN'
                      }
                    </span>
                  </button>

                  {/* INFO SOP: JIKA BELUM ADA KONFIRMASI */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        SOP: Jika Belum Ada Konfirmasi
                      </span>
                      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                        1. Jurnal tetap tercatat dan tersimpan dengan status <em>"Menunggu Validasi"</em>.
                      </p>
                      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                        2. Wali Kelas memantau daftar jurnal yang belum divalidasi dan dapat mengirimkan pengingat ramah via WhatsApp.
                      </p>
                      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                        3. Orang tua dapat mengonfirmasi kapan saja (bisa menyusul) melalui smartphone.
                      </p>
                    </div>

                    <a
                      href={generateWhatsAppReminderUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                      <span>Kirim Pengingat WhatsApp ke HP Orang Tua</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROGRESS & ANALYTICS (PERKEMBANGAN ANAK) */}
      {activeTab === 'progress' && stats && (
        <div className="space-y-4">
          {/* Progress KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-medium">Rata-Rata Kepatuhan 7 KAIH</span>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                {stats.avgScore}%
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                Level: {KATEGORI_CONFIG[stats.kategoriLevel].label}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-medium">Streak Kedisiplinan</span>
              <p className="text-xl sm:text-2xl font-black text-amber-500 mt-0.5">
                {stats.streak} Hari 🔥
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Tanpa terputus berturut-turut
              </p>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-medium">Total Jurnal Tervalidasi</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {studentEntries.filter(e => e.status === 'validated').length} / {studentEntries.length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Jurnal tersimpan & terverifikasi
              </p>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-medium">Apresiasi Guru & Sekolah</span>
              <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                {studentEntries.filter(e => e.teacherFeedback).length} Catatan
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Bimbingan wali kelas aktif
              </p>
            </div>
          </div>

          {/* Charts Row: Weekly Trend Bar/Line + Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly Trend Chart */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Tren Skor Perkembangan 7 Hari Terakhir
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Grafik persentase penyelesaian kebiasaan harian ananda
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Target: &gt;80%
                </span>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#64748b" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Skor Kepatuhan']}
                      labelFormatter={(label) => `Hari ${label}`}
                    />
                    <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Habit Balance Radar Chart */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Radar Keseimbangan 7 Pilar KAIH
                </h3>
                <p className="text-[10px] text-slate-500">
                  Konsistensi ananda pada masing-masing dimensi karakter
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.habitRadar}>
                    <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.35} />
                    <PolarAngleAxis dataKey="habit" stroke="#64748b" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={7} />
                    <Radar
                      name="Konsistensi"
                      dataKey="score"
                      stroke="#e11d48"
                      fill="#e11d48"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown Table: Consistency per Habit */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Evaluasi Rinci Tiap Pilar Kebiasaan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {HABIT_LIST.map((h) => {
                const habitStat = stats.habitRadar.find(r => r.habit === h.shortName);
                const score = habitStat?.score || 80;
                return (
                  <div 
                    key={h.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <HabitIcon habitId={h.id} size={14} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {h.title}
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {score}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${score}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {score >= 80 ? '🌟 Sangat konsisten dilakukan di rumah' : 'Memerlukan pendampingan orang tua'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wali Kelas Periodic Guidance */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Bimbingan & Rekomendasi dari Wali Kelas
              </h3>
            </div>

            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                "Ananda {currentStudent?.name} menunjukkan perkembangan karakter yang sangat membanggakan di sekolah. Kerjasama yang baik antara orang tua di rumah dan guru di sekolah menghasilkan pembiasaan positif yang konsisten."
              </p>
              <div className="flex items-center justify-between text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold pt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                <span>Ibu Siti Rahmawati, S.Pd. • Wali Kelas {currentStudent?.className}</span>
                <span>Evaluasi Karakter 7 KAIH</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORICAL LOGS (RIWAYAT JURNAL) */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Arsip Seluruh Jurnal Ananda ({studentEntries.length} Jurnal)
            </h3>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold"
            >
              <FileDown className="w-3 h-3" /> Unduh Laporan PDF
            </button>
          </div>

          <div className="space-y-2">
            {studentEntries.map((j) => (
              <div
                key={j.id}
                onClick={() => {
                  setSelectedDate(j.date);
                  setActiveTab('validation');
                }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Tanggal {j.date}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                      j.status === 'validated'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {j.status === 'validated' ? '✓ Tervalidasi' : '⏳ Menunggu Validasi'}
                    </span>
                    {j.parentValidation?.rating && (
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: j.parentValidation.rating }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-current" />
                        ))}
                      </div>
                    )}
                  </div>

                  {j.parentValidation?.notes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                      Catatan Orang Tua: "{j.parentValidation.notes}"
                    </p>
                  )}

                  {/* Habit tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {HABIT_LIST.map((h) => {
                      const done = j.habits[h.id]?.completed;
                      return (
                        <span
                          key={h.id}
                          className={`px-1.5 py-0.2 rounded text-[9px] font-medium ${
                            done
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {done ? '✓ ' : ''}{h.shortName}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">
                    {j.overallScore}%
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {j.completedCount}/7 Selesai
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
