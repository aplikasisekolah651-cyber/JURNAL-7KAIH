import React, { createContext, useContext, useState, useEffect } from 'react';
import { SchoolSettings } from '../types';
import { DEFAULT_SCHOOL_SETTINGS } from '../lib/constants';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

interface SchoolContextType {
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (updates: Partial<SchoolSettings>) => Promise<void>;
  resetSchoolSettings: () => Promise<void>;
  isSyncedWithDb: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const SCHOOL_SETTINGS_STORAGE_KEY = '7kaih_school_settings_v1';

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncedWithDb, setIsSyncedWithDb] = useState(false);
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
    try {
      localStorage.setItem(SCHOOL_SETTINGS_STORAGE_KEY, JSON.stringify(schoolSettings));
    } catch (e) {
      console.warn('Local storage quota warning:', e);
    }
  }, [schoolSettings]);

  // Firestore real-time sync listener & immediate initial fetch
  useEffect(() => {
    if (!db) return;

    let isMounted = true;
    const settingsDocRef = doc(db, 'settings', 'school');

    // 1. Immediate fetch from Cloud Firestore Database
    getDoc(settingsDocRef).then((docSnap) => {
      if (isMounted && docSnap.exists()) {
        const data = docSnap.data() as Partial<SchoolSettings>;
        setSchoolSettings(prev => ({
          ...prev,
          ...data
        }));
        setIsSyncedWithDb(true);
      }
    }).catch((err) => {
      console.warn('Firestore school settings direct fetch fallback:', err);
    });

    // 2. Real-time onSnapshot listener
    try {
      const unsub = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SchoolSettings>;
          if (isMounted) {
            setSchoolSettings(prev => ({
              ...prev,
              ...data
            }));
            setIsSyncedWithDb(true);
          }
        }
      }, (err) => {
        console.warn('Firestore school settings listener fallback:', err);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn('Firestore school settings init error:', e);
    }
  }, []);

  const updateSchoolSettings = async (updates: Partial<SchoolSettings>) => {
    setSchoolSettings((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(SCHOOL_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return updated;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'school'), updates, { merge: true });
        setIsSyncedWithDb(true);
      } catch (e) {
        console.warn('Firestore school settings write fallback:', e);
      }
    }
  };

  const resetSchoolSettings = async () => {
    setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    try {
      localStorage.removeItem(SCHOOL_SETTINGS_STORAGE_KEY);
    } catch (e) {
      console.warn('Local storage remove warning:', e);
    }
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
        resetSchoolSettings,
        isSyncedWithDb
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
