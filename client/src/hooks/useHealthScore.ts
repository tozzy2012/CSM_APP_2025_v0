export interface HealthScoreQuestion {
    id: number;
    pilar: string;
    question: string;
    options: {
        value: number;
        label: string;
    }[];
    weight: number;
}

export const HEALTH_SCORE_QUESTIONS: HealthScoreQuestion[] = [
    // PILAR 1: Adoção e Engajamento (2 perguntas)
    {
        id: 1,
        pilar: 'Adoção e Engajamento',
        question: 'Frequência de uso do produto (últimos 7 dias)',
        weight: 10,
        options: [
            { value: 100, label: 'Diariamente - uso intenso e consistente' },
            { value: 75, label: '4-6 vezes por semana - uso regular' },
            { value: 50, label: '2-3 vezes por semana - uso moderado' },
            { value: 25, label: '1 vez por semana - uso esporádico' },
            { value: 0, label: 'Não utilizou - sem engajamento' },
        ],
    },
    {
        id: 2,
        pilar: 'Adoção e Engajamento',
        question: 'Nível de adoção de funcionalidades principais',
        weight: 15,
        options: [
            { value: 100, label: 'Todas as funcionalidades principais implementadas e em uso' },
            { value: 75, label: 'Maioria das funcionalidades implementadas (70-90%)' },
            { value: 50, label: 'Metade das funcionalidades implementadas (40-70%)' },
            { value: 25, label: 'Poucas funcionalidades implementadas (10-40%)' },
            { value: 0, label: 'Nenhuma ou quase nenhuma funcionalidade implementada' },
        ],
    },

    // PILAR 2: Percepção de Valor (2 perguntas)
    {
        id: 3,
        pilar: 'Percepção de Valor',
        question: 'Percepção de valor entregue pelo produto',
        weight: 15,
        options: [
            { value: 100, label: 'Extremamente valioso - supera expectativas' },
            { value: 75, label: 'Muito valioso - atende plenamente' },
            { value: 50, label: 'Moderadamente valioso - atende parcialmente' },
            { value: 25, label: 'Pouco valioso - abaixo das expectativas' },
            { value: 0, label: 'Sem valor percebido - não atende expectativas' },
        ],
    },
    {
        id: 4,
        pilar: 'Percepção de Valor',
        question: 'ROI percebido pelo cliente',
        weight: 15,
        options: [
            { value: 100, label: 'ROI excelente - retorno muito acima do investimento' },
            { value: 75, label: 'ROI bom - retorno positivo claro' },
            { value: 50, label: 'ROI adequado - retorno equilibrado' },
            { value: 25, label: 'ROI questionável - retorno incerto' },
            { value: 0, label: 'ROI negativo - sem retorno percebido' },
        ],
    },

    // PILAR 3: Relacionamento e Satisfação (2 perguntas)
    {
        id: 5,
        pilar: 'Relacionamento e Satisfação',
        question: 'Qualidade do relacionamento com CSM',
        weight: 10,
        options: [
            { value: 100, label: 'Excelente - parceria estratégica forte' },
            { value: 75, label: 'Muito bom - comunicação fluida e proativa' },
            { value: 50, label: 'Bom - comunicação regular e adequada' },
            { value: 25, label: 'Regular - comunicação básica e reativa' },
            { value: 0, label: 'Ruim - comunicação difícil ou inexistente' },
        ],
    },
    {
        id: 6,
        pilar: 'Relacionamento e Satisfação',
        question: 'Engajamento em reuniões e check-ins',
        weight: 10,
        options: [
            { value: 100, label: 'Sempre presente e altamente engajado' },
            { value: 75, label: 'Geralmente presente e engajado' },
            { value: 50, label: 'Às vezes presente com engajamento moderado' },
            { value: 25, label: 'Raramente presente ou pouco engajado' },
            { value: 0, label: 'Nunca presente ou sem engajamento' },
        ],
    },

    // PILAR 4: Saúde Operacional (2 perguntas)
    {
        id: 7,
        pilar: 'Saúde Operacional',
        question: 'Número de tickets de suporte abertos (últimos 30 dias)',
        weight: 8,
        options: [
            { value: 100, label: 'Nenhum ticket - operação estável' },
            { value: 75, label: '1-2 tickets - problemas pontuais' },
            { value: 50, label: '3-5 tickets - alguns problemas recorrentes' },
            { value: 25, label: '6-10 tickets - problemas frequentes' },
            { value: 0, label: 'Mais de 10 tickets - operação crítica' },
        ],
    },
    {
        id: 8,
        pilar: 'Saúde Operacional',
        question: 'Tempo médio de resolução de problemas',
        weight: 7,
        options: [
            { value: 100, label: 'Menos de 24 horas - resolução muito rápida' },
            { value: 75, label: '1-3 dias - resolução rápida' },
            { value: 50, label: '4-7 dias - resolução adequada' },
            { value: 25, label: '1-2 semanas - resolução lenta' },
            { value: 0, label: 'Mais de 2 semanas - resolução muito lenta' },
        ],
    },

    // PILAR 5: Potencial de Crescimento (2 perguntas)
    {
        id: 9,
        pilar: 'Potencial de Crescimento',
        question: 'Potencial de expansão (upsell/cross-sell)',
        weight: 5,
        options: [
            { value: 100, label: 'Alto potencial - já demonstrou interesse ativo' },
            { value: 75, label: 'Bom potencial - sinais positivos identificados' },
            { value: 50, label: 'Potencial moderado - possibilidades futuras' },
            { value: 25, label: 'Baixo potencial - poucas oportunidades' },
            { value: 0, label: 'Sem potencial - risco de churn' },
        ],
    },
    {
        id: 10,
        pilar: 'Potencial de Crescimento',
        question: 'Indicação de NPS (Net Promoter Score)',
        weight: 5,
        options: [
            { value: 100, label: 'Promotor (9-10) - altamente recomendaria' },
            { value: 75, label: 'Promotor moderado (8) - recomendaria' },
            { value: 50, label: 'Neutro (7) - indiferente' },
            { value: 25, label: 'Detrator leve (5-6) - insatisfeito' },
            { value: 0, label: 'Detrator (0-4) - muito insatisfeito' },
        ],
    },
];

export function useHealthScore() {
    return {
        HEALTH_SCORE_QUESTIONS,
    };
}
