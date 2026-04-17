// environment.prod.ts — BankPortal STG/Prod
// LA-STG-002 (2026-04-01): añadidos campos version, sprint, envLabel
// Actualizado Sprint 25 FEAT-023 v1.25.0
// apiUrl vacío → nginx proxy maneja /api y /auth hacia el backend
export const environment = {
  production: true,
  apiUrl: '',
  otpInputLength: 6,
  preAuthTokenSessionKey: 'bank_pre_auth',
  version: '1.25.0',
  sprint: 25,
  envLabel: 'PRD'
};
