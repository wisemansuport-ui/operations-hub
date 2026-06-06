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
  operador: {
    id: 'operador',
    title: 'Painel do Operador',
    steps: [
      {
        route: '/app',
        selector: '[data-tour="operator-hero"]',
        title: 'Seu painel ao vivo',
        description: 'Aqui você vê em tempo real seu saldo do período, a projeção de fechamento e o status da sua operação. Tudo se atualiza conforme você registra remessas.',
      },
      {
        route: '/app',
        selector: '[data-tour="operator-kpis"]',
        title: 'KPIs essenciais',
        description: 'Quatro indicadores que importam: saldo a receber, metas fechadas, contas normais (R$ 2,00) e contas baixo (R$ 1,00). Cada conta validada soma ao seu ganho.',
      },
      {
        route: '/app',
        selector: '[data-tour="operator-chart"]',
        title: 'Evolução do seu faturamento',
        description: 'Acompanhe dia a dia o saldo gerado pela sua produção. Use os filtros de período para comparar hoje, semana ou mês.',
      },
      {
        route: '/app',
        selector: '[data-tour="operator-ai"]',
        title: 'IA Motivacional',
        description: 'O motor lê seus números e devolve uma leitura prática do seu ritmo: o que está indo bem, o que destravar e onde focar.',
      },
      {
        route: '/app',
        selector: '[data-tour="operator-quick"]',
        title: 'Comandos rápidos',
        description: 'Atalhos para as áreas que você usa todo dia: planilhas, extrato, custos e PIX.',
      },
      {
        route: '/tasks',
        selector: '[data-tour="tasks-tabs"]',
        title: 'Suas planilhas operacionais',
        description: 'Aqui ficam as metas atribuídas a você. Cada meta concentra remessas, contas normais e baixas — é onde sua produção é lançada.',
      },
      {
        route: '/tasks',
        selector: '[data-tour="tasks-meta-entry"]',
        title: 'Como lançar remessa',
        description: 'Dentro de uma meta, registre as contas processadas. Quando o controle de qualidade validar, vira saldo no seu extrato automaticamente.',
      },
      {
        route: '/me',
        selector: '[data-tour="operator-extract-table"]',
        title: 'Extrato detalhado',
        description: 'Cada remessa validada aparece linha a linha — plataforma, rede, contas e valor. Use os filtros acima para refinar e o botão Exportar CSV para baixar.',
      },
      {
        route: '/me',
        selector: '[data-tour="operator-payments"]',
        title: 'Histórico de pagamentos',
        description: 'Tudo que já caiu na sua conta: total recebido, últimos 30 dias, ticket médio e a linha do tempo agrupada por mês com cada repasse.',
      },
      {
        route: '/costs',
        selector: '[data-tour="costs-center"]',
        title: 'Registre seus custos',
        description: 'Lance aqui os custos da sua operação para manter o lucro real correto. Útil para auditar a sua própria margem.',
      },
      {
        route: '/pix',
        selector: '[data-tour="pix-stats"]',
        title: 'Chaves PIX',
        description: 'Cadastre, organize e acompanhe as chaves PIX usadas no seu fluxo financeiro — receba sem fricção.',
      },

    ],
  },

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
        selector: '[data-tour="networks-ranking"]',
        title: 'Cadastre suas redes',
        description: 'Comece adicionando as redes onde você opera. Tudo no Nytzer Vision se organiza ao redor delas.',
      },
      {
        route: '/operators',
        selector: '[data-tour="operators-invite"]',
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
        selector: '[data-tour="tasks-tabs"]',
        title: 'Central de Metas',
        description: 'Aqui você cria, acompanha e fecha cada operação. Cada meta concentra remessas, depósitos, saques e contas.',
      },
      {
        route: '/tasks',
        selector: '[data-tour="tasks-meta-entry"]',
        title: 'Registre remessas',
        description: 'Dentro de cada meta, lance remessas com depósitos, saques e quantidade de contas — o lucro é calculado automaticamente.',
      },
      {
        route: '/reports',
        selector: '[data-tour="reports-ranking"]',
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
        selector: '[data-tour="networks-heatmap"]',
        title: 'Estrutura de redes',
        description: 'Cadastre, edite e organize as redes que sua operação utiliza. Use modelos próprios ou padrão.',
      },
      {
        route: '/operators',
        selector: '[data-tour="operators-invite"]',
        title: 'Hierarquia de operadores',
        description: 'Crie operadores com acesso individual, definindo salário, comissão e regras de pagamento.',
      },
      {
        route: '/operators',
        selector: '[data-tour="operators-leaderboard"]',
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
        selector: '[data-tour="goals-launcher"]',
        title: 'Central de Metas',
        description: 'Crie missões mensais ou contínuas com alvo financeiro. O sistema acompanha a trajetória em tempo real.',
      },
      {
        route: '/goals',
        selector: '[data-tour="goals-forecast"]',
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
        selector: '[data-tour="costs-center"]',
        title: 'Cost Intelligence Center',
        description: 'Registre custos fixos e variáveis. Tudo entra no cálculo de lucro líquido automaticamente.',
      },
      {
        route: '/costs',
        selector: '[data-tour="costs-leaks"]',
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
        selector: '[data-tour="hero-lucro"]',
        title: 'Leitura do painel',
        description: 'O Motor parte daqui: lucro, custos e produção do período são a matéria-prima da IA. Confirme o filtro de período antes de interpretar qualquer sinal.',
      },
      {
        route: '/app',
        selector: '[data-tour="decision-engine"]',
        title: 'Recomendações em tempo real',
        description: 'O Motor de Decisão cruza sua operação ao vivo e devolve ações práticas — o que escalar, o que cortar, onde acelerar e quais riscos observar agora.',
      },
      {
        route: '/networks',
        selector: '[data-tour="networks-ranking"]',
        title: 'Ranking inteligente de redes',
        description: 'Cada rede recebe um score com veredito da IA. Clique numa rede para abrir a análise completa: pontos fortes, fracos, ações e previsão.',
      },
      {
        route: '/goals',
        selector: '[data-tour="goals-forecast"]',
        title: 'Forecast de metas',
        description: 'A previsão da IA antecipa fechamento e gargalos das metas em andamento — use para priorizar quem destravar primeiro.',
      },
      {
        route: '/reports',
        selector: '[data-tour="reports-charts"]',
        title: 'Sinais cruzados',
        description: 'Em Relatórios, o motor cruza receita, custos e produtividade por operador para confirmar (ou desafiar) as recomendações do painel.',
      },
    ],
  },

  assinatura: {
    id: 'assinatura',
    title: 'Plano & Acesso Premium',
    steps: [
      {
        route: '/subscription',
        selector: '[data-tour="subscription-plans"]',
        title: 'Planos disponíveis',
        description: 'Conheça os planos Admin Solo e Admin + Operadores, com descontos progressivos por volume.',
      },
      {
        route: '/subscription',
        selector: '[data-tour="subscription-summary"]',
        title: 'Ativação automática',
        description: 'O acesso é liberado automaticamente após a confirmação do pagamento — sem comprovante manual.',
      },
    ],
  },
};

