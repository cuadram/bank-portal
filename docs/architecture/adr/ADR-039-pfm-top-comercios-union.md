# ADR-039 — Top comercios: unificación transactions + bill_payments (cierra DEBT-047)
## Estado: Propuesto | Feature: FEAT-023 | Fecha: 2026-04-16
## Decisión: TransactionReadAdapter.findTopMerchants() ejecuta UNION query nativo SQL sobre transactions.concept y bill_payments.biller_name. Extrae primer token >4 chars como nombre normalizado. Excluye AEAT/TGSS/SUMA y transferencias internas.
## Consecuencia: Cierra DEBT-047. Query nativo para control total sobre extracción de tokens.
