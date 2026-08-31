import React, { createContext, useContext, useState, useEffect } from 'react';
import { SchoolSettings } from '../types';
import { DEFAULT_SCHOOL_SETTINGS } from '../lib/constants';

interface SchoolContextType {
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (updates: Partial<SchoolSettings>) => void;
  resetSchoolSettings: () => void;
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

  useEffect(() => {
    localStorage.setItem(SCHOOL_SETTINGS_STORAGE_KEY, JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  const updateSchoolSettings = (updates: Partial<SchoolSettings>) => {
    setSchoolSettings((prev) => ({
      ...prev,
      ...updates
    }));
  };

  const resetSchoolSettings = () => {
    setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    localStorage.removeItem(SCHOOL_SETTINGS_STORAGE_KEY);
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
