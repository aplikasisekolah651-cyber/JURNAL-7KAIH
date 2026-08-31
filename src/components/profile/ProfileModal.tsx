import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Check, 
  Edit3, 
  Sparkles,
  Calendar,
  IdCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SCHOOL_CONFIG } from '../../lib/constants';
import { UserAvatar } from '../common/UserAvatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenChangePassword
}) => {
  const { currentUser, updateUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(currentUser.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim()
      });
      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'siswa':
        return 'Siswa / Murid';
      case 'orangtua':
        return 'Orang Tua / Wali Murid';
      case 'walikelas':
        return 'Wali Kelas / Pendidik';
      case 'admin':
        return 'Administrator Sekolah';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'siswa':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'orangtua':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'walikelas':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="profile-modal-container"
        className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Profil Pengguna
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informasi detail akun & identitas sekolah
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Profil Anda berhasil diperbarui!</span>
            </div>
          )}

          {/* User Hero Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-left">
            <UserAvatar
              user={currentUser}
              gender={currentUser.gender}
              size="lg"
              className="w-16 h-16 rounded-2xl ring-2 ring-indigo-600/30 shadow-xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getRoleColor(currentUser.role)}`}>
                  {getRoleLabel(currentUser.role)}
                </span>
                {currentUser.className && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {currentUser.className}
                  </span>
                )}
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-indigo-500" />
                {SCHOOL_CONFIG.name}
              </p>
            </div>
          </div>

          {/* Form or Info Display */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username / ID Login (NIS / Username)
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="NIS Siswa / Username Akun"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* NIS / NIP */}
                {(currentUser.nis || currentUser.nisn) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <IdCard className="w-3 h-3 text-indigo-500" />
                      NIS Siswa
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {currentUser.nis || currentUser.nisn}
                    </p>
                  </div>
                )}

                {/* No Absen */}
                {(currentUser.attendanceNumber || currentUser.noAbsen) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <IdCard className="w-3 h-3 text-indigo-500" />
                      No. Absen
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 font-mono text-indigo-600 dark:text-indigo-400">
                      {currentUser.attendanceNumber || currentUser.noAbsen}
                    </p>
                  </div>
                )}

                {/* Role Status */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-indigo-500" />
                    Kelas
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {currentUser.className || '-'}
                  </p>
                </div>

                {/* Username */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-indigo-500" />
                    Username Akun
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {currentUser.email}
                  </p>
                </div>

                {/* Phone */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-500" />
                    Nomor WhatsApp / HP
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {currentUser.phone || '-'}
                  </p>
                </div>
              </div>

              {/* Security & Encryption Info */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold">Keamanan Akun Terlindungi:</span> Data jurnal 7 KAIH Anda dienkripsi secara aman dan hanya dapat diakses oleh Anda, Orang Tua, dan Wali Kelas.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
          {!isEditing && (
            <button
              id="edit-profile-btn"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data Profil</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onOpenChangePassword && (
              <button
                id="open-change-password-modal-btn"
                onClick={() => {
                  onClose();
                  onOpenChangePassword();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Rubah Password</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
