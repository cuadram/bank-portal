export type BizumStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED' | 'ACTIVE' | 'INACTIVE';

export interface BizumActivation {
  phoneMasked: string;
  activatedAt: string;
  status: string;
}

export interface BizumPayment {
  id: string;
  type: string;
  amount: number;
  phoneMasked: string;
  concept: string;
  status: BizumStatus;
  timestamp: string;
}

export interface BizumRequest {
  id: string;
  amount: number;
  phoneMasked: string;
  concept: string;
  status: BizumStatus;
  expiresAt: string;
}

export interface BizumStatus_Resp {
  active: boolean;
  phoneMasked: string;
  dailyUsed: number;
  dailyLimit: number;
  perOperationLimit: number;
}

export interface SendPaymentRequest { recipientPhone: string; amount: number; concept: string; otp: string; }
export interface RequestMoneyRequest { recipientPhone: string; amount: number; concept: string; }
export interface ResolveRequestRequest { action: 'ACCEPTED' | 'REJECTED'; otp?: string; }
