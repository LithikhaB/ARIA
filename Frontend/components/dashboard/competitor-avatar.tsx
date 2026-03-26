import { getCompetitorColor, getCompetitorName, type CompetitorId } from '@/lib/demo-data';

interface CompetitorAvatarProps {
  competitorId: CompetitorId;
  size?: 'sm' | 'md' | 'lg';
}

export function CompetitorAvatar({ competitorId, size = 'md' }: CompetitorAvatarProps) {
  const color = getCompetitorColor(competitorId);
  const name = getCompetitorName(competitorId);
  const initials = name.slice(0, 2).toUpperCase();

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
