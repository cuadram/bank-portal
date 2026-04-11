# Security Report — FEAT-021: Depositos a Plazo Fijo
**Sprint 23 · BankPortal · Banco Meridian · Security Agent · SOFIA v2.7**
**Fecha:** 2026-04-09 | **Semaforo:** GREEN | **CVE Criticos:** 0 | **CVE High:** 0

---

## Resumen ejecutivo

| Metrica           | Resultado |
|-------------------|-----------|
| CVE Criticos      | 0         |
| CVE High          | 0         |
| CVE Medium        | 0         |
| SAST Bloqueantes  | 0         |
| SAST Menores      | 1         |
| PCI-DSS           | CONFORME  |
| GDPR              | CONFORME  |
| PSD2/SCA          | CONFORME  |

**Semaforo: GREEN — pipeline auto-avanza a QA.**

---

## Analisis SAST

**SEC-F021-01** [Menor] DepositApplicationFormComponent: el campo `cuentaOrigenId` tiene UUID de prueba
hardcodeado como valor por defecto en el formulario Angular. En produccion deberia cargarse
dinamicamente desde el listado de cuentas del usuario.
Estado: ACEPTADO en STG. Registrar DEBT-045 para sprint siguiente.

---

## Verificaciones regulatorias

### PSD2 — Autenticacion reforzada (SCA)

- [x] OpenDepositUseCase: OtpValidationUseCase.validate() invocado ANTES de persistir
- [x] CancelDepositUseCase: OtpValidationUseCase.validate() invocado ANTES de cancelar
- [x] DepositExceptionHandler: InvalidOtpException -> HTTP 401 (no 500)
- [x] Umbral SCA: toda operacion que implique movimiento de fondos requiere OTP (RN-F021-08)

### IRPF / Ley 35/2006

- [x] IrpfRetentionCalculator: tramos 19/21/23% correctos segun Art.25 vigente
- [x] BigDecimal HALF_EVEN en todos los calculos fiscales (cero error de redondeo)
- [x] Cuadro de liquidacion expuesto en GET /deposits/{id}

### FGD / RDL 16/2011

- [x] Badge FGD mostrado correctamente para depositos <= 100.000 EUR (RN-F021-05)
- [x] Limite FGD no superable en logica de negocio backend (ListDepositsUseCase)

### PCI-DSS v4

- [x] DEBT-037 CLOSED: CardPanValidator con regex ^[0-9]{13,19}$ + Luhn (CWE-20)
- [x] Sin PAN en logs ni en audit trail de depositos

### OWASP Top 10

- [x] A01 Broken Access Control: verificacion userId en todos los use cases con datos de usuario
- [x] A03 Injection: parametros JPA evitan SQL injection
- [x] A07 Auth Failures: OTP requerido para apertura y cancelacion, InvalidOtpException -> 401

### GDPR

- [x] Datos de deposito ligados a userId — no se exponen cross-user
- [x] Sin PII innecesaria en logs de CoreBankingMockDepositClient

---

## DEBT-039 (absorbida) y deudas de seguridad

| Deuda | Estado |
|---|---|
| DEBT-037 Regex PAN Maestro 19d | CLOSED Sprint 23 |
| DEBT-036 IBAN real ExportAudit | CLOSED (verificado en codigo) |

*Security Agent — SOFIA v2.7 — Sprint 23 — 2026-04-09*
