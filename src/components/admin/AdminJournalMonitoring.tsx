import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Eye, 
  Download, 
  Printer, 
  UserCheck, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  FileSpreadsheet, 
  X, 
  Star, 
  Image as ImageIcon,
  Check,
  RotateCcw,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { useAuth } from '../../context/AuthContext';
import { useSchoolSettings } from '../../context/SchoolContext';
import { JournalEntry, HabitId, User } from '../../types';
import { HABIT_DEFINITIONS } from '../../lib/constants';
import { PDFReportGenerator } from '../../lib/pdfGenerator';
import { UserAvatar } from '../common/UserAvatar';
import * as XLSX from 'xlsx';

const HABIT_KEYS: HabitId[] = [
  'bangun_pagi',
  'ibadah',
  'olahraga',
  'makan_sehat',
  'membaca',
  'bermasyarakat',
  'istirahat'
];

export const AdminJournalMonitoring: React.FC = () => {
  const { journals, deleteJournal, deleteJournalsBulk, clearAllJournals } = useJournal();
  const { allUsers } = useAuth();
  const { schoolSettings } = useSchoolSettings();

  // Dynamic class options derived strictly from active students
  const { availableClasses, classDetails, totalStudentsCount } = useMemo(() => {
    const classCountMap = new Map<string, number>();
    const students = allUsers.filter(u => u.role === 'siswa');
    
    students.forEach(s => {
      if (s.className && s.className.trim()) {
        const cName = s.className.trim();
        classCountMap.set(cName, (classCountMap.get(cName) || 0) + 1);
      }
    });

    // Also include classes present in journals if not yet in map
    journals.forEach(j => {
      if (j.className && j.className.trim() && !classCountMap.has(j.className.trim())) {
        classCountMap.set(j.className.trim(), 0);
      }
    });

    if (classCountMap.size === 0) {
      ['7A', '7B', '8A', '9A'].forEach(c => classCountMap.set(c, 0));
    }

    const sortedClassNames = Array.from(classCountMap.keys()).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    const details = sortedClassNames.map(clsName => ({
      name: clsName,
      count: classCountMap.get(clsName) || 0
    }));

    return {
      availableClasses: sortedClassNames,
      classDetails: details,
      totalStudentsCount: students.length
    };
  }, [allUsers, journals]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'validated' | 'unvalidated' | 'reviewed'>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Journals for Bulk Action
  const [selectedJournalIds, setSelectedJournalIds] = useState<string[]>([]);

  // Detail Modal State
  const [activeJournalDetail, setActiveJournalDetail] = useState<JournalEntry | null>(null);

  // Delete Modals
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [deleteSingleModal, setDeleteSingleModal] = useState<{ open: boolean; journal: JournalEntry | null }>({
    open: false,
    journal: null
  });
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Today Date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered Journals calculation
  const filteredJournals = useMemo(() => {
    return journals.filter(j => {
      const studentUser = allUsers.find(u => u.id === j.studentId || u.name === j.studentName);
      const studentClass = (j.className || studentUser?.className || '').trim();

      // 1. Search Query (student name, nisn, nis, class)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        j.studentName.toLowerCase().includes(q) ||
        (j.studentNis && j.studentNis.toLowerCase().includes(q)) ||
        (j.studentNisn && j.studentNisn.toLowerCase().includes(q)) ||
        (studentUser?.nis && studentUser.nis.toLowerCase().includes(q)) ||
        (studentClass && studentClass.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Class Filter (exact match on student's class or journal's class)
      if (selectedClass !== 'all') {
        const targetClassLower = selectedClass.toLowerCase().trim();
        const effectiveClassLower = studentClass.toLowerCase().trim();
        if (effectiveClassLower !== targetClassLower && j.className?.toLowerCase().trim() !== targetClassLower) {
          return false;
        }
      }

      // 3. Date Filter
      if (dateFilterMode === 'today') {
        if (j.date !== todayStr) return false;
      } else if (dateFilterMode === '7days') {
        const jTime = new Date(j.date).getTime();
        const now = new Date().getTime();
        const diffDays = (now - jTime) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < -1) return false;
      } else if (dateFilterMode === 'month') {
        const currentMonth = todayStr.substring(0, 7); // YYYY-MM
        if (!j.date.startsWith(currentMonth)) return false;
      } else if (dateFilterMode === 'custom' && customDate) {
        if (j.date !== customDate) return false;
      }

      // 4. Verification Filter
      if (verificationFilter === 'validated') {
        if (!j.parentValidation?.validated) return false;
      } else if (verificationFilter === 'unvalidated') {
        if (j.parentValidation?.validated) return false;
      } else if (verificationFilter === 'reviewed') {
        if (!j.teacherFeedback?.reviewed) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort newest date & timestamp first
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [journals, allUsers, searchQuery, selectedClass, dateFilterMode, customDate, verificationFilter, todayStr]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedJournalIds([]);
  }, [searchQuery, selectedClass, dateFilterMode, customDate, verificationFilter, pageSize]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredJournals.length / pageSize) || 1;
  const paginatedJournals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredJournals.slice(startIndex, startIndex + pageSize);
  }, [filteredJournals, currentPage, pageSize]);

  // Multi-select handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJournalIds(paginatedJournals.map(j => j.id));
    } else {
      setSelectedJournalIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedJournalIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelectedOnPage = paginatedJournals.length > 0 && paginatedJournals.every(j => selectedJournalIds.includes(j.id));

  // Statistics calculation
  const stats = useMemo(() => {
    const total = journals.length;
    const todayCount = journals.filter(j => j.date === todayStr).length;
    const validatedCount = journals.filter(j => j.parentValidation?.validated).length;
    const validatedPercent = total > 0 ? Math.round((validatedCount / total) * 100) : 0;
    
    let totalCompletedHabits = 0;
    journals.forEach(j => {
      totalCompletedHabits += (j.completedCount || 0);
    });
    const avgHabits = total > 0 ? (totalCompletedHabits / total).toFixed(1) : '0';

    return {
      total,
      todayCount,
      validatedPercent,
      avgHabits
    };
  }, [journals, todayStr]);

  // Export to Excel handler
  const handleExportToExcel = () => {
    const targetData = selectedJournalIds.length > 0 
      ? filteredJournals.filter(j => selectedJournalIds.includes(j.id))
      : filteredJournals;

    if (targetData.length === 0) return;

    const rows = targetData.map((j, idx) => {
      const studentUser = allUsers.find(u => u.id === j.studentId || u.name === j.studentName);
      const studentNis = j.studentNis || j.studentNisn || studentUser?.nis || studentUser?.nisn || '-';
      const studentAbsen = j.studentAttendanceNo || studentUser?.attendanceNumber || studentUser?.noAbsen || '-';

      return {
        'No': idx + 1,
        'Tanggal Jurnal': j.date,
        'Nama Siswa': j.studentName,
        'NIS': studentNis,
        'No. Absen': studentAbsen,
        'Kelas': j.className,
        'Skor Jurnal (%)': j.overallScore || 0,
        'Kebiasaan Selesai': `${j.completedCount || 0} / 7`,
        '1. Bangun Pagi': j.habits?.bangun_pagi?.completed ? 'Ya' : 'Tidak',
        '2. Beribadah': j.habits?.ibadah?.completed ? 'Ya' : 'Tidak',
        '3. Berolahraga': j.habits?.olahraga?.completed ? 'Ya' : 'Tidak',
        '4. Makan Sehat': j.habits?.makan_sehat?.completed ? 'Ya' : 'Tidak',
        '5. Gemar Belajar': j.habits?.membaca?.completed ? 'Ya' : 'Tidak',
        '6. Bermasyarakat': j.habits?.bermasyarakat?.completed ? 'Ya' : 'Tidak',
        '7. Istirahat Cukup': j.habits?.istirahat?.completed ? 'Ya' : 'Tidak',
        'Status Validasi Ortu': j.parentValidation?.validated ? 'Sudah Diverifikasi' : 'Belum Diverifikasi',
        'Nama Orang Tua': j.parentValidation?.parentName || '-',
        'Rating Ortu (1-5)': j.parentValidation?.rating || '-',
        'Catatan Orang Tua': j.parentValidation?.notes || '-',
        'Review Wali Kelas': j.teacherFeedback?.reviewed ? 'Sudah Direview' : 'Belum',
        'Catatan Wali Kelas': j.teacherFeedback?.notes || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RekapJurnal7KAIH');
    XLSX.writeFile(wb, `Rekap_Jurnal_Siswa_7KAIH_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print individual student PDF
  const handlePrintStudentPDF = (journal: JournalEntry) => {
    const studentUser = allUsers.find(u => u.id === journal.studentId) || {
      id: journal.studentId,
      name: journal.studentName,
      email: journal.studentNisn || 'siswa',
      role: 'siswa' as const,
      className: journal.className,
      nisn: journal.studentNisn,
      createdAt: new Date().toISOString()
    };

    const sJournals = journals.filter(j => j.studentId === journal.studentId);
    PDFReportGenerator.generateStudentReport(
      studentUser,
      sJournals,
      journal.date.substring(0, 7),
      undefined,
      schoolSettings
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Monitoring Real-Time</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Database Real-Time Terhubung</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-300" />
              <span>Pemantauan Jurnal Siswa</span>
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl">
              Pantau seluruh aktivitas kebiasaan harian yang diisi oleh siswa dari semua kelas, verifikasi orang tua, dan catatan tindak lanjut wali kelas secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportToExcel}
              disabled={filteredJournals.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Unduh Rekap Jurnal ke Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel ({selectedJournalIds.length > 0 ? selectedJournalIds.length : filteredJournals.length})</span>
            </button>
            <button
              onClick={() => setShowClearAllModal(true)}
              disabled={journals.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Kosongkan Seluruh Data Monitoring Jurnal"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Monitoring ({journals.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">Total Jurnal Masuk</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">Jurnal Hari Ini</p>
            <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400">{stats.todayCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">Rata-rata Kebiasaan</p>
            <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.avgHabits} / 7</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">Verifikasi Orang Tua</p>
            <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">{stats.validatedPercent}%</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa, NISN, kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">Semua Kelas ({totalStudentsCount} Siswa)</option>
              {classDetails.map(cls => (
                <option key={cls.name} value={cls.name}>
                  Kelas {cls.name} ({cls.count} Siswa)
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
              <option value="custom">Pilih Tanggal Spesifik</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Status Validasi</option>
              <option value="validated">Sudah Diverifikasi Ortu</option>
              <option value="unvalidated">Belum Diverifikasi Ortu</option>
              <option value="reviewed">Telah Direview Wali Kelas</option>
            </select>
          </div>
        </div>

        {/* Quick Class Pills Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-purple-500" />
            <span>Pilihan Kelas:</span>
          </span>
          <button
            onClick={() => setSelectedClass('all')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              selectedClass === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua Kelas ({totalStudentsCount})
          </button>
          {classDetails.map(cls => (
            <button
              key={cls.name}
              onClick={() => setSelectedClass(cls.name)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedClass === cls.name
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Kelas {cls.name} <span className="opacity-75 font-normal">({cls.count})</span>
            </button>
          ))}
        </div>

        {/* Custom Date Picker (if selected) */}
        {dateFilterMode === 'custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold">Tentukan Tanggal:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Active Selection Banner */}
        {selectedJournalIds.length > 0 && (
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-purple-700 dark:text-purple-300">
              Terpilih: {selectedJournalIds.length} Jurnal Siswa
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportToExcel}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Unduh Terpilih ({selectedJournalIds.length})</span>
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-500 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus Terpilih ({selectedJournalIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedJournalIds([])}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-[11px] cursor-pointer"
              >
                Batal Pilih
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table of Journals */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[9px] font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelectedOnPage}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">Siswa & Kelas</th>
                <th className="p-3">Tanggal Jurnal</th>
                <th className="p-3 text-center">Progress 7 KAIH</th>
                <th className="p-3 text-center">Skor & Level</th>
                <th className="p-3">Validasi Orang Tua</th>
                <th className="p-3">Review Wali Kelas</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedJournals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-purple-600 dark:text-purple-400" />
                    {journals.length === 0 ? (
                      <>
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Data Monitoring Masih Kosong</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Belum ada catatan jurnal kebiasaan siswa. Data monitoring akan terisi secara otomatis dan real-time saat siswa mulai mengisi jurnal 7 KAIH harian.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">Tidak ada data jurnal yang sesuai dengan filter</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kriteria tanggal, kelas, atau kata kunci pencarian.</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedJournals.map((journal) => {
                  const isSelected = selectedJournalIds.includes(journal.id);
                  const parentVal = journal.parentValidation;
                  const teacherRev = journal.teacherFeedback;
                  const studentUser = allUsers.find(u => u.id === journal.studentId || u.name === journal.studentName);

                  return (
                    <tr 
                      key={journal.id} 
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(journal.id)}
                          className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>

                      {/* Student Info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            user={studentUser}
                            gender={studentUser?.gender}
                            size="sm"
                            className="w-8 h-8 rounded-lg shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white hover:text-purple-600 transition-colors cursor-pointer" onClick={() => setActiveJournalDetail(journal)}>
                              {journal.studentName}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="font-mono text-slate-500 dark:text-slate-400">
                                NIS: {journal.studentNis || journal.studentNisn || studentUser?.nis || studentUser?.nisn || '-'}
                              </span>
                              {(journal.studentAttendanceNo || studentUser?.attendanceNumber || studentUser?.noAbsen) && (
                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                  • No. {journal.studentAttendanceNo || studentUser?.attendanceNumber || studentUser?.noAbsen}
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                {journal.className}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3">
                        <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                          {journal.date}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {journal.date === todayStr ? 'Hari Ini' : 'Arsip'}
                        </span>
                      </td>

                      {/* 7 KAIH Checklist Icons */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
                          {HABIT_KEYS.map((k, idx) => {
                            const isDone = journal.habits?.[k]?.completed;
                            const hDef = HABIT_DEFINITIONS[k];
                            return (
                              <span
                                key={k}
                                title={`${hDef.title}: ${isDone ? 'Sudah Dilakukan' : 'Belum'}`}
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          {journal.completedCount || 0} / 7 Kebiasaan
                        </p>
                      </td>

                      {/* Score & Level */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${
                          (journal.overallScore || 0) >= 80
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                            : (journal.overallScore || 0) >= 60
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                        }`}>
                          {journal.overallScore || 0}%
                        </span>
                      </td>

                      {/* Parent Validation */}
                      <td className="p-3">
                        {parentVal?.validated ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>Divalidasi Ortu</span>
                            </span>
                            {parentVal.parentName && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                                {parentVal.parentName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Menunggu</span>
                          </span>
                        )}
                      </td>

                      {/* Teacher Review */}
                      <td className="p-3">
                        {teacherRev?.reviewed ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <UserCheck className="w-3 h-3" />
                              <span>Direview</span>
                            </span>
                            {teacherRev.teacherName && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                                {teacherRev.teacherName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum direview</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setActiveJournalDetail(journal)}
                            title="Lihat Detail Lengkap Jurnal"
                            className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/80 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintStudentPDF(journal)}
                            title="Cetak Laporan PDF Siswa"
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSingleModal({ open: true, journal })}
                            title="Hapus Data Jurnal Ini"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>
              Menampilkan <strong>{filteredJournals.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> - <strong>{Math.min(currentPage * pageSize, filteredJournals.length)}</strong> dari <strong>{filteredJournals.length}</strong> jurnal
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {activeJournalDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={allUsers.find(u => u.id === activeJournalDetail.studentId || u.name === activeJournalDetail.studentName)}
                  size="md"
                  className="w-10 h-10 rounded-xl shrink-0"
                />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Detail Jurnal Harian 7 KAIH</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeJournalDetail.studentName} ({activeJournalDetail.className}) • Tanggal: <strong>{activeJournalDetail.date}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveJournalDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Score and Stats summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center">
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Skor Hari Ini</p>
                  <p className="text-xl font-black text-purple-700 dark:text-purple-300">{activeJournalDetail.overallScore || 0}%</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Kebiasaan Selesai</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{activeJournalDetail.completedCount || 0} / 7</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Status Validasi</p>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {activeJournalDetail.parentValidation?.validated ? 'Valid Ortu' : 'Belum Valid'}
                  </p>
                </div>
              </div>

              {/* 7 Habits Detail Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Rincian 7 Kebiasaan:</h4>
                <div className="space-y-2">
                  {HABIT_KEYS.map((k) => {
                    const item = activeJournalDetail.habits?.[k];
                    const def = HABIT_DEFINITIONS[k];
                    const isDone = item?.completed;

                    return (
                      <div 
                        key={k} 
                        className={`p-3 rounded-xl border transition-all ${
                          isDone 
                            ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800' 
                            : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isDone ? 'bg-emerald-500 text-white' : 'bg-rose-400 text-white'
                            }`}>
                              {isDone ? '✓' : '✗'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{def.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDone ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {isDone ? 'Terlaksana' : 'Tidak Terlaksana'}
                          </span>
                        </div>

                        {/* Values breakdown if done */}
                        {isDone && item?.values && Object.keys(item.values).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-1.5">
                            {Object.entries(item.values).map(([vKey, vVal]) => {
                              if (vVal === undefined || vVal === null || vVal === '') return null;
                              return (
                                <span key={vKey} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                                  <strong>{vKey}:</strong> {typeof vVal === 'boolean' ? (vVal ? 'Ya' : 'Tidak') : String(vVal)}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reflection & Photo Proof */}
              {activeJournalDetail.decryptedReflection && (
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <p className="font-bold text-purple-700 dark:text-purple-300 text-[11px] mb-1">Refleksi Diri Siswa (E2EE):</p>
                  <p className="text-slate-700 dark:text-slate-300 italic">"{activeJournalDetail.decryptedReflection}"</p>
                </div>
              )}

              {/* Photo Proof */}
              {activeJournalDetail.photoProof && (
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Dokumentasi Foto Kebiasaan:</span>
                  </p>
                  <img 
                    src={activeJournalDetail.photoProof} 
                    alt="Bukti Kebiasaan" 
                    className="w-full max-h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700" 
                  />
                </div>
              )}

              {/* Parent Validation Section */}
              {activeJournalDetail.parentValidation && (
                <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Paraf & Catatan Orang Tua:</span>
                    </p>
                    {activeJournalDetail.parentValidation.rating && (
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: activeJournalDetail.parentValidation.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-500" />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {activeJournalDetail.parentValidation.notes || 'Telah diverifikasi sesuai oleh orang tua di rumah.'}
                  </p>
                </div>
              )}

              {/* Teacher Feedback Section */}
              {activeJournalDetail.teacherFeedback?.reviewed && (
                <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-1.5">
                  <p className="font-bold text-blue-700 dark:text-blue-300 text-[11px] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Catatan Wali Kelas:</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {activeJournalDetail.teacherFeedback.notes || 'Catatan telah ditinjau oleh wali kelas.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => handlePrintStudentPDF(activeJournalDetail)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Laporan PDF</span>
              </button>
              <button
                onClick={() => setActiveJournalDetail(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Kosongkan Seluruh Data Monitoring */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Kosongkan Data Monitoring?
                </h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Seluruh data jurnal siswa ({journals.length} entri jurnal) pada tabel pemantauan akan dihapus dan dikosongkan. Sistem akan kembali dalam kondisi bersih siap menerima data baru dari siswa.
            </p>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300">
              <p className="font-bold">⚠️ Perhatian:</p>
              <p>Data akun siswa, orang tua, dan wali kelas tetap aman dan tidak akan terhapus.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                disabled={isClearingAll}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={async () => {
                  setIsClearingAll(true);
                  try {
                    await clearAllJournals();
                    setSelectedJournalIds([]);
                    setShowClearAllModal(false);
                  } catch (e) {
                    console.error('Failed to clear journals:', e);
                  } finally {
                    setIsClearingAll(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isClearingAll ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengosongkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Kosongkan Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Terpilih */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Hapus {selectedJournalIds.length} Jurnal Terpilih?
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan data massal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{selectedJournalIds.length}</strong> data jurnal yang telah dipilih? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeletingBulk}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={async () => {
                  setIsDeletingBulk(true);
                  try {
                    await deleteJournalsBulk(selectedJournalIds);
                    setSelectedJournalIds([]);
                    setShowBulkDeleteModal(false);
                  } catch (e) {
                    console.error('Failed to bulk delete journals:', e);
                  } finally {
                    setIsDeletingBulk(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingBulk ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus {selectedJournalIds.length} Jurnal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Single Jurnal */}
      {deleteSingleModal.open && deleteSingleModal.journal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Hapus Data Jurnal?
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hapus jurnal milik siswa <strong>{deleteSingleModal.journal.studentName}</strong> (Kelas {deleteSingleModal.journal.className}) untuk tanggal <strong>{deleteSingleModal.journal.date}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteSingleModal({ open: false, journal: null })}
                disabled={isDeletingSingle}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={async () => {
                  if (!deleteSingleModal.journal) return;
                  setIsDeletingSingle(true);
                  try {
                    await deleteJournal(deleteSingleModal.journal.id);
                    setSelectedJournalIds(prev => prev.filter(id => id !== deleteSingleModal.journal?.id));
                    setDeleteSingleModal({ open: false, journal: null });
                  } catch (e) {
                    console.error('Failed to delete journal:', e);
                  } finally {
                    setIsDeletingSingle(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingSingle ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
