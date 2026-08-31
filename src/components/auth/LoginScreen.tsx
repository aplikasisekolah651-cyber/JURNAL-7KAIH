import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchoolSettings } from '../../context/SchoolContext';
import { SchoolLogo } from '../common/SchoolLogo';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { schoolSettings } = useSchoolSettings();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await login(identifier, password);
      if (!result.success) {
        setErrorMsg(result.message || 'Login gagal. Periksa kembali username dan kata sandi.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan saat memproses login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Official School Logo with Live Custom Logo Support */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 inline-flex items-center justify-center">
            <SchoolLogo 
              customLogoUrl={schoolSettings.customLogoUrl}
              size={104}
              className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-sm transition-transform hover:scale-105" 
            />
          </div>
        </div>
        
        {/* Dynamic School Name */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          JURNAL 7 KAIH
        </h1>
        <p className="mt-1 text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
          {schoolSettings.fullName || schoolSettings.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
          7 Kebiasaan Anak Indonesia Hebat • Penguatan Karakter & Literasi
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-7 px-5 sm:px-8 shadow-xl shadow-indigo-100/40 dark:shadow-none border border-slate-200/90 dark:border-slate-800 rounded-3xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username / NIS */}
            <div>
              <label 
                htmlFor="login-identifier" 
                className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                Username / NIS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan NIS siswa atau username akun..."
                  className="block w-full pl-10 pr-3.5 py-3 min-h-[46px] text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="login-password" 
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Kata Sandi (Password)
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="block w-full pl-10 pr-12 py-3 min-h-[46px] text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                  className="absolute inset-y-0 right-0 pr-3.5 pl-2 flex items-center min-h-[44px] min-w-[44px] justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button (Touch-Friendly) */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-submit-login"
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 min-h-[48px] px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memverifikasi akun...</span>
              ) : (
                <>
                  <span>Masuk ke Jurnal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Guidance Info for Mobile */}
          <div className="mt-5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-bold text-indigo-900 dark:text-indigo-300">Panduan Masuk Cepat:</p>
            <p>• <strong>Siswa</strong>: Gunakan <em>NIS</em> (Kata sandi: <code>siswa[NIS]</code>)</p>
            <p>• <strong>Orang Tua</strong>: Gunakan <em>ortu.[NIS]</em> (Kata sandi: <code>ortu[NIS]</code>)</p>
          </div>

          {/* Security Guarantee & School Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Dilindungi Enkripsi AES-256
            </span>
            <span className="font-medium text-slate-500 dark:text-slate-400">@{currentYear} - SMP Negeri 2 Kasihan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
