import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BanStatusBadgeProps {
  banStatus: 'Banned' | 'Limited' | 'Semi-Limited' | null;
  className?: string;
}

export function BanStatusBadge({ banStatus, className }: BanStatusBadgeProps) {
  if (!banStatus) return null;

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Banned':
        return 'destructive';
      case 'Limited':
        return 'secondary';
      case 'Semi-Limited':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Banned':
        return 'Banned';
      case 'Limited':
        return 'Limited';
      case 'Semi-Limited':
        return 'Semi-Limited';
      default:
        return status;
    }
  };

  return (
    <Badge
      variant={getBadgeVariant(banStatus)}
      className={cn('text-xs px-1.5 py-0.5', className)}
    >
      {getStatusText(banStatus)}
    </Badge>
  );
}