// environment.ts — BankPortal DEV
// FIX RV-F019-03 (LA-019-09): sincronizado con environment.prod.ts
// Campos otpInputLength y preAuthTokenSessionKey añadidos para evitar
// comportamiento undefined en desarrollo vs producción.
export const environment = {
  production: false,
  apiUrl: '/api/v1',
  otpInputLength: 6,
  preAuthTokenSessionKey: 'bank_pre_auth'
};
