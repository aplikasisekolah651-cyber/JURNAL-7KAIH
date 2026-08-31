import { User, UserRole } from '../types';

/**
 * High-definition vector SVG avatars for:
 * 1. Wali Kelas / Guru: Guru mengenakan jas rapi dan berdasi.
 * 2. Siswa Putra (L): Siswa putra mengenakan seragam sekolah dengan dasi sekolah rapi.
 * 3. Siswa Putri (P): Siswa putri mengenakan kerudung/seragam sekolah putri rapi.
 * 4. Orang Tua: Orang tua mengenakan setelan jas formal dan berdasi.
 * 5. Admin: Administrator IT sekolah berjas dan berdasi.
 */

// SVG 1: Guru / Wali Kelas (Jas & Berdasi)
export const SVG_WALI_KELAS = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-teacher" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
    <linearGradient id="suit-teacher" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="tie-teacher" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
  </defs>
  <!-- Background Circle -->
  <circle cx="60" cy="60" r="58" fill="url(#bg-teacher)"/>
  
  <!-- Teacher Suit / Jas -->
  <path d="M18 116 C18 90, 36 80, 60 80 C84 80, 102 90, 102 116 Z" fill="url(#suit-teacher)"/>
  
  <!-- White Shirt / Kemeja Putih -->
  <path d="M46 80 L60 102 L74 80 Z" fill="#FFFFFF"/>
  <path d="M46 80 L60 88 L74 80 Z" fill="#F1F5F9"/>

  <!-- Necktie / Dasi Formal -->
  <polygon points="56,86 64,86 66,92 60,116 54,92" fill="url(#tie-teacher)"/>
  <polygon points="57,86 63,86 64,90 56,90" fill="#B91C1C"/>
  <circle cx="60" cy="88" r="1.5" fill="#FEF08A"/>

  <!-- Suit Lapels / Kerah Jas Kiri & Kanan -->
  <path d="M38 80 L49 104 L60 104 L52 80 Z" fill="#334155"/>
  <path d="M82 80 L71 104 L60 104 L68 80 Z" fill="#334155"/>

  <!-- Teacher Badge / Pin Guru Emas -->
  <circle cx="34" cy="94" r="3.5" fill="#EAB308"/>
  <circle cx="34" cy="94" r="2" fill="#CA8A04"/>

  <!-- Neck -->
  <rect x="52" y="66" width="16" height="18" fill="#FCD34D" rx="4"/>
  <path d="M52 74 Q60 80 68 74 L68 78 Q60 84 52 78 Z" fill="#F59E0B" opacity="0.4"/>

  <!-- Head & Face -->
  <ellipse cx="60" cy="50" rx="20" ry="24" fill="#FDE68A"/>
  
  <!-- Ears -->
  <circle cx="39" cy="52" r="5" fill="#FDE68A"/>
  <circle cx="81" cy="52" r="5" fill="#FDE68A"/>

  <!-- Hair (Rapi Formal) -->
  <path d="M38 46 C38 28, 48 24, 60 24 C72 24, 82 28, 82 46 C80 34, 70 30, 60 30 C50 30, 40 34, 38 46 Z" fill="#1E293B"/>
  <path d="M40 38 Q60 26 80 36 Q70 30 50 34 Z" fill="#334155"/>

  <!-- Eyebrows -->
  <path d="M46 42 Q52 39 56 42" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M64 42 Q68 39 74 42" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" fill="none"/>

  <!-- Eyes & Glasses / Kacamata Guru Pendidik -->
  <circle cx="51" cy="48" r="3" fill="#1E293B"/>
  <circle cx="69" cy="48" r="3" fill="#1E293B"/>
  <circle cx="52" cy="47" r="1" fill="#FFFFFF"/>
  <circle cx="70" cy="47" r="1" fill="#FFFFFF"/>
  
  <!-- Glasses Frame -->
  <rect x="44" y="43" width="14" height="10" rx="3" fill="none" stroke="#D97706" stroke-width="1.8"/>
  <rect x="62" y="43" width="14" height="10" rx="3" fill="none" stroke="#D97706" stroke-width="1.8"/>
  <line x1="58" y1="48" x2="62" y2="48" stroke="#D97706" stroke-width="1.8"/>

  <!-- Nose -->
  <path d="M60 50 L58 56 L62 56" stroke="#D97706" stroke-width="1.5" stroke-linecap="round" fill="none"/>

  <!-- Friendly Smile -->
  <path d="M52 61 Q60 67 68 61" stroke="#B45309" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`.trim();

// SVG 2: Siswa Putra (L) - Seragam Sekolah Putra Berdasi
export const SVG_SISWA_PUTRA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-boy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="tie-student" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E40AF"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
  </defs>
  <!-- Background Circle -->
  <circle cx="60" cy="60" r="58" fill="url(#bg-boy)"/>

  <!-- Student Uniform (Kemeja Putih Seragam Sekolah) -->
  <path d="M22 116 C22 92, 38 82, 60 82 C82 82, 98 92, 98 116 Z" fill="#FFFFFF"/>
  <path d="M22 116 C22 92, 38 82, 60 82 C82 82, 98 92, 98 116 Z" fill="#F8FAFC" opacity="0.3"/>

  <!-- Shirt Collars / Kerah Baju Siswa -->
  <polygon points="44,82 60,94 48,94" fill="#E2E8F0"/>
  <polygon points="76,82 60,94 72,94" fill="#CBD5E1"/>

  <!-- Student Tie / Dasi SMP Biru Rapi -->
  <polygon points="56,88 64,88 65,94 60,116 55,94" fill="url(#tie-tie-student, #1D4ED8)"/>
  <polygon points="56,88 64,88 65,92 55,92" fill="#1E40AF"/>
  <circle cx="60" cy="98" r="1.5" fill="#93C5FD"/>

  <!-- OSIS Badge Pocket / Saku & Bet OSIS Siswa -->
  <rect x="30" y="96" width="12" height="14" rx="2" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>
  <path d="M33 100 L39 100 L36 106 Z" fill="#3B82F6"/>

  <!-- Neck -->
  <rect x="53" y="68" width="14" height="16" fill="#FCD34D" rx="3"/>

  <!-- Head & Face -->
  <ellipse cx="60" cy="52" rx="19" ry="22" fill="#FDE68A"/>

  <!-- Ears -->
  <circle cx="40" cy="53" r="4.5" fill="#FDE68A"/>
  <circle cx="80" cy="53" r="4.5" fill="#FDE68A"/>

  <!-- Hair (Siswa Putra Rapi Ceria) -->
  <path d="M40 48 C38 30, 48 24, 60 24 C72 24, 82 30, 80 48 C76 34, 68 32, 60 32 C50 32, 44 36, 40 48 Z" fill="#1E293B"/>
  <!-- Front Fringe -->
  <path d="M45 32 Q54 36 60 33 Q66 38 75 34 Q68 28 60 29 Q50 28 45 32 Z" fill="#0F172A"/>

  <!-- Eyebrows -->
  <path d="M47 44 Q52 41 56 44" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M64 44 Q68 41 73 44" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- Eyes (Semangat & Ceria) -->
  <circle cx="52" cy="49" r="2.8" fill="#1E293B"/>
  <circle cx="68" cy="49" r="2.8" fill="#1E293B"/>
  <circle cx="53" cy="48" r="1" fill="#FFFFFF"/>
  <circle cx="69" cy="48" r="1" fill="#FFFFFF"/>

  <!-- Rosy Cheeks -->
  <ellipse cx="46" cy="55" rx="3" ry="1.5" fill="#FCA5A5" opacity="0.6"/>
  <ellipse cx="74" cy="55" rx="3" ry="1.5" fill="#FCA5A5" opacity="0.6"/>

  <!-- Nose -->
  <path d="M60 52 L59 56 L61 56" stroke="#D97706" stroke-width="1.2" stroke-linecap="round" fill="none"/>

  <!-- Bright Smile -->
  <path d="M53 60 Q60 67 67 60" stroke="#B45309" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`.trim();

