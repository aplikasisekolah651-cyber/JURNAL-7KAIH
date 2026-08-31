import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  RotateCcw, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  FileText,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  Eye,
  Database,
  CloudCheck
} from 'lucide-react';
import { useSchoolSettings } from '../../context/SchoolContext';
import { SchoolLogo } from '../common/SchoolLogo';
import { SchoolSettings } from '../../types';
import { DEFAULT_SCHOOL_SETTINGS } from '../../lib/constants';
import confetti from 'canvas-confetti';
import { audioNotifier } from '../../lib/audioNotifier';

export const AdminSettings: React.FC = () => {
  const { schoolSettings, updateSchoolSettings, resetSchoolSettings, isSyncedWithDb } = useSchoolSettings();
  const [formData, setFormData] = useState<SchoolSettings>({ ...schoolSettings });
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(schoolSettings.customLogoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form data if settings update from database in background
  useEffect(() => {
    setFormData(prev => ({
      ...schoolSettings,
      // preserve local changes if user is actively typing
      ...(isSaved ? {} : {})
    }));
    if (schoolSettings.customLogoUrl !== undefined) {
      setLogoPreview(schoolSettings.customLogoUrl || '');
    }
  }, [schoolSettings]);

  const handleInputChange = (field: keyof SchoolSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsSaved(false);
  };

  const compressAndOptimizeLogo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 360;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/png');
            resolve(optimizedBase64);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Gagal memproses gambar'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 5MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const optimizedBase64 = await compressAndOptimizeLogo(file);
      setLogoPreview(optimizedBase64);
      setFormData(prev => ({
        ...prev,
        customLogoUrl: optimizedBase64
      }));
      // Auto save to database
      await updateSchoolSettings({ customLogoUrl: optimizedBase64 });
      setIsSaved(true);
      audioNotifier.playSuccessChime();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Terjadi kesalahan saat memproses logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSchoolSettings(formData);
    setIsSaved(true);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });
    audioNotifier.playSuccessChime();

    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleReset = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh pengaturan identitas sekolah dan logo ke pengaturan bawaan?')) {
      await resetSchoolSettings();
      setFormData({ ...DEFAULT_SCHOOL_SETTINGS });
      setLogoPreview('');
      audioNotifier.playReminderChime();
    }
  };

  const handleRemoveCustomLogo = async () => {
    setLogoPreview('');
    setFormData(prev => ({
      ...prev,
      customLogoUrl: ''
    }));
    await updateSchoolSettings({ customLogoUrl: '' });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Pengaturan Identitas & Kop Surat Sekolah
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola nama sekolah, alamat resmi kop surat, kepala sekolah, tahun ajaran, dan logo aplikasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan identitas sekolah, logo, dan kop surat berhasil diperbarui dan diterapkan ke seluruh sistem!</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Form Fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section 1: School Identity */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                1. Data Identitas & Kop Surat Resmi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Resmi Sekolah (Kop Surat Baris 3):
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => {
                    handleInputChange('fullName', e.target.value);
                    handleInputChange('name', e.target.value);
                  }}
                  placeholder="Contoh: SMP NEGERI 2 KASIHAN"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pemerintah / Instansi Tingkat Atas (Kop Baris 1):
                </label>
                <input
                  type="text"
                  required
                  value={formData.government}
                  onChange={(e) => handleInputChange('government', e.target.value)}
                  placeholder="PEMERINTAH KABUPATEN BANTUL"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dinas Terkait (Kop Baris 2):
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap Jalan & Kelurahan:
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Jl. Bibis, Jetis, Tamantirto, Kasihan, Bantul"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kecamatan / Kapanewon:
                </label>
                <input
                  type="text"
                  required
                  value={formData.subDistrict}
                  onChange={(e) => handleInputChange('subDistrict', e.target.value)}
                  placeholder="Kasihan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kabupaten / Kota:
                </label>
                <input
                  type="text"
                  required
                  value={formData.regency}
                  onChange={(e) => handleInputChange('regency', e.target.value)}
                  placeholder="Bantul"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Provinsi:
                </label>
                <input
                  type="text"
                  required
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  placeholder="D.I. Yogyakarta"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Pos:
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="55183"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon / Fax:
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(0274) 379348"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Resmi Sekolah:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="smpn2kasihan@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Website Resmi:
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="www.smpn2kasihan.sch.id"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Principal & Academic Year */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                2. Kepala Sekolah & Periode Akademik
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Kepala Sekolah:
                </label>
                <input
                  type="text"
                  required
                  value={formData.principalName}
                  onChange={(e) => handleInputChange('principalName', e.target.value)}
                  placeholder="Sugiyarto, S.Pd., M.Pd."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Kepala Sekolah:
                </label>
                <input
                  type="text"
                  value={formData.principalNip}
                  onChange={(e) => handleInputChange('principalNip', e.target.value)}
                  placeholder="19700512 199512 1 002"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Pelajaran:
                </label>
                <input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => handleInputChange('academicYear', e.target.value)}
                  placeholder="2025/2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Semester Berjalan:
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Logo Management & Kop Surat Live Preview */}
        <div className="space-y-5">
          {/* Logo Card */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                3. Logo Resmi Sekolah
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 gap-3">
              <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <SchoolLogo customLogoUrl={logoPreview} size={56} />
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {logoPreview ? 'Logo Kustom Aktif' : 'Logo Bawaan Sekolah (SVG)'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Format: PNG/JPG/WebP/SVG (Maks. 2MB)
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Logo</span>
                </button>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomLogo}
                    className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 Logo sekolah khusus digunakan untuk <strong>Halaman Login</strong> dan identitas aplikasi. Sesuai format resmi, <strong>Kop Surat</strong> menggunakan format teks resmi instansi tanpa logo.
            </p>
          </div>

          {/* Live Kop Surat Preview */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Eye className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Pratinjau Kop Surat Resmi (Tanpa Logo)
              </h3>
            </div>

            {/* Simulated Paper Header */}
            <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-300 shadow-xs font-serif text-center relative overflow-hidden">
              <div className="space-y-0.5 pb-2 text-center">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
                  {formData.government}
                </p>
                <p className="text-[9.5px] font-bold uppercase text-slate-800">
                  {formData.department}
                </p>
                <p className="text-[13px] font-black uppercase text-slate-950 tracking-tight">
                  {formData.fullName || formData.name}
                </p>
                <p className="text-[8px] text-slate-600 font-sans leading-tight">
                  Alamat : {formData.address}, {formData.subDistrict}, {formData.regency}, {formData.province} {formData.postalCode}
                </p>
                <p className="text-[7.5px] text-slate-500 font-sans">
                  Telp : {formData.phone}  |  Email : {formData.email}  |  Website : {formData.website}
                </p>
              </div>

              {/* Double Line Divider */}
              <div className="space-y-0.5 pt-0.5">
                <div className="border-b-2 border-black" />
                <div className="border-b border-black" />
              </div>

              <div className="pt-2 text-left font-sans">
                <p className="text-[8px] text-slate-500">
                  Kepala Sekolah: <strong>{formData.principalName}</strong> (NIP. {formData.principalNip})
                </p>
                <p className="text-[8px] text-slate-500">
                  Tahun Pelajaran: <strong>{formData.academicYear}</strong> ({formData.semester})
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
