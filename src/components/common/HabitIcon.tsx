import React from 'react';
import { 
  Sun, 
  HeartHandshake, 
  Activity, 
  Apple, 
  BookOpen, 
  Users, 
  Moon,
  Sparkles
} from 'lucide-react';
import { HabitId } from '../../types';

interface HabitIconProps {
  habitId: HabitId | string;
  className?: string;
  size?: number;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ habitId, className = 'w-5 h-5', size = 20 }) => {
  switch (habitId) {
    case 'bangun_pagi':
      return <Sun className={className} size={size} />;
    case 'ibadah':
      return <HeartHandshake className={className} size={size} />;
    case 'olahraga':
      return <Activity className={className} size={size} />;
    case 'makan_sehat':
      return <Apple className={className} size={size} />;
    case 'membaca':
      return <BookOpen className={className} size={size} />;
    case 'bermasyarakat':
      return <Users className={className} size={size} />;
    case 'istirahat':
      return <Moon className={className} size={size} />;
    default:
      return <Sparkles className={className} size={size} />;
  }
};
