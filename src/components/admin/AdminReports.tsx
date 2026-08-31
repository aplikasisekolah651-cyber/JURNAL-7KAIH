import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  GraduationCap, 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  ChevronRight, 
  Sparkles,
  BarChart3,
  Layers,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import { useSchoolSettings } from '../../context/SchoolContext';
import { PDFReportGenerator } from '../../lib/pdfGenerator';
import { HABIT_LIST, KATEGORI_CONFIG } from '../../lib/constants';
import { User, HabitKategoriLevel } from '../../types';
import { audioNotifier } from '../../lib/audioNotifier';

interface AdminReportsProps {
  onSelectStudent?: (student: User) => void;
}

const MONTH_OPTIONS = [
  'Januari 2026',
  'Februari 2026',
  'Maret 2026',
  'April 2026',
  'Mei 2026',
  'Juni 2026',
  'Juli 2026',
  'Agustus 2026',
  'September 2026',
  'Oktober 2026',
  'November 2026',
  'Desember 2026'
];

export const AdminReports: React.FC<AdminReportsProps> = () => {
  const { allUsers } = useAuth();
  const { journals, getStudentJournals, getClassAnalysis } = useJournal();
  const { schoolSettings } = useSchoolSettings();

  const [activeTab, setActiveTab] = useState<'individual' | 'collective'>('individual');
  const [selectedMonth, setSelectedMonth] = useState<string>('Agustus 2026');
  
  // Individual Report States
  const [selectedClassForIndiv, setSelectedClassForIndiv] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customTeacherNote, setCustomTeacherNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Collective Report States
  const [selectedClassForCollect, setSelectedClassForCollect] = useState<string>('7A');

  const students = useMemo(() => allUsers.filter(u => u.role === 'siswa'), [allUsers]);
  const teachers = useMemo(() => allUsers.filter(u => u.role === 'walikelas'), [allUsers]);

  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach(s => {
      if (s.className && s.className.trim()) classSet.add(s.className.trim());
    });
    if (classSet.size === 0) {
      return ['7A', '7B', '8A', '9A'];
    }
    return Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [students]);

  // Keep selected collective class in sync with available classes
  useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.includes(selectedClassForCollect)) {
      setSelectedClassForCollect(availableClasses[0]);
    }
  }, [availableClasses, selectedClassForCollect]);

  // Filtered Students for Individual Mode
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClassForIndiv === 'all' || s.className === selectedClassForIndiv;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.nisn && s.nisn.includes(searchQuery));
      return matchClass && matchSearch;
    });
  }, [students, selectedClassForIndiv, searchQuery]);

  // Selected Student Data
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return filteredStudents[0] || students[0];
    return students.find(s => s.id === selectedStudentId) || students[0];
  }, [selectedStudentId, filteredStudents, students]);

  const selectedStudentJournals = useMemo(() => {
    if (!selectedStudent) return [];
    return getStudentJournals(selectedStudent.id);
  }, [selectedStudent, getStudentJournals, journals]);

  const selectedStudentStats = useMemo(() => {
    const totalDays = selectedStudentJournals.length;
    const avgScore = totalDays > 0 
      ? Math.round(selectedStudentJournals.reduce((acc, curr) => acc + curr.overallScore, 0) / totalDays)
      : 0;

    let kategori: HabitKategoriLevel = 'belum_terbiasa';
    if (avgScore >= 80) kategori = 'sudah_terbiasa';
    else if (avgScore >= 50) kategori = 'mulai_terbiasa';

    const validatedCount = selectedStudentJournals.filter(j => j.status === 'validated').length;
    const validationRate = totalDays > 0 ? Math.round((validatedCount / totalDays) * 100) : 0;

    return { totalDays, avgScore, kategori, validatedCount, validationRate };
  }, [selectedStudentJournals]);

  // Export Individual Student PDF
  const handlePrintIndividualPDF = (targetStudent: User) => {
    const sJournals = getStudentJournals(targetStudent.id);
    setIsExporting(true);
    try {
      PDFReportGenerator.generateStudentReport(
        targetStudent,
        sJournals,
        selectedMonth,
        customTeacherNote || undefined,
        schoolSettings
      );
      audioNotifier.playSuccessChime();
    } catch (err) {
      console.error('Error exporting student report:', err);
      alert('Gagal membuat dokumen PDF laporan siswa.');
    } finally {
      setIsExporting(false);
    }
  };

  // Collective Class Data
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClassForCollect);
  }, [students, selectedClassForCollect]);

  const classTeacher = useMemo(() => {
    const teacher = teachers.find(t => t.className?.includes(selectedClassForCollect));
    return teacher?.name || 'Wali Kelas ' + selectedClassForCollect;
  }, [teachers, selectedClassForCollect]);

  const classAnalysis = useMemo(() => {
    const studentIds = classStudents.map(s => s.id);
    return getClassAnalysis(selectedClassForCollect, studentIds);
  }, [selectedClassForCollect, classStudents, getClassAnalysis, journals]);

  const classStudentRows = useMemo(() => {
    return classStudents.map(student => {
      const sJournals = getStudentJournals(student.id);
      const totalCount = sJournals.length;
      const avgScore = totalCount > 0 
        ? Math.round(sJournals.reduce((a, b) => a + b.overallScore, 0) / totalCount)
        : 0;

      let level: HabitKategoriLevel = 'belum_terbiasa';
      if (avgScore >= 80) level = 'sudah_terbiasa';
      else if (avgScore >= 50) level = 'mulai_terbiasa';

      const validatedCount = sJournals.filter(j => j.status === 'validated').length;
      const validationRate = totalCount > 0 ? Math.round((validatedCount / totalCount) * 100) : 0;

      return {
        student,
        score: avgScore,
        level,
        entriesCount: totalCount,
        validationRate
      };
    });
  }, [classStudents, getStudentJournals, journals]);

  // Export Collective Class PDF
  const handlePrintCollectiveClassPDF = (targetClass: string) => {
    const targetStudents = students.filter(s => s.className === targetClass);
    const targetStudentIds = targetStudents.map(s => s.id);
    const targetAnalysis = getClassAnalysis(targetClass, targetStudentIds);
    const targetTeacher = teachers.find(t => t.className?.includes(targetClass))?.name || `Wali Kelas ${targetClass}`;

    const targetRows = targetStudents.map(student => {
      const sJournals = getStudentJournals(student.id);
      const totalCount = sJournals.length;
      const avgScore = totalCount > 0 
        ? Math.round(sJournals.reduce((a, b) => a + b.overallScore, 0) / totalCount)
        : 0;

      let level: HabitKategoriLevel = 'belum_terbiasa';
      if (avgScore >= 80) level = 'sudah_terbiasa';
      else if (avgScore >= 50) level = 'mulai_terbiasa';

      const validatedCount = sJournals.filter(j => j.status === 'validated').length;
      const validationRate = totalCount > 0 ? Math.round((validatedCount / totalCount) * 100) : 0;

      return {
        student,
        score: avgScore,
        level,
        entriesCount: totalCount,
        validationRate
      };
    });

    setIsExporting(true);
    try {
      PDFReportGenerator.generateClassReport(
        targetClass,
        targetTeacher,
        selectedMonth,
        targetAnalysis,
        targetRows,
        schoolSettings
      );
      audioNotifier.playSuccessChime();
    } catch (err) {
      console.error('Error generating class report:', err);
      alert('Gagal membuat dokumen PDF rekapitulasi kelas.');
    } finally {
      setIsExporting(false);
    }
  };

  // Batch Print All Classes
  const handlePrintAllClassesBatch = () => {
    if (!window.confirm(`Apakah Anda ingin mengunduh Rekapitulasi PDF untuk seluruh ${availableClasses.length} kelas sekaligus?`)) {
      return;
    }

    availableClasses.forEach((cls, idx) => {
      setTimeout(() => {
        handlePrintCollectiveClassPDF(cls);
      }, idx * 600);
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Panel */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Cetak Laporan Perkembangan 7 KAIH</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Resmi Kop Standar
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cetak laporan perkembangan karakter siswa secara pribadi (per siswa) maupun kolektif rekapitulasi kelas (A4 Landscape & Portrait).
            </p>
          </div>
        </div>

        {/* Global Period Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(m => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('individual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'individual'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>1. Laporan Pribadi Per Siswa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('collective')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'collective'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Laporan Kolektif Rekapitulasi Kelas</span>
        </button>
      </div>

      {/* ================= SECTION 1: INDIVIDUAL STUDENT REPORT ================= */}
      {activeTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Filter & List */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Pilih Siswa ({filteredStudents.length})</span>
              </h3>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Filter Kelas:
              </label>
              <select
                value={selectedClassForIndiv}
                onChange={(e) => setSelectedClassForIndiv(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold outline-none focus:border-purple-500"
              >
                <option value="all">Semua Kelas ({students.length} Siswa)</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / NIS siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            {/* Student List */}
            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
              {filteredStudents.map(s => {
                const isSelected = selectedStudent?.id === s.id;
                const sJournals = getStudentJournals(s.id);
                const avgScore = sJournals.length > 0
                  ? Math.round(sJournals.reduce((a, b) => a + b.overallScore, 0) / sJournals.length)
                  : 0;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 shadow-xs'
                        : 'bg-white dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-purple-900 dark:text-purple-200' : 'text-slate-900 dark:text-white'}`}>
                        {s.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{s.className || '7A'}</span>
                        <span>•</span>
                        <span className="font-mono">NIS: {s.nis || s.nisn || '-'}</span>
                        {(s.attendanceNumber || s.noAbsen) && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">No. {s.attendanceNumber || s.noAbsen}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        avgScore >= 80 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        avgScore >= 50 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                        'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}>
                        {avgScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (2 Cols): Student Detail & Print Card */}
          <div className="lg:col-span-2 space-y-4">
            {selectedStudent ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                    />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {selectedStudent.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        NIS: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{selectedStudent.nis || selectedStudent.nisn || '0089234512'}</strong>
                        {(selectedStudent.attendanceNumber || selectedStudent.noAbsen) && (
                          <span> • No. Absen: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{selectedStudent.attendanceNumber || selectedStudent.noAbsen}</strong></span>
                        )}
                        <span> • {selectedStudent.className || '7A'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePrintIndividualPDF(selectedStudent)}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isExporting ? 'Membuat PDF...' : 'Cetak PDF Laporan Siswa (A4)'}</span>
                  </button>
                </div>

                {/* Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Jurnal Terisi</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedStudentStats.totalDays} Hari
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Kepatuhan Rerata</p>
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {selectedStudentStats.avgScore}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Kategori KAIH</p>
                    <p className={`text-xs font-bold mt-1 ${
                      selectedStudentStats.kategori === 'sudah_terbiasa' ? 'text-emerald-600 dark:text-emerald-400' :
                      selectedStudentStats.kategori === 'mulai_terbiasa' ? 'text-amber-600 dark:text-amber-400' :
                      'text-rose-600 dark:text-rose-400'
                    }`}>
                      {KATEGORI_CONFIG[selectedStudentStats.kategori].label}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Validasi Orang Tua</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedStudentStats.validationRate}%
                    </p>
                  </div>
                </div>

                {/* 7 Habits Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Rekapitulasi Pelaksanaan 7 Pilar Kebiasaan ({selectedMonth}):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {HABIT_LIST.map(h => {
                      const completedCount = selectedStudentJournals.filter(
                        j => j.habits[h.id]?.completed
                      ).length;
                      const rate = selectedStudentStats.totalDays > 0 
                        ? Math.round((completedCount / selectedStudentStats.totalDays) * 100) 
                        : 0;

                      return (
                        <div key={h.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{h.shortName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">{completedCount}/{selectedStudentStats.totalDays} hr</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              rate >= 80 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                              rate >= 50 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                              'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}>
                              {rate}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Custom Note */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Catatan Evaluasi / Rekomendasi Tambahan (Ditampilkan pada PDF):
                  </label>
                  <textarea
                    rows={3}
                    value={customTeacherNote}
                    onChange={(e) => setCustomTeacherNote(e.target.value)}
                    placeholder={`Contoh: Ananda ${selectedStudent.name} menunjukkan konsistensi sangat baik dalam beribadah dan bangun pagi. Pertahankan semangat belajar dan gotong royong.`}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    * Kosongkan jika ingin menggunakan catatan evaluasi otomatis sistem.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                Silakan pilih siswa di sebelah kiri untuk melihat rincian dan mencetak laporan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: COLLECTIVE CLASS REPORT ================= */}
      {activeTab === 'collective' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Pilih Kelas untuk Dicetak:
                </label>
                <select
                  value={selectedClassForCollect}
                  onChange={(e) => setSelectedClassForCollect(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                >
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintAllClassesBatch}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cetak Rekap Semua Kelas ({availableClasses.length} Kelas)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintCollectiveClassPDF(selectedClassForCollect)}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekap {selectedClassForCollect} (PDF Landscape)</span>
              </button>
            </div>
          </div>

          {/* Class Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Murid Kelas</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {classStudents.length} Siswa
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Wali: {classTeacher}</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Sudah Terbiasa (≥80%)</span>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {classAnalysis.categoryDistribution.sudah_terbiasa} Siswa
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                {classStudents.length > 0 ? Math.round((classAnalysis.categoryDistribution.sudah_terbiasa / classStudents.length) * 100) : 0}% Kepatuhan Tinggi
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Mulai Terbiasa (50-79%)</span>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {classAnalysis.categoryDistribution.mulai_terbiasa} Siswa
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                {classStudents.length > 0 ? Math.round((classAnalysis.categoryDistribution.mulai_terbiasa / classStudents.length) * 100) : 0}% Dalam Pembiasaan
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Belum Terbiasa (&lt;50%)</span>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                {classAnalysis.categoryDistribution.belum_terbiasa} Siswa
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                Perlu Pendampingan Khusus
              </p>
            </div>
          </div>

          {/* Classroom Table of Students */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Daftar Murid {selectedClassForCollect} ({classStudentRows.length} Siswa):
              </h4>
              <span className="text-[11px] text-slate-400">
                Format resmi otomatis sesuai standar lembar arsip sekolah
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[9px] font-bold">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">NIS</th>
                    <th className="p-3 text-center">No Absen</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Jurnal</th>
                    <th className="p-3 text-center">Skor Rerata</th>
                    <th className="p-3 text-center">Kategori KAIH</th>
                    <th className="p-3 text-center">Validasi Ortu</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classStudentRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 text-xs">
                        Tidak ada siswa terdaftar di {selectedClassForCollect}.
                      </td>
                    </tr>
                  ) : (
                    classStudentRows.map((row, idx) => (
                      <tr key={row.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{row.student.nis || row.student.nisn || '-'}</td>
                        <td className="p-3 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">{row.student.attendanceNumber || row.student.noAbsen || '-'}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{row.student.name}</td>
                        <td className="p-3 text-center">{row.entriesCount} Hari</td>
                        <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{row.score}%</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            row.level === 'sudah_terbiasa' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                            row.level === 'mulai_terbiasa' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                            'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}>
                            {KATEGORI_CONFIG[row.level].label}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-600 dark:text-slate-300">{row.validationRate}%</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintIndividualPDF(row.student)}
                            title="Cetak PDF Siswa Ini"
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
