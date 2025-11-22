import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ClipboardCheck } from 'lucide-react';
import HealthScoreQuestionnaire from './HealthScoreQuestionnaire';

interface HealthScoreButtonProps {
  accountId?: string;
  variant?: 'floating' | 'inline';
}

export default function HealthScoreButton({ accountId, variant = 'floating' }: HealthScoreButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'floating') {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="icon"
            >
              <ClipboardCheck className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            <p>Avaliar Health Score</p>
            <p className="text-xs text-muted-foreground">Questionário semanal</p>
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
