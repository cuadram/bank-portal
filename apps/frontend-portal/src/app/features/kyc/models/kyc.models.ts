// kyc.models.ts — FEAT-013 Sprint 15
export type KycStatus = 'NONE' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type DocumentType = 'DNI' | 'NIE' | 'PASSPORT';
export type DocumentSide = 'FRONT' | 'BACK';

export interface KycStatusResponse {
  userId: string;
  status: KycStatus;
  submittedAt: string | null;
  rejectionReason: string | null;
  kycWizardUrl: string;
  estimatedReviewHours: number;
}

export interface DocumentUploadResponse {
  documentId: string;
  kycStatus: KycStatus;
}

export interface KycWizardState {
  step: number;
  documentType: DocumentType | null;
  frontFile: File | null;
  backFile: File | null;
  uploading: boolean;
  error: string | null;
  kycStatus: KycStatus | null;
}
