import React from 'react';
import { User, UserRole } from '../../types';
import { getUserAvatarUrl, getRoleDefaultAvatar } from '../../lib/avatarHelper';

interface UserAvatarProps {
  user?: Partial<User> | null;
  role?: UserRole;
  gender?: 'L' | 'P';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  showBorder?: boolean;
  alt?: string;
  id?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
  custom: ''
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  role,
  gender,
  size = 'md',
  className = '',
  showBorder = false,
  alt = 'Avatar Pengguna',
  id
}) => {
  // If a user is provided, we compute using user.role and user.gender
  const effectiveRole = user?.role || role || 'siswa';
  const effectiveGender = user?.gender || gender;
  
  const avatarSrc = user 
    ? getUserAvatarUrl(user) 
    : getRoleDefaultAvatar(effectiveRole, effectiveGender);

  const sizeClass = sizeClasses[size];
  const borderClass = showBorder ? 'ring-2 ring-white dark:ring-slate-800 shadow-xs' : '';

  return (
    <img
      id={id}
      src={avatarSrc}
      alt={alt || user?.name || 'User Avatar'}
      className={`rounded-full object-cover shrink-0 select-none bg-slate-100 dark:bg-slate-800 ${sizeClass} ${borderClass} ${className}`}
      loading="lazy"
      onError={(e) => {
        // Fallback to role vector avatar if any image error
        (e.target as HTMLImageElement).src = getRoleDefaultAvatar(effectiveRole, effectiveGender);
      }}
    />
  );
};
