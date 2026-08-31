import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../lib/constants';
import { E2EEService } from '../lib/crypto';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { 
  getUserAvatarUrl, 
  getRoleDefaultAvatar, 
  DATA_URI_SISWA_PUTRA, 
  DATA_URI_SISWA_PUTRI, 
  DATA_URI_ORANG_TUA, 
  DATA_URI_WALI_KELAS, 
  DATA_URI_ADMIN 
} from '../lib/avatarHelper';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  allUsers: User[];
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  addUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  deleteUsersBulk: (userIds: string[]) => Promise<void>;
  importStudentsBulk: (importedList: { 
    name: string; 
    nis?: string; 
    nisn?: string; 
    attendanceNumber?: string; 
    noAbsen?: string; 
    className: string; 
    gender?: 'L' | 'P'; 
    parentName?: string; 
    parentPhone?: string 
  }[]) => Promise<number>;
  generateNewCredentials: (userId: string) => Promise<string>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = '7kaih_users_v1';
const AUTH_SESSION_KEY = '7kaih_auth_session_v1';

export const normalizeClassName = (cn?: string): string => {
  if (!cn) return '7A';
  const clean = String(cn).trim().replace(/\s+/g, ' ');
  return clean || '7A';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map(u => ({
          ...u,
          className: u.className ? normalizeClassName(u.className) : u.className,
          avatar: getUserAvatarUrl(u)
        }));
      } catch (e) {
        console.error('Failed to parse cached users:', e);
      }
    }
    return DEMO_USERS;
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const sessionUserId = localStorage.getItem(AUTH_SESSION_KEY);
    if (sessionUserId) {
      const match = allUsers.find(u => u.id === sessionUserId);
      if (match) return match;
    }
    const defaultUser = allUsers.find(u => u.role === 'siswa') || DEMO_USERS[0];
    return defaultUser;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const sessionUserId = localStorage.getItem(AUTH_SESSION_KEY);
    return !!sessionUserId;
  });

  // Sync users to localStorage whenever allUsers changes
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Real-time Firestore sync listener
  useEffect(() => {
    if (db) {
      try {
        // Listen to Firestore users collection in background
        const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
          if (!snapshot.empty) {
            const firestoreUsers: User[] = [];
            snapshot.forEach((docSnap) => {
              firestoreUsers.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            if (firestoreUsers.length > 0) {
              setAllUsers(prev => {
                // Merge by ID
                const map = new Map<string, User>();
                prev.forEach(u => map.set(u.id, u));
                firestoreUsers.forEach(u => map.set(u.id, u));
                return Array.from(map.values());
              });
            }
          }
        }, (err) => {
          console.warn('Firestore users listener fallback to local:', err);
        });
        return () => unsub();
      } catch (e) {
        console.warn('Firestore users init:', e);
      }
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleaned = identifier.trim().toLowerCase();
    const cleanPwd = password.trim();

    if (!cleaned || !cleanPwd) {
      return { success: false, message: 'Harap isi username/NIS/email dan password.' };
    }

    const found = allUsers.find((u) => {
      const emailMatch = u.email.toLowerCase() === cleaned;
      const nisMatch = Boolean((u.nis && u.nis.toLowerCase() === cleaned) || (u.nisn && u.nisn.toLowerCase() === cleaned));
      const nameMatch = u.name.toLowerCase() === cleaned;
      const usernameMatch = u.email.toLowerCase().split('@')[0] === cleaned;
      const idMatch = u.id.toLowerCase() === cleaned || u.id.toLowerCase().replace('usr-', '') === cleaned;
      const phoneCleaned = cleaned.replace(/[^0-9]/g, '');
      const phoneMatch = Boolean(u.phone && phoneCleaned.length >= 8 && u.phone.replace(/[^0-9]/g, '') === phoneCleaned);
      
      // Admin aliases
      const isAdminAlias = u.role === 'admin' && (
        cleaned === 'admin' || 
        cleaned === 'administrator' || 
        cleaned === 'admin@sekolah.id' || 
        cleaned === 'aplikasisekolah651@gmail.com' ||
        cleaned === 'admin@smpn2kasihan.sch.id'
      );

      // Parent aliases derived from student NIS: "ortu.8923", "ortu_8923", "ortu8923"
      let isParentAlias = false;
      if (u.role === 'orangtua') {
        const pEmailPrefix = u.email.toLowerCase().split('@')[0];
        if (pEmailPrefix === cleaned || pEmailPrefix.replace(/[^a-z0-9]/g, '') === cleaned.replace(/[^a-z0-9]/g, '')) {
          isParentAlias = true;
        }

        // Check if cleaned identifier matches child's NIS or NISN with ortu prefix or plain child NIS
        if (u.studentIds && u.studentIds.length > 0) {
          const linkedStudents = allUsers.filter(s => u.studentIds?.includes(s.id));
          for (const s of linkedStudents) {
            const childNis = (s.nis || s.nisn || '').toLowerCase();
            if (childNis) {
              if (
                cleaned === `ortu.${childNis}` ||
                cleaned === `ortu_${childNis}` ||
                cleaned === `ortu${childNis}` ||
                cleaned === `ortu.${childNis}@sekolah.id`
              ) {
                isParentAlias = true;
                break;
              }
            }
          }
        }
      }

      // Student aliases
      const sNis = (u.nis || u.nisn || '').toLowerCase();
      const isStudentAlias = u.role === 'siswa' && Boolean(
        sNis && (
          cleaned === `siswa.${sNis}` ||
          cleaned === `siswa_${sNis}` ||
          cleaned === `siswa${sNis}`
        )
      );

      // Homeroom Teacher / Wali Kelas aliases
      const isTeacherAlias = u.role === 'walikelas' && (
        (u.className && cleaned === `wali.${u.className.toLowerCase()}`) ||
        (u.className && cleaned === `wali_${u.className.toLowerCase()}`) ||
        (u.className && cleaned === `wali${u.className.toLowerCase()}`)
      );

      return emailMatch || nisMatch || nameMatch || usernameMatch || idMatch || phoneMatch || isAdminAlias || isParentAlias || isStudentAlias || isTeacherAlias;
    });

    if (!found) {
      return { 
        success: false, 
        message: 'Akun dengan username / email / NIS tersebut tidak ditemukan.' 
      };
    }

    // Password verification with convenient standard fallback
    let isPasswordValid = !found.password || found.password === cleanPwd;

    if (!isPasswordValid) {
      if (found.role === 'admin') {
        isPasswordValid = 
          cleanPwd === 'admin' || 
          cleanPwd === 'admin123' || 
          cleanPwd === 'admin123#Master' || 
          cleanPwd === 'admin123#';
      } else if (found.role === 'siswa' && found.nisn) {
        isPasswordValid = 
          cleanPwd === `siswa${found.nisn}` ||
          cleanPwd === `siswa.${found.nisn}` ||
          cleanPwd === 'siswa123#' ||
          cleanPwd === 'siswa123#Secure';
      } else if (found.role === 'orangtua') {
        // Check password matching child NISN (ortu<NISN>)
        const linkedStudents = allUsers.filter(s => found.studentIds?.includes(s.id));
        const childNisns = linkedStudents.map(s => s.nisn).filter(Boolean);
        const childNisnMatch = childNisns.some(nisn => cleanPwd === `ortu${nisn}` || cleanPwd === `ortu.${nisn}`);
        isPasswordValid = childNisnMatch || cleanPwd === 'ortu123#' || cleanPwd === 'ortu123#Secure' || cleanPwd === 'ortu123';
      } else if (found.role === 'walikelas') {
        isPasswordValid = cleanPwd === 'wali123' || cleanPwd === 'wali123#Secure' || cleanPwd === 'wali123#';
      }
    }

    if (!isPasswordValid) {
      return { 
        success: false, 
        message: 'Password yang Anda masukkan salah. Silakan coba kembali.' 
      };
    }

    setCurrentUserState(found);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_SESSION_KEY, found.id);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_SESSION_KEY);
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_SESSION_KEY, user.id);
  };

  const switchUser = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUserState(target);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_SESSION_KEY, target.id);
    }
  };

  const switchRole = (role: UserRole) => {
    const target = allUsers.find(u => u.role === role);
    if (target) {
      setCurrentUserState(target);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_SESSION_KEY, target.id);
    }
  };

  const addUser = async (userData: Partial<User>): Promise<User> => {
    const newId = userData.id || `usr-${userData.role || 'siswa'}-${Date.now()}`;
    const userNis = userData.nis || userData.nisn;
    const userAbsen = userData.attendanceNumber || userData.noAbsen;
    
    // Standardized default password logic based on role & NIS
    let defaultPassword = userData.password;
    if (!defaultPassword) {
      if (userData.role === 'siswa' && userNis) {
        defaultPassword = `siswa${userNis}`;
      } else if (userData.role === 'orangtua') {
        defaultPassword = 'ortu123#Secure';
      } else if (userData.role === 'walikelas') {
        defaultPassword = 'wali123#Secure';
      } else if (userData.role === 'admin') {
        defaultPassword = 'admin123#Master';
      } else {
        defaultPassword = E2EEService.generateSecurePassword(8);
      }
    }
    
    // Identifier (Username / NIS / Email / Bebas)
    const identifier = userData.email?.trim() || (
      userData.role === 'siswa' && userNis
        ? userNis
        : `${userData.role || 'user'}_${Date.now()}`
    );

    const computedAvatar = userData.avatar && !userData.avatar.includes('api.dicebear.com') && !userData.avatar.includes('images.unsplash.com')
      ? userData.avatar
      : getUserAvatarUrl({ role: userData.role || 'siswa', gender: userData.gender });

    const newUser: User = {
      id: newId,
      name: userData.name || 'Pengguna Baru',
      email: identifier,
      role: userData.role || 'siswa',
      gender: userData.gender,
      nis: userNis,
      nisn: userNis,
      attendanceNumber: userAbsen,
      noAbsen: userAbsen,
      classId: userData.classId || 'class-7a',
      className: userData.className ? normalizeClassName(userData.className) : '7A',
      parentId: userData.parentId,
      studentIds: userData.studentIds,
      assignedClassIds: userData.assignedClassIds,
      phone: userData.phone || '08123456789',
      avatar: computedAvatar,
      password: defaultPassword,
      schoolName: 'SMP Negeri 2 Kasihan',
      createdAt: new Date().toISOString()
    };

    setAllUsers(prev => {
      const updated = [newUser, ...prev];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'users', newId), newUser);
      } catch (e) {
        console.warn('Firestore write user fallback:', e);
      }
    }

    return newUser;
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    setAllUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, ...updates } : u);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (currentUser.id === userId) {
      setCurrentUserState(prev => ({ ...prev, ...updates }));
    }

    if (db) {
      try {
        await setDoc(doc(db, 'users', userId), updates, { merge: true });
      } catch (e) {
        console.warn('Firestore user update fallback:', e);
      }
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    const userToDelete = allUsers.find(u => u.id === userId);
    
    setAllUsers(prev => {
      let updated = prev.filter(u => u.id !== userId);

      // If deleted user is a student, unlink or remove orphaned parent
      if (userToDelete?.role === 'siswa') {
        updated = updated.map(u => {
          if (u.role === 'orangtua' && u.studentIds?.includes(userId)) {
            const newStudentIds = u.studentIds.filter(id => id !== userId);
            return { ...u, studentIds: newStudentIds };
          }
          return u;
        });
      }

      // If deleted user is a parent, unlink child's parentId
      if (userToDelete?.role === 'orangtua') {
        updated = updated.map(u => {
          if (u.role === 'siswa' && u.parentId === userId) {
            const { parentId, ...rest } = u;
            return rest as User;
          }
          return u;
        });
      }

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (e) {
        console.warn('Firestore delete user fallback:', e);
      }
    }
  };

  const deleteUsersBulk = async (userIds: string[]): Promise<void> => {
    if (!userIds || userIds.length === 0) return;
    const userSet = new Set(userIds);
    const usersToDelete = allUsers.filter(u => userSet.has(u.id));
    const studentIdsToDelete = new Set(usersToDelete.filter(u => u.role === 'siswa').map(u => u.id));
    const parentIdsToDelete = new Set(usersToDelete.filter(u => u.role === 'orangtua').map(u => u.id));

    setAllUsers(prev => {
      let updated = prev.filter(u => !userSet.has(u.id));

      if (studentIdsToDelete.size > 0) {
        updated = updated.map(u => {
          if (u.role === 'orangtua' && u.studentIds) {
            const newStudentIds = u.studentIds.filter(id => !studentIdsToDelete.has(id));
            return { ...u, studentIds: newStudentIds };
          }
          return u;
        });
      }

      if (parentIdsToDelete.size > 0) {
        updated = updated.map(u => {
          if (u.role === 'siswa' && u.parentId && parentIdsToDelete.has(u.parentId)) {
            const { parentId, ...rest } = u;
            return rest as User;
          }
          return u;
        });
      }

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (db) {
      try {
        const batch = writeBatch(db);
        userIds.forEach(uid => {
          batch.delete(doc(db, 'users', uid));
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore bulk delete user fallback:', e);
      }
    }
  };

  const generateNewCredentials = async (userId: string): Promise<string> => {
    const targetUser = allUsers.find(u => u.id === userId);
    let newPassword = E2EEService.generateSecurePassword(10);
    const targetNis = targetUser?.nis || targetUser?.nisn;
    if (targetUser?.role === 'siswa' && targetNis) {
      newPassword = `siswa${targetNis}`;
    } else if (targetUser?.role === 'orangtua') {
      const linked = allUsers.filter(s => targetUser.studentIds?.includes(s.id));
      const childNis = linked.length > 0 ? (linked[0].nis || linked[0].nisn) : '';
      if (childNis) {
        newPassword = `ortu${childNis}`;
      } else {
        newPassword = 'ortu123#Secure';
      }
    }
    await updateUser(userId, { password: newPassword });
    return newPassword;
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();

    if (currentUser.password && currentUser.password !== cleanOld) {
      return { success: false, message: 'Kata sandi lama yang Anda masukkan tidak sesuai.' };
    }

    if (cleanNew.length < 6) {
      return { success: false, message: 'Kata sandi baru harus memiliki minimal 6 karakter.' };
    }

    await updateUser(currentUser.id, { password: cleanNew });
    return { success: true, message: 'Kata sandi berhasil diubah dan disimpan dengan aman!' };
  };

  const importStudentsBulk = async (
    importedList: { 
      name: string; 
      nis?: string; 
      nisn?: string; 
      attendanceNumber?: string; 
      noAbsen?: string; 
      className: string; 
      gender?: 'L' | 'P'; 
      parentName?: string; 
      parentPhone?: string 
    }[]
  ): Promise<number> => {
    let count = 0;
    const newStudents: User[] = [];
    const newParents: User[] = [];

    for (const item of importedList) {
      const cleanNis = (item.nis || item.nisn || '').trim();
      const cleanAbsen = (item.attendanceNumber || item.noAbsen || '').trim();
      const cleanName = item.name.trim();
      if (!cleanName || !cleanNis) continue;
      
      const studentId = `usr-siswa-${cleanNis}`;
      const parentId = `usr-ortu-${cleanNis}`;

      // Normalize gender (L = Laki-laki, P = Perempuan)
      let cleanGender: 'L' | 'P' = 'L';
      if (item.gender) {
        const gStr = item.gender.trim().toUpperCase();
        if (gStr.startsWith('P') || gStr === 'WANITA' || gStr === 'PEREMPUAN') {
          cleanGender = 'P';
        } else {
          cleanGender = 'L';
        }
      }

      // 1. Orang tua: Otomatis dibuatkan akun dan dihubungkan ke anak
      const pName = item.parentName?.trim() || `Orang Tua dari ${cleanName}`;
      const parentUser: User = {
        id: parentId,
        name: pName.includes('(Ortu') ? pName : `${pName} (Ortu ${cleanName})`,
        email: `ortu.${cleanNis}@sekolah.id`,
        role: 'orangtua',
        studentIds: [studentId],
        phone: item.parentPhone?.trim() || '08123456789',
        avatar: DATA_URI_ORANG_TUA,
        password: `ortu${cleanNis}`, // Digenerate otomatis dari NIS anak
        schoolName: 'SMP Negeri 2 Kasihan',
        createdAt: new Date().toISOString()
      };
      newParents.push(parentUser);

      const normalizedClass = item.className ? normalizeClassName(item.className) : '7A';
      const cleanClassId = `class-${normalizedClass.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      // 2. Siswa: Kredensial terstandarisasi berbasis NIS
      const studentUser: User = {
        id: studentId,
        name: cleanName,
        email: `${cleanNis}@sekolah.id`,
        role: 'siswa',
        gender: cleanGender,
        nis: cleanNis,
        nisn: cleanNis,
        attendanceNumber: cleanAbsen,
        noAbsen: cleanAbsen,
        classId: cleanClassId,
        className: normalizedClass,
        parentId: parentId,
        phone: '08123456789',
        avatar: cleanGender === 'P' ? DATA_URI_SISWA_PUTRI : DATA_URI_SISWA_PUTRA,
        password: `siswa${cleanNis}`, // Digenerate otomatis dari NIS
        schoolName: 'SMP Negeri 2 Kasihan',
        createdAt: new Date().toISOString()
      };
      newStudents.push(studentUser);
      count++;
    }

    setAllUsers(prev => {
      // Remove any previous conflicting IDs, then prepend new ones
      const newIds = new Set([...newStudents.map(s => s.id), ...newParents.map(p => p.id)]);
      const filteredPrev = prev.filter(u => !newIds.has(u.id));
      const updated = [...newStudents, ...newParents, ...filteredPrev];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Realtime persistence to Firestore
    if (db) {
      try {
        const batch = writeBatch(db);
        [...newStudents, ...newParents].forEach(u => {
          batch.set(doc(db, 'users', u.id), u);
        });
        await batch.commit();
      } catch (e) {
        console.warn('Firestore write batch fallback:', e);
      }
    }

    return count;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        allUsers,
        login,
        logout,
        setCurrentUser,
        switchUser,
        switchRole,
        addUser,
        updateUser,
        deleteUser,
        deleteUsersBulk,
        importStudentsBulk,
        generateNewCredentials,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