// SVG 3: Siswa Putri (P) - Siswi Putri Kerudung Putih Seragam Sekolah Rapi
export const SVG_SISWA_PUTRI = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-girl" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#BE185D"/>
    </linearGradient>
    <linearGradient id="hijab-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
  </defs>
  <!-- Background Circle -->
  <circle cx="60" cy="60" r="58" fill="url(#bg-girl)"/>

  <!-- School Uniform Underneath -->
  <path d="M22 116 C22 92, 38 82, 60 82 C82 82, 98 92, 98 116 Z" fill="#F8FAFC"/>

  <!-- Hijab / Kerudung Siswi Putih Rapi Menjuntai -->
  <path d="M26 116 C26 90, 36 76, 60 76 C84 76, 94 90, 94 116 Z" fill="url(#hijab-grad)"/>
  <path d="M40 84 C40 102, 50 116, 60 116 C70 116, 80 102, 80 84 Z" fill="#E2E8F0" opacity="0.4"/>

  <!-- Inner Head Hijab Cover -->
  <path d="M36 48 C36 28, 46 22, 60 22 C74 22, 84 28, 84 48 C84 72, 74 80, 60 80 C46 80, 36 72, 36 48 Z" fill="url(#hijab-grad)"/>
  <path d="M40 38 Q60 28 80 38 Q70 30 50 30 Z" fill="#E2E8F0" opacity="0.5"/>

  <!-- Hijab Pin / Bros Bunga Kecil Manis -->
  <circle cx="60" cy="79" r="2.5" fill="#EC4899"/>
  <circle cx="60" cy="79" r="1.2" fill="#FDF2F8"/>

  <!-- Girl Face Cutout -->
  <ellipse cx="60" cy="52" rx="16" ry="19" fill="#FDE68A"/>
  <!-- Underscarf (Ciput) -->
  <path d="M46 38 Q60 33 74 38 Q68 35 52 35 Z" fill="#F472B6"/>

  <!-- Eyebrows -->
  <path d="M49 44 Q53 41 57 44" stroke="#475569" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M63 44 Q67 41 71 44" stroke="#475569" stroke-width="1.8" stroke-linecap="round" fill="none"/>

  <!-- Pretty Eyes & Eyelashes -->
  <circle cx="53" cy="49" r="2.6" fill="#1E293B"/>
  <circle cx="67" cy="49" r="2.6" fill="#1E293B"/>
  <circle cx="54" cy="48" r="1" fill="#FFFFFF"/>
  <circle cx="68" cy="48" r="1" fill="#FFFFFF"/>
  <!-- Lashes -->
  <path d="M50 47 L48 45" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M70 47 L72 45" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Rosy Cheeks -->
  <ellipse cx="48" cy="55" rx="3.2" ry="1.8" fill="#F43F5E" opacity="0.45"/>
  <ellipse cx="72" cy="55" rx="3.2" ry="1.8" fill="#F43F5E" opacity="0.45"/>

  <!-- Nose -->
  <path d="M60 52 L59 55 L61 55" stroke="#D97706" stroke-width="1.2" stroke-linecap="round" fill="none"/>

  <!-- Sweet Smile -->
  <path d="M54 60 Q60 66 66 60" stroke="#BE123C" stroke-width="1.8" stroke-linecap="round" fill="none"/>
