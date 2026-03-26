import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  showLabel?: boolean;
  score?: number;
}

export function PriorityBadge({ priority, showLabel = true, score }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded',
        priority === 'HIGH' && 'bg-destructive/10 text-destructive',
        priority === 'MEDIUM' && 'bg-warning/10 text-warning',
        priority === 'LOW' && 'bg-muted text-muted-foreground'
      )}
    >
      {score !== undefined && <span>{score}</span>}
      {showLabel && <span>{priority}</span>}
    </span>
  );
}
