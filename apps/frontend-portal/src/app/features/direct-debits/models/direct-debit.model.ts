/** FEAT-017 Sprint 19 */
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
}

export interface DirectDebitPage {
  content: DirectDebit[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface DebitFilterParams {
  status?: DebitStatus;
  from?: string;
  to?: string;
  mandateId?: string;
  page?: number;
  size?: number;
}
