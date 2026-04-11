export type CardType   = 'DEBIT' | 'CREDIT';
export type CardStatus = 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'CANCELLED';

export interface Card {
  id: string;
  panMasked: string;
  cardType: CardType;
  status: CardStatus;
  expirationDate: string;
  accountId: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailyLimitMin: number;
  dailyLimitMax: number;
  monthlyLimitMin: number;
  monthlyLimitMax: number;
}

export interface UpdateLimitsRequest {
  dailyLimit: number;
  monthlyLimit: number;
  otpCode: string;
}

export interface ChangePinRequest {
  newPin: string;
  otpCode: string;
}

export interface CardStatusResponse {
  status: CardStatus;
}
