import React, { useState } from 'react';
import { ShieldCheck, Lock, Info, X } from 'lucide-react';

export const E2EEBadge: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        id="e2ee-info-badge-btn"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-xs"
        title="Data refleksi dan catatan dilindungi enkripsi AES-256"
      >
        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>E2EE Terenkripsi</span>
        <Info className="w-3 h-3 text-emerald-500 opacity-80" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Privasi & Enkripsi End-to-End
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Standar Keamanan AES-256 Bit
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Aplikasi <strong>Jurnal 7 KAIH</strong> menerapkan sistem enkripsi client-side end-to-end (E2EE) untuk melindungi catatan refleksi pribadi murid, catatan validasi orang tua, dan rekap bimbingan wali kelas.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Kunci Kriptografis Unik</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Teks dienkripsi sebelum disimpan ke basis data cloud sehingga hanya pihak berwenang (Siswa, Orang Tua, dan Wali Kelas) yang dapat membaca informasi sensitif ini.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
