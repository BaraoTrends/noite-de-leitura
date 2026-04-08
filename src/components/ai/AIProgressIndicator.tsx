import { CheckCircle, Loader2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'done';
}

interface Props {
  steps: ProgressStep[];
  currentStepIndex: number;
  elapsedSeconds: number;
}

export function AIProgressIndicator({ steps, currentStepIndex, elapsedSeconds }: Props) {
  const progress = Math.min(((currentStepIndex + 1) / steps.length) * 100, 95);

  return (
    <div className="space-y-4 py-2">
      <Progress value={progress} className="h-2" />
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {step.status === 'done' ? (
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            ) : step.status === 'active' ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className={cn(
              step.status === 'done' && 'text-muted-foreground line-through',
              step.status === 'active' && 'text-foreground font-medium',
              step.status === 'pending' && 'text-muted-foreground/60',
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Tempo decorrido: {elapsedSeconds}s
      </p>
    </div>
  );
}
