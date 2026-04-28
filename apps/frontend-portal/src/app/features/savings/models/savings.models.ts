/**
 * Modelos TypeScript — Módulo Savings (Objetivos de Ahorro).
 * FEAT-024 Sprint 26 · BankPortal · Banco Meridian.
 *
 * Mapeo 1:1 con SavingsDtos.java (Fase E backend):
 *   UUID -> string
 *   BigDecimal -> number
 *   Instant -> string (ISO 8601)
 *   LocalDate -> string (YYYY-MM-DD)
 *   short / int -> number
 *
 * Tokens UX heredados de UX-DESIGN-SYSTEM v1.1 §7 FEAT-024.
 */

// ---------------------------------------------------------------------------
// Enums (string union types — alineados con domain model Java)
// ---------------------------------------------------------------------------

export type GoalCategory = 'VIAJE' | 'HOGAR' | 'VEHICULO' | 'EMERGENCIA' | 'EDUCACION' | 'OTROS';

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'COMPLETED';

export type AllocationType = 'MANUAL' | 'AUTO';

export type AllocationStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

// ---------------------------------------------------------------------------
// Entidades (response DTOs)
// ---------------------------------------------------------------------------

export interface SavingsGoal {
  id:                            string;
  name:                          string;
  targetAmount:                  number;
  reservedAmount:                number;
  targetDate:                    string;            // YYYY-MM-DD
  category:                      GoalCategory;
  customCategory?:               string;
  icon?:                         string;
  color?:                        string;
  status:                        GoalStatus;
  sourceAccountId?:              string;
  createdAt:                     string;            // ISO 8601
  progressPct:                   number;            // 0..100
  suggestedMonthlyContribution:  number;
  projectionRisk:                boolean;           // RN-F024-08
}

export interface Allocation {
  id:               string;
  amount:           number;
  type:             AllocationType;
  sourceAccountId:  string;
  allocationMonth?: string;            // YYYY-MM (solo AUTO)
  status:           AllocationStatus;
  failureReason?:   string;
  executedAt:       string;            // ISO 8601
}

export interface AutoRule {
  id:               string;
  amount:           number;
  dayOfMonth:       number;            // 1..28
  sourceAccountId:  string;
  active:           boolean;
  nextExecutionAt:  string;            // ISO 8601
  lastExecutionAt?: string;            // ISO 8601
}

export interface Milestone {
  id:        string;
  percent:   25 | 50 | 75 | 100;
  reachedAt: string;                   // ISO 8601
}

export interface GoalDetail {
  goal:               SavingsGoal;
  recentAllocations:  Allocation[];
  milestones:         Milestone[];
  autoRule?:          AutoRule;
}

export interface CloseResult {
  goalId:           string;
  returnedAmount:   number;
  returnAccountId?: string;
  closedAt:         string;            // ISO 8601
}

export interface WidgetGoalSummary {
  id:           string;
  name:         string;
  icon?:        string;
  progressPct:  number;
}

export interface SavingsWidget {
  activeGoalsCount:    number;
  totalReserved:       number;
  totalTarget:         number;
  globalProgressPct:   number;
  topGoals:            WidgetGoalSummary[];
}

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface CreateGoalRequest {
  name:             string;            // 1..100
  targetAmount:     number;             // 100..500000
  targetDate:       string;             // YYYY-MM-DD (>= hoy + 30 días)
  category:         GoalCategory;
  customCategory?:  string;             // <=50
  icon?:            string;             // <=30
  color?:           string;             // <=10
  sourceAccountId?: string;
}

export interface UpdateGoalRequest {
  name?:         string;
  targetAmount?: number;
  targetDate?:   string;
  status?:       GoalStatus;            // solo ACTIVE / PAUSED via PUT
}

export interface ContributeRequest {
  amount:           number;             // 10..5000
  sourceAccountId:  string;
}

export interface AutoRuleRequest {
  amount:           number;             // 10..5000
  dayOfMonth:       number;             // 1..28
  sourceAccountId:  string;
}

// ---------------------------------------------------------------------------
// Paginación (formato Spring Data Page<T>)
// ---------------------------------------------------------------------------

export interface Page<T> {
  content:           T[];
  totalElements:     number;
  totalPages:        number;
  number:            number;            // página actual (0-based)
  size:              number;
  first:             boolean;
  last:              boolean;
}

// ---------------------------------------------------------------------------
// Diccionarios UX (RN-F024-07)
// ---------------------------------------------------------------------------

export const GOAL_CATEGORY_ICON: Record<GoalCategory, string> = {
  VIAJE:      'flight',
  HOGAR:      'home',
  VEHICULO:   'directions_car',
  EMERGENCIA: 'health_and_safety',
  EDUCACION:  'school',
  OTROS:      'savings'
};

export const GOAL_CATEGORY_COLOR: Record<GoalCategory, string> = {
  VIAJE:      '#0ea5e9',
  HOGAR:      '#84cc16',
  VEHICULO:   '#f59e0b',
  EMERGENCIA: '#ef4444',
  EDUCACION:  '#a855f7',
  OTROS:      '#64748b'
};

export const GOAL_CATEGORY_LABEL: Record<GoalCategory, string> = {
  VIAJE:      'Viaje',
  HOGAR:      'Hogar',
  VEHICULO:   'Vehículo',
  EMERGENCIA: 'Emergencia',
  EDUCACION:  'Educación',
  OTROS:      'Otros'
};

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  ACTIVE:    'Activo',
  PAUSED:    'Pausado',
  CLOSED:    'Cerrado',
  COMPLETED: 'Completado'
};
