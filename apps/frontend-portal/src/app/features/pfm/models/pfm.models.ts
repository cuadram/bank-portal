/**
 * Modelos TypeScript — Módulo PFM Mi Dinero.
 * FEAT-023 Sprint 25 · BankPortal · Banco Meridian.
 */

export type BudgetStatus = 'GREEN' | 'ORANGE' | 'RED';

export interface MovimientoCategorizado {
  txId:          string;
  concept:       string;
  amount:        number;
  categoryCode:  string;
  categoryLabel: string;
  isIngreso:     boolean;
}

export interface BudgetDto {
  id:               string;
  categoryCode:     string;
  amountLimit:      number;
  spent:            number;
  percentConsumed:  number;
  status:           BudgetStatus;
  thresholdPercent: number;
}

export interface BudgetCreateRequest {
  categoryCode:     string;
  amountLimit:      number;
  thresholdPercent: number;
}

export interface PfmOverviewResponse {
  totalGastoMes:   number;
  totalIngresoMes: number;
  movimientos:     MovimientoCategorizado[];
  budgets:         BudgetDto[];
}

export interface CategoryAnalysis {
  categoryCode:     string;
  totalMesActual:   number;
  totalMesAnterior: number;
  variacionPct:     number;
}

export interface PfmAnalysisResponse {
  mes:                string;
  mesAnterior:        string;
  totalActual:        number;
  totalAnterior:      number;
  variacionGlobalPct: number;
  categorias:         CategoryAnalysis[];
}

export interface TopComercio {
  nombre:           string;
  totalImporte:     number;
  numTransacciones: number;
}

export interface DistribucionCategoria {
  categoryCode: string;
  totalImporte: number;
  porcentaje:   number;
}

export interface PfmDistributionResponse {
  mes:          string;
  distribucion: DistribucionCategoria[];
  topComercios: TopComercio[];
}

export interface PfmWidgetResponse {
  gastoTotalMes: number;
  topCategorias: { categoryCode: string; importe: number }[];
  semaforo:      BudgetStatus;
}

export const CATEGORY_LABELS: Record<string, string> = {
  ALIMENTACION:   'Alimentación',
  TRANSPORTE:     'Transporte',
  SERVICIOS:      'Servicios',
  OCIO:           'Ocio',
  RESTAURANTES:   'Restaurantes',
  SALUD:          'Salud',
  HOGAR:          'Hogar',
  SUMINISTROS:    'Suministros',
  COMUNICACIONES: 'Comunicaciones',
  EDUCACION:      'Educación',
  VIAJES:         'Viajes',
  SEGUROS:        'Seguros',
  NOMINA:         'Nómina',
  TRANSFERENCIAS: 'Transferencias',
  OTROS:          'Otros'
};

export const CATEGORY_ICONS: Record<string, string> = {
  ALIMENTACION:   '🛒', TRANSPORTE:     '🚗', SERVICIOS:      '⚙️',
  OCIO:           '🎮', RESTAURANTES:   '🍽️', SALUD:          '💊',
  HOGAR:          '🏠', SUMINISTROS:    '💡', COMUNICACIONES: '📱',
  EDUCACION:      '📚', VIAJES:         '✈️', SEGUROS:        '🛡️',
  NOMINA:         '💰', TRANSFERENCIAS: '↔️', OTROS:          '📦'
};

export const BUDGET_COLORS = ['#1e3a5f','#2e86ab','#a23b72','#f18f01','#c73e1d',
  '#3b1f2b','#44bba4','#e94f37','#393e41','#f5f5f5'];

/** Colores PFM design system — anotacion 13 prototipo (conic-gradient, paleta 8) */
export const PFM_CATEGORY_COLORS: Record<string, string> = {
  ALIMENTACION:   '#4CAF50', TRANSPORTE:     '#2196F3',
  RESTAURANTES:   '#FF9800', SALUD:          '#E91E63',
  HOGAR:          '#9C27B0', SUMINISTROS:    '#00BCD4',
  OCIO:           '#FF5722', EDUCACION:      '#3F51B5',
  VIAJES:         '#009688', SEGUROS:        '#795548',
  NOMINA:         '#00897B', TRANSFERENCIAS: '#607D8B',
  SERVICIOS:      '#FF9800', COMUNICACIONES: '#2196F3',
  OTROS:          '#9E9E9E'
};

export const PFM_CATEGORY_BG: Record<string, string> = {
  ALIMENTACION:   '#E8F5E9', TRANSPORTE:     '#E3F2FD',
  RESTAURANTES:   '#FFF3E0', SALUD:          '#FCE4EC',
  HOGAR:          '#F3E5F5', SUMINISTROS:    '#E0F7FA',
  OCIO:           '#FBE9E7', EDUCACION:      '#E8EAF6',
  VIAJES:         '#E0F2F1', SEGUROS:        '#EFEBE9',
  NOMINA:         '#E0F2F1', TRANSFERENCIAS: '#ECEFF1',
  SERVICIOS:      '#FFF3E0', COMUNICACIONES: '#E3F2FD',
  OTROS:          '#F5F5F5'
};

/** Convierte YearMonth string '2026-04' → 'Abril 2026' */
export function formatYearMonth(ym: string): string {
  if (!ym || !ym.includes('-')) return ym;
  const [year, month] = ym.split('-');
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${names[parseInt(month, 10) - 1]} ${year}`;
}
