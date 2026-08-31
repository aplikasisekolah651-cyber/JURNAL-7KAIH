import React, { createContext, useContext, useState, useEffect } from 'react';
import { SchoolSettings } from '../types';
import { DEFAULT_SCHOOL_SETTINGS } from '../lib/constants';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface SchoolContextType {
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (updates: Partial<SchoolSettings>) => Promise<void>;
  resetSchoolSettings: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const SCHOOL_SETTINGS_STORAGE_KEY = '7kaih_school_settings_v1';

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem(SCHOOL_SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SCHOOL_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Failed to parse cached school settings:', e);
      }
    }
    return DEFAULT_SCHOOL_SETTINGS;
  });

  // Local storage backup
  useEffect(() => {
    localStorage.setItem(SCHOOL_SETTINGS_STORAGE_KEY, JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  // Firestore real-time sync listener
  useEffect(() => {
    if (db) {
      try {
        const unsub = onSnapshot(doc(db, 'settings', 'school'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<SchoolSettings>;
            setSchoolSettings(prev => ({
              ...prev,
              ...data
            }));
          }
        }, (err) => {
          console.warn('Firestore school settings listener fallback:', err);
        });
        return () => unsub();
      } catch (e) {
        console.warn('Firestore school settings init:', e);
      }
    }
  }, []);

  const updateSchoolSettings = async (updates: Partial<SchoolSettings>) => {
    setSchoolSettings((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(SCHOOL_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'school'), updates, { merge: true });
      } catch (e) {
        console.warn('Firestore school settings write fallback:', e);
      }
    }
  };

  const resetSchoolSettings = async () => {
    setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    localStorage.removeItem(SCHOOL_SETTINGS_STORAGE_KEY);
    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'school'), DEFAULT_SCHOOL_SETTINGS);
      } catch (e) {
        console.warn('Firestore school settings reset fallback:', e);
      }
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        schoolSettings,
        updateSchoolSettings,
        resetSchoolSettings
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchoolSettings = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchoolSettings must be used within a SchoolProvider');
  }
  return context;
};
