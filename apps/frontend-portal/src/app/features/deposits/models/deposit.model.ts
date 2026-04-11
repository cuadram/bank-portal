export type DepositStatus      = 'ACTIVE' | 'MATURED' | 'CANCELLED';
export type RenewalInstruction = 'RENEW_AUTO' | 'RENEW_MANUAL' | 'CANCEL_AT_MATURITY';

export interface Deposit {
  id: string;
  importe: number;
  plazoMeses: number;
  tin: number;
  tae: number;
  estado: DepositStatus;
  renovacion: RenewalInstruction;
  cuentaOrigenId: string;
  fechaApertura: string;
  fechaVencimiento: string;
  penalizacion?: number;
  fgdCovered?: boolean;
  // Campos de detalle fiscal (DepositDetailDTO backend)
  interesesBrutos?: number;
  retencionIrpf?: number;
  interesesNetos?: number;
  totalVencimiento?: number;
  createdAt?: string;
}

export interface SimulateRequest   { importe: number; plazoMeses: number; }
export interface SimulationResponse {
  tin: number; tae: number;
  interesesBrutos: number; retencionIrpf: number;
  interesesNetos: number;  totalVencimiento: number;
}
export interface OpenDepositRequest {
  importe: number; plazoMeses: number;
  cuentaOrigenId: string; renovacion: RenewalInstruction; otp: string;
}
export interface CancellationResult {
  importeAbonado: number; penalizacion: number; interesesDevengados: number;
}
export interface Page<T> {
  content: T[]; totalElements: number; totalPages: number; number: number;
}
