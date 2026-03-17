# QA Report - Sprint 7 Semana 2
# US-602 Desbloqueo por email + US-603 Login contextual
# SOFIA QA Agent - BankPortal - 2026-03-17

## Resumen ejecutivo

| Metrica | Valor |
|---|---|
| User Stories validadas | US-602, US-603 |
| Story Points cubiertos | 8 SP (3+5) |
| Tests unitarios nuevos | 17 |
| Tests integracion web IT | 9 (5+4) |
| Tests Angular unitarios | 6 ContextConfirmComponent |
| Tests E2E Playwright | 11 (5+6) |
| Total tests Semana 2 | 43 |
| Defectos criticos | 0 |
| Estado | PASS apto Gate 5 DevOps |

## US-602 Desbloqueo por email 3 SP - 18 escenarios PASS

R-SEC-004 anti-enumeration POST 204 siempre OK
R-SEC-005 token single-use OK
R-F6-002 TTL 1h ADR-007 OK
R-SEC-006 invalida tokens anteriores OK

## US-603 Login contextual 5 SP - 25 escenarios PASS

ADR-011 scope=context-pending segregado OK
Claim pendingSubnet en JWT OK
Sealed interface ContextEvaluationResult OK
Token TTL 30min single-use OK
known_subnets persistencia OK
userId ownership verificado OK
WCAG 2.1 aria-live OK

## PCI-DSS 4.0 req 8.3.4

Sin user enumeration OK - Token unlock single-use OK
Token confirm single-use OK - scope segregado OK
userId ownership OK - Auditoria completa OK

## Veredicto Gate 4

US-602 + US-603 APROBADO. 43 tests, 0 defectos.
