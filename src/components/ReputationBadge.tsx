import { Trophy, Medal, Award, Star } from 'lucide-react';

type Level = 'bronze' | 'silver' | 'gold' | 'platinum';

interface ReputationBadgeProps {
  level: Level;
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
}

const levelConfig = {
  bronze: {
    label: 'برونزي',
    gradient: 'from-amber-600 to-orange-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: Medal,
    nextLevel: 100,
    color: '#cd7f32',
  },
  silver: {
    label: 'فضي',
    gradient: 'from-slate-400 to-gray-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    icon: Star,
    nextLevel: 300,
    color: '#c0c0c0',
  },
  gold: {
    label: 'ذهبي',
    gradient: 'from-yellow-400 to-amber-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: Trophy,
    nextLevel: 600,
    color: '#ffd700',
  },
  platinum: {
    label: 'بلاتيني',
    gradient: 'from-cyan-400 to-teal-500',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: Award,
    nextLevel: null,
    color: '#00bcd4',
  },
};

export default function ReputationBadge({ level, points, size = 'md', showPoints = true }: ReputationBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} bg-gradient-to-r ${config.gradient} text-white rounded-xl font-bold shadow-sm`}>
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
      {showPoints && <span className="opacity-80">· {points.toLocaleString('ar-SA')}</span>}
    </div>
  );
}

export function ReputationProgress({ level, points }: { level: Level; points: number }) {
  const config = levelConfig[level];
  const levels: Level[] = ['bronze', 'silver', 'gold', 'platinum'];
  const thresholds = [0, 100, 300, 600];
  const currentIdx = levels.indexOf(level);
  const currentThreshold = thresholds[currentIdx];
  const nextThreshold = thresholds[currentIdx + 1];

  const progress = nextThreshold
    ? Math.min(100, ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <div className={`${config.bg} border ${config.border} rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ReputationBadge level={level} points={points} size="md" />
        </div>
        {nextThreshold && (
          <span className={`text-xs ${config.text} font-medium`}>
            {(nextThreshold - points).toLocaleString('ar-SA')} نقطة للمستوى التالي
          </span>
        )}
      </div>
      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {nextThreshold && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-400">{currentThreshold.toLocaleString('ar-SA')}</span>
          <span className="text-xs text-gray-400">{nextThreshold.toLocaleString('ar-SA')}</span>
        </div>
      )}
    </div>
  );
}
