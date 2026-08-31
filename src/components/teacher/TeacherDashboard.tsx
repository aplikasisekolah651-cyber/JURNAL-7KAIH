import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  FileDown, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Star, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import { DEMO_CLASSES, HABIT_LIST, KATEGORI_CONFIG } from '../../lib/constants';
import { HabitId, HabitKategoriLevel, User, JournalEntry } from '../../types';
import { HabitIcon } from '../common/HabitIcon';
import { E2EEBadge } from '../common/E2EEBadge';
import { PDFReportGenerator } from '../../lib/pdfGenerator';
import { audioNotifier } from '../../lib/audioNotifier';
import { UserAvatar } from '../common/UserAvatar';

export const TeacherDashboard: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const { 
    journals, 
    getClassAnalysis, 
    giveTeacherFeedback, 
    getStudentJournals, 
    getStudentStats 
  } = useJournal();

  // Dynamic available classes from registered student database
  const availableClasses = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string; rawName: string; studentCount: number }>();
    
    // Scan all student users
    const students = allUsers.filter(u => u.role === 'siswa');
    students.forEach(s => {
      const cName = s.className ? s.className.trim() : '7A';
      const cId = s.classId || `class-${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const displayName = cName.toLowerCase().startsWith('kelas') ? cName : `Kelas ${cName}`;
      if (!classMap.has(cId)) {
        classMap.set(cId, { id: cId, name: displayName, rawName: cName, studentCount: 0 });
      }
      classMap.get(cId)!.studentCount += 1;
    });

    // Fallback if no students yet
    if (classMap.size === 0) {
      ['7A', '7B', '8A', '9A'].forEach(cName => {
        const cId = `class-${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        classMap.set(cId, { id: cId, name: `Kelas ${cName}`, rawName: cName, studentCount: 0 });
      });
    }

    return Array.from(classMap.values()).sort((a, b) => 
      a.rawName.localeCompare(b.rawName, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [allUsers]);

  // Initial teacher class
  const teacherInitialClassId = useMemo(() => {
    if (currentUser.assignedClassIds && currentUser.assignedClassIds.length > 0) {
      return currentUser.assignedClassIds[0];
    }
    if (currentUser.className) {
      const clean = currentUser.className.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = availableClasses.find(c => c.id === `class-${clean}` || c.rawName.toLowerCase() === clean);
      if (match) return match.id;
    }
    return availableClasses[0]?.id || 'class-7a';
  }, [currentUser, availableClasses]);

  const [selectedClassId, setSelectedClassId] = useState<string>(() => teacherInitialClassId);

  useEffect(() => {
    if (teacherInitialClassId && (!selectedClassId || !availableClasses.some(c => c.id === selectedClassId))) {
      setSelectedClassId(teacherInitialClassId);
    }
  }, [teacherInitialClassId, availableClasses, selectedClassId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Modal State for Student Detail & Feedback
  const [inspectingStudent, setInspectingStudent] = useState<User | null>(null);
  const [teacherNoteInput, setTeacherNoteInput] = useState('');
  const [awardedBadge, setAwardedBadge] = useState('Bintang 7 KAIH Teladan');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const selectedClassObj = availableClasses.find(c => c.id === selectedClassId) || availableClasses[0];
  const selectedClassName = selectedClassObj?.rawName || '7A';

  // Get students in this class matching by classId or className
  const classStudents = allUsers.filter(u => {
    if (u.role !== 'siswa') return false;
    return u.classId === selectedClassId || u.className === selectedClassName;
  });
  const classStudentIds = classStudents.map(s => s.id);

  // Classroom Analysis Summary
  const classAnalysis = getClassAnalysis(selectedClassId, classStudentIds);

  // Prepare table data for students
  const studentRows = classStudents.map(student => {
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
      validationRate,
      journals: sJournals
    };
  });

  // Filter student rows
  const filteredRows = studentRows.filter(row => {
    const matchesSearch = row.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (row.student.nis && row.student.nis.includes(searchQuery)) ||
                          (row.student.nisn && row.student.nisn.includes(searchQuery)) ||
                          (row.student.attendanceNumber && row.student.attendanceNumber.includes(searchQuery));
    const matchesCategory = filterCategory === 'all' || row.level === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Habit Bar Chart data
  const habitBarData = HABIT_LIST.map(h => ({
    name: h.shortName,
    kepatuhan: classAnalysis.habitScores[h.id] || 0
  }));

  // Habit Radar Chart data
  const habitRadarData = HABIT_LIST.map(h => ({
    habit: h.shortName,
    score: classAnalysis.habitScores[h.id] || 0,
    fullMark: 100
  }));

  // Export Class Report PDF (1-Click)
  const handleExportClassPDF = () => {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonth = monthNames[new Date().getMonth()] + ' ' + new Date().getFullYear();
    const currentClassObj = DEMO_CLASSES.find(c => c.id === selectedClassId);
    PDFReportGenerator.generateClassReport(
      currentClassObj ? currentClassObj.name : '7A',
      currentUser.name,
      currentMonth,
      classAnalysis,
      studentRows
    );
  };

  // Export Individual Student PDF
  const handleExportStudentPDF = (student: User) => {
    const sJournals = getStudentJournals(student.id);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonth = monthNames[new Date().getMonth()] + ' ' + new Date().getFullYear();
    PDFReportGenerator.generateStudentReport(student, sJournals, currentMonth, teacherNoteInput);
  };

  // Submit Feedback Handler
  const handleSubmitTeacherFeedback = async () => {
    if (!inspectingStudent) return;
    const latestJournal = getStudentJournals(inspectingStudent.id)[0];
    if (!latestJournal) return;

    setIsSubmittingFeedback(true);
    try {
      await giveTeacherFeedback(
        latestJournal.id,
        currentUser,
        teacherNoteInput || 'Terus tingkatkan semangat beribadah, literasi, dan gotong royong setiap hari!',
        'Pertahankan konsistensi 7 KAIH.',
        awardedBadge
      );

      audioNotifier.playSuccessChime();
      alert(`Catatan bimbingan & penghargaan berhasil dikirimkan ke siswa ${inspectingStudent.name}!`);
      setInspectingStudent(null);
      setTeacherNoteInput('');
    } catch (e) {
      console.error('Teacher feedback error:', e);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner Wali Kelas */}
      <div className="bg-slate-900 dark:bg-[#1E293B] text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Panel Wali Kelas Komprehensif
              </span>
              <E2EEBadge />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, {currentUser.name}! 👩‍🏫
            </h2>
            <p className="text-slate-300 text-xs max-w-xl">
              Pantau perkembangan 7 Kebiasaan Anak Indonesia Hebat seluruh murid dalam satu tampilan cerdas dengan rekap otomatis dan ekspor laporan 1-klik.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-white/10 text-white text-xs font-semibold border border-white/20 outline-none backdrop-blur-md cursor-pointer"
            >
              {availableClasses.map(c => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.name} ({c.studentCount} Siswa)
                </option>
              ))}
            </select>

            <button
              id="teacher-export-class-pdf-btn"
              onClick={handleExportClassPDF}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Bulanan (1-Klik PDF)</span>
            </button>
          </div>
        </div>

        {/* 4 Key Metric Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">Total Siswa Kelas</span>
              <Users className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">
              {classAnalysis.totalStudents} Murid
            </p>
            <p className="text-[9px] text-slate-300">Rerata Kelas: {classAnalysis.averageScore}%</p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md rounded-lg p-2.5 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-200 font-medium">Sudah Terbiasa (≥80%)</span>
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5">
              {classAnalysis.categoryDistribution.sudah_terbiasa} Siswa
            </p>
            <p className="text-[9px] text-emerald-300/80">Karakter Tertanam Kuat</p>
          </div>

          <div className="bg-amber-950/40 backdrop-blur-md rounded-lg p-2.5 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-200 font-medium">Mulai Terbiasa (50-79%)</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">
              {classAnalysis.categoryDistribution.mulai_terbiasa} Siswa
            </p>
            <p className="text-[9px] text-amber-300/80">Perlu Menjaga Konsistensi</p>
          </div>

          <div className="bg-rose-950/40 backdrop-blur-md rounded-lg p-2.5 border border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-rose-200 font-medium">Belum Terbiasa (&lt;50%)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-base sm:text-lg font-bold text-rose-300 mt-0.5">
              {classAnalysis.categoryDistribution.belum_terbiasa} Siswa
            </p>
            <p className="text-[9px] text-rose-300/80">Perlu Bimbingan Khusus</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Bento Grid: Class Radar & Class Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart: 7 Habit Performance */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Analisis Keseimbangan 7 Pilar Kelas
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Peta kepatuhan kolektif kelas terhadap 7 KAIH
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Rerata {classAnalysis.averageScore}%
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={habitRadarData}>
                <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.35} />
                <PolarAngleAxis dataKey="habit" stroke="#64748b" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={7} />
                <Radar
                  name="Capaian Kelas"
                  dataKey="score"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Kepatuhan per Habit */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Persentase Kepatuhan Tiap Kebiasaan
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Evaluasi tingkat keberhasilan per pilar
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} interval={0} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Bar dataKey="kepatuhan" name="Kepatuhan (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Student Monitoring Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Rekapitulasi Perkembangan Seluruh Murid
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Klasifikasi otomatis status keterbiasaan 7 KAIH dan bimbingan wali kelas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa, NIS, absen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 w-44 sm:w-52"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                  filterCategory === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterCategory('sudah_terbiasa')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                  filterCategory === 'sudah_terbiasa' ? 'bg-emerald-500 text-white shadow-xs' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                Sudah Terbiasa
              </button>
              <button
                onClick={() => setFilterCategory('mulai_terbiasa')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                  filterCategory === 'mulai_terbiasa' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                Mulai Terbiasa
              </button>
              <button
                onClick={() => setFilterCategory('belum_terbiasa')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                  filterCategory === 'belum_terbiasa' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                Belum Terbiasa
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-bold">
              <tr>
                <th className="p-2.5 rounded-l-lg">No</th>
                <th className="p-2.5">Nama Siswa & NIS</th>
                <th className="p-2.5 text-center">No Absen</th>
                <th className="p-2.5 text-center">Jurnal Terisi</th>
                <th className="p-2.5 text-center">Skor Kepatuhan</th>
                <th className="p-2.5 text-center">Status Keterbiasaan</th>
                <th className="p-2.5 text-center">Validasi Ortu</th>
                <th className="p-2.5 rounded-r-lg text-center">Aksi Bimbingan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map((row, idx) => (
                <tr key={row.student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 font-semibold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        user={row.student}
                        gender={row.student.gender}
                        size="sm"
                        className="w-7 h-7 rounded-lg shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {row.student.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          NIS: {row.student.nis || row.student.nisn || '-'} • {row.student.className || '7A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {row.student.attendanceNumber || row.student.noAbsen || '-'}
                  </td>
                  <td className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {row.entriesCount} Hari
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {row.score}%
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${KATEGORI_CONFIG[row.level].badge}`}>
                      {KATEGORI_CONFIG[row.level].label}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {row.validationRate}%
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setInspectingStudent(row.student);
                          setTeacherNoteInput('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1 text-[11px]"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Bimbingan</span>
                      </button>
                      <button
                        onClick={() => handleExportStudentPDF(row.student)}
                        title="Cetak Laporan PDF Siswa"
                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Siswa & Input Catatan/Masukan Wali Kelas */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-3 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  user={inspectingStudent}
                  gender={inspectingStudent.gender}
                  size="sm"
                  className="w-8 h-8 rounded-lg shrink-0"
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Evaluasi & Bimbingan: {inspectingStudent.name}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    NISN: {inspectingStudent.nisn} • {inspectingStudent.className}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Form Input Catatan Wali Kelas */}
              <div className="space-y-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Catatan Masukan & Bimbingan Wali Kelas
                  </label>
                  <E2EEBadge />
                </div>
                <textarea
                  rows={2}
                  value={teacherNoteInput}
                  onChange={(e) => setTeacherNoteInput(e.target.value)}
                  placeholder="Berikan masukan motivasi, evaluasi pembiasaan, atau saran perbaikan untuk murid ini..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 resize-none"
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Penghargaan:
                    </label>
                    <select
                      value={awardedBadge}
                      onChange={(e) => setAwardedBadge(e.target.value)}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="Bintang 7 KAIH Teladan">⭐ Bintang 7 KAIH Teladan</option>
                      <option value="Pelopor Literasi Gemar Membaca">📚 Pelopor Literasi Gemar Membaca</option>
                      <option value="Pejuang Disiplin Bangun Pagi">🌅 Pejuang Disiplin Bangun Pagi</option>
                      <option value="Teladan Gotong Royong & Empati">🤝 Teladan Gotong Royong</option>
                      <option value="Duta Pola Hidup Sehat">🥗 Duta Pola Hidup Sehat</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSubmitTeacherFeedback}
                    disabled={isSubmittingFeedback}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSubmittingFeedback ? 'Mengirim...' : 'Kirim Catatan ke Siswa & Ortu'}</span>
                  </button>
                </div>
              </div>

              {/* Recent Student Journals Logs */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Riwayat Jurnal Terakhir Ananda ({getStudentJournals(inspectingStudent.id).length} Hari)
                </h4>
                <div className="space-y-1.5">
                  {getStudentJournals(inspectingStudent.id).slice(0, 4).map((j) => (
                    <div
                      key={j.id}
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          📅 Tanggal {j.date}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                          Skor {j.overallScore}% ({j.completedCount}/7 Habit)
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                        Refleksi: "{j.decryptedReflection || 'Tidak ada catatan.'}"
                      </p>
                      {j.parentValidation?.validated && (
                        <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                          Validasi Ortu: "{j.parentValidation.notes}" ({j.parentValidation.rating}★)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleExportStudentPDF(inspectingStudent)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                <span>Cetak Rapor Bulanan Siswa (PDF)</span>
              </button>
              <button
                onClick={() => setInspectingStudent(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
