import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Upload, 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Search, 
  Download, 
  Database, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  X, 
  GraduationCap, 
  Heart, 
  UserCheck, 
  Filter, 
  Printer, 
  FileText, 
  Menu, 
  LayoutDashboard, 
  Plus, 
  Eye, 
  EyeOff, 
  Building2,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth, normalizeClassName } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import { useSchoolSettings } from '../../context/SchoolContext';
import { User, UserRole } from '../../types';
import { E2EEService } from '../../lib/crypto';
import { E2EEBadge } from '../common/E2EEBadge';
import { SCHOOL_CONFIG } from '../../lib/constants';
import { UserAvatar } from '../common/UserAvatar';
import { 
  DATA_URI_SISWA_PUTRA, 
  DATA_URI_SISWA_PUTRI, 
  DATA_URI_ORANG_TUA, 
  DATA_URI_WALI_KELAS, 
  DATA_URI_ADMIN 
} from '../../lib/avatarHelper';
import { AdminSettings } from './AdminSettings';
import { AdminReports } from './AdminReports';
import { AdminJournalMonitoring } from './AdminJournalMonitoring';
import { PDFReportGenerator } from '../../lib/pdfGenerator';
import * as XLSX from 'xlsx';

type AdminMenuKey = 'overview' | 'students' | 'parents' | 'teachers' | 'journals' | 'reports' | 'import' | 'credentials' | 'settings' | 'database';

