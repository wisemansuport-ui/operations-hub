// Guided tour definitions — each trilha is a sequence of steps.
// A step can target a route + optional CSS selector to spotlight.
// If selector is missing or not found, the tooltip is centered.

export type TourStep = {
  route: string;
  selector?: string;
  title: string;
  description: string;
};

export type TourDefinition = {
  id: string;
  title: string;
  steps: TourStep[];
};

export const TOURS: Record<string, TourDefinition> = {
  primeiros: {
    id: 'primeiros',
    title: 'Primeiros Passos',
    steps: [
      {
        route: '/app',
        selector: '[data-tour="hero-lucro"]',
        title: 'Lucro consolidado',
        description: 'O coração do painel. Lucro líquido (depois de salário, BAU e custos) no período selecionado. Filtros: mês, hoje, ontem, 7d, 30d ou tudo.',
      },
      {
        route: '/app',
        selector: '[data-tour="period-filter"]',
        title: 'Filtros de período',
        description: 'Troque rapidamente entre hoje, ontem, 7d, 30d ou tudo para enxergar a operação em diferentes janelas de tempo.',
      },
      {
        route: '/networks',
        title: 'Cadastre suas redes',
        description: 'Comece adicionando as redes onde você opera. Tudo no Nytzer Vision se organiza ao redor delas.',
      },
      {
        route: '/operators',
        title: 'Adicione operadores',
        description: 'Vincule operadores às redes e acompanhe individualmente desempenho, salário e logs em tempo real.',
      },
    ],
  },
  operacoes: {
    id: 'operacoes',
    title: 'Operações & Remessas',
    steps: [
      {
        route: '/tasks',
        title: 'Central de Metas',
        description: 'Aqui você cria, acompanha e fecha cada operação. Cada meta concentra remessas, depósitos, saques e contas.',
      },
      {
        route: '/tasks',
        title: 'Registre remessas',
        description: 'Dentro de cada meta, lance remessas com depósitos, saques e quantidade de contas — o lucro é calculado automaticamente.',
      },
      {
        route: '/reports',
        title: 'Veja o resultado',
        description: 'Tudo que você registra aparece consolidado em Relatórios — sem precisar somar planilha nenhuma.',
      },
    ],
  },
  redes: {
    id: 'redes',
    title: 'Redes & Operadores',
    steps: [
      {
        route: '/networks',
        title: 'Estrutura de redes',
        description: 'Cadastre, edite e organize as redes que sua operação utiliza. Use modelos próprios ou padrão.',
      },
      {
        route: '/operators',
        title: 'Hierarquia de operadores',
        description: 'Crie operadores com acesso individual, definindo salário, comissão e regras de pagamento.',
      },
      {
        route: '/operators',
        title: 'Log de atividade',
        description: 'Acompanhe sessão, ações e desempenho de cada operador — controle total sem precisar perguntar.',
      },
    ],
  },
  metas: {
    id: 'metas',
    title: 'Missões & Forecast',
    steps: [
      {
        route: '/goals',
        title: 'Central de Metas',
        description: 'Crie missões mensais ou contínuas com alvo financeiro. O sistema acompanha a trajetória em tempo real.',
      },
      {
        route: '/goals',
        title: 'Previsão IA',
        description: 'Cada missão recebe uma projeção em dias para ser batida, calculada com base no seu ritmo histórico.',
      },
    ],
  },
  custos: {
    id: 'custos',
    title: 'Inteligência de Custos',
    steps: [
      {
        route: '/costs',
        title: 'Cost Intelligence Center',
        description: 'Registre custos fixos e variáveis. Tudo entra no cálculo de lucro líquido automaticamente.',
      },
      {
        route: '/costs',
        title: 'Identifique vazamentos',
        description: 'Distribuição visual e tendências revelam onde o dinheiro está escorrendo para você cortar com precisão.',
      },
    ],
  },
  decision: {
    id: 'decision',
    title: 'Motor de Decisão IA',
    steps: [
      {
        route: '/app',
        selector: '[data-tour="decision-engine"]',
        title: 'Motor de Decisão',
        description: 'O Motor lê seus dados em tempo real e devolve recomendações práticas: o que escalar, o que cortar e onde acelerar.',
      },
      {
        route: '/reports',
        title: 'Sinais cruzados',
        description: 'Em Relatórios, o motor cruza receita, custos e produtividade por operador para apontar prioridades.',
      },
    ],
  },
  assinatura: {
    id: 'assinatura',
    title: 'Plano & Acesso Premium',
    steps: [
      {
        route: '/subscription',
        title: 'Planos disponíveis',
        description: 'Conheça os planos Admin Solo e Admin + Operadores, com descontos progressivos por volume.',
      },
      {
        route: '/subscription',
        title: 'Ativação automática',
        description: 'O acesso é liberado automaticamente após a confirmação do pagamento — sem comprovante manual.',
      },
    ],
  },
};

export const TOUR_STORAGE_KEY = 'nytzer-active-tour';

export type ActiveTourState = {
  tourId: string;
  step: number;
};

export const startTour = (tourId: string) => {
  const tour = TOURS[tourId];
  if (!tour) return;
  const state: ActiveTourState = { tourId, step: 0 };
  localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nytzer-tour-start', { detail: state }));
};
