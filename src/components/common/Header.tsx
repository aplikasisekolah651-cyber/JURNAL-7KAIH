import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Bell, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  GraduationCap, 
  Heart, 
  UserCheck, 
  Shield, 
  LogOut,
  User as UserIcon,
  KeyRound,
  Building2,
  IdCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useJournal } from '../../context/JournalContext';
import { useSchoolSettings } from '../../context/SchoolContext';
import { UserRole } from '../../types';
import { SchoolLogo } from './SchoolLogo';
import { UserAvatar } from './UserAvatar';
import { NotificationDropdown } from './NotificationDropdown';
import { ReminderModal } from './ReminderModal';
import { E2EEBadge } from './E2EEBadge';
import { ProfileModal } from '../profile/ProfileModal';
import { ChangePasswordModal } from '../profile/ChangePasswordModal';

interface HeaderProps {
  onSelectDate?: (date: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectDate }) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadNotificationCount } = useJournal();
  const { schoolSettings } = useSchoolSettings();
  
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'siswa':
        return 'Siswa';
      case 'orangtua':
        return 'Orang Tua';
      case 'walikelas':
        return 'Wali Kelas';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'siswa':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'orangtua':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'walikelas':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'admin':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-2.5">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <SchoolLogo className="w-8 h-8 shrink-0 drop-shadow-xs" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  Jurnal 7 KAIH
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  {schoolSettings.name.replace('SMP Negeri ', 'SMPN ')}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:block sm:block leading-none mt-0.5 truncate">
                {schoolSettings.name} • {schoolSettings.regency} ({schoolSettings.academicYear} {schoolSettings.semester})
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5">
            {/* E2EE Security Badge */}
            <div className="hidden sm:block">
              <E2EEBadge />
            </div>

            {/* Reminder Config Button */}
            <button
              id="header-reminder-btn"
              onClick={() => setShowReminderModal(true)}
              className="p-2 sm:p-1.5 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              title="Pengingat Otomatis 7 KAIH"
            >
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                id="header-notif-btn"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-2 sm:p-1.5 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0F172A] animate-pulse" />
                )}
              </button>

              <NotificationDropdown
                isOpen={showNotificationDropdown}
                onClose={() => setShowNotificationDropdown(false)}
                onSelectDate={onSelectDate}
              />
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              id="header-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 sm:p-1.5 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* User Account Menu Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                id="header-user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1.5 pl-2 pr-2.5 min-h-[38px] rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/60 transition-colors text-left"
              >
                <UserAvatar
                  user={currentUser}
                  gender={currentUser.gender}
                  size="sm"
                  className="w-6 h-6 rounded-lg ring-1 ring-white dark:ring-slate-700 shrink-0"
                />
                <div className="hidden sm:block max-w-[120px]">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 capitalize truncate leading-none mt-0.5">
                    {getRoleLabel(currentUser.role)}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Account Popover */}
              {showUserMenu && (
                <div className="absolute right-0 top-11 z-50 w-72 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150">
                  {/* Account Info Box */}
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-xl mb-2">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        user={currentUser}
                        gender={currentUser.gender}
                        size="md"
                        className="w-10 h-10 rounded-xl ring-1 ring-indigo-500/20 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                          {currentUser.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wider ${getRoleBadgeStyle(currentUser.role)}`}>
                            {getRoleLabel(currentUser.role)}
                          </span>
                          {currentUser.className && (
                            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {currentUser.className}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentUser.nisn && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <IdCard className="w-3 h-3 text-indigo-500" /> NISN
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser.nisn}</span>
                      </div>
                    )}
                  </div>

                  {/* Account Action Menus */}
                  <div className="space-y-1">
                    {/* Profil Menu */}
                    <button
                      id="btn-menu-profil"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <p className="leading-tight">Profil Pengguna</p>
                        <p className="text-[10px] text-slate-400 font-normal">Lihat data akun & identitas</p>
                      </div>
                    </button>

                    {/* Rubah Password Menu */}
                    <button
                      id="btn-menu-change-password"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowChangePasswordModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="leading-tight">Rubah Password</p>
                        <p className="text-[10px] text-slate-400 font-normal">Perbarui kata sandi akun</p>
                      </div>
                    </button>
                  </div>

                  {/* Divider & Logout Button */}
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      id="btn-header-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Keluar (Logout Akun)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Config Modal */}
      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </header>
  );
};

