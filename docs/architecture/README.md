# Arquitectura — BankPortal / Banco Meridian · ADR log + índice de sprint

> Índice ligero de decisiones de arquitectura (ADR) y artefactos de diseño por sprint.
> Generado/actualizado en Step 3b del pipeline SOFIA. Última actualización: 2026-06-01.

## Convención de numeración ADR
- **Serie canónica:** `docs/architecture/adr/` — ADR continuos (001–044). **Los ADR nuevos van aquí.**
- **Histórico:** `docs/architecture/hld/` contiene ADR-015–020 (ubicación previa, antes de migrar a `adr/`).
- **Raíz `docs/architecture/`:** algunos ADR antiguos y pares (p. ej. ADR-023-024, ADR-034-035) por motivos históricos.
- **Siguiente número libre: ADR-045.**
- Antes de crear un ADR, verificar el máximo en las tres ubicaciones (no solo `hld/`).

## Índice por sprint

### Sprint 27 — Saneamiento + deudas (sin FEAT nueva)
- **SRS:** `docs/requirements/SRS-S27-saneamiento-sprint27.md` (8 REQ verificables)
- **Diseño (TDN):** `docs/architecture/TDN-S27-saneamiento-sprint27.md`
- **ADR-043** — GR-CONFIG-001: merge profundo de perfiles YAML (`adr/ADR-043-yaml-profile-deep-merge.md`) · DEBT-054 / REQ-S27-04
- **ADR-044** — Estrategia de IT: perfil integration-compose (`adr/ADR-044-integration-compose-test-strategy.md`) · DEBT-064 / REQ-S27-02
- Sin cambios de contrato OpenAPI. HLD/LLD vigentes (S1–S26) sin cambio estructural (modulith).

## ADR log (completo)
| ADR | Título | Ubicación |
|---|---|---|
| ADR-001 | totp library | `adr/` |
| ADR-002 | preauth token | `adr/` |
| ADR-003 | aes256 totp secret | `adr/` |
| ADR-004 | audit log immutable | `adr/` |
| ADR-005 | jwt rsa256 | `adr/` |
| ADR-006 | session blacklist redis | `adr/` |
| ADR-007 | hmac deny link | `adr/` |
| ADR-008 | trust token cookie | `adr/` |
| ADR-009 | dual hmac key rotation | `adr/` |
| ADR-010 | sse cors cdn proxy | `adr/` |
| ADR-011 | jwt context pending scope | `(raíz)/` |
| ADR-011 | context pending jwt scope | `adr/` |
| ADR-012 | sse registry pool | `adr/` |
| ADR-014 | redis pubsub sse | `adr/` |
| ADR-015 | jwt rs256 migration | `hld/` |
| ADR-016 | transfer saga pattern | `hld/` |
| ADR-017 | resilience4j core integration | `hld/` |
| ADR-018 | bucket4j rate limiting | `hld/` |
| ADR-019 | dashboard cache strategy | `hld/` |
| ADR-020 | export strategy | `hld/` |
| ADR-021 | password history table | `adr/` |
| ADR-022 | jti revocation hybrid | `adr/` |
| ADR-023 | kyc document storage | `adr/` |
| ADR-023-024 | 024 KYC | `(raíz)/` |
| ADR-024 | kyc validation sync vs async | `adr/` |
| ADR-025 | vapid vs fcm | `adr/` |
| ADR-026 | shedlock deferred | `adr/` |
| ADR-027 | no edit amount recurrent | `adr/` |
| ADR-028 | shedlock scheduler | `adr/` |
| ADR-029 | sepa mandate storage | `adr/` |
| ADR-030-031 | 031 export pdf strategy | `adr/` |
| ADR-032-033 | 033 privacy decisions | `adr/` |
| ADR-034-035 | 035 FEAT 020 sprint22 | `(raíz)/` |
| ADR-036-037 | 037 FEAT 021 sprint23 | `(raíz)/` |
| ADR-037 | pfm categorizacion consulta | `adr/` |
| ADR-038 | pfm budget month varchar | `adr/` |
| ADR-038-039 | 039 FEAT 022 sprint24 | `(raíz)/` |
| ADR-039 | pfm top comercios union | `adr/` |
| ADR-040 | savings segregacion virtual alpha | `adr/` |
| ADR-041 | savings scheduled shedlock | `adr/` |
| ADR-042 | openapi springdoc 2.3 | `adr/` |
| ADR-043 | yaml profile deep merge | `adr/` |
| ADR-044 | integration compose test strategy | `adr/` |
| ADR-FEAT-001 | 001 | `(raíz)/` |