export const AdminDashboard: React.FC = () => {
  const { allUsers, addUser, updateUser, deleteUser, deleteUsersBulk, importStudentsBulk, generateNewCredentials } = useAuth();
  const { journals, getStudentJournals } = useJournal();
  const { schoolSettings } = useSchoolSettings();

  // Dynamically extract all available classes strictly matching imported students
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    
    // Extract classes directly from all registered students
    const students = allUsers.filter(u => u.role === 'siswa');
    students.forEach(s => {
      if (s.className && s.className.trim()) {
        classSet.add(s.className.trim());
      }
    });

    // Fallback only if no students are present in the system
    if (classSet.size === 0) {
      return ['7A', '7B', '8A', '9A'];
    }

    return Array.from(classSet).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [allUsers]);

  // Excel File Input Ref
  const excelFileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Sidebar Menu State
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Student Filter & Pagination & Bulk Selection States
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Parent Filter & Pagination & Bulk Selection States
  const [parentSearch, setParentSearch] = useState('');
  const [parentSelectedClass, setParentSelectedClass] = useState<string>('all');
  const [parentPage, setParentPage] = useState(1);
  const [parentPageSize, setParentPageSize] = useState(10);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);

  // Teacher Search State
  const [teacherSearch, setTeacherSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRole, setAddRole] = useState<UserRole>('siswa');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [deletingUser, setDeletingUser] = useState(false);

  // Bulk Delete Modal State
  const [bulkDeleteModal, setBulkDeleteModal] = useState<{
    open: boolean;
    role: 'siswa' | 'orangtua';
    ids: string[];
    count: number;
    title: string;
  }>({
    open: false,
    role: 'siswa',
    ids: [],
    count: 0,
    title: ''
  });
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    nisn: string;
    noAbsen: string;
    gender: 'L' | 'P';
    className: string;
    phone: string;
    parentName: string;
    parentPhone: string;
    assignedClass: string;
    linkedStudentId: string;
    customPassword: string;
  }>({
    name: '',
    email: '',
    nisn: '',
    noAbsen: '',
    gender: 'L',
    className: '7A',
    phone: '',
    parentName: '',
    parentPhone: '',
    assignedClass: '7A',
    linkedStudentId: '',
    customPassword: ''
  });

  // Credential Notification Modal
  const [credentialModal, setCredentialModal] = useState<{ user: User; password?: string; extraParent?: { user: User; password?: string } } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPasswordsMap, setShowPasswordsMap] = useState<Record<string, boolean>>({});

  // Bulk Import States
  const [importText, setImportText] = useState(
`23451, 01, Muhammad Faiz Al-Farisi, L, 7A, Bpk. Bambang Al-Farisi, 081234567810
23452, 02, Siti Aisyah Nurhaliza, P, 7A, Ibu Nurhayati, 081234567811
23453, 03, Rendy Pratama Putra, L, 7B, Bpk. Joko Susilo, 081234567812
23454, 04, Dwi Lestari Ramadhani, P, 7B, Ibu Sri Mulyani, 081234567813
23455, 05, Bagas Satria Yudha, L, 8A, Bpk. Tri Wibowo, 081234567814`
  );
  const [importing, setImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Print & Batch Credentials State
  const [credentialFilterClass, setCredentialFilterClass] = useState<string>('all');
  const [credentialFilterRole, setCredentialFilterRole] = useState<string>('all');
  const [credentialViewMode, setCredentialViewMode] = useState<'family' | 'individual'>('family');
  const [broadcastCopied, setBroadcastCopied] = useState(false);

  // Computed Users by Role
  const students = useMemo(() => allUsers.filter(u => u.role === 'siswa'), [allUsers]);
  const parents = useMemo(() => allUsers.filter(u => u.role === 'orangtua'), [allUsers]);
  const teachers = useMemo(() => allUsers.filter(u => u.role === 'walikelas'), [allUsers]);
  const admins = useMemo(() => allUsers.filter(u => u.role === 'admin'), [allUsers]);

  // Helper to normalize gender strings
  const normalizeGenderVal = (val?: string): 'L' | 'P' => {
    if (!val) return 'L';
    const s = String(val).trim().toUpperCase();
    if (s.startsWith('P') || s === 'WANITA' || s === 'PEREMPUAN' || s === 'F' || s === 'FEMALE') {
      return 'P';
    }
    return 'L';
  };

  const isGenderToken = (val?: string): boolean => {
    if (!val) return false;
    const s = String(val).trim().toUpperCase();
    return s === 'L' || s === 'P' || s === 'LAKI-LAKI' || s === 'PEREMPUAN' || s === 'LAKI' || s === 'WANITA' || s === 'PRIA' || s === 'M' || s === 'F';
  };

  const isClassToken = (val?: string): boolean => {
    if (!val) return false;
    const s = String(val).trim().toUpperCase().replace(/\s+/g, '');
    return /^[789VII|vii|VIII|IX|X]+[A-Z0-9]*$/.test(s) || /^[0-9]{1,2}[A-Z]$/.test(s);
  };

  const isPhoneToken = (val?: string): boolean => {
    if (!val) return false;
    const s = String(val).trim().replace(/[^0-9+]/g, '');
    return (s.startsWith('08') || s.startsWith('62') || s.startsWith('+62')) && s.length >= 9;
  };

  // Helper parser for single student import row/line (supports CSV, TSV/Excel copy-paste, semicolon, and pipe)
  // Equipped with Semantic Entity Extraction to auto-disambiguate shifted columns and auto-heal missing NIS
  const parseImportLine = (line: string, rowIdx: number = 1) => {
    const rawLine = line.trim();
    if (!rawLine) {
      return {
        nis: '',
        nisn: '',
        noAbsen: '',
        attendanceNumber: '',
        name: '',
        gender: 'L' as 'L' | 'P',
        className: '7A',
        studentUsername: '',
        studentPassword: '',
        parentName: '',
        parentPhone: '',
        parentUsername: '',
        parentPassword: '',
        isValid: false,
        isHeader: false,
        errorReason: 'Baris kosong'
      };
    }

    // Auto-detect delimiter: Tab (from Excel/Google Sheets copy), Semicolon, Pipe, or Comma
    let delimiter = ',';
    if (rawLine.includes('\t')) delimiter = '\t';
    else if (rawLine.includes(';') && !rawLine.includes(',')) delimiter = ';';
    else if (rawLine.includes('|')) delimiter = '|';

    // Parse tokens respecting trimmed string cleanups
    const rawParts = rawLine.split(delimiter).map(s => {
      let clean = s.trim().replace(/^["']|["']$/g, '');
      if (/^\d+\.0$/.test(clean)) clean = clean.replace(/\.0$/, '');
      return clean;
    });

    // Check if line is a header row
    const joinedLower = rawParts.join(' ').toLowerCase();
    const isHeader = (
      (joinedLower.includes('nama') && (joinedLower.includes('nis') || joinedLower.includes('kelas') || joinedLower.includes('absen') || joinedLower.includes('kelamin') || joinedLower.includes('gender') || joinedLower.includes('ortu'))) ||
      (joinedLower.includes('no') && (joinedLower.includes('absen') || joinedLower.includes('nama') || joinedLower.includes('siswa'))) ||
      (joinedLower.includes('daftar siswa') || joinedLower.includes('rekap peserta') || joinedLower.includes('buku induk')) ||
      rawParts[0]?.toLowerCase() === 'nis' ||
      rawParts[0]?.toLowerCase() === 'no' ||
      rawParts[0]?.toLowerCase() === 'no.' ||
      rawParts[0]?.toLowerCase() === 'no urut' ||
      rawParts[0]?.toLowerCase() === 'nisn'
    );

    if (isHeader) {
      return {
        nis: rawParts[0] || 'NIS',
        nisn: rawParts[0] || 'NIS',
        noAbsen: '',
        attendanceNumber: '',
        name: 'Header Kolom',
        gender: 'L' as 'L' | 'P',
        className: '',
        studentUsername: '',
        studentPassword: '',
        parentName: '',
        parentPhone: '',
        parentUsername: '',
        parentPassword: '',
        isValid: false,
        isHeader: true,
        errorReason: 'Baris judul header'
      };
    }

    // Semantic Token Classification
    let detectedPhone = '';
    let detectedClass = '';
    let detectedGender: 'L' | 'P' | null = null;
    let detectedAbsen = '';
    let detectedNis = '';
    const detectedNames: string[] = [];

    // Filter non-empty tokens
    const validTokens = rawParts.filter(p => p !== '' && p !== '-');

    validTokens.forEach((token) => {
      // 1. Phone number
      if (!detectedPhone && isPhoneToken(token)) {
        detectedPhone = token.replace(/[^0-9+]/g, '');
        return;
      }

      // 2. Class name (e.g. 7A, 7B, 8A, 9F)
      if (!detectedClass && isClassToken(token)) {
        detectedClass = normalizeClassName(token);
        return;
      }

      // 3. Gender (L / P)
      if (!detectedGender && isGenderToken(token)) {
        detectedGender = normalizeGenderVal(token);
        return;
      }

      // 4. Absen number (1-2 digits, 1 to 50)
      if (!detectedAbsen && /^\d{1,2}$/.test(token) && parseInt(token, 10) >= 1 && parseInt(token, 10) <= 60) {
        detectedAbsen = token.padStart(2, '0');
        return;
      }

      // 5. NIS (Numeric string 3-12 digits)
      if (!detectedNis && /^\d{3,12}$/.test(token)) {
        detectedNis = token;
        return;
      }

      // 6. Text Names (Student Name / Parent Name)
      // If it contains alphabetic characters and is not a gender or class token
      if (/[a-zA-Z]/.test(token) && token.length >= 2 && !isGenderToken(token) && !isClassToken(token)) {
        detectedNames.push(token);
      }
    });

    // Resolve Student & Parent Names
    let finalStudentName = '';
    let finalParentName = '';

    if (detectedNames.length >= 2) {
      finalStudentName = detectedNames[0];
      finalParentName = detectedNames[1];
    } else if (detectedNames.length === 1) {
      finalStudentName = detectedNames[0];
      finalParentName = `Orang Tua dari ${finalStudentName}`;
    }

    const finalClassName = detectedClass || '7A';
    const finalGender = detectedGender || 'L';
    const finalNoAbsen = detectedAbsen || (rowIdx > 0 ? String(rowIdx).padStart(2, '0') : '01');

    // Auto-Heal NIS if missing: construct from Class + Absen (e.g., 7A01, 7A02) or generated unique ID
    let finalNis = detectedNis;
    if (!finalNis || finalNis === 'L' || finalNis === 'P' || finalNis.length < 2) {
      if (finalClassName && finalNoAbsen) {
        finalNis = `${finalClassName.replace(/[^a-zA-Z0-9]/g, '')}${finalNoAbsen.padStart(2, '0')}`;
      } else {
        finalNis = `24${String(rowIdx).padStart(3, '0')}`;
      }
    }

    // Clean strings and sanitize tokens
    const cleanNis = finalNis.trim().replace(/[^a-zA-Z0-9._-]/g, '');
    const cleanName = finalStudentName.trim();
    const cleanNoAbsen = finalNoAbsen.trim() === '-' ? '' : finalNoAbsen.trim();
    const pAutoName = finalParentName.trim() || (cleanName ? `Orang Tua dari ${cleanName}` : '');

    let errorReason = '';
    if (!cleanName || cleanName.length < 2) {
      errorReason = 'Nama siswa belum lengkap';
    } else if (!cleanNis) {
      errorReason = 'NIS tidak boleh kosong';
    }

    const isValid = Boolean(cleanNis && cleanName && cleanName.length >= 2 && !isHeader);

    return {
      nis: cleanNis,
      nisn: cleanNis,
      noAbsen: cleanNoAbsen,
      attendanceNumber: cleanNoAbsen,
      name: cleanName,
      gender: finalGender,
      className: finalClassName,
      studentUsername: cleanNis,
      studentPassword: `siswa${cleanNis}`,
      parentName: pAutoName,
      parentPhone: detectedPhone.trim(),
      parentUsername: `ortu.${cleanNis}`,
      parentPassword: `ortu${cleanNis}`,
      isValid,
      isHeader: false,
      errorReason
    };
  };

  // Live parsing preview for bulk import (automatically skips header rows)
  const parsedImportPreview = useMemo(() => {
    const lines = importText.trim().split('\n').filter(l => l.trim().length > 0);
    const results: Array<ReturnType<typeof parseImportLine> & { idx: number }> = [];
    let validIdx = 1;

    for (let i = 0; i < lines.length; i++) {
      const parsed = parseImportLine(lines[i], validIdx);
      if (!parsed.isHeader && (parsed.name || parsed.nis)) {
        results.push({
          idx: validIdx++,
          ...parsed
        });
      }
    }
    return results;
  }, [importText]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          (s.nis && s.nis.includes(studentSearch)) ||
                          (s.nisn && s.nisn.includes(studentSearch)) ||
                          (s.attendanceNumber && s.attendanceNumber.includes(studentSearch)) ||
                          (s.noAbsen && s.noAbsen.includes(studentSearch)) ||
                          s.email.toLowerCase().includes(studentSearch.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, studentSearch]);

  // Filtered Parents
  const filteredParents = useMemo(() => {
    return parents.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
                          p.email.toLowerCase().includes(parentSearch.toLowerCase()) ||
                          (p.phone && p.phone.includes(parentSearch));
      if (!matchSearch) return false;
      if (parentSelectedClass === 'all') return true;
      const linkedChildren = students.filter(s => s.parentId === p.id || (p.studentIds && p.studentIds.includes(s.id)));
      return linkedChildren.some(c => c.className === parentSelectedClass);
    });
  }, [parents, parentSearch, parentSelectedClass, students]);

  // Reset student page and selections when filters change
  React.useEffect(() => {
    setStudentPage(1);
    setSelectedStudentIds([]);
  }, [selectedClass, studentSearch, studentPageSize]);

  // Reset parent page and selections when filters change
  React.useEffect(() => {
    setParentPage(1);
    setSelectedParentIds([]);
  }, [parentSelectedClass, parentSearch, parentPageSize]);

  // Paginated Students
  const totalStudentPages = Math.ceil(filteredStudents.length / studentPageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const startIndex = (studentPage - 1) * studentPageSize;
    return filteredStudents.slice(startIndex, startIndex + studentPageSize);
  }, [filteredStudents, studentPage, studentPageSize]);

  // Paginated Parents
  const totalParentPages = Math.ceil(filteredParents.length / parentPageSize) || 1;
  const paginatedParents = useMemo(() => {
    const startIndex = (parentPage - 1) * parentPageSize;
    return filteredParents.slice(startIndex, startIndex + parentPageSize);
  }, [filteredParents, parentPage, parentPageSize]);

  // Student Bulk Selection Helpers
  const isAllStudentsSelectedOnPage = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id));

  const handleSelectAllStudentsOnPage = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedStudents.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIdSet = new Set(paginatedStudents.map(s => s.id));
      setSelectedStudentIds(prev => prev.filter(id => !pageIdSet.has(id)));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Parent Bulk Selection Helpers
  const isAllParentsSelectedOnPage = paginatedParents.length > 0 && paginatedParents.every(p => selectedParentIds.includes(p.id));

  const handleSelectAllParentsOnPage = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedParents.map(p => p.id);
      setSelectedParentIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIdSet = new Set(paginatedParents.map(p => p.id));
      setSelectedParentIds(prev => prev.filter(id => !pageIdSet.has(id)));
    }
  };

  const handleToggleSelectParent = (id: string) => {
    setSelectedParentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Trigger
  const handleTriggerBulkDelete = (role: 'siswa' | 'orangtua') => {
    const ids = role === 'siswa' ? selectedStudentIds : selectedParentIds;
    if (ids.length === 0) return;
    setBulkDeleteModal({
      open: true,
      role,
      ids,
      count: ids.length,
      title: role === 'siswa' ? `Hapus Kolektif ${ids.length} Siswa` : `Hapus Kolektif ${ids.length} Orang Tua`
    });
  };

  // Bulk Delete Execution
  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteModal.ids || bulkDeleteModal.ids.length === 0) return;
    setDeletingBulk(true);
    try {
      await deleteUsersBulk(bulkDeleteModal.ids);
      if (bulkDeleteModal.role === 'siswa') {
        setSelectedStudentIds([]);
      } else if (bulkDeleteModal.role === 'orangtua') {
        setSelectedParentIds([]);
      }
      setBulkDeleteModal({ open: false, role: 'siswa', ids: [], count: 0, title: '' });
    } catch (err) {
      console.error('Error deleting bulk users:', err);
    } finally {
      setDeletingBulk(false);
    }
  };

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                          t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                          (t.className && t.className.toLowerCase().includes(teacherSearch.toLowerCase()));
      return matchSearch;
    });
  }, [teachers, teacherSearch]);

  // Toggle Password Visibility
  const togglePasswordVisibility = (id: string) => {
    setShowPasswordsMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Add Modal
  const handleOpenAddModal = (role: UserRole) => {
    setAddRole(role);
    setEditUser(null);
    setFormData({
      name: '',
      email: '',
      nisn: '',
      noAbsen: '',
      gender: 'L',
      className: '7A',
      phone: '08123456789',
      parentName: '',
      parentPhone: '08139876543',
      assignedClass: '7A',
      linkedStudentId: students[0]?.id || '',
      customPassword: ''
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setEditUser(user);
    setAddRole(user.role);
    const linkedParent = parents.find(p => p.id === user.parentId || (p.studentIds && p.studentIds.includes(user.id)));
    const cleanClassName = user.className?.replace(/^Kelas\s+/i, '').replace(/(\d+)-([A-Za-z])/g, '$1$2') || '7A';
    setFormData({
      name: user.name,
      email: user.email,
      nisn: user.nis || user.nisn || '',
      noAbsen: user.attendanceNumber || user.noAbsen || '',
      gender: user.gender || 'L',
      className: cleanClassName,
      phone: user.phone || '',
      parentName: linkedParent ? linkedParent.name.replace(/\s*\(Ortu.*\)/i, '') : '',
      parentPhone: linkedParent?.phone || '',
      assignedClass: cleanClassName,
      linkedStudentId: (user.studentIds && user.studentIds[0]) || '',
      customPassword: ''
    });
    setShowAddModal(true);
  };

  // Handle Save (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editUser) {
      // Update existing
      const updates: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        nis: formData.nisn ? formData.nisn.trim() : undefined,
        nisn: formData.nisn ? formData.nisn.trim() : undefined,
        attendanceNumber: formData.noAbsen ? formData.noAbsen.trim() : undefined,
        noAbsen: formData.noAbsen ? formData.noAbsen.trim() : undefined,
        className: formData.className,
        gender: formData.gender,
      };

      if (editUser.role === 'walikelas') {
        updates.className = formData.assignedClass;
      }
      if (editUser.role === 'orangtua' && formData.linkedStudentId) {
        updates.studentIds = [formData.linkedStudentId];
      }
      if (formData.customPassword && formData.customPassword.trim()) {
        updates.password = formData.customPassword.trim();
      }

      // If editing student and updated parent details
      if (editUser.role === 'siswa') {
        const linkedParent = parents.find(p => p.id === editUser.parentId || (p.studentIds && p.studentIds.includes(editUser.id)));
        if (linkedParent && (formData.parentName.trim() || formData.parentPhone.trim())) {
          const pName = formData.parentName.trim() || linkedParent.name;
          await updateUser(linkedParent.id, {
            name: pName.includes('(Ortu') ? pName : `${pName} (Ortu ${formData.name.trim()})`,
            phone: formData.parentPhone.trim() || linkedParent.phone
          });
        }
      }

      await updateUser(editUser.id, updates);
      setShowAddModal(false);
      return;
    }

    // Create New
    let newUser: User;

    if (addRole === 'siswa') {
      const cleanNisn = formData.nisn?.trim();
      const cleanAbsen = formData.noAbsen?.trim();
      const customUsername = formData.email?.trim();
      const studentIdentifier = customUsername 
        ? customUsername 
        : (cleanNisn ? cleanNisn : `siswa_${Date.now()}`);
      const studentPassword = formData.customPassword?.trim() || (cleanNisn ? `siswa${cleanNisn}` : E2EEService.generateSecurePassword(8));
      
      // Auto create linked parent (always generated and linked so parents appear in table)
      const pName = formData.parentName.trim() || `Orang Tua dari ${formData.name.trim()}`;
      const parentPassword = cleanNisn ? `ortu${cleanNisn}` : E2EEService.generateSecurePassword(8);
      const parentIdentifier = cleanNisn ? `ortu.${cleanNisn}` : `ortu_${Date.now()}`;
      
      const parentUser = await addUser({
        name: pName.includes('(Ortu') ? pName : `${pName} (Ortu ${formData.name.trim()})`,
        email: parentIdentifier,
        role: 'orangtua',
        phone: formData.parentPhone || '08139876543',
        password: parentPassword,
        avatar: DATA_URI_ORANG_TUA
      });

      newUser = await addUser({
        name: formData.name.trim(),
        email: studentIdentifier,
        role: 'siswa',
        gender: formData.gender || 'L',
        nis: cleanNisn,
        nisn: cleanNisn,
        attendanceNumber: cleanAbsen || undefined,
        noAbsen: cleanAbsen || undefined,
        className: formData.className,
        phone: formData.phone || '08123456789',
        parentId: parentUser.id,
        password: studentPassword,
        avatar: formData.gender === 'P' ? DATA_URI_SISWA_PUTRI : DATA_URI_SISWA_PUTRA
      });

      await updateUser(parentUser.id, { studentIds: [newUser.id] });

      setShowAddModal(false);
      setCredentialModal({
        user: newUser,
        password: studentPassword,
        extraParent: { user: parentUser, password: parentPassword }
      });
    } else if (addRole === 'orangtua') {
      const customUsername = formData.email?.trim();
      const linkedStudent = students.find(s => s.id === formData.linkedStudentId);
      const childNisn = linkedStudent?.nisn;
      const parentIdentifier = customUsername 
        ? customUsername 
        : (childNisn ? `ortu.${childNisn}` : `ortu_${Date.now()}`);
      const parentPassword = formData.customPassword?.trim() || (childNisn ? `ortu${childNisn}` : E2EEService.generateSecurePassword(8));

      newUser = await addUser({
        name: formData.name.trim(),
        email: parentIdentifier,
        role: 'orangtua',
        phone: formData.phone || '08139876543',
        studentIds: formData.linkedStudentId ? [formData.linkedStudentId] : [],
        password: parentPassword
      });

      setShowAddModal(false);
      setCredentialModal({ user: newUser, password: parentPassword });
    } else if (addRole === 'walikelas') {
      const customUsername = formData.email?.trim();
      const teacherIdentifier = customUsername || `wali.${formData.assignedClass.toLowerCase() || Date.now()}`;
      const waliPassword = formData.customPassword?.trim() || 'wali123#Secure';
      newUser = await addUser({
        name: formData.name.trim(),
        email: teacherIdentifier,
        role: 'walikelas',
        className: `${formData.assignedClass} (Wali Kelas)`,
        phone: formData.phone || '08112233445',
        password: waliPassword
      });

      setShowAddModal(false);
      setCredentialModal({ user: newUser, password: waliPassword });
    } else {
      const customUsername = formData.email?.trim();
      const adminIdentifier = customUsername || `admin_${Date.now()}`;
      const generatedPassword = formData.customPassword?.trim() || 'admin123#Master';
      newUser = await addUser({
        name: formData.name.trim(),
        email: adminIdentifier,
        role: 'admin',
        phone: formData.phone || '0812998877',
        password: generatedPassword
      });
      setShowAddModal(false);
      setCredentialModal({ user: newUser, password: generatedPassword });
    }
  };

  // Confirm and Execute User Deletion
  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;
    setDeletingUser(true);
    try {
      await deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setDeletingUser(false);
    }
  };

  // Generate New Password
  const handleRegeneratePassword = async (user: User) => {
    const newPass = await generateNewCredentials(user.id);
    setCredentialModal({ user, password: newPass });
  };

  // Bulk Import Processing
  const handleProcessImport = async () => {
    setImporting(true);
    setImportSuccessCount(null);
    try {
      const lines = importText.trim().split('\n');
      const parsed = lines
        .map(line => parseImportLine(line))
        .filter(item => item.isValid && !item.isHeader)
        .map(item => ({
          nis: item.nis,
          nisn: item.nisn,
          noAbsen: item.noAbsen,
          attendanceNumber: item.attendanceNumber,
          name: item.name,
          gender: item.gender,
          className: item.className,
          parentName: item.parentName || undefined,
          parentPhone: item.parentPhone || undefined
        }));

      if (parsed.length === 0) {
        alert('Tidak ada baris data siswa yang valid untuk diimpor. Pastikan minimal mengisi NIS dan Nama Siswa pada setiap baris.');
        return;
      }

      const count = await importStudentsBulk(parsed);
      setImportSuccessCount(count);
    } catch (err) {
      console.error('Import error:', err);
      alert('Terjadi kesalahan saat memproses impor data. Silakan coba lagi.');
    } finally {
      setImporting(false);
    }
  };

  // Download Sample Template CSV (7 Columns matching updated schema)
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "NIS,No Absen,Nama Siswa,Jenis Kelamin (L/P),Kelas,Nama Orang Tua,No HP Orang Tua\n" +
      "23451,01,Ahmad Fauzan,L,7A,Bpk. Fauzan,081234567801\n" +
      "23452,02,Annisa Rahma,P,7A,Ibu Rahma,081234567802\n" +
      "23453,03,Bayu Kurniawan,L,7B,Bpk. Kurniawan,081234567803\n" +
      "23454,04,Cinta Laura Santoso,P,7C,Ibu Laura,081234567804\n" +
      "23455,05,Doni Pratama Putra,L,8A,Bpk. Pratama,081234567805\n" +
      "23456,06,Eka Putri Lestari,P,8B,Ibu Lestari,081234567806\n" +
      "23457,07,Farhan Ramadhan,L,9A,Bpk. Ramadhan,081234567807\n" +
      "23458,08,Gita Permata Sari,P,9B,Ibu Permata,081234567808";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_siswa_7kaih_smpn2kasihan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Template Excel (.xlsx) matching latest database schema and account generator rules
  const handleDownloadExcelTemplate = () => {
    // Sheet 1: Data Siswa (7 Standar Kolom Database)
    const wsData = [
      ['NIS', 'No Absen', 'Nama Siswa', 'Jenis Kelamin (L/P)', 'Kelas', 'Nama Orang Tua', 'No HP Orang Tua'],
      ['23451', '01', 'Ahmad Fauzan', 'L', '7A', 'Bpk. Fauzan', '081234567801'],
      ['23452', '02', 'Annisa Rahma', 'P', '7A', 'Ibu Rahma', '081234567802'],
      ['23453', '03', 'Bayu Kurniawan', 'L', '7B', 'Bpk. Kurniawan', '081234567803'],
      ['23454', '04', 'Cinta Laura Santoso', 'P', '7C', 'Ibu Laura', '081234567804'],
      ['23455', '05', 'Doni Pratama Putra', 'L', '8A', 'Bpk. Pratama', '081234567805'],
      ['23456', '06', 'Eka Putri Lestari', 'P', '8B', 'Ibu Lestari', '081234567806'],
      ['23457', '07', 'Farhan Ramadhan', 'L', '9A', 'Bpk. Ramadhan', '081234567807'],
      ['23458', '08', 'Gita Permata Sari', 'P', '9B', 'Ibu Permata', '081234567808']
    ];
    
    // Explicitly treat strings as text to protect leading zeros ('01', '0812...')
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    Object.keys(ws).forEach(cellKey => {
      if (cellKey.startsWith('!')) return;
      if (ws[cellKey] && typeof ws[cellKey].v === 'string') {
        ws[cellKey].t = 's';
      }
    });

    ws['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 12 }, // No Absen
      { wch: 30 }, // Nama Siswa
      { wch: 22 }, // Jenis Kelamin
      { wch: 12 }, // Kelas
      { wch: 28 }, // Nama Orang Tua
      { wch: 20 }  // No HP Orang Tua
    ];

    // Sheet 2: Petunjuk Format Database & Akun
    const guideData = [
      ['PANDUAN LENGKAP TEMPLATE IMPOR DATA SISWA (7 KAIH SMPN 2 KASIHAN)'],
      [''],
      ['No', 'Nama Kolom', 'Keterangan Database', 'Kaidah Penulisan', 'Otomatisasi Akun Login'],
      ['1', 'NIS', 'Nomor Induk Siswa (Wajib)', 'Angka/Teks unik siswa (cth: 23451)', 'Username Login Siswa: [NIS] | Sandi: siswa[NIS]'],
      ['2', 'No Absen', 'Nomor Urut Presensi Kelas', '2 digit atau angka (cth: 01, 02, ...)', 'Disimpan sebagai Nomor Absen Siswa'],
      ['3', 'Nama Siswa', 'Nama Lengkap Siswa (Wajib)', 'Nama lengkap sesuai rapor', 'Nama Profil Siswa'],
      ['4', 'Jenis Kelamin (L/P)', 'Jenis Kelamin Siswa', 'Isi L (Laki-laki) atau P (Perempuan)', 'Avatar & profil otomatis sesuai gender'],
      ['5', 'Kelas', 'Rombel / Kelas', 'Format 7A, 7B, 8A, 9A, dll.', 'Menghubungkan siswa dengan Wali Kelas'],
      ['6', 'Nama Orang Tua', 'Nama Ayah/Ibu/Wali', 'Nama lengkap orang tua siswa', 'Username Ortu: ortu.[NIS] | Sandi: ortu[NIS]'],
      ['7', 'No HP Orang Tua', 'No. WhatsApp/HP Orang Tua', 'Format 08xxxx atau 62xxxx', 'Disimpan untuk pengiriman rekap kredensial WhatsApp']
    ];
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
    wsGuide['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 30 },
      { wch: 38 },
      { wch: 55 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk_Format_Akun');
    XLSX.writeFile(wb, 'template_import_siswa_7kaih_smpn2kasihan.xlsx');
  };

  // Helper to safely clean string/number values from Excel cells
  const cleanExcelCellValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    let s = String(val).trim();
    if (/^\d+\.0$/.test(s)) s = s.replace(/\.0$/, '');
    return s;
  };

  // Handle Excel (.xlsx / .xls) and CSV file upload
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;

        const workbook = XLSX.read(buffer, { type: 'array' });
        // Select sheet: prefer sheet with 'siswa' or 'data' in name, or default to first sheet
        const targetSheetName = workbook.SheetNames.find(n => {
          const lower = n.toLowerCase();
          return lower.includes('siswa') || lower.includes('data');
        }) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[targetSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        const parsedLines: string[] = [];
        let validIdx = 1;

        for (let r = 0; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          // Join row cells using tab delimiter to preserve column boundaries
          const joinedRow = row.map((val: any) => cleanExcelCellValue(val)).join('\t');
          if (!joinedRow.trim()) continue;

          const parsed = parseImportLine(joinedRow, validIdx);

          // Skip header row
          if (parsed.isHeader) continue;

          // If row contains valid name or NIS
          if (parsed.name && parsed.name.length >= 2) {
            parsedLines.push(`${parsed.nis}, ${parsed.noAbsen || String(validIdx).padStart(2, '0')}, ${parsed.name}, ${parsed.gender}, ${parsed.className}, ${parsed.parentName}, ${parsed.parentPhone}`);
            validIdx++;
          }
        }

        if (parsedLines.length > 0) {
          setImportText(parsedLines.join('\n'));
          setImportSuccessCount(null);
        } else {
          alert('Tidak ada baris data siswa yang ditemukan pada file Excel. Pastikan file memiliki data nama siswa.');
        }
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        alert('Gagal memproses file. Pastikan file berformat .xlsx, .xls, atau .csv yang valid.');
      } finally {
        if (excelFileInputRef.current) {
          excelFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadSampleImport = () => {
    setImportText(
`23451, 01, Ahmad Fauzan, L, 7A, Bpk. Fauzan, 081234567801
23452, 02, Annisa Rahma, P, 7A, Ibu Rahma, 081234567802
23453, 03, Bayu Kurniawan, L, 7B, Bpk. Kurniawan, 081234567803
23454, 04, Cinta Laura Santoso, P, 7C, Ibu Laura, 081234567804
23455, 05, Doni Pratama Putra, L, 8A, Bpk. Pratama, 081234567805
23456, 06, Eka Putri Lestari, P, 8B, Ibu Lestari, 081234567806
23457, 07, Farhan Ramadhan, L, 9A, Bpk. Ramadhan, 081234567807
23458, 08, Gita Permata Sari, P, 9B, Ibu Permata, 081234567808`
    );
    setImportSuccessCount(null);
  };

  const handleClearImport = () => {
    setImportText('');
    setImportSuccessCount(null);
  };

  // Copy WhatsApp Broadcast Text for Selected Class
  const handleCopyWhatsAppBroadcast = (targetClass: string) => {
    const list = targetClass === 'all' 
      ? students 
      : students.filter(s => s.className === targetClass);

    let text = `📋 *KREDENSIAL LOGIN JURNAL 7 KAIH*\n`;
    text += `🏫 *SMP NEGERI 2 KASIHAN*\n`;
    text += `🎯 Kelas: ${targetClass === 'all' ? 'Semua Kelas' : targetClass}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    list.forEach((s, idx) => {
      const linkedParent = parents.find(p => p.id === s.parentId || (p.studentIds && p.studentIds.includes(s.id)));
      const sPwd = s.password || `siswa${s.nis || s.nisn || '123'}`;
      const sNis = s.nis || s.nisn || s.email;
      const pPwd = linkedParent?.password || `ortu${sNis}`;
      const pUser = linkedParent ? linkedParent.email : `ortu.${sNis}`;

      text += `${idx + 1}. *${s.name}* (NIS: ${sNis})\n`;
      text += `   👤 *Login Siswa*:\n`;
      text += `      • Username (NIS): ${sNis}\n`;
      text += `      • Password: ${sPwd}\n`;
      
      if (linkedParent) {
        text += `   👨‍👩‍👧 *Login Orang Tua* (${linkedParent.name}):\n`;
        text += `      • Username: ${pUser}\n`;
        text += `      • Password: ${pPwd}\n`;
      }
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 *Petunjuk Masuk*:\n`;
    text += `1. Buka aplikasi Jurnal 7 KAIH SMP Negeri 2 Kasihan\n`;
    text += `2. Masukkan Username (NIS untuk Siswa, ortu.NIS untuk Orang Tua) dan Password di atas.\n`;
    text += `3. Jaga kerahasiaan kata sandi Anda. Salam sehat & berkarakter!`;

    navigator.clipboard.writeText(text);
    setBroadcastCopied(true);
    setTimeout(() => setBroadcastCopied(false), 3000);
  };

  // Export Data JSON
  const handleExportDataJSON = () => {
    const data = {
      school: SCHOOL_CONFIG,
      users: allUsers,
      journals,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_7kaih_smpn2kasihan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered Users for Credentials Batch Print
  const batchCredentialUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchRole = credentialFilterRole === 'all' || u.role === credentialFilterRole;
      const matchClass = credentialFilterClass === 'all' || u.className === credentialFilterClass;
      return matchRole && matchClass;
    });
  }, [allUsers, credentialFilterRole, credentialFilterClass]);

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-140px)] pb-12">
      {/* ===================== SIDEBAR MENU ===================== */}
      <aside className="w-full lg:w-64 shrink-0">
        {/* Mobile Toggle Button */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Menu Admin Sidebar</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Container */}
        <div className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm lg:sticky lg:top-24 space-y-4 ${
          mobileSidebarOpen ? 'block' : 'hidden lg:block'
        }`}>
          {/* Header Sidebar */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Panel Administrator
                </h3>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                  SMP Negeri 2 Kasihan
                </p>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveMenu('overview'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMenu === 'overview'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Ringkasan Master</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeMenu === 'overview' ? 'bg-purple-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {allUsers.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('students'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMenu === 'students'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4" />
                <span>Manajemen Siswa</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeMenu === 'students' ? 'bg-purple-700 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
              }`}>
                {students.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('parents'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMenu === 'parents'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                <span>Manajemen Orang Tua</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeMenu === 'parents' ? 'bg-purple-700 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                {parents.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('teachers'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMenu === 'teachers'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4" />
                <span>Manajemen Wali Kelas</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeMenu === 'teachers' ? 'bg-purple-700 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              }`}>
                {teachers.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('journals'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMenu === 'journals'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Monitoring Jurnal</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                activeMenu === 'journals' ? 'bg-purple-700 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
              }`}>
                {journals.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('reports'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMenu === 'reports'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Laporan & Cetak PDF</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                7 KAIH
              </span>
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1">
                Alat & Distribusi
              </span>

              <button
                onClick={() => { setActiveMenu('import'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeMenu === 'import'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Impor Data Siswa</span>
              </button>

              <button
                onClick={() => { setActiveMenu('credentials'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeMenu === 'credentials'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Cetak / Bagikan Login</span>
              </button>

              <button
                onClick={() => { setActiveMenu('settings'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeMenu === 'settings'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Pengaturan Sekolah & Kop</span>
              </button>

              <button
                onClick={() => { setActiveMenu('database'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeMenu === 'database'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Cadangan Database</span>
              </button>
            </div>
          </nav>

          {/* Quick Action Footer in Sidebar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleOpenAddModal('siswa')}
              className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-purple-200 dark:border-purple-800/60"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah User Baru</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <main className="flex-1 space-y-4 min-w-0">
        {/* ================= 1. OVERVIEW / RINGKASAN ================= */}
        {activeMenu === 'overview' && (
          <div className="space-y-4">
            {/* Top Banner */}
            <div className="bg-slate-900 dark:bg-[#1E293B] text-white rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Sistem Informasi 7 KAIH
                    </span>
                    <E2EEBadge />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Pusat Manajemen Master Data
                  </h2>
                  <p className="text-slate-300 text-xs max-w-xl">
                    Kelola data siswa per kelas, data orang tua siswa, penugasan wali kelas, impor data massal, serta pembagian kredensial login akun secara terenkripsi.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenAddModal('siswa')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Siswa</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('reports')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Laporan</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('import')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all shadow-xs active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-300" />
                    <span>Impor XLS / CSV</span>
                  </button>
                </div>
              </div>

              {/* 5 Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-white/10">
                <div 
                  onClick={() => setActiveMenu('students')} 
                  className="bg-blue-950/40 hover:bg-blue-950/60 cursor-pointer backdrop-blur-md rounded-xl p-3 border border-blue-500/30 transition-all"
                >
                  <span className="text-[10px] text-blue-200 font-semibold flex items-center justify-between">
                    <span>Siswa Terdaftar</span>
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-blue-300 mt-1">{students.length} Siswa</p>
                  <p className="text-[9px] text-blue-200/80">Pengisi Jurnal Kebiasaan</p>
                </div>

                <div 
                  onClick={() => setActiveMenu('parents')} 
                  className="bg-rose-950/40 hover:bg-rose-950/60 cursor-pointer backdrop-blur-md rounded-xl p-3 border border-rose-500/30 transition-all"
                >
                  <span className="text-[10px] text-rose-200 font-semibold flex items-center justify-between">
                    <span>Orang Tua / Wali</span>
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-rose-300 mt-1">{parents.length} Akun</p>
                  <p className="text-[9px] text-rose-200/80">Validator & Pendamping</p>
                </div>

                <div 
                  onClick={() => setActiveMenu('teachers')} 
                  className="bg-emerald-950/40 hover:bg-emerald-950/60 cursor-pointer backdrop-blur-md rounded-xl p-3 border border-emerald-500/30 transition-all"
                >
                  <span className="text-[10px] text-emerald-200 font-semibold flex items-center justify-between">
                    <span>Wali Kelas & Guru</span>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-emerald-300 mt-1">{teachers.length} Pendidik</p>
                  <p className="text-[9px] text-emerald-200/80">Monitoring Kelas</p>
                </div>

                <div 
                  onClick={() => setActiveMenu('journals')} 
                  className="bg-indigo-950/40 hover:bg-indigo-950/60 cursor-pointer backdrop-blur-md rounded-xl p-3 border border-indigo-500/30 transition-all"
                >
                  <span className="text-[10px] text-indigo-200 font-semibold flex items-center justify-between">
                    <span>Jurnal Terkumpul</span>
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-indigo-300 mt-1">{journals.length} Entri</p>
                  <p className="text-[9px] text-indigo-200/80">Pantau & Ekspor Excel</p>
                </div>

                <div 
                  onClick={() => setActiveMenu('credentials')} 
                  className="bg-purple-950/40 hover:bg-purple-950/60 cursor-pointer backdrop-blur-md rounded-xl p-3 border border-purple-500/30 transition-all"
                >
                  <span className="text-[10px] text-purple-200 font-semibold flex items-center justify-between">
                    <span>Total Akun Login</span>
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-purple-300 mt-1">{allUsers.length} User</p>
                  <p className="text-[9px] text-purple-200/80">Kredensial Siap Digenerate</p>
                </div>
              </div>
            </div>

            {/* Quick Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                  <span>Sebaran Siswa Per Kelas</span>
                </div>
                <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                  {availableClasses.map(cls => {
                    const count = students.filter(s => s.className === cls).length;
                    if (count === 0 && !['7A', '7B', '8A', '9A'].includes(cls)) return null;
                    return (
                      <div key={cls} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Kelas {cls}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded text-[11px]">
                          {count} Siswa
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>Wali Kelas Aktif</span>
                </div>
                <div className="space-y-2 text-xs">
                  {teachers.map(t => (
                    <div key={t.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <UserAvatar user={t} size="sm" className="w-8 h-8 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{t.name}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{t.className}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Fitur Cepat Administrasi</span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveMenu('import')}
                    className="w-full p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 text-left flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300 transition-all"
                  >
                    <span>📥 Impor Format CSV Siswa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveMenu('credentials')}
                    className="w-full p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 text-left flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300 transition-all"
                  >
                    <span>🔑 Cetak Kartu Kredensial Siswa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleExportDataJSON}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
                  >
                    <span>💾 Unduh Backup Database (JSON)</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. MANAJEMEN SISWA BERDASARKAN KELAS ================= */}
        {activeMenu === 'students' && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            {/* Header & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <span>Manajemen Siswa Berdasarkan Kelas</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total: <strong>{students.length} Siswa Terdaftar</strong> di SMP Negeri 2 Kasihan
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAddModal('siswa')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Siswa Baru</span>
                </button>
              </div>
            </div>

            {/* Filter Kelas & Pencarian */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Dropdown Filter Kelas */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Filter Kelas:</span>
                </div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                >
                  <option value="all">Semua Kelas ({students.length} Siswa)</option>
                  {availableClasses.map(cls => {
                    const count = students.filter(s => s.className === cls).length;
                    return (
                      <option key={cls} value={cls}>
                        Kelas {cls} ({count} Siswa)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama siswa, NISN, atau username..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Bulk Selection Action Toolbar */}
            {selectedStudentIds.length > 0 && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center">
                    {selectedStudentIds.length}
                  </span>
                  <span className="font-bold text-purple-900 dark:text-purple-200">
                    Siswa Terpilih untuk Tindakan Kolektif
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerBulkDelete('siswa')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kolektif ({selectedStudentIds.length} Siswa)</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudentIds([])}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-xs transition-colors"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}

            {/* Student Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[9px] font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllStudentsSelectedOnPage}
                        onChange={(e) => handleSelectAllStudentsOnPage(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Pilih Semua di Halaman Ini"
                      />
                    </th>
                    <th className="p-3">Siswa & NIS</th>
                    <th className="p-3 text-center">No. Absen</th>
                    <th className="p-3 text-center">L/P</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Username (NIS)</th>
                    <th className="p-3">Orang Tua Terhubung</th>
                    <th className="p-3">Password Kredensial</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 text-xs">
                        Tidak ada data siswa yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const linkedParent = parents.find(p => p.id === s.parentId || (p.studentIds && p.studentIds.includes(s.id)));
                      const isPwdVisible = showPasswordsMap[s.id];
                      const isSelected = selectedStudentIds.includes(s.id);
                      const displayAbsen = s.attendanceNumber || s.noAbsen;

                      return (
                        <tr 
                          key={s.id} 
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(s.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={s} gender={s.gender} size="sm" className="w-8 h-8 rounded-lg" />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                                  NIS: {s.nis || s.nisn || '-'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {displayAbsen ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {displayAbsen}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                              s.gender === 'P'
                                ? 'bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`} title={s.gender === 'P' ? 'Perempuan' : 'Laki-laki'}>
                              {s.gender || 'L'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {s.className || '7A'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                            {s.email}
                          </td>
                          <td className="p-3">
                            {linkedParent ? (
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{linkedParent.name}</p>
                                <p className="text-[10px] text-slate-400">{linkedParent.phone || '-'}</p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum terhubung</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                {isPwdVisible ? (s.password || 'siswa123#Secure') : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(s.id)}
                                title={isPwdVisible ? "Sembunyikan Password" : "Lihat Password"}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleRegeneratePassword(s)}
                                title="Reset / Generate Password Baru"
                                className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 rounded transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const sJournals = getStudentJournals(s.id);
                                  PDFReportGenerator.generateStudentReport(
                                    s,
                                    sJournals,
                                    'Agustus 2026',
                                    undefined,
                                    schoolSettings
                                  );
                                }}
                                title="Cetak Laporan PDF Siswa (7 KAIH)"
                                className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 rounded transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(s)}
                                title="Edit Data Siswa"
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ open: true, user: s })}
                                title="Hapus Siswa"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer for Students */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan <strong>{filteredStudents.length > 0 ? (studentPage - 1) * studentPageSize + 1 : 0}</strong> - <strong>{Math.min(studentPage * studentPageSize, filteredStudents.length)}</strong> dari <strong>{filteredStudents.length}</strong> siswa
                </span>

                <div className="flex items-center gap-1.5">
                  <span>Per hal:</span>
                  <select
                    value={studentPageSize}
                    onChange={(e) => setStudentPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                  disabled={studentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalStudentPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalStudentPages <= 5) {
                    pageNum = i + 1;
                  } else if (studentPage <= 3) {
                    pageNum = i + 1;
                  } else if (studentPage >= totalStudentPages - 2) {
                    pageNum = totalStudentPages - 4 + i;
                  } else {
                    pageNum = studentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setStudentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        studentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                  disabled={studentPage >= totalStudentPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. MANAJEMEN ORANG TUA ================= */}
        {activeMenu === 'parents' && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span>Manajemen Orang Tua / Wali Murid</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total: <strong>{parents.length} Akun Orang Tua</strong> terdaftar sebagai validator kebiasaan.
                </p>
              </div>

              <button
                onClick={() => handleOpenAddModal('orangtua')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Orang Tua Baru</span>
              </button>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Dropdown Filter Kelas Orang Tua */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-rose-500" />
                  <span>Filter Kelas:</span>
                </div>
                <select
                  value={parentSelectedClass}
                  onChange={(e) => setParentSelectedClass(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-xs"
                >
                  <option value="all">Semua Kelas ({parents.length} Orang Tua)</option>
                  {availableClasses.map(cls => {
                    const count = parents.filter(p => {
                      const linkedChildren = students.filter(s => s.parentId === p.id || (p.studentIds && p.studentIds.includes(s.id)));
                      return linkedChildren.some(c => c.className === cls);
                    }).length;
                    return (
                      <option key={cls} value={cls}>
                        Kelas {cls} ({count} Orang Tua)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama orang tua, no HP/WhatsApp, atau username..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Bulk Selection Action Toolbar for Parents */}
            {selectedParentIds.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-[11px] flex items-center justify-center">
                    {selectedParentIds.length}
                  </span>
                  <span className="font-bold text-rose-900 dark:text-rose-200">
                    Akun Orang Tua Terpilih untuk Tindakan Kolektif
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerBulkDelete('orangtua')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kolektif ({selectedParentIds.length} Orang Tua)</span>
                  </button>
                  <button
                    onClick={() => setSelectedParentIds([])}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-xs transition-colors"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}

            {/* Parent Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[9px] font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllParentsSelectedOnPage}
                        onChange={(e) => handleSelectAllParentsOnPage(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        title="Pilih Semua di Halaman Ini"
                      />
                    </th>
                    <th className="p-3">Nama Orang Tua</th>
                    <th className="p-3">No. WhatsApp / HP</th>
                    <th className="p-3">Username Ortu</th>
                    <th className="p-3">Siswa Asuh (Anak)</th>
                    <th className="p-3">Password</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedParents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                        Tidak ada data orang tua yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedParents.map((p) => {
                      const linkedChildren = students.filter(s => s.parentId === p.id || (p.studentIds && p.studentIds.includes(s.id)));
                      const isPwdVisible = showPasswordsMap[p.id];
                      const isSelected = selectedParentIds.includes(p.id);

                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectParent(p.id)}
                              className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={p} size="sm" className="w-8 h-8 rounded-lg" />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">ID: {p.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-mono">
                            {p.phone || '-'}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                            {p.email}
                          </td>
                          <td className="p-3">
                            {linkedChildren.length > 0 ? (
                              <div className="space-y-0.5">
                                {linkedChildren.map(c => (
                                  <span key={c.id} className="inline-block mr-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
                                    {c.name} ({c.className})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum dikaitkan</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                {isPwdVisible ? (p.password || 'ortu123#Secure') : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(p.id)}
                                title={isPwdVisible ? "Sembunyikan" : "Lihat"}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleRegeneratePassword(p)}
                                title="Generate Password Baru"
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Orang Tua"
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ open: true, user: p })}
                                title="Hapus Orang Tua"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer for Parents */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan <strong>{filteredParents.length > 0 ? (parentPage - 1) * parentPageSize + 1 : 0}</strong> - <strong>{Math.min(parentPage * parentPageSize, filteredParents.length)}</strong> dari <strong>{filteredParents.length}</strong> orang tua
                </span>

                <div className="flex items-center gap-1.5">
                  <span>Per hal:</span>
                  <select
                    value={parentPageSize}
                    onChange={(e) => setParentPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setParentPage(p => Math.max(1, p - 1))}
                  disabled={parentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalParentPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalParentPages <= 5) {
                    pageNum = i + 1;
                  } else if (parentPage <= 3) {
                    pageNum = i + 1;
                  } else if (parentPage >= totalParentPages - 2) {
                    pageNum = totalParentPages - 4 + i;
                  } else {
                    pageNum = parentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setParentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        parentPage === pageNum
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setParentPage(p => Math.min(totalParentPages, p + 1))}
                  disabled={parentPage >= totalParentPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. MANAJEMEN WALI KELAS ================= */}
        {activeMenu === 'teachers' && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>Manajemen Wali Kelas & Guru Pembimbing</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wali kelas memiliki hak akses memantau perkembangan jurnal, memberikan catatan apresiasi & rekomendasi kelas.
                </p>
              </div>

              <button
                onClick={() => handleOpenAddModal('walikelas')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Wali Kelas Baru</span>
              </button>
            </div>

            {/* Teacher Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTeachers.map((t) => {
                const isPwdVisible = showPasswordsMap[t.id];
                return (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={t} size="md" className="w-11 h-11 rounded-xl" />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{t.name}</h4>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mt-0.5">
                            {t.className || 'Wali Kelas'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, user: t })}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400">Username / Email:</span>
                        <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px] truncate">{t.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">No. WhatsApp / HP:</span>
                        <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">{t.phone || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Password:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-[11px]">
                          {isPwdVisible ? (t.password || 'wali123#Secure') : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(t.id)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {isPwdVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>

                      <button
                        onClick={() => handleRegeneratePassword(t)}
                        className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset Sandi</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= 4.5 MONITORING JURNAL SISWA ================= */}
        {activeMenu === 'journals' && (
          <AdminJournalMonitoring />
        )}

        {/* ================= 5. CETAK LAPORAN 7 KAIH ================= */}
        {activeMenu === 'reports' && (
          <AdminReports />
        )}

        {/* ================= 6. IMPOR DATA SISWA MASSAL (XLS/XLSX/CSV) ================= */}
        {activeMenu === 'import' && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Impor Data Siswa Format Excel (.XLS / .XLSX / .CSV)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unggah file spreadsheet Excel atau salin format CSV: Akun Siswa & Akun Orang Tua langsung digenerate otomatis dan saling terhubung.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleImport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-all active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Muat Contoh</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Template Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Template CSV</span>
                </button>
              </div>
            </div>

            {/* Excel Upload Dropzone Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/40 dark:to-indigo-950/40 border border-dashed border-purple-300 dark:border-purple-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-purple-200 dark:border-purple-800 text-emerald-600">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Unggah File Excel Spreadsheet (.xlsx / .xls)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedFileName ? (
                      <span className="text-purple-600 dark:text-purple-400 font-bold">File terpilih: {selectedFileName}</span>
                    ) : (
                      'Pilih file Excel dari komputer Anda untuk langsung membaca dan mengekstrak daftar siswa.'
                    )}
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={excelFileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => excelFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Pilih File Excel / CSV</span>
              </button>
            </div>

            {/* Format Instructions Box */}
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 text-xs font-bold">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Format Standar 7 Kolom Data Siswa:</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("NIS,No Absen,Nama Siswa,Jenis Kelamin (L/P),Kelas,Nama Orang Tua,No HP Orang Tua");
                    alert('Format header kolom berhasil disalin ke clipboard!');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-300 hover:text-purple-900 font-semibold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 shadow-2xs hover:bg-purple-50 transition-all cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Salin Header Kolom</span>
                </button>
              </div>

              {/* 7 Columns Visual Badges */}
              <div className="flex flex-wrap gap-1.5 font-sans">
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  1. NIS <span className="text-rose-500">*</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                  2. No Absen
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  3. Nama Siswa <span className="text-rose-500">*</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-sky-700 dark:text-sky-300 shadow-2xs">
                  4. JK (L/P)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
                  5. Kelas (7A-9F)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                  6. Nama Orang Tua
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                  7. No HP Ortu (WA)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 space-y-1">
                <p className="font-mono text-[11px] text-purple-950 dark:text-purple-200 overflow-x-auto whitespace-nowrap">
                  NIS, No Absen, Nama Siswa, Jenis Kelamin (L/P), Kelas, Nama Orang Tua, No HP Orang Tua
                </p>
                <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap">
                  Contoh: 23451, 01, Ahmad Fauzan, L, 7A, Bpk. Fauzan, 081234567801
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                  <p><strong>Akun Siswa Otomatis:</strong> User <code>[NIS]</code> | Sandi <code>siswa[NIS]</code></p>
                </div>
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <p><strong>Akun Orang Tua Otomatis:</strong> User <code>ortu.[NIS]</code> | Sandi <code>ortu[NIS]</code></p>
                </div>
              </div>
            </div>

            {/* Input Box */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Data Siswa (CSV Text / Ekstraksi Excel):
                </label>
                {importText && (
                  <button
                    onClick={handleClearImport}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-medium"
                  >
                    Bersihkan Kolom
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="23451, 01, Muhammad Faiz, L, 7A, Bpk. Bambang, 081234567810"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 resize-none shadow-inner"
              />

              {/* Live Interactive Table Preview */}
              {parsedImportPreview.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      <span>Pratinjau Otomatisasi Akun ({parsedImportPreview.length} Data Terdeteksi):</span>
                    </span>
                    {parsedImportPreview.some(r => !r.isValid) ? (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        {parsedImportPreview.filter(r => !r.isValid).length} Data Perlu Diperbaiki
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Semua ({parsedImportPreview.length}) Siap Diimpor
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 uppercase text-[9px] font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5 w-10">No</th>
                          <th className="p-2.5">Siswa & NIS</th>
                          <th className="p-2.5 text-center w-20">No. Absen</th>
                          <th className="p-2.5 text-center w-16">Kelas</th>
                          <th className="p-2.5">Kredensial Siswa</th>
                          <th className="p-2.5">Orang Tua Terhubung</th>
                          <th className="p-2.5">Kredensial Orang Tua</th>
                          <th className="p-2.5 text-center w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                        {parsedImportPreview.map((row) => (
                          <tr key={row.idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${!row.isValid ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}>
                            <td className="p-2.5 text-slate-400 font-mono text-center">{row.idx}</td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {row.name || <span className="text-rose-500 italic">Nama kosong</span>}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  row.gender === 'P'
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                }`}>
                                  {row.gender === 'P' ? 'P' : 'L'}
                                </span>
                              </div>
                              <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                                NIS: {row.nis || <span className="text-rose-500 italic">-</span>}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              {row.noAbsen ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {row.noAbsen}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="inline-block px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                                {row.className}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">User:</span>
                                <strong className="text-indigo-600 dark:text-indigo-400">{row.nis || '-'}</strong>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">Pass:</span>
                                <strong>{row.studentPassword || '-'}</strong>
                              </div>
                            </td>
                            <td className="p-2.5">
                              {row.parentName ? (
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">{row.parentName}</span>
                                  <span className="block text-[10px] text-slate-400 font-mono">{row.parentPhone || '-'}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Tanpa akun ortu</span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                              {row.parentName ? (
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">User:</span>
                                    <strong className="text-rose-600 dark:text-rose-400">{row.parentUsername}</strong>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">Pass:</span>
                                    <strong>{row.parentPassword}</strong>
                                  </div>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="p-2.5 text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Siap
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full" title={row.errorReason}>
                                  <AlertCircle className="w-3 h-3" /> {row.errorReason || 'Tidak Valid'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importSuccessCount !== null && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Sukses! Berhasil mengimpor {importSuccessCount} siswa dan men-generate seluruh kredensial akun orang tua!</span>
                  </div>
                  <button
                    onClick={() => setActiveMenu('credentials')}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all shrink-0"
                  >
                    Buka Tab Kredensial
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                <span className="text-[11px] text-slate-500">
                  Data otomatis terenkripsi dan siap dipakai login oleh siswa & orang tua.
                </span>
                <button
                  onClick={handleProcessImport}
                  disabled={importing || parsedImportPreview.filter(p => p.isValid).length === 0}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{importing ? 'Memproses Data...' : `Mulai Impor (${parsedImportPreview.filter(p => p.isValid).length} Siswa & Ortu)`}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 6. GENERATE & CETAK KREDENSIAL LOGIN ================= */}
        {activeMenu === 'credentials' && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <span>Generate & Distribusi Kredensial Login Pengguna</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cetak kartu login berpasangan (Siswa & Ortu) atau salin format teks WhatsApp untuk dibagikan ke wali murid.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleCopyWhatsAppBroadcast(credentialFilterClass)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{broadcastCopied ? '✓ Format WA Disalin!' : 'Salin Format Rekap WA'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Kartu (Print)</span>
                </button>
              </div>
            </div>

            {/* Filter Tools & Mode Switcher */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="w-full sm:w-44">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Filter Kelas:</label>
                  <select
                    value={credentialFilterClass}
                    onChange={(e) => setCredentialFilterClass(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="all">Semua Kelas</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                {credentialViewMode === 'individual' && (
                  <div className="w-full sm:w-44">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Filter Peran:</label>
                    <select
                      value={credentialFilterRole}
                      onChange={(e) => setCredentialFilterRole(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="all">Semua Peran ({allUsers.length})</option>
                      <option value="siswa">🎓 Siswa Saja ({students.length})</option>
                      <option value="orangtua">👨‍👩‍👧 Orang Tua Saja ({parents.length})</option>
                      <option value="walikelas">👩‍🏫 Wali Kelas Saja ({teachers.length})</option>
                    </select>
                  </div>
                )}
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-stretch md:self-auto">
                <button
                  onClick={() => setCredentialViewMode('family')}
                  className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    credentialViewMode === 'family'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  👨‍👩‍👦 Kartu Keluarga (Siswa + Ortu)
                </button>
                <button
                  onClick={() => setCredentialViewMode('individual')}
                  className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    credentialViewMode === 'individual'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  👤 Kartu Individual
                </button>
              </div>
            </div>

            {/* ================= MODE 1: FAMILY PAIRED CARDS ================= */}
            {credentialViewMode === 'family' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {students
                  .filter(s => credentialFilterClass === 'all' || s.className === credentialFilterClass)
                  .map((s) => {
                    const linkedParent = parents.find(p => p.id === s.parentId || (p.studentIds && p.studentIds.includes(s.id)));
                    const isStudentPwdVisible = showPasswordsMap[s.id];
                    const isParentPwdVisible = linkedParent ? showPasswordsMap[linkedParent.id] : false;
                    const sPwd = s.password || `siswa${s.nisn || '123'}`;
                    const pPwd = linkedParent?.password || (s.nisn ? `ortu${s.nisn}` : 'ortu123#');

                    const familyShareText = `KREDENSIAL LOGIN JURNAL 7 KAIH SMP NEGERI 2 KASIHAN\n` +
                      `Siswa: ${s.name} (${s.className || '7A'})\n` +
                      `• Login Siswa: ${s.nisn || s.email} | Sandi: ${sPwd}\n` +
                      (linkedParent ? `• Login Ortu (${linkedParent.name}): ortu.${s.nisn || s.id} | Sandi: ${pPwd}\n` : '');

                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-linear-to-b from-white to-purple-50/20 dark:from-slate-800 dark:to-slate-850 shadow-xs space-y-3 relative"
                      >
                        {/* Header Kartu Keluarga */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                              {s.className?.replace('Kelas ', '') || '7A'}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[200px]">
                                {s.name}
                              </h4>
                              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                                NISN: {s.nisn || '-'}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => copyToClipboard(familyShareText)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold transition-all"
                            title="Salin kredensial keluarga ini"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Salin Paket</span>
                          </button>
                        </div>

                        {/* Dual Column: Student & Parent */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {/* Student Box */}
                          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1">
                                <span>🎓 Akun Siswa</span>
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(s.id)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {isStudentPwdVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>

                            <div className="space-y-1 text-[11px] font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Username (NIS):</span>
                                <strong className="text-slate-800 dark:text-slate-200">{s.nis || s.nisn || s.email}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Password:</span>
                                <strong className="text-indigo-600 dark:text-indigo-400">
                                  {isStudentPwdVisible ? sPwd : '••••••••'}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* Parent Box */}
                          <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide flex items-center gap-1">
                                <span>👨‍👩‍👧 Akun Orang Tua</span>
                              </span>
                              {linkedParent && (
                                <button
                                  onClick={() => togglePasswordVisibility(linkedParent.id)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  {isParentPwdVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              )}
                            </div>

                            {linkedParent ? (
                              <div className="space-y-1 text-[11px] font-mono">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-slate-400">Username:</span>
                                  <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                    {linkedParent.email}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-slate-400">Password:</span>
                                  <strong className="text-rose-600 dark:text-rose-400">
                                    {isParentPwdVisible ? pPwd : '••••••••'}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic py-2">Belum ada akun orang tua.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              /* ================= MODE 2: INDIVIDUAL CARDS ================= */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {batchCredentialUsers.map((u) => {
                  const isPwdVisible = showPasswordsMap[u.id];
                  const cardPwd = u.password || (u.role === 'siswa' ? `siswa${u.nis || u.nisn || '123'}` : 'ortu123#');
                  const shareText = `Kredensial Login Jurnal 7 KAIH SMP Negeri 2 Kasihan\nNama: ${u.name}\nUsername: ${u.nis || u.nisn || u.email}\nPassword: ${cardPwd}\nPeran: ${u.role.toUpperCase()}`;

                  return (
                    <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          u.role === 'siswa' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'orangtua' ? 'bg-rose-100 text-rose-700' :
                          u.role === 'walikelas' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{u.className || 'SMPN 2 Kasihan'}</span>
                      </div>

                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{u.name}</p>
                        {u.nis && <p className="text-[10px] text-slate-500 font-mono">NIS: {u.nis}</p>}
                      </div>

                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Username:</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{u.nis || u.nisn || u.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Password:</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {isPwdVisible ? cardPwd : '••••••••'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          {isPwdVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{isPwdVisible ? 'Sembunyikan' : 'Tampilkan'}</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(shareText)}
                          className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin Kredensial</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= 7. STATUS DATABASE & SKALABILITAS ================= */}
        {activeMenu === 'database' && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>Status Basis Data & Cadangan Master</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Infrastruktur penyimpanan Firestore & skema relasional dengan proteksi enkripsi AES-256.
                </p>
              </div>

              <button
                onClick={handleExportDataJSON}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Backup (.json)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Database className="w-4 h-4" />
                  <span>Engine Database</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Firebase Cloud Firestore
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Penyimpanan real-time tersinkronisasi otomatis antar HP siswa, orang tua, dan laptop wali kelas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>Enkripsi Kredensial</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  AES-256 End-to-End
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Setiap password dan refleksi siswa dienkripsi dari browser sebelum disimpan.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                  <span>Lembaga Pendidikan</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {SCHOOL_CONFIG.name}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {SCHOOL_CONFIG.address} • Telp: {SCHOOL_CONFIG.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= 8. PENGATURAN SEKOLAH & KOP SURAT ================= */}
        {activeMenu === 'settings' && <AdminSettings />}
      </main>

      {/* ===================== MODAL ADD / EDIT USER ===================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>{editUser ? 'Edit Data Pengguna' : 'Tambah Pengguna & Generate Akun'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              {/* Role Picker (if new user) */}
              {!editUser && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Peran / Hak Akses</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { role: 'siswa', label: '🎓 Siswa' },
                      { role: 'orangtua', label: '👨‍👩‍👧 Ortu' },
                      { role: 'walikelas', label: '👩‍🏫 Wali' },
                      { role: 'admin', label: '⚙️ Admin' }
                    ].map(r => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setAddRole(r.role as UserRole)}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                          addRole === r.role
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Fields */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Rizky Pratama"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Siswa Fields */}
              {addRole === 'siswa' && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NIS *</label>
                      <input
                        type="text"
                        placeholder="23451"
                        value={formData.nisn}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">No. Absen</label>
                      <input
                        type="text"
                        placeholder="01"
                        value={formData.noAbsen}
                        onChange={(e) => setFormData({ ...formData, noAbsen: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">L / P *</label>
                      <select
                        value={formData.gender || 'L'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kelas *</label>
                      <select
                        value={formData.className}
                        onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {availableClasses.map(cls => (
                          <option key={cls} value={cls}>Kelas {cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Auto create parent if new */}
                  {!editUser && (
                    <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-2">
                      <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 block">
                        👨‍👩‍👧 Data Orang Tua Terkait (Otomatis Terhubung & Dibuatkan Akun Login):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">Nama Orang Tua (Opsional)</label>
                          <input
                            type="text"
                            placeholder="Bpk. Hendra Pratama"
                            value={formData.parentName}
                            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                            className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">No. WhatsApp Orang Tua</label>
                          <input
                            type="text"
                            placeholder="08139876543"
                            value={formData.parentPhone}
                            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                            className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Wali Kelas Fields */}
              {addRole === 'walikelas' && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kelas Bimbingan yang Diampu *</label>
                  <select
                    value={formData.assignedClass}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Orang Tua Link to Student */}
              {addRole === 'orangtua' && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hubungkan ke Siswa Asuh *</label>
                  <select
                    value={formData.linkedStudentId}
                    onChange={(e) => setFormData({ ...formData, linkedStudentId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.className} - {s.nisn})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Username / ID Login (NIS / Username)
                  </label>
                  <input
                    type="text"
                    placeholder={
                      addRole === 'siswa'
                        ? 'NIS Siswa (cth: 23451)'
                        : addRole === 'orangtua'
                        ? 'ortu.NIS (cth: ortu.23451)'
                        : addRole === 'walikelas'
                        ? 'Bebas: wali.7a / NIP / username'
                        : 'Bebas: admin_utama / admin2'
                    }
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Siswa cukup menggunakan NIS. Orang tua menggunakan ortu.[NIS]. Tidak menggunakan format '@'.
                  </p>
                </div>
              </div>

              {/* Password Setting / Changing */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {editUser ? 'Kata Sandi Baru (Opsional - Kosongkan jika tidak ingin diubah)' : 'Kata Sandi Kustom (Opsional - Otomatis digenerate jika kosong)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={editUser ? 'Ketik kata sandi baru untuk memperbarui...' : 'Ketik kata sandi khusus atau biarkan kosong...'}
                    value={formData.customPassword}
                    onChange={(e) => setFormData({ ...formData, customPassword: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {editUser 
                    ? 'Sandi tersimpan dengan enkripsi aman. Mengisi kolom ini akan langsung memperbarui sandi login pengguna.'
                    : 'Format standar otomatis: Siswa = "siswa[NIS]", Ortu = "ortu[NIS]", Wali = "wali123#Secure".'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {editUser ? 'Simpan Perubahan' : 'Buat Akun & Generate Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL CREDENTIAL POPUP ===================== */}
      {credentialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 mx-auto shadow-xs">
              <Key className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Kredensial Login Berhasil Dibuat 🎉
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kredensial login siap dibagikan kepada pengguna <strong>{credentialModal.user.name}</strong>
              </p>
            </div>

            {/* Student Credential Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="font-bold text-slate-900 dark:text-white">{credentialModal.user.name}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  {credentialModal.user.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Username (NIS):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{credentialModal.user.nis || credentialModal.user.nisn || credentialModal.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kata Sandi:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{credentialModal.password}</span>
              </div>
            </div>

            {/* Extra Parent Credential if generated together */}
            {credentialModal.extraParent && (
              <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 text-left space-y-1.5 text-xs">
                <div className="flex justify-between items-center border-b border-rose-200 dark:border-rose-800 pb-1">
                  <span className="font-bold text-rose-900 dark:text-rose-200">{credentialModal.extraParent.user.name} (Orang Tua)</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    Orang Tua
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Username Ortu:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{credentialModal.extraParent.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kata Sandi:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{credentialModal.extraParent.password}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  let text = `Kredensial 7 KAIH SMP Negeri 2 Kasihan\nNama Siswa: ${credentialModal.user.name}\nUsername (NIS): ${credentialModal.user.nis || credentialModal.user.nisn || credentialModal.user.email}\nPassword: ${credentialModal.password}`;
                  if (credentialModal.extraParent) {
                    text += `\n\nAkun Orang Tua:\nNama Ortu: ${credentialModal.extraParent.user.name}\nUsername Ortu: ${credentialModal.extraParent.user.email}\nPassword Ortu: ${credentialModal.extraParent.password}`;
                  }
                  copyToClipboard(text);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kredensial Tersalin!' : 'Salin Format Teks WhatsApp'}</span>
              </button>

              <button
                onClick={() => setCredentialModal(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI HAPUS ===================== */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Konfirmasi Hapus Pengguna
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus data pengguna <strong>{deleteModal.user.name}</strong>?
              </p>
            </div>

            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Role:</span>
                <span className="font-bold uppercase text-rose-700 dark:text-rose-300">{deleteModal.user.role}</span>
              </div>
              {deleteModal.user.nisn && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">NISN:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{deleteModal.user.nisn}</span>
                </div>
              )}
              {deleteModal.user.className && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Kelas:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{deleteModal.user.className}</span>
                </div>
              )}
              <p className="text-[10px] text-rose-600 dark:text-rose-400 pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
                ⚠️ Penghapusan akan otomatis memperbarui relasi akun yang terhubung tanpa merusak data lain.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={deletingUser}
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {deletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI HAPUS KOLEKTIF ===================== */}
      {bulkDeleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {bulkDeleteModal.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus sebanyak <strong>{bulkDeleteModal.count} {bulkDeleteModal.role === 'siswa' ? 'siswa' : 'orang tua'}</strong> secara massal?
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 text-left text-xs space-y-2">
              <div className="flex justify-between font-bold text-rose-900 dark:text-rose-200">
                <span>Jumlah Akun Dihapus:</span>
                <span className="font-mono text-sm">{bulkDeleteModal.count} Akun</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                {bulkDeleteModal.role === 'siswa' 
                  ? 'Semua data siswa yang dipilih akan dihapus permanen, dan relasi orang tua terkait akan diperbarui secara aman.'
                  : 'Semua data akun orang tua yang dipilih akan dihapus permanen, dan relasi pada akun siswa akan diperbarui secara aman.'}
              </p>
              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/60 text-[10px] text-slate-500 dark:text-slate-400">
                Tindakan ini tidak dapat dibatalkan setelah diproses.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={deletingBulk}
                onClick={() => setBulkDeleteModal({ open: false, role: 'siswa', ids: [], count: 0, title: '' })}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingBulk}
                onClick={handleConfirmBulkDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deletingBulk ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus {bulkDeleteModal.count}...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Kolektif</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
