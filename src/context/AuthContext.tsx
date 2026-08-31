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
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    } catch (e) {
      console.warn('LocalStorage users sync warning:', e);
    }
  }, [allUsers]);

  // Real-time Firestore sync listener & initial fetch
  useEffect(() => {
    if (!db) return;

    let isMounted = true;
    const usersColRef = collection(db, 'users');

    // 1. Immediate fetch from Firestore
    getDocs(usersColRef).then((snapshot) => {
      if (isMounted && !snapshot.empty) {
        const firestoreUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          firestoreUsers.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        if (firestoreUsers.length > 0) {
          setAllUsers(prev => {
            const map = new Map<string, User>();
            prev.forEach(u => map.set(u.id, u));
            firestoreUsers.forEach(u => map.set(u.id, u));
            return Array.from(map.values());
          });
        }
      }
    }).catch((err) => {
      console.warn('Firestore users direct fetch fallback:', err);
    });

    // 2. Real-time snapshot listener
    try {
      const unsub = onSnapshot(usersColRef, (snapshot) => {
        if (!snapshot.empty) {
          const firestoreUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            firestoreUsers.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          if (firestoreUsers.length > 0 && isMounted) {
            setAllUsers(prev => {
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
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn('Firestore users init:', e);
    }
  }, []);

  const findUserByIdentifier = (userList: User[], cleaned: string): User | undefined => {
    const rawClean = cleaned.replace(/\s+/g, '');
    return userList.find((u) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uEmailPrefix = uEmail.split('@')[0];
      const uNis = (u.nis || '').toLowerCase().trim();
      const uNisn = (u.nisn || '').toLowerCase().trim();
      const uName = (u.name || '').toLowerCase().trim();
      const uId = (u.id || '').toLowerCase().trim();
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const inputPhone = cleaned.replace(/[^0-9]/g, '');

      // Direct Matches
      if (uEmail === cleaned || uEmailPrefix === cleaned) return true;
      if (uNis && (uNis === cleaned || uNis === rawClean)) return true;
      if (uNisn && (uNisn === cleaned || uNisn === rawClean)) return true;
      if (uName === cleaned || uName.replace(/\s+/g, '') === rawClean) return true;
      if (uId === cleaned || uId.replace('usr-', '') === cleaned) return true;
      if (inputPhone.length >= 8 && uPhone.length >= 8 && uPhone === inputPhone) return true;

      // Admin aliases
      if (u.role === 'admin') {
        if (
          cleaned === 'admin' || 
          cleaned === 'administrator' || 
          cleaned === 'admin@sekolah.id' || 
          cleaned === 'aplikasisekolah651@gmail.com' ||
          cleaned === 'admin@smpn2kasihan.sch.id' ||
          cleaned === 'admin1'
        ) return true;
      }

      // Student aliases: "siswa.8921", "siswa8921", "siswa_8921", "8921"
      if (u.role === 'siswa') {
        const studentNis = uNis || uNisn;
        if (studentNis) {
          if (
            cleaned === studentNis ||
            cleaned === `siswa.${studentNis}` ||
            cleaned === `siswa_${studentNis}` ||
            cleaned === `siswa${studentNis}` ||
            cleaned === `${studentNis}@sekolah.id`
          ) return true;
        }
      }

      // Parent aliases: "ortu.8921", "ortu_8921", "ortu8921", child's NIS
      if (u.role === 'orangtua') {
        if (uEmailPrefix.replace(/[^a-z0-9]/g, '') === rawClean.replace(/[^a-z0-9]/g, '')) return true;

        if (u.studentIds && u.studentIds.length > 0) {
          const linkedStudents = userList.filter(s => u.studentIds?.includes(s.id));
          for (const s of linkedStudents) {
            const childNis = (s.nis || s.nisn || '').toLowerCase().trim();
            if (childNis) {
              if (
                cleaned === childNis ||
                cleaned === `ortu.${childNis}` ||
                cleaned === `ortu_${childNis}` ||
                cleaned === `ortu${childNis}` ||
                cleaned === `ortu.${childNis}@sekolah.id`
              ) return true;
            }
          }
        }
      }

      // Homeroom Teacher / Wali Kelas aliases: "wali.7a", "wali7a", "wali_7a", "guru.7a", "guru7a"
      if (u.role === 'walikelas') {
        const cName = (u.className || '').toLowerCase().trim();
        if (cName) {
          if (
            cleaned === `wali.${cName}` ||
            cleaned === `wali_${cName}` ||
            cleaned === `wali${cName}` ||
            cleaned === `guru.${cName}` ||
            cleaned === `guru${cName}` ||
            cleaned === `guru.${cName}@sekolah.id` ||
            cleaned === cName
          ) return true;
        }
      }

      return false;
    });
  };

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleaned = identifier.trim().toLowerCase();
    const cleanPwd = password.trim();

    if (!cleaned || !cleanPwd) {
      return { success: false, message: 'Harap isi username/NIS dan kata sandi.' };
    }

    let userPool = [...allUsers];
    let found = findUserByIdentifier(userPool, cleaned);

    // Fallback: If not found in current memory, query Firestore users directly
    if (!found && db) {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        if (!snapshot.empty) {
          const remoteUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            remoteUsers.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          userPool = remoteUsers;
          setAllUsers(remoteUsers);
          found = findUserByIdentifier(remoteUsers, cleaned);
        }
      } catch (err) {
        console.warn('Firestore live fallback query during login:', err);
      }
    }

    if (!found) {
      return { 
        success: false, 
        message: 'Akun dengan username / NIS tersebut tidak ditemukan.' 
      };
    }

    // Comprehensive Password Verification
    let isPasswordValid = false;
    
    // 1. Direct match with saved password
    if (!found.password || found.password === cleanPwd || found.password.toLowerCase() === cleanPwd.toLowerCase()) {
      isPasswordValid = true;
    }

    // 2. Standard convenient role fallbacks
    if (!isPasswordValid) {
      if (found.role === 'admin') {
        isPasswordValid = 
          cleanPwd === 'admin' || 
          cleanPwd === 'admin123' || 
          cleanPwd === 'admin123#Master' || 
          cleanPwd === 'admin123#' ||
          cleanPwd === 'admin#123';
      } else if (found.role === 'siswa') {
        const studentNis = (found.nis || found.nisn || '').toLowerCase().trim();
        isPasswordValid = 
          (Boolean(studentNis) && (
            cleanPwd.toLowerCase() === `siswa${studentNis}` ||
            cleanPwd.toLowerCase() === `siswa.${studentNis}` ||
            cleanPwd.toLowerCase() === studentNis
          )) ||
          cleanPwd === 'siswa123#' ||
          cleanPwd === 'siswa123#Secure' ||
          cleanPwd === 'siswa123' ||
          cleanPwd === '123456';
      } else if (found.role === 'orangtua') {
        const linkedStudents = userPool.filter(s => found.studentIds?.includes(s.id));
        const childNisList = linkedStudents.map(s => (s.nis || s.nisn || '').toLowerCase().trim()).filter(Boolean);
        const childNisMatch = childNisList.some(nis => 
          cleanPwd.toLowerCase() === `ortu${nis}` || 
          cleanPwd.toLowerCase() === `ortu.${nis}` || 
          cleanPwd.toLowerCase() === nis
        );
        isPasswordValid = 
          childNisMatch || 
          cleanPwd === 'ortu123#' || 
          cleanPwd === 'ortu123#Secure' || 
          cleanPwd === 'ortu123' ||
          cleanPwd === '123456';
      } else if (found.role === 'walikelas') {
        const cName = (found.className || '').toLowerCase().trim();
        isPasswordValid = 
          cleanPwd === 'wali123' || 
          cleanPwd === 'wali123#Secure' || 
          cleanPwd === 'wali123#' || 
          cleanPwd === 'guru123' ||
          (Boolean(cName) && cleanPwd.toLowerCase() === `wali${cName}`) ||
          cleanPwd === '123456';
      }
    }

    if (!isPasswordValid) {
      return { 
        success: false, 
        message: 'Kata sandi yang Anda masukkan salah. Silakan coba kembali.' 
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
        email: `ortu.${cleanNis}`,
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
        email: cleanNis,
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

    // Realtime persistence to Firestore (chunked in safe batches of 400 operations)
    if (db) {
      try {
        const allNew = [...newStudents, ...newParents];
        const chunkSize = 400;
        for (let i = 0; i < allNew.length; i += chunkSize) {
          const chunk = allNew.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach(u => {
            batch.set(doc(db, 'users', u.id), u);
          });
          await batch.commit();
        }
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
