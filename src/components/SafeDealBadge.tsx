import { ShieldCheck } from 'lucide-react';

interface SafeDealBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function SafeDealBadge({ size = 'md', showLabel = true }: SafeDealBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold shadow-sm`}
      title="بائع موثوق - أتم 3 صفقات مضمونة بدون شكاوى"
    >
      <ShieldCheck className={iconSizes[size]} />
      {showLabel && <span>صفقة مضمونة</span>}
    </div>
  );
}
