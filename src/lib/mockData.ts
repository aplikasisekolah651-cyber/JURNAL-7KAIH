import { JournalEntry, HabitId, HabitKategoriLevel } from '../types';
import { HABIT_LIST, DEMO_USERS } from './constants';
import { E2EEService } from './crypto';

// Helper to format date YYYY-MM-DD
export function getDateString(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function generateSeedJournals(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const students = DEMO_USERS.filter(u => u.role === 'siswa');

  students.forEach((student, sIdx) => {
    // Generate past 14 days of journals
    for (let i = 0; i < 14; i++) {
      const dateStr = getDateString(i);
      const isToday = i === 0;
      
      // Calculate realistic variation per student
      // Student 1 (Rizky): high achiever (85-100%)
      // Student 2 (Nadia): good achiever (75-90%)
      // Student 3 (Dimas): moderate developing (50-75%)
      // Student 4 (Kirana): very consistent (90-100%)
      let successProbability = 0.85;
      if (sIdx === 1) successProbability = 0.80;
      if (sIdx === 2) successProbability = 0.62;
      if (sIdx === 3) successProbability = 0.92;

      // Make today optional or partial for student 1 to allow live filling
      if (isToday && sIdx === 0) {
        // Today is not submitted yet for Ahmad Rizky so user can try filing it
        continue;
      }

      const habitsRecord: any = {};
      let completedCount = 0;

      HABIT_LIST.forEach((habit) => {
        const isCompleted = Math.random() < successProbability;
        if (isCompleted) completedCount++;

        habitsRecord[habit.id] = {
          habitId: habit.id,
          completed: isCompleted,
          time: habit.defaultTime,
          score: isCompleted ? 100 : 0,
          note: isCompleted ? `Melaksanakan ${habit.shortName} dengan baik.` : 'Belum sempat terlaksana optimal.',
          values: {
            wakeTime: '04:55',
            bedMade: true,
            drinkWater: true,
            morningMood: 'Sangat Bersemangat 😊',
            prayerFajr: true,
            prayerDhuhr: isCompleted,
            prayerAsr: isCompleted,
            prayerMaghrib: isCompleted,
            prayerIsha: isCompleted,
            sunnahWorship: isCompleted,
            sunnahDetail: isCompleted ? 'Sholat Dhuha 4 Rakaat & Rawatib' : '',
            holyBookReading: isCompleted,
            holyBookDetail: isCompleted ? 'QS. Al-Mulk Ayat 1-30' : '',
            almsGiving: isCompleted,
            almsDetail: isCompleted ? 'Infaq kotak amal dan berbagi makanan' : '',
            exerciseType: 'Senam Pagi / Stretching',
            durationMin: isCompleted ? 20 : 0,
            breakfastEaten: true,
            breakfastMenu: 'Nasi + Telur Mata Sapi + Tumis Sayur',
            breakfastCustom: '',
            lunchEaten: isCompleted,
            lunchMenu: 'Nasi + Ikan Bakar / Ayam + Sayur Asam / Bayam',
            lunchCustom: '',
            dinnerEaten: isCompleted,
            dinnerMenu: 'Nasi Porsi Sedang + Sup Ayam Sayuran',
            dinnerCustom: '',
            hasVegetables: isCompleted,
            hasFruits: isCompleted,
            waterGlasses: isCompleted ? 8 : 4,
            avoidJunkFood: true,
            bookTitle: 'Kisah Penemu & Sains Modern',
            startTime: '16:00',
            endTime: '16:45',
            pageRange: 'Hlm 15 - 30',
            summaryInsight: 'Belajar tentang ketekunan ilmuwan dalam menemukan teknologi baru.',
            activityName: 'Gotong royong membersihkan halaman bersama',
            withWhom: 'Keluarga',
            benefits: 'Halaman menjadi asri, sehat, dan hubungan keluarga semakin harmonis',
            helpParents: isCompleted,
            cleanEnvironment: true,
            targetSleepTime: '21:00',
            noScreenBeforeBed: true
          }
        };
      });

      const overallScore = Math.round((completedCount / 7) * 100);
      let kategoriLevel: HabitKategoriLevel = 'belum_terbiasa';
      if (overallScore >= 80) kategoriLevel = 'sudah_terbiasa';
      else if (overallScore >= 50) kategoriLevel = 'mulai_terbiasa';

      const reflectionPlain = `Hari ini saya merasa bersyukur bisa menjalankan rutinitas ${completedCount} dari 7 Kebiasaan Anak Indonesia Hebat. Saya bertekad untuk terus konsisten berolahraga dan membaca buku.`;
      const encryptedReflection = E2EEService.encrypt(reflectionPlain, student.id);

      const isValidated = i > 1; // days older than 1 day are validated by parent
      const entry: JournalEntry = {
        id: `journal-${student.id}-${dateStr}`,
        studentId: student.id,
        studentName: student.name,
        studentNisn: student.nisn,
        className: student.className || '7A',
        date: dateStr,
        createdAt: Date.now() - i * 86400000,
        updatedAt: Date.now() - i * 86400000,
        habits: habitsRecord,
        overallScore,
        completedCount,
        kategoriLevel,
        isEncrypted: true,
        encryptedReflection,
        decryptedReflection: reflectionPlain,
        status: isValidated ? 'validated' : 'submitted',
        parentValidation: isValidated ? {
          validated: true,
          status: 'valid',
          validatedAt: Date.now() - (i - 1) * 86400000,
          parentId: student.parentId || 'usr-ortu-1',
          parentName: 'Bpk. Hendra Pratama',
          notes: overallScore >= 80 
            ? 'Bagus sekali ananda! Pertahankan kebiasaan bangun pagi dan sholat tepat waktu.' 
            : 'Perlu ditingkatkan lagi porsi makan sayur dan tidur tidak larut malam ya nak.',
          rating: overallScore >= 80 ? 5 : 4,
          signatureStatus: true
        } : undefined,
        teacherFeedback: i === 7 ? {
          reviewed: true,
          reviewedAt: Date.now() - 6 * 86400000,
          teacherId: 'usr-walikelas-1',
          teacherName: 'Ibu Siti Rahmawati, S.Pd.',
          notes: 'Perkembangan 7 KAIH ananda sangat konsisten. Teruskan semangat literasi dan tolong-menolong!',
          badgeAwarded: 'Bintang 7 KAIH Teladan'
        } : undefined
      };

      entries.push(entry);
    }
  });

  return entries;
}
