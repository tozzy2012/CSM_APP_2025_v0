import { useState, useEffect } from 'react';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  order: number;
  category: 'setup' | 'training' | 'integration' | 'adoption';
}

export interface OnboardingProgress {
  accountId: string;
  completedTasks: {
    taskId: string;
    completedAt: string;
    completedBy?: string;
  }[];
  startedAt: string;
  completedAt?: string;
}

// Template padrão de onboarding (10 tarefas do Manus)
export const DEFAULT_ONBOARDING_TEMPLATE: OnboardingTask[] = [
  {
    id: '1',
    title: 'Kick-off Meeting',
    description: 'Reunião inicial com stakeholders para alinhar expectativas e objetivos',
    order: 1,
    category: 'setup',
  },
  {
    id: '2',
    title: 'Configuração de Conta',
    description: 'Criar conta, configurar permissões e acessos iniciais',
    order: 2,
    category: 'setup',
  },
  {
    id: '3',
    title: 'Treinamento Básico',
    description: 'Sessão de treinamento sobre funcionalidades principais da plataforma',
    order: 3,
    category: 'training',
  },
  {
    id: '4',
    title: 'Importação de Dados',
    description: 'Migrar dados existentes para a plataforma',
    order: 4,
    category: 'integration',
  },
  {
    id: '5',
    title: 'Configuração de Integrações',
    description: 'Conectar ferramentas e sistemas existentes (CRM, email, etc.)',
    order: 5,
    category: 'integration',
  },
  {
    id: '6',
    title: 'Personalização',
    description: 'Customizar interface, workflows e relatórios conforme necessidades',
    order: 6,
    category: 'setup',
  },
  {
    id: '7',
    title: 'Treinamento Avançado',
    description: 'Sessão de treinamento sobre recursos avançados e best practices',
    order: 7,
    category: 'training',
  },
  {
    id: '8',
    title: 'Primeiro Caso de Uso',
    description: 'Implementar e validar primeiro caso de uso real',
    order: 8,
    category: 'adoption',
  },
  {
    id: '9',
    title: 'Revisão de 30 Dias',
    description: 'Reunião de revisão para avaliar progresso e ajustar estratégia',
    order: 9,
    category: 'adoption',
  },
  {
    id: '10',
    title: 'Go-Live',
    description: 'Lançamento oficial para todos os usuários',
    order: 10,
    category: 'adoption',
  },
];

export function useOnboarding() {
  const [template, setTemplate] = useState<OnboardingTask[]>(() => {
    const saved = localStorage.getItem('zapper_onboarding_template');
    return saved ? JSON.parse(saved) : DEFAULT_ONBOARDING_TEMPLATE;
  });

  const [progressMap, setProgressMap] = useState<Record<string, OnboardingProgress>>(() => {
    const saved = localStorage.getItem('zapper_onboarding_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Salvar template no localStorage
  useEffect(() => {
    localStorage.setItem('zapper_onboarding_template', JSON.stringify(template));
  }, [template]);

  // Salvar progresso no localStorage
  useEffect(() => {
    localStorage.setItem('zapper_onboarding_progress', JSON.stringify(progressMap));
  }, [progressMap]);

  // Iniciar onboarding para um account
  const startOnboarding = (accountId: string) => {
    if (!progressMap[accountId]) {
      setProgressMap(prev => ({
        ...prev,
        [accountId]: {
          accountId,
          completedTasks: [],
          startedAt: new Date().toISOString(),
        },
      }));
    }
  };

  // Marcar tarefa como completa
  const completeTask = (accountId: string, taskId: string, completedBy?: string) => {
    setProgressMap(prev => {
      const progress = prev[accountId] || {
        accountId,
        completedTasks: [],
        startedAt: new Date().toISOString(),
      };

      // Verificar se já está completa
      if (progress.completedTasks.some(t => t.taskId === taskId)) {
        return prev;
      }

      const updatedProgress = {
        ...progress,
        completedTasks: [
          ...progress.completedTasks,
          {
            taskId,
            completedAt: new Date().toISOString(),
            completedBy,
          },
        ],
      };

      // Se todas as tarefas foram completadas, marcar como concluído
      if (updatedProgress.completedTasks.length === template.length) {
        updatedProgress.completedAt = new Date().toISOString();
      }

      return {
        ...prev,
        [accountId]: updatedProgress,
      };
    });
  };

  // Desmarcar tarefa
  const uncompleteTask = (accountId: string, taskId: string) => {
    setProgressMap(prev => {
      const progress = prev[accountId];
      if (!progress) return prev;

      return {
        ...prev,
        [accountId]: {
          ...progress,
          completedTasks: progress.completedTasks.filter(t => t.taskId !== taskId),
          completedAt: undefined, // Remover data de conclusão se desmarcar
        },
      };
    });
  };

  // Obter progresso de um account
  const getProgress = (accountId: string): OnboardingProgress | undefined => {
    return progressMap[accountId];
  };

  // Calcular estatísticas de progresso
  const getProgressStats = (accountId: string) => {
    const progress = progressMap[accountId];
    if (!progress) {
      return {
        total: template.length,
        completed: 0,
        percentage: 0,
        isComplete: false,
        timeToValue: null,
      };
    }

    const completed = progress.completedTasks.length;
    const percentage = Math.round((completed / template.length) * 100);
    const isComplete = completed === template.length;

    let timeToValue = null;
    if (isComplete && progress.completedAt) {
      const start = new Date(progress.startedAt);
      const end = new Date(progress.completedAt);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      timeToValue = days;
    }

    return {
      total: template.length,
      completed,
      percentage,
      isComplete,
      timeToValue,
    };
  };

  // Verificar se tarefa está completa
  const isTaskComplete = (accountId: string, taskId: string): boolean => {
    const progress = progressMap[accountId];
    if (!progress) return false;
    return progress.completedTasks.some(t => t.taskId === taskId);
  };

  // Atualizar template
  const updateTemplate = (newTemplate: OnboardingTask[]) => {
    setTemplate(newTemplate);
  };

  // Resetar template para padrão
  const resetTemplate = () => {
    setTemplate(DEFAULT_ONBOARDING_TEMPLATE);
  };

  return {
    template,
    progressMap,
    startOnboarding,
    completeTask,
    uncompleteTask,
    getProgress,
    getProgressStats,
    isTaskComplete,
    updateTemplate,
    resetTemplate,
  };
}
