import React, { useState } from 'react';
import { Bell, Clock, Volume2, VolumeX, CheckCircle, X, BellRing, Sparkles } from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { HABIT_LIST } from '../../lib/constants';
import { HabitIcon } from './HabitIcon';
import { audioNotifier } from '../../lib/audioNotifier';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose }) => {
  const { reminders, updateReminder } = useJournal();
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [testTriggered, setTestTriggered] = useState(false);

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const granted = await audioNotifier.requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      audioNotifier.triggerPushNotification(
        'Pengingat 7 KAIH Aktif',
        'Notifikasi pengingat otomatis untuk kebiasaan harian Anda kini telah aktif.'
      );
    }
  };

  const handleTestChime = () => {
    audioNotifier.playReminderChime();
    setTestTriggered(true);
    setTimeout(() => setTestTriggered(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Pengingat Otomatis 7 KAIH
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur jadwal alarm & notifikasi harian untuk setiap kebiasaan
              </p>
            </div>
          </div>
          <button
            id="close-reminder-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Push Notification Banner */}
        <div className="my-4 p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {notificationPermissionGranted ? 'Notifikasi Browser Aktif' : 'Aktifkan Notifikasi Push'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {notificationPermissionGranted
                  ? 'Pengingat akan muncul di layar desktop & perangkat Anda.'
                  : 'Izinkan browser mengirim notifikasi pop-up tepat waktu.'}
              </p>
            </div>
          </div>
          {!notificationPermissionGranted ? (
            <button
              id="enable-browser-push-btn"
              onClick={handleRequestPush}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0 transition-colors"
            >
              Izinkan
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle className="w-4 h-4" /> Aktif
            </span>
          )}
        </div>

        {/* Habits List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {HABIT_LIST.map((habit) => {
            const reminder = reminders.find(r => r.habitId === habit.id) || {
              habitId: habit.id,
              enabled: true,
              time: habit.defaultTime,
              sound: true
            };

            return (
              <div
                key={habit.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  reminder.enabled
                    ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 shadow-xs'
                    : 'bg-slate-50/30 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${habit.badgeBg}`}>
                      <HabitIcon habitId={habit.id} size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {habit.shortName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {habit.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Time Picker */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={reminder.time}
                        disabled={!reminder.enabled}
                        onChange={(e) => updateReminder(habit.id, { time: e.target.value })}
                        className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none w-16"
                      />
                    </div>

                    {/* Sound Toggle */}
                    <button
                      onClick={() => updateReminder(habit.id, { sound: !reminder.sound })}
                      disabled={!reminder.enabled}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        reminder.sound
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                      title={reminder.sound ? 'Suara alarm aktif' : 'Suara alarm nonaktif'}
                    >
                      {reminder.sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>

                    {/* Enabled Switch */}
                    <button
                      onClick={() => updateReminder(habit.id, { enabled: !reminder.enabled })}
                      className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                        reminder.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleTestChime}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>{testTriggered ? 'Memutar Nada...' : 'Uji Nada Alarm'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            Simpan & Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
