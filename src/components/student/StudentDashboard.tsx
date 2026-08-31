import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Award, 
  Send, 
  Lock, 
  Sparkles, 
  Star, 
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  Check,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import { HABIT_LIST, KATEGORI_CONFIG } from '../../lib/constants';
import { HabitId, HabitItemData } from '../../types';
import { HabitIcon } from '../common/HabitIcon';
import { E2EEBadge } from '../common/E2EEBadge';
import { audioNotifier } from '../../lib/audioNotifier';
import { UserAvatar } from '../common/UserAvatar';

interface StudentDashboardProps {
  initialDate?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ initialDate }) => {
  const { currentUser } = useAuth();
  const { 
    getStudentJournalByDate, 
    getStudentJournals, 
    getStudentStats, 
    saveJournalEntry 
  } = useJournal();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'analytics' | 'history'>('form');

  // Form State for the selected date
  const [habitsData, setHabitsData] = useState<Record<HabitId, HabitItemData>>(() => {
    const initial: any = {};
    HABIT_LIST.forEach(h => {
      initial[h.id] = {
        habitId: h.id,
        completed: false,
        time: h.defaultTime,
        score: 0,
        note: '',
        values: {}
      };
    });
    return initial;
  });

  const [reflection, setReflection] = useState('');
  const [existingJournal, setExistingJournal] = useState<any>(null);

  // Sync Form State when selectedDate changes or journals update
  useEffect(() => {
    const existing = getStudentJournalByDate(currentUser.id, selectedDate);
    setExistingJournal(existing || null);

    if (existing) {
      setHabitsData(existing.habits);
      setReflection(existing.decryptedReflection || existing.encryptedReflection || '');
    } else {
      // Default empty form
      const fresh: any = {};
      HABIT_LIST.forEach(h => {
        fresh[h.id] = {
          habitId: h.id,
          completed: false,
          time: h.defaultTime,
          score: 0,
          note: '',
          values: {}
        };
      });
      setHabitsData(fresh);
      setReflection('');
    }
  }, [selectedDate, currentUser.id, getStudentJournalByDate]);

  const stats = getStudentStats(currentUser.id);
  const studentHistory = getStudentJournals(currentUser.id);

  // Toggle habit completion
  const handleToggleHabit = (habitId: HabitId) => {
    setHabitsData(prev => {
      const current = prev[habitId];
      const nextCompleted = !current.completed;
      return {
        ...prev,
        [habitId]: {
          ...current,
          completed: nextCompleted,
          score: nextCompleted ? 100 : 0
        }
      };
    });
  };

  // Update specific field in subtask
  const handleUpdateSubValue = (habitId: HabitId, key: string, value: any) => {
    setHabitsData(prev => {
      const current = prev[habitId];
      const nextValues = { ...current.values, [key]: value };
      return {
        ...prev,
        [habitId]: {
          ...current,
          values: nextValues
        }
      };
    });
  };

  // Calculate live completion count
  const completedCount = Object.values(habitsData).filter((h: HabitItemData) => h?.completed).length;
  const completionPercentage = Math.round((completedCount / 7) * 100);

  // Save Journal Handler
  const handleSaveJournal = async () => {
    setIsSaving(true);
    try {
      await saveJournalEntry({
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentNis: currentUser.nis || currentUser.nisn,
        studentAttendanceNo: currentUser.attendanceNumber || currentUser.noAbsen,
        studentNisn: currentUser.nis || currentUser.nisn,
        className: currentUser.className || '7A',
        date: selectedDate,
        habits: habitsData,
        decryptedReflection: reflection,
        status: 'submitted'
      });

      // Confetti celebration if 5 or more habits completed
      if (completedCount >= 5) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      audioNotifier.playSuccessChime();
    } catch (err) {
      console.error('Error saving journal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Greeting & KPI Cards */}
      <div className="bg-slate-900 dark:bg-[#1E293B] text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800 relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <UserAvatar
              user={currentUser}
              gender={currentUser.gender}
              size="lg"
              className="w-14 h-14 rounded-2xl ring-2 ring-indigo-500/40 shrink-0"
            />
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Dashboard Siswa
                </span>
                <E2EEBadge />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate">
                Semangat Pagi, {currentUser.name}! 🌟
              </h2>
              <p className="text-slate-300 text-xs line-clamp-1">
                Catat 7 Kebiasaan Anak Indonesia Hebat hari ini: bangun pagi, ibadah, olahraga, makan sehat, gemar membaca, bermasyarakat & istirahat teratur.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-emerald-500/30 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Jurnal Otomatis Terhubung ke Ortu & Guru</span>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">Status Keterbiasaan</span>
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
              {KATEGORI_CONFIG[stats.kategoriLevel].label}
            </p>
            <p className="text-[9px] text-emerald-300 mt-0.5">Analisis Otomatis 7 KAIH</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">Rata-rata Kepatuhan</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">
              {stats.avgScore}%
            </p>
            <p className="text-[9px] text-slate-300 mt-0.5">Dari {stats.completedEntries} entri jurnal</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">Konsistensi Streak</span>
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>
            <p className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">
              {stats.streak} Hari Berturut-turut
            </p>
            <p className="text-[9px] text-slate-300 mt-0.5">Hebat! Pertahankan!</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">Kemajuan Hari Ini</span>
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            </div>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">
              {completedCount} / 7 Selesai
            </p>
            <p className="text-[9px] text-pink-200 mt-0.5">{completionPercentage}% Terpenuhi</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            id="tab-student-form"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            📝 Pengisian Jurnal 7 KAIH
          </button>
          <button
            id="tab-student-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            📊 Grafik Karakter
          </button>
          <button
            id="tab-student-history"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            📜 Riwayat ({studentHistory.length})
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-[#1E293B] px-3 py-1.5 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">Pilih Tanggal:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Tab 1: Form Pengisian Jurnal */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Status Validation Alert Banner */}
          {existingJournal?.status === 'validated' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Telah Divalidasi Orang Tua ({existingJournal.parentValidation?.parentName})
                    </h4>
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: existingJournal.parentValidation?.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 italic">
                    "{existingJournal.parentValidation?.notes || 'Bagus sekali ananda! Pertahankan kebiasaan baik ini.'}"
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full shrink-0">
                Resmi Tervalidasi
              </span>
            </div>
          )}

          {existingJournal?.teacherFeedback?.reviewed && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Catatan Bimbingan Wali Kelas ({existingJournal.teacherFeedback?.teacherName})
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                  "{existingJournal.teacherFeedback?.notes}"
                </p>
                {existingJournal.teacherFeedback?.badgeAwarded && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-blue-200/60 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 rounded-md">
                    🎖️ {existingJournal.teacherFeedback?.badgeAwarded}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Kemajuan Checklist 7 Kebiasaan ({selectedDate})
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {completedCount} dari 7 Selesai ({completionPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* The 7 Habits Accordion / Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HABIT_LIST.map((habit) => {
              const itemData = habitsData[habit.id] || {
                habitId: habit.id,
                completed: false,
                time: habit.defaultTime,
                score: 0,
                values: {}
              };

              return (
                <div
                  key={habit.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                    itemData.completed
                      ? 'bg-white dark:bg-[#1E293B] border-indigo-300 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/20'
                      : 'bg-white dark:bg-[#1E293B]/70 border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${habit.badgeBg} shrink-0`}>
                          <HabitIcon habitId={habit.id} size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                            {habit.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {habit.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Complete Checkbox Button */}
                      <button
                        id={`toggle-habit-${habit.id}`}
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          itemData.completed
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                        }`}
                      >
                        {itemData.completed ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Terlaksana</span>
                          </>
                        ) : (
                          <span>Tandai Selesai</span>
                        )}
                      </button>
                    </div>

                    {/* Subtasks Detail Inputs */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      {/* Custom UI for Ibadah */}
                      {habit.id === 'ibadah' && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Ibadah Wajib 5 Waktu
                          </p>
                          <div className="grid grid-cols-5 gap-1">
                            {[
                              { key: 'prayerFajr', label: 'Subuh' },
                              { key: 'prayerDhuhr', label: 'Dzuhur' },
                              { key: 'prayerAsr', label: 'Ashar' },
                              { key: 'prayerMaghrib', label: 'Maghrib' },
                              { key: 'prayerIsha', label: 'Isya' }
                            ].map((p) => {
                              const isChecked = !!itemData.values?.[p.key];
                              return (
                                <button
                                  key={p.key}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateSubValue('ibadah', p.key, !isChecked);
                                    if (!itemData.completed) handleToggleHabit('ibadah');
                                  }}
                                  className={`py-1 px-1 rounded-md text-[10px] font-bold border transition-all text-center ${
                                    isChecked
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {isChecked ? '✓ ' : ''}{p.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Puasa / Sholat Sunnah */}
                          <div className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.sunnahWorship}
                                onChange={(e) => {
                                  handleUpdateSubValue('ibadah', 'sunnahWorship', e.target.checked);
                                  if (!itemData.completed && e.target.checked) handleToggleHabit('ibadah');
                                }}
                                className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                              />
                              <span>Puasa Sunnah / Sholat Sunnah (Tahajud / Dhuha / Rawatib)</span>
                            </label>
                            {itemData.values?.sunnahWorship && (
                              <input
                                type="text"
                                placeholder="Contoh: Sholat Dhuha 4 Rakaat / Puasa Senin-Kamis"
                                value={itemData.values?.sunnahDetail || ''}
                                onChange={(e) => handleUpdateSubValue('ibadah', 'sunnahDetail', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                              />
                            )}
                          </div>

                          {/* Baca Kitab Suci */}
                          <div className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.holyBookReading}
                                onChange={(e) => {
                                  handleUpdateSubValue('ibadah', 'holyBookReading', e.target.checked);
                                  if (!itemData.completed && e.target.checked) handleToggleHabit('ibadah');
                                }}
                                className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                              />
                              <span>Membaca Kitab Suci / Tadarus Al-Qur'an</span>
                            </label>
                            {itemData.values?.holyBookReading && (
                              <input
                                type="text"
                                placeholder="Contoh: QS. Al-Kahfi Ayat 1-20 / Juz 1 Hlm 1-5"
                                value={itemData.values?.holyBookDetail || ''}
                                onChange={(e) => handleUpdateSubValue('ibadah', 'holyBookDetail', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                              />
                            )}
                          </div>

                          {/* Sedekah */}
                          <div className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.almsGiving}
                                onChange={(e) => {
                                  handleUpdateSubValue('ibadah', 'almsGiving', e.target.checked);
                                  if (!itemData.completed && e.target.checked) handleToggleHabit('ibadah');
                                }}
                                className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                              />
                              <span>Sedekah / Infaq / Berbagi Kebaikan</span>
                            </label>
                            {itemData.values?.almsGiving && (
                              <input
                                type="text"
                                placeholder="Contoh: Infaq kotak amal masjid & berbagi makanan"
                                value={itemData.values?.almsDetail || ''}
                                onChange={(e) => handleUpdateSubValue('ibadah', 'almsDetail', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                              />
                            )}
                          </div>

                          {/* Doa / Kebaikan Spiritual */}
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Doa / Kebaikan Spiritual Hari Ini
                            </label>
                            <input
                              type="text"
                              placeholder="Tuliskan doa atau rasa syukurmu..."
                              value={itemData.values?.spiritualNote || ''}
                              onChange={(e) => handleUpdateSubValue('ibadah', 'spiritualNote', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Custom UI for Makan Sehat (Sarapan, Makan Siang, Makan Malam + Menu Lain) */}
                      {habit.id === 'makan_sehat' && (
                        <div className="space-y-2.5">
                          {/* 1. Sarapan */}
                          <div className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.breakfastEaten}
                                onChange={(e) => {
                                  handleUpdateSubValue('makan_sehat', 'breakfastEaten', e.target.checked);
                                  if (!itemData.completed && e.target.checked) handleToggleHabit('makan_sehat');
                                }}
                                className="w-3.5 h-3.5 rounded text-green-600 border-slate-300 focus:ring-green-500"
                              />
                              <span>🌅 Sarapan Pagi Bergizi</span>
                            </label>
                            <div className="space-y-1">
                              <select
                                value={itemData.values?.breakfastMenu || ''}
                                onChange={(e) => handleUpdateSubValue('makan_sehat', 'breakfastMenu', e.target.value)}
                                className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none"
                              >
                                <option value="">-- Pilih Menu Sarapan --</option>
                                <option value="Nasi + Telur Mata Sapi + Tumis Sayur">Nasi + Telur Mata Sapi + Tumis Sayur</option>
                                <option value="Bubur Ayam Sehat + Kacang & Telur">Bubur Ayam Sehat + Kacang & Telur</option>
                                <option value="Roti Gandum + Telur Rebus + Susu">Roti Gandum + Telur Rebus + Susu</option>
                                <option value="Nasi Uduk Komplit Sehat">Nasi Uduk Komplit Sehat</option>
                                <option value="Oatmeal Buah + Madu">Oatmeal Buah + Madu</option>
                                <option value="Tulis Menu Lainnya">Tulis Menu Lainnya...</option>
                              </select>
                              {(itemData.values?.breakfastMenu === 'Tulis Menu Lainnya' || itemData.values?.breakfastCustom) && (
                                <input
                                  type="text"
                                  placeholder="Tulis menu sarapan sehat lainnya..."
                                  value={itemData.values?.breakfastCustom || ''}
                                  onChange={(e) => handleUpdateSubValue('makan_sehat', 'breakfastCustom', e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                                />
                              )}
                            </div>
                          </div>

                          {/* 2. Makan Siang */}
                          <div className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.lunchEaten}
                                onChange={(e) => {
                                  handleUpdateSubValue('makan_sehat', 'lunchEaten', e.target.checked);
                                  if (!itemData.completed && e.target.checked) handleToggleHabit('makan_sehat');
                                }}
                                className="w-3.5 h-3.5 rounded text-green-600 border-slate-300 focus:ring-green-500"
                              />
                              <span>☀️ Makan Siang Sehat & Seimbang</span>
                            </label>
                            <div className="space-y-1">
                              <select
                                value={itemData.values?.lunchMenu || ''}
                                onChange={(e) => handleUpdateSubValue('makan_sehat', 'lunchMenu', e.target.value)}
                                className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none"
                              >
                                <option value="">-- Pilih Menu Makan Siang --</option>
                                <option value="Nasi + Ikan Bakar / Ayam + Sayur Asam / Bayam">Nasi + Ikan Bakar / Ayam + Sayur Asam / Bayam</option>
                                <option value="Nasi + Tahu Tempe + Sayur Sop Sehat">Nasi + Tahu Tempe + Sayur Sop Sehat</option>
                                <option value="Gado-Gado / Pecel Sayur Telur">Gado-Gado / Pecel Sayur Telur</option>
                                <option value="Soto Sehat Daging & Sayuran">Soto Sehat Daging & Sayuran</option>
                                <option value="Tulis Menu Lainnya">Tulis Menu Lainnya...</option>
                              </select>
                              {(itemData.values?.lunchMenu === 'Tulis Menu Lainnya' || itemData.values?.lunchCustom) && (
                                <input
                                  type="text"
                                  placeholder="Tulis menu makan siang sehat lainnya..."
                                  value={itemData.values?.lunchCustom || ''}
                                  onChange={(e) => handleUpdateSubValue('makan_sehat', 'lunchCustom', e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                                />
                              )}
                            </div>
                          </div>

                          {/* 3. Makan Malam */}
                          <div className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.dinnerEaten}
                                onChange={(e) => {
                                  handleUpdateSubValue('makan_sehat', 'dinnerEaten', e.target.checked);
                                  if (!itemData.completed && e.target.checked) handleToggleHabit('makan_sehat');
                                }}
                                className="w-3.5 h-3.5 rounded text-green-600 border-slate-300 focus:ring-green-500"
                              />
                              <span>🌙 Makan Malam Bergizi (Sebelum Pukul 19.30)</span>
                            </label>
                            <div className="space-y-1">
                              <select
                                value={itemData.values?.dinnerMenu || ''}
                                onChange={(e) => handleUpdateSubValue('makan_sehat', 'dinnerMenu', e.target.value)}
                                className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none"
                              >
                                <option value="">-- Pilih Menu Makan Malam --</option>
                                <option value="Nasi Porsi Sedang + Sup Ayam Sayuran">Nasi Porsi Sedang + Sup Ayam Sayuran</option>
                                <option value="Tumis Sayur Hijau + Tahu / Tempe / Telur">Tumis Sayur Hijau + Tahu / Tempe / Telur</option>
                                <option value="Salad Sayur / Buah + Protein Sehat">Salad Sayur / Buah + Protein Sehat</option>
                                <option value="Menu Ringan Sehat">Menu Ringan Sehat</option>
                                <option value="Tulis Menu Lainnya">Tulis Menu Lainnya...</option>
                              </select>
                              {(itemData.values?.dinnerMenu === 'Tulis Menu Lainnya' || itemData.values?.dinnerCustom) && (
                                <input
                                  type="text"
                                  placeholder="Tulis menu makan malam sehat lainnya..."
                                  value={itemData.values?.dinnerCustom || ''}
                                  onChange={(e) => handleUpdateSubValue('makan_sehat', 'dinnerCustom', e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                                />
                              )}
                            </div>
                          </div>

                          {/* Extra healthy habits */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.hasVegetables}
                                onChange={(e) => handleUpdateSubValue('makan_sehat', 'hasVegetables', e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-green-600"
                              />
                              <span>Makan Sayur Segar</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.hasFruits}
                                onChange={(e) => handleUpdateSubValue('makan_sehat', 'hasFruits', e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-green-600"
                              />
                              <span>Makan Buah</span>
                            </label>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Jumlah Gelas Air Putih
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder="Target: 8"
                                value={itemData.values?.waterGlasses || ''}
                                onChange={(e) => handleUpdateSubValue('makan_sehat', 'waterGlasses', e.target.value)}
                                className="w-16 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none text-center"
                              />
                              <span className="text-[10px] text-slate-400">gelas</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom UI for Membaca / Gemar Belajar (Jam Mulai & Jam Berakhir) */}
                      {habit.id === 'membaca' && (
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Judul Buku / Materi Pelajaran yang Dipelajari
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: IPA Bab Energi / Kisah Tokoh Sains Hebat"
                              value={itemData.values?.bookTitle || ''}
                              onChange={(e) => handleUpdateSubValue('membaca', 'bookTitle', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Jam Mulai dan Jam Berakhir */}
                          <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
                                ⏱️ Jam Mulai Belajar
                              </label>
                              <input
                                type="time"
                                value={itemData.values?.startTime || '16:00'}
                                onChange={(e) => handleUpdateSubValue('membaca', 'startTime', e.target.value)}
                                className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
                                ⏱️ Jam Berakhir Belajar
                              </label>
                              <input
                                type="time"
                                value={itemData.values?.endTime || '16:45'}
                                onChange={(e) => handleUpdateSubValue('membaca', 'endTime', e.target.value)}
                                className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Halaman / Bab yang Dipelajari
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Hlm. 12 - 25"
                              value={itemData.values?.pageRange || ''}
                              onChange={(e) => handleUpdateSubValue('membaca', 'pageRange', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Pesan / Intisari Ilmu Baru yang Didapatkan
                            </label>
                            <input
                              type="text"
                              placeholder="Satu kalimat hikmah pelajaran..."
                              value={itemData.values?.summaryInsight || ''}
                              onChange={(e) => handleUpdateSubValue('membaca', 'summaryInsight', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Custom UI for Bermasyarakat (Kegiatan, Dengan Siapa, Manfaat) */}
                      {habit.id === 'bermasyarakat' && (
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Nama Kegiatan Sosial / Tolong Menolong
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Membantu kerja bakti lingkungan / Membantu adik belajar"
                              value={itemData.values?.activityName || ''}
                              onChange={(e) => handleUpdateSubValue('bermasyarakat', 'activityName', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Dengan Siapa (Keluarga, Teman, Tetangga) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              Dengan Siapa Kegiatan Dilakukan:
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {['Keluarga', 'Teman', 'Tetangga'].map((person) => {
                                const isSelected = itemData.values?.withWhom === person;
                                return (
                                  <button
                                    key={person}
                                    type="button"
                                    onClick={() => handleUpdateSubValue('bermasyarakat', 'withWhom', person)}
                                    className={`py-1 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                                    }`}
                                  >
                                    {isSelected ? '✓ ' : ''}{person}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Manfaat Kegiatan */}
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Manfaat Kegiatan yang Dirasakan
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Lingkungan jadi bersih dan mempererat silaturahmi"
                              value={itemData.values?.benefits || ''}
                              onChange={(e) => handleUpdateSubValue('bermasyarakat', 'benefits', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Supporting checkboxes */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.helpParents}
                                onChange={(e) => handleUpdateSubValue('bermasyarakat', 'helpParents', e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-indigo-600"
                              />
                              <span>Membantu Orang Tua</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!itemData.values?.cleanEnvironment}
                                onChange={(e) => handleUpdateSubValue('bermasyarakat', 'cleanEnvironment', e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-indigo-600"
                              />
                              <span>Kebersihan Lingkungan</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Default Generic Renderer for other habits (Bangun Pagi, Olahraga, Istirahat) */}
                      {!['ibadah', 'makan_sehat', 'membaca', 'bermasyarakat'].includes(habit.id) && habit.subTasks.map((sub) => {
                        const val = itemData.values?.[sub.key];

                        if (sub.type === 'checkbox') {
                          return (
                            <label
                              key={sub.key}
                              className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              <input
                                type="checkbox"
                                checked={!!val}
                                onChange={(e) => {
                                  handleUpdateSubValue(habit.id, sub.key, e.target.checked);
                                  if (!itemData.completed && e.target.checked) {
                                    handleToggleHabit(habit.id);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                              />
                              <span className="text-xs">{sub.label}</span>
                            </label>
                          );
                        }

                        if (sub.type === 'select') {
                          return (
                            <div key={sub.key} className="space-y-0.5">
                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {sub.label}
                              </label>
                              <select
                                value={val || ''}
                                onChange={(e) => handleUpdateSubValue(habit.id, sub.key, e.target.value)}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                              >
                                <option value="">-- Pilih {sub.label} --</option>
                                {sub.options?.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        if (sub.type === 'time') {
                          return (
                            <div key={sub.key} className="flex items-center justify-between gap-2">
                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {sub.label}
                              </label>
                              <input
                                type="time"
                                value={val || habit.defaultTime}
                                onChange={(e) => handleUpdateSubValue(habit.id, sub.key, e.target.value)}
                                className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                              />
                            </div>
                          );
                        }

                        if (sub.type === 'number') {
                          return (
                            <div key={sub.key} className="flex items-center justify-between gap-2">
                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {sub.label}
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  placeholder={sub.placeholder}
                                  value={val || ''}
                                  onChange={(e) => handleUpdateSubValue(habit.id, sub.key, e.target.value)}
                                  className="w-16 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none"
                                />
                                {sub.unit && <span className="text-[10px] text-slate-400">{sub.unit}</span>}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={sub.key} className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {sub.label}
                            </label>
                            <input
                              type="text"
                              placeholder={sub.placeholder}
                              value={val || ''}
                              onChange={(e) => handleUpdateSubValue(habit.id, sub.key, e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* E2EE Encrypted Daily Reflection Section */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Refleksi & Catatan Harian Pribadi Siswa
                </h3>
              </div>
              <E2EEBadge />
            </div>
            <textarea
              id="student-reflection-input"
              rows={2}
              placeholder="Ceritakan perasaan, kendala, atau capaian baik yang kamu rasakan hari ini (terenkripsi E2EE aman)..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons: Submit & Reset */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Jurnal tanggal <strong>{selectedDate}</strong> ({completedCount}/7 Kebiasaan Aktif)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="submit-student-journal-btn"
                onClick={handleSaveJournal}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all duration-200 active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan & Mengenkripsi...' : 'Simpan & Kirim Jurnal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Charts & Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar Polar Chart: 7 Habits Strength */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Peta Radar 7 Pilar Karakter
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Keseimbangan pembiasaan dalam 7 pilar
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Target: 100%
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats.habitRadar}>
                    <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.35} />
                    <PolarAngleAxis dataKey="habit" stroke="#64748b" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={8} />
                    <Radar
                      name="Konsistensi"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  Kebiasaan Terkuat:{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {[...stats.habitRadar].sort((a, b) => b.score - a.score)[0]?.habit || 'Bangun Pagi'}
                  </strong>
                </div>
                <div>
                  Perlu Ditingkatkan:{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {[...stats.habitRadar].sort((a, b) => a.score - b.score)[0]?.habit || 'Gemar Membaca'}
                  </strong>
                </div>
              </div>
            </div>

            {/* 7 Days Trend Score Area Chart */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Tren Skor Kepatuhan 7 Hari Terakhir
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Perkembangan konsistensi harian
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Positif
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weeklyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Skor 7 KAIH (%)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Pertahankan skor di atas <strong>80%</strong> setiap hari untuk mencapai predikat <em>Anak Indonesia Hebat</em>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Riwayat Jurnal & Status Validasi */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Daftar Riwayat Jurnal Siswa
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pantau validasi orang tua dan catatan bimbingan wali kelas
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 w-fit">
              Total {studentHistory.length} Hari Tercatat
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Tanggal</th>
                  <th className="p-2.5">7 Kebiasaan</th>
                  <th className="p-2.5">Skor</th>
                  <th className="p-2.5">Status Kategori</th>
                  <th className="p-2.5">Validasi Orang Tua</th>
                  <th className="p-2.5 rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                      {item.date}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        {HABIT_LIST.map((h) => {
                          const isDone = item.habits[h.id]?.completed;
                          return (
                            <span
                              key={h.id}
                              title={`${h.shortName}: ${isDone ? 'Selesai' : 'Belum'}`}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                              }`}
                            >
                              {isDone ? '✓' : '•'}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {item.overallScore}%
                    </td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${KATEGORI_CONFIG[item.kategoriLevel].badge}`}>
                        {KATEGORI_CONFIG[item.kategoriLevel].label}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {item.status === 'validated' ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Divalidasi ({item.parentValidation?.rating || 5}★)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Menunggu Validasi</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <button
                        onClick={() => {
                          setSelectedDate(item.date);
                          setActiveTab('form');
                        }}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 text-[11px]"
                      >
                        Buka Jurnal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
