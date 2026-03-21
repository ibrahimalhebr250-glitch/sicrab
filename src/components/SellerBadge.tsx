import { Shield, Star, Sparkles } from 'lucide-react';

interface SellerBadgeProps {
  badge: 'new' | 'active' | 'trusted';
  size?: 'sm' | 'md' | 'lg';
}

export default function SellerBadge({ badge, size = 'md' }: SellerBadgeProps) {
  const badges = {
    new: {
      label: 'بائع جديد',
      color: 'from-gray-400 to-gray-500',
      icon: Sparkles,
      textColor: 'text-gray-700'
    },
    active: {
      label: 'بائع نشط',
      color: 'from-blue-500 to-blue-600',
      icon: Star,
      textColor: 'text-blue-700'
    },
    trusted: {
      label: 'بائع موثوق',
      color: 'from-green-500 to-emerald-500',
      icon: Shield,
      textColor: 'text-green-700'
    }
  };

  const currentBadge = badges[badge];
  const Icon = currentBadge.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} bg-gradient-to-r ${currentBadge.color} text-white rounded-lg font-bold shadow-sm`}>
      <Icon className={iconSizes[size]} />
      <span>{currentBadge.label}</span>
    </div>
  );
}
