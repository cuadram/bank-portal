# FEAT-013 — Onboarding KYC / Verificación de Identidad

## Metadata

| Campo | Valor |
|---|---|
| ID | FEAT-013 |
| Tipo | new-feature |
| Sprint | 15 |
| SP | 21 |
| Release | v1.15.0 |
| Jira Epic | SCRUM-36 |

## Descripción

Implementar el flujo completo de verificación de identidad (KYC) para nuevos
clientes de Banco Meridian. Cumplimiento PSD2 + AML Directive EU 2018/843 + RGPD.

## User Stories

| US | SP | Prioridad |
|---|---|---|
| US-1301 Modelo de datos KYC + Flyway V15 | 3 | Must Have |
| US-1302 API subida documentos | 3 | Must Have |
| US-1303 Validación automática básica | 2 | Must Have |
| US-1304 Estado KYC y notificaciones | 3 | Must Have |
| US-1305 Guard acceso financiero (KYC_REQUIRED) | 2 | Must Have |
| US-1306 Frontend KYC wizard Angular | 5 | Must Have |
| US-1307 Admin endpoint revisión manual | 3 | Should Have |

## Normativa aplicable
- PSD2 (Payment Services Directive 2)
- AML Directive EU 2018/843 (Anti-Money Laundering)
- RGPD Art.9 (datos biométricos/identidad)
- Banco de España: Circular 1/2010 identificación clientes
