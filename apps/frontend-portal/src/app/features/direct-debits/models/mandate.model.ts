/** FEAT-017 Sprint 19 */
export type MandateStatus = 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
export type MandateType = 'CORE' | 'B2B';

export interface Mandate {
  id: string;
  accountId: string;
  creditorName: string;
  creditorIban: string;
  mandateRef: string;
  mandateType: MandateType;
  status: MandateStatus;
  signedAt: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface MandatePage {
  content: Mandate[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface CreateMandateRequest {
  creditorName: string;
  creditorIban: string;
  accountId: string;
  otp: string;
}

export type DebitStatus = 'PENDING' | 'CHARGED' | 'RETURNED' | 'REJECTED';

export interface DirectDebit {
  id: string;
  mandateId: string;
  amount: number;
  currency: string;
  status: DebitStatus;
  dueDate: string;
  chargedAt?: string;
  returnReason?: string;
  createdAt: string;
}

export interface DirectDebitPage {
  content: DirectDebit[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface DebitFilterParams {
  status?: DebitStatus;
  page?: number;
  size?: number;
}
