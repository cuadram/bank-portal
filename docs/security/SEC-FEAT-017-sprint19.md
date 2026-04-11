# Security Audit Report - FEAT-017 - Sprint 19

**BankPortal - Banco Meridian - SOFIA v2.2**

| Campo | Valor |
|---|---|
| Feature | FEAT-017 Domiciliaciones y Recibos SEPA |
| Sprint | 19 |
| Auditado por | Security Agent - SOFIA v2.2 |
| Fecha | 2026-03-27T13:40:26.933646Z |
| Semaforo | GREEN |
| CVE criticos | 0 |
| CVE altos | 0 |
| SAST findings bloqueantes | 0 |

---

## OWASP Top 10 - Evaluacion FEAT-017

| OWASP | Riesgo | Control implementado | Estado |
|---|---|---|---|
| A01 Broken Access Control | Alto | findByIdAndUserId() ownership check en todos los endpoints | PASS |
| A02 Cryptographic Failures | Medio | IBAN no es dato PCI - no requiere cifrado adicional | PASS |
| A03 Injection | Alto | Spring Data JPA con PreparedStatement - no SQL raw | PASS |
| A04 Insecure Design | Medio | OTP obligatorio en operaciones write (alta/baja) | PASS |
| A05 Security Misconfiguration | Medio | @ResponseStatus en excepciones - no leak de stack traces | PASS |
| A06 Vulnerable Components | Bajo | Bucket4j iban4j - librerias validadas en sprints anteriores | PASS |
| A07 Auth Failures | Alto | JWT Bearer en todos los endpoints + OTP 2FA en writes | PASS |
| A08 Software Integrity | Bajo | Flyway V19 firmada y versionada | PASS |
| A09 Logging Failures | Medio | Audit log MANDATE_CREATED/CANCELLED con userId + IP | PASS |
| A10 SSRF | Bajo | No hay llamadas a URLs externas en el nuevo modulo | PASS |

---

## PCI-DSS 4.0 - Verificacion DEBT-031

| Requisito | Descripcion | Estado |
|---|---|---|
| Req 8.3.6 | Limite intentos autenticacion | PASS - Bucket4j 3 intentos/hora /cards/pin |
| Req 8.3.4 | Bloqueo cuenta tras intentos fallidos | PASS - 429 + bloqueo temporal 24h |
| Req 10.2.1 | Audit log eventos seguridad | PASS - PIN_RATE_LIMIT_EXCEEDED en audit |

---

## Verificaciones SEPA/PSD2

| Control | Descripcion | Estado |
|---|---|---|
| SCA PSD2 | OTP obligatorio en alta y cancelacion mandato | PASS |
| Isolation | Usuario solo ve sus propios mandatos y recibos | PASS |
| D-2 Rule | Bloqueo cancelacion PSD2 Art.80 implementado | PASS |
| Audit trail | MANDATE_CREATED MANDATE_CANCELLED con timestamp + IP | PASS |
| RGPD Art.17 | Datos en BD propia - control borrado independiente | PASS |

---

## SAST - Analisis estatico

| Finding | Severidad | Descripcion | Estado |
|---|---|---|---|
| SA-017-01 | INFO | SimulaCobroJob Math.random() - no criptografico | Aceptado - MVP |
| SA-017-02 | INFO | accountId placeholder en Angular component | Deferred RV-F017-02 |

**0 findings bloqueantes. 0 CVE criticos. Semaforo GREEN.**

---

## Riesgos residuales Sprint 19

| ID | Descripcion | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|---|
| R-019-01 | Validacion IBAN - casos edge paises poco comunes SEPA | Baja | Bajo | IbanValidator cubre 34 paises EPC |
| R-019-02 | SimulaCobro en STG genera estados inconsistentes | Media | Bajo | Job activo solo en DEV/STG - no en PRD |

---

*Security Agent - CMMI RSKM SP 1.1 2.1 - SOFIA v2.2 - BankPortal - Sprint 19*