</svg>
`.trim();

// SVG 4: Orang Tua (Semua Berjas & Berdasi Formal)
export const SVG_ORANG_TUA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-parent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#3730A3"/>
    </linearGradient>
    <linearGradient id="suit-parent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="tie-parent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <!-- Background Circle -->
  <circle cx="60" cy="60" r="58" fill="url(#bg-parent)"/>

  <!-- Parent Formal Suit / Jas -->
  <path d="M18 116 C18 90, 36 80, 60 80 C84 80, 102 90, 102 116 Z" fill="url(#suit-parent)"/>

  <!-- White Shirt / Kemeja Putih -->
  <path d="M46 80 L60 102 L74 80 Z" fill="#FFFFFF"/>
  <path d="M46 80 L60 88 L74 80 Z" fill="#E2E8F0"/>

  <!-- Necktie / Dasi Hijau Zamrud Elegan Bergaris -->
  <polygon points="56,86 64,86 66,92 60,116 54,92" fill="url(#tie-parent)"/>
  <polygon points="57,86 63,86 64,90 56,90" fill="#047857"/>
  <!-- Dasi Accent Stripes -->
  <line x1="56" y1="96" x2="63" y2="99" stroke="#A7F3D0" stroke-width="1.2" opacity="0.8"/>
  <line x1="57" y1="104" x2="62" y2="107" stroke="#A7F3D0" stroke-width="1.2" opacity="0.8"/>

  <!-- Lapels / Kerah Jas Formal -->
  <path d="M38 80 L50 104 L60 104 L52 80 Z" fill="#475569"/>
  <path d="M82 80 L70 104 L60 104 L68 80 Z" fill="#475569"/>

  <!-- Pocket Square / Saputangan Saku -->
  <polygon points="34,92 40,90 38,95" fill="#FFFFFF"/>

  <!-- Neck -->
  <rect x="52" y="66" width="16" height="18" fill="#FCD34D" rx="4"/>
  <path d="M52 74 Q60 80 68 74 L68 78 Q60 84 52 78 Z" fill="#F59E0B" opacity="0.4"/>

  <!-- Head & Face -->
  <ellipse cx="60" cy="50" rx="20" ry="24" fill="#FDE68A"/>

  <!-- Ears -->
  <circle cx="39" cy="52" r="5" fill="#FDE68A"/>
  <circle cx="81" cy="52" r="5" fill="#FDE68A"/>

  <!-- Mature Elegant Hair (Rapi Formal) -->
  <path d="M38 46 C38 28, 48 24, 60 24 C72 24, 82 28, 82 46 C80 34, 70 30, 60 30 C50 30, 40 34, 38 46 Z" fill="#1E293B"/>
  <!-- Sideburns -->
  <path d="M38 44 L39 52 L42 48 Z" fill="#1E293B"/>
  <path d="M82 44 L81 52 L78 48 Z" fill="#1E293B"/>

  <!-- Eyebrows (Hangat & Bijak) -->
  <path d="M46 42 Q52 39 56 42" stroke="#334155" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M64 42 Q68 39 74 42" stroke="#334155" stroke-width="2.5" stroke-linecap="round" fill="none"/>

  <!-- Eyes (Hangat Penuh Kasih) -->
  <circle cx="51" cy="48" r="3" fill="#1E293B"/>
  <circle cx="69" cy="48" r="3" fill="#1E293B"/>
  <circle cx="52" cy="47" r="1" fill="#FFFFFF"/>
  <circle cx="70" cy="47" r="1" fill="#FFFFFF"/>

  <!-- Gentle Expression Lines -->
  <path d="M43 48 Q44 50 45 52" stroke="#D97706" stroke-width="0.8" fill="none" opacity="0.6"/>
  <path d="M77 48 Q76 50 75 52" stroke="#D97706" stroke-width="0.8" fill="none" opacity="0.6"/>

  <!-- Nose -->
  <path d="M60 50 L58 56 L62 56" stroke="#D97706" stroke-width="1.5" stroke-linecap="round" fill="none"/>

  <!-- Warm Caring Smile -->
  <path d="M51 62 Q60 68 69 62" stroke="#B45309" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>
`.trim();

