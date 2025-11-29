import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ClipboardCheck } from 'lucide-react';
import HealthScoreQuestionnaire from './HealthScoreQuestionnaire';

interface HealthScoreButtonProps {
  accountId?: string;
  variant?: 'floating' | 'inline';
  pendingCount?: number;
}

export default function HealthScoreButton({ accountId, variant = 'floating', pendingCount = 0 }: HealthScoreButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  console.error('[HealthScoreButton] Rendering with pendingCount:', pendingCount);

  if (variant === 'floating') {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="fixed bottom-6 right-6 z-50">
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md animate-bounce z-50">
                  {pendingCount}
                </span>
              )}
              <Button
                onClick={() => setIsOpen(true)}
                className={`transition-all shadow-lg hover:shadow-xl ${pendingCount > 0
                  ? 'h-14 px-6 rounded-full !bg-red-600 hover:!bg-red-700 animate-pulse ring-4 ring-red-400/30'
                  : 'h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
              // Removed invalid size prop, relying on className
              >
                <ClipboardCheck className={`w-6 h-6 ${pendingCount > 0 ? 'mr-2' : ''}`} />
                {pendingCount > 0 && (
                  <span className="font-bold text-base whitespace-nowrap">
                    {pendingCount} Pendente{pendingCount > 1 ? 's' : ''}
                  </span>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            <p>Avaliar Health Score</p>
            {pendingCount > 0 ? (
              <p className="text-xs text-red-400 font-bold">{pendingCount} avaliações pendentes!</p>
            ) : (
              <p className="text-xs text-muted-foreground">Questionário semanal</p>
            )}
          </TooltipContent>
        </Tooltip>

        <HealthScoreQuestionnaire
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          accountId={accountId}
        />
      </>
    );
  }

  // Inline variant
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <ClipboardCheck className="w-4 h-4" />
        Avaliar Health Score
      </Button>

      <HealthScoreQuestionnaire
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        accountId={accountId}
      />
    </>
  );
}
