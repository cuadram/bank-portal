// environment.prod.ts — BankPortal STG/Prod
// LA-STG-002 (2026-04-01): añadidos campos version, sprint, envLabel
// apiUrl vacío → nginx proxy maneja /api y /auth hacia el backend
export const environment = {
  production: true,
  apiUrl: '',
  otpInputLength: 6,
  preAuthTokenSessionKey: 'bank_pre_auth',
  version: '1.21.0',
  sprint: 21,
  envLabel: 'PRD'
};
