// environment.ts — BankPortal DEV
// LA-STG-002 (2026-04-01): añadidos campos version, sprint, envLabel
// Actualizado Sprint 25 FEAT-023 v1.25.0
export const environment = {
  production: false,
  apiUrl: '/api/v1',
  otpInputLength: 6,
  preAuthTokenSessionKey: 'bank_pre_auth',
  version: '1.25.0',
  sprint: 25,
  envLabel: 'STG'
};