// SVG 5: Admin (Administrator IT Sekolah Jas & Berdasi)
export const SVG_ADMIN = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-admin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="suit-admin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="tie-admin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>
  </defs>
  <!-- Background Circle -->
  <circle cx="60" cy="60" r="58" fill="url(#bg-admin)"/>

  <!-- Suit / Jas Admin -->
  <path d="M18 116 C18 90, 36 80, 60 80 C84 80, 102 90, 102 116 Z" fill="url(#suit-admin)"/>

  <!-- White Shirt -->
  <path d="M46 80 L60 102 L74 80 Z" fill="#FFFFFF"/>
  <path d="M46 80 L60 88 L74 80 Z" fill="#E2E8F0"/>

  <!-- Necktie / Dasi Modern Indigo -->
  <polygon points="56,86 64,86 66,92 60,116 54,92" fill="url(#tie-admin)"/>
  <polygon points="57,86 63,86 64,90 56,90" fill="#3730A3"/>
  <circle cx="60" cy="88" r="1.5" fill="#A5B4FC"/>

  <!-- Lapels -->
  <path d="M38 80 L50 104 L60 104 L52 80 Z" fill="#312E81"/>
  <path d="M82 80 L70 104 L60 104 L68 80 Z" fill="#312E81"/>

  <!-- Neck -->
  <rect x="52" y="66" width="16" height="18" fill="#FCD34D" rx="4"/>

  <!-- Head & Face -->
  <ellipse cx="60" cy="50" rx="20" ry="24" fill="#FDE68A"/>

  <!-- Ears & Admin Headset / Kacamata Modern -->
  <circle cx="39" cy="52" r="5" fill="#FDE68A"/>
  <circle cx="81" cy="52" r="5" fill="#FDE68A"/>

  <!-- Hair Modern Cut -->
  <path d="M38 46 C38 28, 48 24, 60 24 C72 24, 82 28, 82 46 C80 34, 70 30, 60 30 C50 30, 40 34, 38 46 Z" fill="#0F172A"/>

  <!-- Eyebrows -->
  <path d="M46 42 Q52 39 56 42" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M64 42 Q68 39 74 42" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" fill="none"/>

  <!-- Eyes & Modern Glasses -->
  <circle cx="51" cy="48" r="3" fill="#0F172A"/>
  <circle cx="69" cy="48" r="3" fill="#0F172A"/>
  <circle cx="52" cy="47" r="1" fill="#FFFFFF"/>
  <circle cx="70" cy="47" r="1" fill="#FFFFFF"/>

  <rect x="44" y="44" width="14" height="9" rx="2" fill="none" stroke="#6366F1" stroke-width="1.8"/>
  <rect x="62" y="44" width="14" height="9" rx="2" fill="none" stroke="#6366F1" stroke-width="1.8"/>
  <line x1="58" y1="48" x2="62" y2="48" stroke="#6366F1" stroke-width="1.8"/>

  <!-- Confident Smile -->
  <path d="M53 61 Q60 66 67 61" stroke="#B45309" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`.trim();

// Convert SVG strings to clean Data URI format for standard <img src="..." />
const toDataUri = (svgStr: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;

export const DATA_URI_WALI_KELAS = toDataUri(SVG_WALI_KELAS);
export const DATA_URI_SISWA_PUTRA = toDataUri(SVG_SISWA_PUTRA);
export const DATA_URI_SISWA_PUTRI = toDataUri(SVG_SISWA_PUTRI);
export const DATA_URI_ORANG_TUA = toDataUri(SVG_ORANG_TUA);
export const DATA_URI_ADMIN = toDataUri(SVG_ADMIN);

/**
 * Returns the exact standard role-based avatar compliant with requirements:
 * - Wali Kelas: Guru berjas & berdasi
 * - Siswa L: Siswa putra seragam berdasi
 * - Siswa P: Siswa putri kerudung/seragam putri
 * - Orang Tua: Semua orang tua mengenakan jas & berdasi
 * - Admin: Administrator berjas & berdasi
 */
export const getUserAvatarUrl = (user?: Partial<User> | null): string => {
  if (!user) return DATA_URI_SISWA_PUTRA;

  if (user.role === 'walikelas') {
    return DATA_URI_WALI_KELAS;
  }

  if (user.role === 'orangtua') {
    return DATA_URI_ORANG_TUA;
  }

  if (user.role === 'admin') {
    return DATA_URI_ADMIN;
  }

  if (user.role === 'siswa') {
    if (user.gender === 'P') {
      return DATA_URI_SISWA_PUTRI;
    }
    return DATA_URI_SISWA_PUTRA;
  }

  return DATA_URI_SISWA_PUTRA;
};

/**
 * Helper to get role default avatar based on role and gender
 */
export const getRoleDefaultAvatar = (role?: UserRole, gender?: 'L' | 'P'): string => {
  if (role === 'walikelas') return DATA_URI_WALI_KELAS;
  if (role === 'orangtua') return DATA_URI_ORANG_TUA;
  if (role === 'admin') return DATA_URI_ADMIN;
  if (role === 'siswa') {
    return gender === 'P' ? DATA_URI_SISWA_PUTRI : DATA_URI_SISWA_PUTRA;
  }
  return DATA_URI_SISWA_PUTRA;
};
