export interface LoanSummary {
  id: string;
  tipo: 'PERSONAL' | 'VEHICULO' | 'REFORMA';
  importeOriginal: number;
  importePendiente: number;
  cuotaMensual: number;
  tae: number;
  estado: LoanStatus;
  proximaCuota: string;
}

export interface LoanDetail extends LoanSummary {
  plazo: number;
  costeTotal: number;
  interesesTotales: number;
  fechaInicio: string;
  fechaFin: string;
  amortizacion: AmortizationRow[];
}

export type LoanStatus = 'ACTIVE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID_OFF' | 'CANCELLED';

export interface SimulateRequest {
  importe: number;
  plazo: number;
  finalidad: string;
}

export interface SimulationResponse {
  cuotaMensual: number;
  tae: number;
  costeTotal: number;
  interesesTotales: number;
  schedule: AmortizationRow[];
}

export interface ApplyLoanRequest {
  importe: number;
  plazo: number;
  finalidad: string;
  otpCode: string;
}

export interface LoanApplicationResponse {
  id: string;
  estado: string;
  mensaje: string;
}

export interface AmortizationRow {
  n: number;
  fecha: string;
  capital: number;
  intereses: number;
  cuotaTotal: number;
  saldoPendiente: number;
}
