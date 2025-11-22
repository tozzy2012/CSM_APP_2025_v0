/**
 * Hook para gerenciar playbooks com localStorage
 */
import { useState, useEffect } from "react";

export interface PlaybookDoc {
  id: string;
  organizationId: string; // ID da organização dona deste playbook
  title: string;
  description: string;
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  version: string;
  tags: string[];
  content: string;
}

const STORAGE_KEY = "zapper_playbooks";

// Dados iniciais (vazio - playbooks devem ser criados com organizationId)
const initialPlaybooks: PlaybookDoc[] = [
  /*
  {
    id: "1",
    title: "Processo Completo de Onboarding",
    description:
      "Guia passo a passo para onboarding de novos clientes, incluindo configuração inicial, treinamento e primeiros passos.",
    category: "onboarding",
    author: "John Doe",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-20",
    views: 145,
    version: "2.1",
    tags: ["onboarding", "setup", "training"],
    content: `
      <h1>Processo de Onboarding</h1>
      <p>Este documento descreve o processo completo de onboarding de novos clientes.</p>
      
      <h2>1. Preparação Inicial</h2>
      <p>Antes do kickoff, certifique-se de:</p>
      <ul>
        <li>Revisar o contrato e escopo</li>
        <li>Preparar ambiente de produção</li>
        <li>Agendar kickoff call</li>
        <li>Enviar materiais de boas-vindas</li>
      </ul>

      <h2>2. Kickoff Meeting</h2>
      <p>Durante a reunião de kickoff:</p>
      <ol>
        <li>Apresentar o time de Customer Success</li>
        <li>Revisar objetivos e expectativas</li>
        <li>Demonstrar a plataforma</li>
        <li>Definir próximos passos</li>
      </ol>

      <blockquote>
        <p><strong>Dica:</strong> Sempre grave a sessão de kickoff para referência futura.</p>
      </blockquote>

      <h2>3. Configuração Técnica</h2>
      <p>Passos técnicos necessários:</p>
      <ul>
        <li>Criar usuários e permissões</li>
        <li>Configurar integrações</li>
        <li>Importar dados iniciais</li>
        <li>Validar configurações</li>
      </ul>

      <h2>4. Treinamento</h2>
      <p>Sessões de treinamento recomendadas:</p>
      <ul>
        <li><strong>Sessão 1:</strong> Fundamentos da plataforma (2h)</li>
        <li><strong>Sessão 2:</strong> Features avançadas (2h)</li>
        <li><strong>Sessão 3:</strong> Casos de uso específicos (1h)</li>
      </ul>

      <h2>5. Go-Live e Acompanhamento</h2>
      <p>Após o go-live:</p>
      <ol>
        <li>Monitorar uso nas primeiras semanas</li>
        <li>Agendar check-ins semanais</li>
        <li>Coletar feedback</li>
        <li>Ajustar configurações conforme necessário</li>
      </ol>

      <h2>Checklist Final</h2>
      <p>Antes de considerar o onboarding completo:</p>
      <ul>
        <li>✓ Todos os usuários criados e treinados</li>
        <li>✓ Integrações funcionando</li>
        <li>✓ Dados importados e validados</li>
        <li>✓ Cliente usando a plataforma ativamente</li>
        <li>✓ Feedback inicial coletado</li>
      </ul>

      <p><em>Última atualização: 20 de fevereiro de 2024</em></p>
    `,
  },
  {
    id: "2",
    title: "Estratégias de Renovação",
    description:
      "Melhores práticas para garantir renovações bem-sucedidas, incluindo timeline, comunicação e negociação.",
    category: "renewal",
    author: "Jane Smith",
    createdAt: "2024-01-20",
    updatedAt: "2024-03-01",
    views: 98,
    version: "1.5",
    tags: ["renewal", "retention", "negotiation"],
    content: `
      <h1>Estratégias de Renovação</h1>
      <p>Guia completo para renovações bem-sucedidas.</p>
      <h2>Timeline de Renovação</h2>
      <p>Comece o processo 90 dias antes do vencimento.</p>
    `,
  },
  {
    id: "3",
    title: "Identificação de Oportunidades de Upsell",
    description:
      "Como identificar e abordar oportunidades de expansão com base em sinais de uso e engajamento.",
    category: "expansion",
    author: "John Doe",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-15",
    views: 76,
    version: "1.0",
    tags: ["upsell", "expansion", "revenue"],
    content: `
      <h1>Oportunidades de Upsell</h1>
      <p>Identifique sinais de expansão.</p>
    `,
  },*/
];

export function usePlaybooks() {
  const [playbooks, setPlaybooks] = useState<PlaybookDoc[]>([]);

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPlaybooks(JSON.parse(stored));
      } catch (error) {
        console.error("Erro ao carregar playbooks:", error);
        setPlaybooks(initialPlaybooks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPlaybooks));
      }
    } else {
      setPlaybooks(initialPlaybooks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPlaybooks));
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    if (playbooks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playbooks));
    }
  }, [playbooks]);

  // Buscar playbook por ID
  const getPlaybook = (id: string): PlaybookDoc | undefined => {
    return playbooks.find((p) => p.id === id);
  };

  // Buscar playbooks por organizationId
  const getPlaybooksByOrganization = (organizationId: string | null): PlaybookDoc[] => {
    if (!organizationId) {
      // Super Admin vê todos os playbooks
      return playbooks;
    }
    return playbooks.filter((p) => p.organizationId === organizationId);
  };

  // Criar novo playbook
  const createPlaybook = (data: Omit<PlaybookDoc, "id" | "createdAt" | "updatedAt" | "views">): PlaybookDoc => {
    const now = new Date().toISOString().split("T")[0];
    const newPlaybook: PlaybookDoc = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
      views: 0,
    };
    setPlaybooks((prev) => [...prev, newPlaybook]);
    return newPlaybook;
  };

  // Atualizar playbook
  const updatePlaybook = (id: string, data: Partial<PlaybookDoc>): void => {
    setPlaybooks((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : p
      )
    );
  };

  // Deletar playbook
  const deletePlaybook = (id: string): void => {
    setPlaybooks((prev) => prev.filter((p) => p.id !== id));
  };

  // Incrementar views
  const incrementViews = (id: string): void => {
    setPlaybooks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p))
    );
  };

  return {
    playbooks,
    getPlaybook,
    getPlaybooksByOrganization,
    createPlaybook,
    updatePlaybook,
    deletePlaybook,
    incrementViews,
  };
}