export const TOUR_STORAGE_KEY = 'nytzer-active-tour';
export const TOUR_PROGRESS_KEY = 'nytzer-tour-progress';
export const TOUR_PROGRESS_EVENT = 'nytzer-tour-progress-changed';

export type ActiveTourState = {
  tourId: string;
  step: number;
};

// Persisted progress: tourId -> highest step index reached + completed flag
export type TourProgressEntry = { reached: number; completed: boolean };
export type TourProgressMap = Record<string, TourProgressEntry>;

export const getTourProgressMap = (): TourProgressMap => {
  try {
    const raw = localStorage.getItem(TOUR_PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TourProgressMap;
  } catch {
    return {};
  }
};

export const getTourProgressPercent = (tourId: string): number => {
  const tour = TOURS[tourId];
  if (!tour) return 0;
  const entry = getTourProgressMap()[tourId];
  if (!entry) return 0;
  if (entry.completed) return 100;
  // reached is the index of the last viewed step (0-based)
  const stepsDone = Math.min(entry.reached + 1, tour.steps.length);
  return Math.round((stepsDone / tour.steps.length) * 100);
};

export const markTourStepReached = (tourId: string, step: number) => {
  const tour = TOURS[tourId];
  if (!tour) return;
  const map = getTourProgressMap();
  const prev = map[tourId] || { reached: -1, completed: false };
  const reached = Math.max(prev.reached, step);
  const completed = prev.completed || reached >= tour.steps.length - 1;
  map[tourId] = { reached, completed };
  localStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(TOUR_PROGRESS_EVENT));
};

export const markTourCompleted = (tourId: string) => {
  const tour = TOURS[tourId];
  if (!tour) return;
  const map = getTourProgressMap();
  map[tourId] = { reached: tour.steps.length - 1, completed: true };
  localStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(TOUR_PROGRESS_EVENT));
};

export const startTour = (tourId: string) => {
  const tour = TOURS[tourId];
  if (!tour) return;
  const state: ActiveTourState = { tourId, step: 0 };
  localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  markTourStepReached(tourId, 0);
  window.dispatchEvent(new CustomEvent('nytzer-tour-start', { detail: state }));
};
