import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JournalEntry, User, ClassAnalysisSummary, HabitKategoriLevel, SchoolSettings } from '../types';
import { HABIT_DEFINITIONS, KATEGORI_CONFIG, DEFAULT_SCHOOL_SETTINGS } from './constants';

export class PDFReportGenerator {
  /**
   * Helper to retrieve current active school settings from localStorage or fallback
   */
  public static getActiveSchoolSettings(): SchoolSettings {
    try {
      const saved = localStorage.getItem('7kaih_school_settings_v1');
      if (saved) {
        return { ...DEFAULT_SCHOOL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('PDF generator school settings fallback:', e);
    }
    return DEFAULT_SCHOOL_SETTINGS;
  }

  /**
   * Draw formal official Indonesian Kop Surat with customizable school config
   */
  private static drawFormalKopSurat(doc: jsPDF, isLandscape: boolean = false, customConfig?: SchoolSettings): number {
    const config = customConfig || this.getActiveSchoolSettings();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setTextColor(20, 20, 20);

    // Line 1: Pemerintah Kabupaten / Provinsi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(config.government.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

    // Line 2: Dinas Pendidikan
    doc.setFontSize(10.5);
    doc.text(config.department.toUpperCase(), pageWidth / 2, 17, { align: 'center' });

    // Line 3: Nama Sekolah (Standout Bold)
    doc.setFontSize(13.5);
    doc.text(config.fullName.toUpperCase(), pageWidth / 2, 23, { align: 'center' });

    // Line 4: Alamat & Kontak
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Alamat : ${config.address}`,
      pageWidth / 2,
      28,
      { align: 'center' }
    );
    doc.setFontSize(8);
    doc.text(
      `Telp : ${config.phone}  |  Email : ${config.email}  |  Website : ${config.website}`,
      pageWidth / 2,
      32,
      { align: 'center' }
    );

    // Double Border Divider (Garis Ganda Kop Surat)
    const lineY = 35;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(margin, lineY, pageWidth - margin, lineY);
    doc.setLineWidth(0.25);
    doc.line(margin, lineY + 0.9, pageWidth - margin, lineY + 0.9);

    return lineY + 5; // Return next Y position
  }

  /**
   * Export individual student monthly development report with formal Kop Surat
   */
  static generateStudentReport(
    student: User,
    entries: JournalEntry[],
    monthName: string,
    teacherFeedbackGlobal?: string,
    customConfig?: SchoolSettings
  ) {
    const config = customConfig || this.getActiveSchoolSettings();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // 1. Official Kop Surat
    const startY = this.drawFormalKopSurat(doc, false, config);

    // 2. Report Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('LAPORAN HASIL PEMANTAUAN 7 KEBIASAAN ANAK INDONESIA HEBAT (7 KAIH)', pageWidth / 2, startY + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Tahun Ajaran ${config.academicYear} (Semester ${config.semester}) • Periode: ${monthName}`, pageWidth / 2, startY + 9, { align: 'center' });

    // 3. Student Identity Box
    const infoY = startY + 12;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, infoY, pageWidth - 2 * margin, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.text('Nama Siswa', margin + 4, infoY + 6);
    doc.text('NIS', margin + 4, infoY + 12);
    doc.text('Kelas / No Absen', margin + 4, infoY + 18);

    const displayAbsen = student.attendanceNumber || student.noAbsen ? `No. ${student.attendanceNumber || student.noAbsen}` : '-';

    doc.setFont('helvetica', 'normal');
    doc.text(`: ${student.name}`, margin + 36, infoY + 6);
    doc.text(`: ${student.nis || student.nisn || '-'}`, margin + 36, infoY + 12);
    doc.text(`: ${student.className || '7A'} / ${displayAbsen}`, margin + 36, infoY + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Bulan Pemantauan', margin + 104, infoY + 6);
    doc.text('Total Jurnal Terisi', margin + 104, infoY + 12);
    doc.text('Tingkat Keterbiasaan', margin + 104, infoY + 18);

    const totalDays = entries.length;
    const avgScore = totalDays > 0 
      ? Math.round(entries.reduce((acc, curr) => acc + curr.overallScore, 0) / totalDays)
      : 0;

    let kategori: HabitKategoriLevel = 'belum_terbiasa';
    if (avgScore >= 80) kategori = 'sudah_terbiasa';
    else if (avgScore >= 50) kategori = 'mulai_terbiasa';

    doc.setFont('helvetica', 'normal');
    doc.text(`: ${monthName}`, margin + 144, infoY + 6);
    doc.text(`: ${totalDays} Hari (${avgScore}% Kepatuhan)`, margin + 144, infoY + 12);

    doc.setFont('helvetica', 'bold');
    if (kategori === 'sudah_terbiasa') {
      doc.setTextColor(16, 185, 129); // green
    } else if (kategori === 'mulai_terbiasa') {
      doc.setTextColor(217, 119, 6); // amber
    } else {
      doc.setTextColor(225, 29, 72); // rose
    }
    doc.text(`: ${KATEGORI_CONFIG[kategori].label.toUpperCase()}`, margin + 144, infoY + 18);

    doc.setTextColor(30, 41, 59);

    // 4. Rekapitulasi 7 Kebiasaan Table
    const tableTitleY = infoY + 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('I. Rekapitulasi Pelaksanaan 7 Pilar Kebiasaan', margin, tableTitleY);

    const habitRows = Object.keys(HABIT_DEFINITIONS).map((habitId, idx) => {
      const def = HABIT_DEFINITIONS[habitId as keyof typeof HABIT_DEFINITIONS];
      const completedTimes = entries.filter(e => e.habits[habitId as keyof typeof HABIT_DEFINITIONS]?.completed).length;
      const rate = totalDays > 0 ? Math.round((completedTimes / totalDays) * 100) : 0;
      
      let habitStatus = 'Belum Konsisten';
      if (rate >= 80) habitStatus = 'Sangat Baik (Konsisten)';
      else if (rate >= 50) habitStatus = 'Cukup Baik (Berkembang)';

      return [
        (idx + 1).toString(),
        def.shortName,
        def.tagline,
        `${completedTimes} / ${totalDays} hari`,
        `${rate}%`,
        habitStatus
      ];
    });

    autoTable(doc, {
      startY: tableTitleY + 3,
      head: [['No', 'Pilar Kebiasaan', 'Tujuan / Indikator', 'Keterisian', 'Kepatuhan', 'Status Analisis']],
      body: habitRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138], // Indigo-900
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 34 },
        2: { cellWidth: 56 },
        3: { halign: 'center', cellWidth: 26 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        5: { fontStyle: 'bold', cellWidth: 38 }
      }
    });

    // 5. Catatan Wali Kelas & Evaluasi Ortu
    let currentY = (doc as any).lastAutoTable.finalY + 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('II. Catatan Evaluasi & Bimbingan Wali Kelas', margin, currentY);

    currentY += 3;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const noteText = teacherFeedbackGlobal || 
      `Ananda ${student.name} menunjukkan perkembangan karakter yang ${KATEGORI_CONFIG[kategori].label.toLowerCase()} di SMP Negeri 2 Kasihan. Tetap istiqomah dalam beribadah, bangun pagi, dan aktif membaca buku di rumah. Terima kasih kepada Orang Tua atas konfirmasi dan pendampingan di rumah.`;
    
    doc.text(doc.splitTextToSize(noteText, pageWidth - 2 * margin - 8), margin + 4, currentY + 5);

    currentY += 24;

    // 6. Signatures Box (Siswa, Orang Tua, Wali Kelas, Kepala Sekolah)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${config.regency}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - margin - 50, currentY);

    currentY += 5;
    const colW = (pageWidth - 2 * margin) / 3;

    // Column 1: Siswa
    doc.text('Siswa / Murid,', margin + (colW / 2), currentY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(student.name, margin + (colW / 2), currentY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`NIS. ${student.nis || student.nisn || '-'}`, margin + (colW / 2), currentY + 22, { align: 'center' });

    // Column 2: Orang Tua
    doc.text('Orang Tua / Wali Murid,', margin + colW + (colW / 2), currentY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('( ................................... )', margin + colW + (colW / 2), currentY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Tanda Tangan & Nama Terang', margin + colW + (colW / 2), currentY + 22, { align: 'center' });

    // Column 3: Wali Kelas
    doc.text('Wali Kelas,', margin + 2 * colW + (colW / 2), currentY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Ibu Siti Rahmawati, S.Pd.', margin + 2 * colW + (colW / 2), currentY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('NIP. 19850314 200801 2 007', margin + 2 * colW + (colW / 2), currentY + 22, { align: 'center' });

    // Bottom Center: Mengetahui Kepala Sekolah (Digeser 2 baris ke bawah agar longgar & rapi)
    currentY += 35;
    if (currentY + 25 < doc.internal.pageSize.getHeight()) {
      doc.text('Mengetahui,', pageWidth / 2, currentY, { align: 'center' });
      doc.text(`Kepala ${config.name}`, pageWidth / 2, currentY + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(config.principalName, pageWidth / 2, currentY + 19, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${config.principalNip}`, pageWidth / 2, currentY + 23, { align: 'center' });
    }

    // Save File
    const filename = `Laporan_7KAIH_${student.name.replace(/\s+/g, '_')}_${monthName}.pdf`;
    doc.save(filename);
  }

  /**
   * Export comprehensive classroom monthly report for Wali Kelas & School Archive with formal Kop Surat
   */
  static generateClassReport(
    className: string,
    teacherName: string,
    monthName: string,
    summary: ClassAnalysisSummary,
    studentsList: { student: User; score: number; level: HabitKategoriLevel; entriesCount: number; validationRate: number }[],
    customConfig?: SchoolSettings
  ) {
    const config = customConfig || this.getActiveSchoolSettings();
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // 1. Official Kop Surat
    const startY = this.drawFormalKopSurat(doc, true, config);

    // 2. Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`REKAPITULASI HASIL ANALISIS 7 KEBIASAAN ANAK INDONESIA HEBAT (7 KAIH) - ${className.toUpperCase()}`, pageWidth / 2, startY + 3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Periode: ${monthName} (TA ${config.academicYear} ${config.semester}) • Wali Kelas: ${teacherName} • ${config.fullName}`, pageWidth / 2, startY + 8, { align: 'center' });

    // 3. Summary Stat Cards (4 Columns)
    doc.setTextColor(30, 41, 59);
    const cardWidth = (pageWidth - 2 * margin - 9) / 4;
    const cardY = startY + 11;

    // Box 1: Total Siswa
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, cardY, cardWidth, 16, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL SISWA KELAS', margin + 4, cardY + 5);
    doc.setFontSize(12);
    doc.text(`${summary.totalStudents} Murid`, margin + 4, cardY + 12);

    // Box 2: Sudah Terbiasa
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin + cardWidth + 3, cardY, cardWidth, 16, 2, 2, 'FD');
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(8);
    doc.text('SUDAH TERBIASA (≥80%)', margin + cardWidth + 7, cardY + 5);
    doc.setFontSize(12);
    doc.text(`${summary.categoryDistribution.sudah_terbiasa} Siswa (${Math.round((summary.categoryDistribution.sudah_terbiasa / summary.totalStudents) * 100)}%)`, margin + cardWidth + 7, cardY + 12);

    // Box 3: Mulai Terbiasa
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin + (cardWidth + 3) * 2, cardY, cardWidth, 16, 2, 2, 'FD');
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(8);
    doc.text('MULAI TERBIASA (50-79%)', margin + (cardWidth + 3) * 2 + 4, cardY + 5);
    doc.setFontSize(12);
    doc.text(`${summary.categoryDistribution.mulai_terbiasa} Siswa (${Math.round((summary.categoryDistribution.mulai_terbiasa / summary.totalStudents) * 100)}%)`, margin + (cardWidth + 3) * 2 + 4, cardY + 12);

    // Box 4: Belum Terbiasa
    doc.setFillColor(255, 228, 230);
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(margin + (cardWidth + 3) * 3, cardY, cardWidth, 16, 2, 2, 'FD');
    doc.setTextColor(225, 29, 72);
    doc.setFontSize(8);
    doc.text('BELUM TERBIASA (<50%)', margin + (cardWidth + 3) * 3 + 4, cardY + 5);
    doc.setFontSize(12);
    doc.text(`${summary.categoryDistribution.belum_terbiasa} Siswa (${Math.round((summary.categoryDistribution.belum_terbiasa / summary.totalStudents) * 100)}%)`, margin + (cardWidth + 3) * 3 + 4, cardY + 12);

    doc.setTextColor(30, 41, 59);

    // 4. Students Detail Table
    const tableBody = studentsList.map((item, idx) => [
      (idx + 1).toString(),
      item.student.nis || item.student.nisn || '-',
      item.student.attendanceNumber || item.student.noAbsen || '-',
      item.student.name,
      `${item.entriesCount} Hari`,
      `${item.score}%`,
      KATEGORI_CONFIG[item.level].label,
      `${item.validationRate}% Tervalidasi`,
      item.score >= 80 
        ? 'Sangat disiplin & konsisten dalam 7 pilar kebiasaan' 
        : item.score >= 50 
        ? 'Perlu peningkatan konsistensi membaca literasi & istirahat tepat waktu' 
        : 'Perlu bimbingan khusus dari wali kelas dan pendampingan orang tua'
    ]);

    autoTable(doc, {
      startY: cardY + 19,
      head: [['No', 'NIS', 'No. Absen', 'Nama Lengkap Siswa', 'Jurnal', 'Skor Rerata', 'Kategori Keterbiasaan', 'Validasi Ortu', 'Rekomendasi / Catatan Pembinaan']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 16 },
        3: { fontStyle: 'bold', cellWidth: 46 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        6: { halign: 'center', fontStyle: 'bold', cellWidth: 34 },
        7: { halign: 'center', cellWidth: 24 },
        8: { cellWidth: 68 }
      }
    });

    let endY = (doc as any).lastAutoTable.finalY + 8;
    if (endY > 165) {
      doc.addPage();
      endY = 20;
    }

    // Signatures (Kepala Sekolah & Wali Kelas)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${config.regency}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - margin - 60, endY);
    
    endY += 5;
    doc.text('Mengetahui,', 50, endY, { align: 'center' });
    doc.text(`Kepala ${config.name}`, 50, endY + 4, { align: 'center' });
    doc.text('Wali Kelas,', pageWidth - 50, endY + 4, { align: 'center' });

    endY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text(config.principalName, 50, endY, { align: 'center' });
    doc.text(teacherName, pageWidth - 50, endY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${config.principalNip}`, 50, endY + 4, { align: 'center' });
    doc.text('NIP. 19850314 200801 2 007', pageWidth - 50, endY + 4, { align: 'center' });

    const filename = `Rekap_Kelas_7KAIH_${className.replace(/\s+/g, '_')}_${monthName}.pdf`;
    doc.save(filename);
  }
}
