import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ProgressDialogProps {
  open: boolean;
  title: string;
  description?: string;
  progress: number;
  total: number;
}

export function ProgressDialog({
  open,
  title,
  description,
  progress,
  total,
}: ProgressDialogProps) {
  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">
          <Progress value={percent} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress} / {total}</span>
            <span>{percent}%</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
