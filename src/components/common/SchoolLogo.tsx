import React from 'react';
import { useSchoolSettings } from '../../context/SchoolContext';

interface SchoolLogoProps {
  className?: string;
  size?: number | string;
  forceSvg?: boolean;
  customLogoUrl?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ 
  className = "w-16 h-16", 
  size, 
  forceSvg = false,
  customLogoUrl: customLogoProp
}) => {
  let contextLogoUrl = '';
  try {
    const settingsContext = useSchoolSettings();
    contextLogoUrl = settingsContext?.schoolSettings?.customLogoUrl || '';
  } catch (e) {
    // Context fallback if used outside provider
  }

  const effectiveLogoUrl = customLogoProp || contextLogoUrl;

  if (effectiveLogoUrl && !forceSvg) {
    return (
      <img
        src={effectiveLogoUrl}
        alt="Logo Sekolah"
        className={`${className} object-contain rounded-lg`}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo SMP Negeri 2 Kasihan"
    >
      <defs>
        {/* Glow & Gradients */}
        <linearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE033" />
          <stop offset="50%" stopColor="#FFC700" />
          <stop offset="100%" stopColor="#FFA000" />
        </linearGradient>

        <linearGradient id="wingGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFEE55" />
          <stop offset="100%" stopColor="#E5B20D" />
        </linearGradient>

        <linearGradient id="torchFlame" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#C41A1A" />
          <stop offset="60%" stopColor="#EE2B2B" />
          <stop offset="100%" stopColor="#FF4D4D" />
        </linearGradient>

        <linearGradient id="torchBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F9D423" />
          <stop offset="50%" stopColor="#E09F00" />
          <stop offset="100%" stopColor="#C78500" />
        </linearGradient>
      </defs>

      {/* Outer 5-lobed Lotus Crest Background (Black) */}
      <path
        d="M 150 15 
           C 168 15, 186 28, 198 42
           C 214 36, 236 44, 248 60
           C 252 74, 248 90, 242 102
           C 258 116, 268 136, 266 158
           C 264 176, 252 192, 238 202
           C 246 220, 236 242, 218 252
           C 204 258, 186 254, 174 246
           C 162 262, 142 274, 150 282
           C 134 278, 122 258, 114 248
           C 102 254, 84 258, 70 250
           C 52 240, 44 218, 52 198
           C 38 188, 28 170, 28 150
           C 28 130, 38 112, 54 98
           C 48 86, 44 70, 52 56
           C 66 40, 88 34, 104 42
           C 116 26, 134 15, 150 15 Z"
        fill="#121212"
        stroke="#FFCC00"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Inner Contour Line (Yellow double border) */}
      <path
        d="M 150 26 
           C 165 26, 180 37, 190 49
           C 204 44, 222 51, 232 64
           C 236 76, 232 89, 227 99
           C 241 111, 250 128, 248 147
           C 246 163, 236 177, 224 186
           C 231 201, 222 220, 207 228
           C 195 233, 180 230, 170 223
           C 159 237, 145 247, 150 255
           C 137 251, 126 235, 120 226
           C 110 231, 95 234, 83 227
           C 68 219, 61 200, 68 183
           C 56 174, 48 159, 48 141
           C 48 124, 56 109, 70 97
           C 65 86, 61 73, 68 61
           C 80 47, 98 42, 112 49
           C 122 35, 137 26, 150 26 Z"
        fill="none"
        stroke="#FFD700"
        strokeWidth="2.5"
        opacity="0.85"
      />

      {/* Arc Text "SMP N 2 KASIHAN" */}
      <path id="textArcPath" d="M 68 126 A 96 96 0 0 1 232 126" fill="none" />
      <text fill="#FFD700" fontSize="19.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="2.5">
        <textPath href="#textArcPath" startOffset="50%" textAnchor="middle">
          SMP N 2 KASIHAN
        </textPath>
      </text>

      {/* Left Wing */}
      <g fill="url(#wingGold)" stroke="#D49B00" strokeWidth="1.2">
        {/* Outer large feather */}
        <path d="M 124 188 C 114 184, 88 174, 76 150 C 64 126, 68 96, 74 74 C 77 92, 85 110, 94 122 C 86 110, 84 94, 88 84 C 92 98, 100 114, 108 126 C 102 114, 102 102, 106 94 C 110 108, 118 124, 124 136 C 120 126, 122 116, 126 110 C 130 122, 134 138, 134 152 C 134 168, 130 182, 124 188 Z" />
        {/* Inner lower feathers */}
        <path d="M 124 180 C 110 178, 92 168, 86 148 C 96 156, 108 162, 122 166 Z" />
        <path d="M 124 190 C 112 188, 98 182, 94 168 C 104 174, 114 178, 124 182 Z" />
      </g>

      {/* Right Wing (Mirrored) */}
      <g fill="url(#wingGold)" stroke="#D49B00" strokeWidth="1.2">
        {/* Outer large feather */}
        <path d="M 176 188 C 186 184, 212 174, 224 150 C 236 126, 232 96, 226 74 C 223 92, 215 110, 206 122 C 214 110, 216 94, 212 84 C 208 98, 200 114, 192 126 C 198 114, 198 102, 194 94 C 190 108, 182 124, 176 136 C 180 126, 178 116, 174 110 C 170 122, 166 138, 166 152 C 166 168, 170 182, 176 188 Z" />
        {/* Inner lower feathers */}
        <path d="M 176 180 C 190 178, 208 168, 214 148 C 204 156, 192 162, 178 166 Z" />
        <path d="M 176 190 C 188 188, 202 182, 206 168 C 196 174, 186 178, 176 182 Z" />
      </g>

      {/* White Radiating Arches at the Base (Pancaran Air/Tulang) */}
      <g fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.8">
        {/* Level 1 (Top arch) */}
        <path d="M 132 172 C 142 166, 158 166, 168 172 C 160 170, 140 170, 132 172 Z" />
        <path d="M 134 171 L 140 166 L 146 171 L 150 165 L 154 171 L 160 166 L 166 171 C 158 168, 142 168, 134 171 Z" />

        {/* Level 2 */}
        <path d="M 126 182 C 138 174, 162 174, 174 182 C 162 178, 138 178, 126 182 Z" />

        {/* Level 3 */}
        <path d="M 120 193 C 136 184, 164 184, 180 193 C 164 188, 136 188, 120 193 Z" />

        {/* Level 4 (Bottom broad arch) */}
        <path d="M 114 204 C 134 194, 166 194, 186 204 C 166 198, 134 198, 114 204 Z" />
      </g>

      {/* Central Torch Shaft */}
      <path
        d="M 144 126 L 156 126 L 154 170 L 146 170 Z"
        fill="url(#torchBody)"
        stroke="#B27B00"
        strokeWidth="1"
      />
      {/* Torch Head Ring */}
      <ellipse cx="150" cy="126" rx="9" ry="3.5" fill="#FFE259" stroke="#B27B00" strokeWidth="1" />

      {/* Red Flaming Torch (3 Prongs) */}
      <path
        d="M 150 82 
           C 152 92, 158 100, 164 104 
           C 168 96, 172 88, 176 86
           C 174 98, 168 114, 159 122
           C 155 125, 145 125, 141 122
           C 132 114, 126 98, 124 86
           C 128 88, 132 96, 136 104
           C 142 100, 148 92, 150 82 Z"
        fill="url(#torchFlame)"
        stroke="#8B0000"
        strokeWidth="1.2"
      />
      {/* Inner flame core */}
      <path
        d="M 150 94 
           C 152 102, 155 108, 157 114 
           C 153 117, 147 117, 143 114 
           C 145 108, 148 102, 150 94 Z"
        fill="#FFA233"
      />

      {/* Bottom Ribbon / Pita "ABIYASA PINASTHIKA" */}
      <g>
        {/* Ribbon shadow / fold */}
        <path
          d="M 64 228 L 74 218 L 84 228 L 76 238 Z"
          fill="#E2E8F0"
        />
        <path
          d="M 236 228 L 226 218 L 216 228 L 224 238 Z"
          fill="#E2E8F0"
        />

        {/* Main Ribbon Body */}
        <path
          d="M 60 234 
             L 76 220 
             C 105 238, 195 238, 224 220 
             L 240 234 
             L 228 248 
             C 196 264, 104 264, 72 248 
             Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* Ribbon Fishtail Ends */}
        <path
          d="M 60 234 L 46 226 L 56 242 L 72 248 Z"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="1"
        />
        <path
          d="M 240 234 L 254 226 L 244 242 L 228 248 Z"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="1"
        />

        {/* Ribbon Arc Text "ABIYASA PINASTHIKA" */}
        <path id="ribbonTextPath" d="M 76 245 Q 150 262 224 245" fill="none" />
        <text fill="#B91C1C" fontSize="11.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.2">
          <textPath href="#ribbonTextPath" startOffset="50%" textAnchor="middle">
            ABIYASA PINASTHIKA
          </textPath>
        </text>
      </g>
    </svg>
  );
};
