import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  JournalEntry, 
  HabitId, 
  ReminderSetting, 
  AppNotification, 
  ClassAnalysisSummary, 
  HabitKategoriLevel,
  User
} from '../types';
import { DEFAULT_REMINDERS, HABIT_LIST } from '../lib/constants';
import { getDateString } from '../lib/mockData';
import { audioNotifier } from '../lib/audioNotifier';
import { E2EEService } from '../lib/crypto';
import { db } from '../lib/firebase';
import { collection, setDoc, doc, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';

interface JournalContextType {
  journals: JournalEntry[];
  reminders: ReminderSetting[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  activeReminderHabit: HabitId | null;
  
  // Journal Operations
  saveJournalEntry: (entry: Partial<JournalEntry> & { studentId: string; date: string }) => Promise<JournalEntry>;
  validateByParent: (
    journalId: string, 
    parentUser: User, 
    notes: string, 
    rating: number, 
    status?: 'valid' | 'invalid', 
    disputedHabits?: HabitId[]
  ) => Promise<void>;
  giveTeacherFeedback: (journalId: string, teacherUser: User, notes: string, recommendation?: string, badge?: string) => Promise<void>;
  getStudentJournalByDate: (studentId: string, date: string) => JournalEntry | undefined;
  getStudentJournals: (studentId: string) => JournalEntry[];
  deleteJournal: (journalId: string) => Promise<void>;
  deleteJournalsBulk: (journalIds: string[]) => Promise<void>;
  clearAllJournals: () => Promise<void>;
  
  // Stats & Analytics
  getClassAnalysis: (classId: string, studentIds: string[]) => ClassAnalysisSummary;
  getStudentStats: (studentId: string) => {
    avgScore: number;
    streak: number;
    completedEntries: number;
    kategoriLevel: HabitKategoriLevel;
    habitRadar: { habit: string; score: number; fullMark: number }[];
    weeklyTrend: { date: string; day: string; score: number; completed: number }[];
  };

  // Reminders & Notifications
  updateReminder: (habitId: HabitId, updates: Partial<ReminderSetting>) => void;
  dismissReminder: () => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  sendCustomNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const JOURNALS_STORAGE_KEY = '7kaih_journals_v2';
const REMINDERS_STORAGE_KEY = '7kaih_reminders_v1';
const NOTIFICATIONS_STORAGE_KEY = '7kaih_notifications_v1';

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any legacy seed data from v1
  useEffect(() => {
    try {
      localStorage.removeItem('7kaih_journals_v1');
    } catch (e) {
      console.warn('Storage cleanup:', e);
    }
  }, []);

  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(JOURNALS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse cached journals:', e);
      }
    }
    // Default to empty array - all monitoring data starts empty until filled
    return [];
  });

  const [reminders, setReminders] = useState<ReminderSetting[]>(() => {
    const saved = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse reminders:', e);
      }
    }
    return DEFAULT_REMINDERS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
    return [
      {
        id: 'notif-welcome',
        userId: 'all',
        title: '🌟 Selamat Datang di 7 KAIH!',
        message: 'Mulai bangun karakter unggul dengan mencatat 7 Kebiasaan Anak Indonesia Hebat setiap hari.',
        timestamp: Date.now() - 3600000,
        read: false,
        type: 'system'
      }
    ];
  });

  const [activeReminderHabit, setActiveReminderHabit] = useState<HabitId | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(JOURNALS_STORAGE_KEY, JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Firestore background sync
  useEffect(() => {
    if (db) {
      try {
        const unsub = onSnapshot(collection(db, 'journals'), (snapshot) => {
          if (!snapshot.empty) {
            const firestoreJournals: JournalEntry[] = [];
            snapshot.forEach((docSnap) => {
              firestoreJournals.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            if (firestoreJournals.length > 0) {
              setJournals(prev => {
                const map = new Map<string, JournalEntry>();
                prev.forEach(j => map.set(j.id, j));
                firestoreJournals.forEach(j => map.set(j.id, j));
                return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
              });
            }
          }
        }, (err) => {
          console.warn('Firestore journals fallback:', err);
        });
        return () => unsub();
      } catch (e) {
        console.warn('Firestore init err:', e);
      }
    }
  }, []);

  // Reminder interval check (checks every 30 seconds for matching HH:mm)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      reminders.forEach((r) => {
        if (r.enabled && r.time === currentTimeStr) {
          const habitDef = HABIT_LIST.find(h => h.id === r.habitId);
          if (habitDef) {
            setActiveReminderHabit(r.habitId);
            if (r.sound) {
              audioNotifier.playReminderChime();
            }
            audioNotifier.triggerPushNotification(
              `Waktunya ${habitDef.shortName}!`,
              `${habitDef.tagline}. Jangan lupa catat di Jurnal 7 KAIH.`
            );
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const saveJournalEntry = async (
    entryData: Partial<JournalEntry> & { studentId: string; date: string }
  ): Promise<JournalEntry> => {
    const entryId = entryData.id || `journal-${entryData.studentId}-${entryData.date}`;
    
    // Count completed habits and calculate score
    let completedCount = 0;
    if (entryData.habits) {
      Object.values(entryData.habits).forEach((h) => {
        if (h.completed) completedCount++;
      });
    }

    const overallScore = Math.round((completedCount / 7) * 100);
    let kategoriLevel: HabitKategoriLevel = 'belum_terbiasa';
    if (overallScore >= 80) kategoriLevel = 'sudah_terbiasa';
    else if (overallScore >= 50) kategoriLevel = 'mulai_terbiasa';

    // Handle E2EE encryption for reflection
    let encryptedReflection = entryData.encryptedReflection;
    let decryptedReflection = entryData.decryptedReflection;
    if (decryptedReflection && !encryptedReflection) {
      encryptedReflection = E2EEService.encrypt(decryptedReflection, entryData.studentId);
    } else if (encryptedReflection && !decryptedReflection) {
      decryptedReflection = E2EEService.decrypt(encryptedReflection, entryData.studentId);
    }

    const existing = journals.find(j => j.id === entryId);

    const fullEntry: JournalEntry = {
      id: entryId,
      studentId: entryData.studentId,
      studentName: entryData.studentName || 'Siswa',
      studentNis: entryData.studentNis || entryData.studentNisn,
      studentNisn: entryData.studentNisn || entryData.studentNis,
      studentAttendanceNo: entryData.studentAttendanceNo,
      className: entryData.className || '7A',
      date: entryData.date,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      habits: entryData.habits as any,
      overallScore,
      completedCount,
      kategoriLevel,
      isEncrypted: true,
      encryptedReflection,
      decryptedReflection,
      photoProof: entryData.photoProof || existing?.photoProof,
      status: entryData.status || (existing?.status === 'validated' ? 'validated' : 'submitted'),
      parentValidation: existing?.parentValidation,
      teacherFeedback: existing?.teacherFeedback
    };

    // Update state
    setJournals(prev => {
      const filtered = prev.filter(j => j.id !== entryId);
      return [fullEntry, ...filtered];
    });

    // Add in-app notification
    sendCustomNotification({
      userId: entryData.studentId,
      targetRole: 'orangtua',
      title: '📝 Jurnal Harian Terkirim',
      message: `${fullEntry.studentName} telah mengisi jurnal 7 KAIH (${completedCount}/7 selesai, Skor: ${overallScore}%). Menunggu validasi orang tua.`,
      type: 'journal_submitted',
      linkDate: fullEntry.date,
      studentId: fullEntry.studentId
    });

    // Attempt cloud firestore write
    if (db) {
      try {
        await setDoc(doc(db, 'journals', entryId), fullEntry);
      } catch (e) {
        console.warn('Firestore journal write fallback:', e);
      }
    }

    return fullEntry;
  };

  const validateByParent = async (
    journalId: string,
    parentUser: User,
    notes: string,
    rating: number,
    status: 'valid' | 'invalid' = 'valid',
    disputedHabits?: HabitId[]
  ): Promise<void> => {
    const target = journals.find(j => j.id === journalId);
    if (!target) return;

    const isValid = status === 'valid';
    const updated: JournalEntry = {
      ...target,
      status: isValid ? 'validated' : 'needs_revision',
      updatedAt: Date.now(),
      parentValidation: {
        validated: true,
        status: status,
        validatedAt: Date.now(),
        parentId: parentUser.id,
        parentName: parentUser.name,
        notes,
        rating: isValid ? rating : 0,
        signatureStatus: isValid,
        disputedHabits: disputedHabits || []
      }
    };

    setJournals(prev => prev.map(j => (j.id === journalId ? updated : j)));

    // Play sound
    if (isValid) {
      audioNotifier.playSuccessChime();
      audioNotifier.triggerPushNotification(
        '✅ Jurnal Disetujui Orang Tua!',
        `Orang tua (${parentUser.name}) mengonfirmasi Benar jurnal tanggal ${target.date}: "${notes || 'Sangat bagus!'}"`
      );
      sendCustomNotification({
        userId: target.studentId,
        targetRole: 'siswa',
        title: '🎉 Jurnal 7 KAIH Dikonfirmasi BENAR',
        message: `${parentUser.name} telah mengonfirmasi bahwa 7 KAIH telah dilakukan dengan jujur di rumah: "${notes || 'Hebat!'}" (Rating: ${rating}/5)`,
        type: 'validation',
        linkDate: target.date,
        studentId: target.studentId
      });
    } else {
      audioNotifier.playReminderChime();
      audioNotifier.triggerPushNotification(
        '⚠️ Catatan Perbaikan Jurnal',
        `Orang tua (${parentUser.name}) menandai catatan pada jurnal tanggal ${target.date}`
      );
      sendCustomNotification({
        userId: target.studentId,
        targetRole: 'siswa',
        title: '⚠️ Catatan Evaluasi dari Orang Tua',
        message: `${parentUser.name} menandai kebiasaan yang perlu diperbaiki: "${notes || 'Perlu bimbingan dan perbaikan'}"`,
        type: 'validation',
        linkDate: target.date,
        studentId: target.studentId
      });
    }

    if (db) {
      try {
        await setDoc(doc(db, 'journals', journalId), updated, { merge: true });
      } catch (e) {
        console.warn('Firestore parent validation sync:', e);
      }
    }
  };

  const giveTeacherFeedback = async (
    journalId: string,
    teacherUser: User,
    notes: string,
    recommendation?: string,
    badge?: string
  ): Promise<void> => {
    const target = journals.find(j => j.id === journalId);
    if (!target) return;

    const updated: JournalEntry = {
      ...target,
      updatedAt: Date.now(),
      teacherFeedback: {
        reviewed: true,
        reviewedAt: Date.now(),
        teacherId: teacherUser.id,
        teacherName: teacherUser.name,
        notes,
        recommendation,
        badgeAwarded: badge
      }
    };

    setJournals(prev => prev.map(j => (j.id === journalId ? updated : j)));

    sendCustomNotification({
      userId: target.studentId,
      targetRole: 'siswa',
      title: '👨‍🏫 Catatan Baru dari Wali Kelas',
      message: `${teacherUser.name}: "${notes}" ${badge ? `🎖️ Penghargaan: ${badge}` : ''}`,
      type: 'teacher_note',
      linkDate: target.date,
      studentId: target.studentId
    });

    if (db) {
      try {
        await setDoc(doc(db, 'journals', journalId), updated, { merge: true });
      } catch (e) {
        console.warn('Firestore teacher feedback sync:', e);
      }
    }
  };

  const deleteJournal = async (journalId: string): Promise<void> => {
    setJournals(prev => prev.filter(j => j.id !== journalId));
    if (db) {
      try {
        await deleteDoc(doc(db, 'journals', journalId));
      } catch (e) {
        console.warn('Firestore delete journal sync:', e);
      }
    }
  };

  const deleteJournalsBulk = async (journalIds: string[]): Promise<void> => {
    const idSet = new Set(journalIds);
    setJournals(prev => prev.filter(j => !idSet.has(j.id)));
    if (db) {
      try {
        await Promise.all(journalIds.map(id => deleteDoc(doc(db, 'journals', id))));
      } catch (e) {
        console.warn('Firestore bulk delete journal sync:', e);
      }
    }
  };

  const clearAllJournals = async (): Promise<void> => {
    const currentJournals = [...journals];
    setJournals([]);
    try {
      localStorage.removeItem(JOURNALS_STORAGE_KEY);
      localStorage.removeItem('7kaih_journals_v1');
    } catch (e) {
      console.warn('Local storage clear error:', e);
    }
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'journals'));
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(doc(db, 'journals', docSnap.id)));
        });
        await Promise.all(deletePromises);
      } catch (e) {
        console.warn('Firestore clear all journals sync:', e);
      }
    }
  };

  const getStudentJournalByDate = (studentId: string, date: string): JournalEntry | undefined => {
    return journals.find(j => j.studentId === studentId && j.date === date);
  };

  const getStudentJournals = (studentId: string): JournalEntry[] => {
    return journals
      .filter(j => j.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getStudentStats = (studentId: string) => {
    const studentEntries = getStudentJournals(studentId);
    const totalCount = studentEntries.length;
    
    if (totalCount === 0) {
      return {
        avgScore: 0,
        streak: 0,
        completedEntries: 0,
        kategoriLevel: 'belum_terbiasa' as HabitKategoriLevel,
        habitRadar: HABIT_LIST.map(h => ({ habit: h.shortName, score: 0, fullMark: 100 })),
        weeklyTrend: []
      };
    }

    const totalScore = studentEntries.reduce((acc, curr) => acc + curr.overallScore, 0);
    const avgScore = Math.round(totalScore / totalCount);

    let kategoriLevel: HabitKategoriLevel = 'belum_terbiasa';
    if (avgScore >= 80) kategoriLevel = 'sudah_terbiasa';
    else if (avgScore >= 50) kategoriLevel = 'mulai_terbiasa';

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const dStr = getDateString(i);
      const entry = studentEntries.find(e => e.date === dStr);
      if (entry && entry.overallScore >= 50) {
        streak++;
      } else if (i === 0) {
        // Today might not be filled yet, continue check yesterday
        continue;
      } else {
        break;
      }
    }

    // Habit radar score calculation
    const habitRadar = HABIT_LIST.map((habit) => {
      const completedTimes = studentEntries.filter(e => e.habits[habit.id]?.completed).length;
      const score = Math.round((completedTimes / totalCount) * 100);
      return {
        habit: habit.shortName,
        score,
        fullMark: 100
      };
    });

    // Weekly trend (last 7 days)
    const weeklyTrend: { date: string; day: string; score: number; completed: number }[] = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const entry = studentEntries.find(e => e.date === dStr);
      
      weeklyTrend.push({
        date: dStr,
        day: dayNames[d.getDay()],
        score: entry ? entry.overallScore : 0,
        completed: entry ? entry.completedCount : 0
      });
    }

    return {
      avgScore,
      streak,
      completedEntries: totalCount,
      kategoriLevel,
      habitRadar,
      weeklyTrend
    };
  };

  const getClassAnalysis = (classId: string, studentIds: string[]): ClassAnalysisSummary => {
    const classEntries = journals.filter(j => studentIds.includes(j.studentId));
    const totalStudents = studentIds.length || 1;
    const totalEntries = classEntries.length;

    const habitScores: Record<HabitId, number> = {
      bangun_pagi: 0,
      ibadah: 0,
      olahraga: 0,
      makan_sehat: 0,
      membaca: 0,
      bermasyarakat: 0,
      istirahat: 0
    };

    if (totalEntries > 0) {
      HABIT_LIST.forEach(h => {
        const completed = classEntries.filter(e => e.habits[h.id]?.completed).length;
        habitScores[h.id] = Math.round((completed / totalEntries) * 100);
      });
    }

    const studentScoreMap = new Map<string, { score: number; count: number; name: string; missed: string[] }>();
    
    studentIds.forEach(id => {
      const userEntries = classEntries.filter(e => e.studentId === id);
      const name = userEntries[0]?.studentName || `Siswa ${id.slice(-4)}`;
      if (userEntries.length > 0) {
        const avg = Math.round(userEntries.reduce((a, b) => a + b.overallScore, 0) / userEntries.length);
        studentScoreMap.set(id, { score: avg, count: userEntries.length, name, missed: [] });
      } else {
        studentScoreMap.set(id, { score: 0, count: 0, name, missed: ['Belum mengisi jurnal'] });
      }
    });

    const categoryDistribution = {
      belum_terbiasa: 0,
      mulai_terbiasa: 0,
      sudah_terbiasa: 0
    };

    const studentSummaryList: any[] = [];
    studentScoreMap.forEach((val, id) => {
      let lvl: HabitKategoriLevel = 'belum_terbiasa';
      if (val.score >= 80) lvl = 'sudah_terbiasa';
      else if (val.score >= 50) lvl = 'mulai_terbiasa';
      
      categoryDistribution[lvl]++;
      studentSummaryList.push({
        studentId: id,
        studentName: val.name,
        score: val.score,
        streak: Math.min(val.count, 7),
        level: lvl,
        missedHabits: val.missed
      });
    });

    const overallClassAvg = Math.round(
      Array.from(studentScoreMap.values()).reduce((a, b) => a + b.score, 0) / totalStudents
    );

    const sortedByScore = [...studentSummaryList].sort((a, b) => b.score - a.score);
    const topPerformers = sortedByScore.slice(0, 5);
    const needsAttention = sortedByScore.filter(s => s.score < 60);

    return {
      classId,
      className: classId ? classId.replace('class-', '').toUpperCase() : '7A',
      totalStudents,
      totalEntries,
      averageScore: overallClassAvg,
      habitScores,
      categoryDistribution,
      topPerformers,
      needsAttention
    };
  };

  const updateReminder = (habitId: HabitId, updates: Partial<ReminderSetting>) => {
    setReminders(prev =>
      prev.map(r => (r.habitId === habitId ? { ...r, ...updates } : r))
    );
  };

  const dismissReminder = () => {
    setActiveReminderHabit(null);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, ...readNotification(n) } : n))
    );
  };

  const readNotification = (n: AppNotification) => ({ ...n, read: true });

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const sendCustomNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      read: false,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <JournalContext.Provider
      value={{
        journals,
        reminders,
        notifications,
        unreadNotificationCount,
        activeReminderHabit,
        saveJournalEntry,
        validateByParent,
        giveTeacherFeedback,
        getStudentJournalByDate,
        getStudentJournals,
        deleteJournal,
        deleteJournalsBulk,
        clearAllJournals,
        getClassAnalysis,
        getStudentStats,
        updateReminder,
        dismissReminder,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        sendCustomNotification
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
