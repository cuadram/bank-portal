// environment.ts — BankPortal DEV
// LA-STG-002 (2026-04-01): añadidos campos version, sprint, envLabel
// FIX RV-F019-03 (LA-019-09): sincronizado con environment.prod.ts
export const environment = {
  production: false,
  apiUrl: '/api/v1',
  otpInputLength: 6,
  preAuthTokenSessionKey: 'bank_pre_auth',
  version: '1.21.0',
  sprint: 21,
  envLabel: 'STG'
};
