# Sprint 14 — Planning

## Metadata CMMI (PP SP 2.1)

| Campo | Valor |
|---|---|
| Sprint | 14 |
| Feature principal | DEBT-022 + RV-013..017 + FEAT-012 (inicio) |
| Sprint Goal | Desbloquear STG eliminando el 403 en todos los endpoints (DEBT-022), sanear la deuda técnica de código post-Sprint-13, e iniciar FEAT-012 |
| Período | 2026-03-23 → 2026-04-06 (14 días) |
| Capacidad | 24 SP |
| Release objetivo | v1.14.0 |
| Rama | `feature/FEAT-012-sprint14` |
| Jira Epic | pendiente — Gate 1 |

---

## Velocidad y capacidad (PP SP 2.2)

| Sprint | SP | Feature |
|---|---|---|
| Sprint 11 | 20 | FEAT-009 Core real + Pagos |
| Sprint 12 | 24 | FEAT-010 Dashboard backend |
| Sprint 13 | 24 | FEAT-011 Frontend Angular + Exportación |
| **Sprint 14** | **24** | **DEBT-022 + RV-013..017 + FEAT-012** |
| Media 13 sprints | ~23.6 | — |

---

## Análisis DEBT-022 — Root Cause & Solución

### Problema
`spring-boot-starter-oauth2-resource-server` auto-configura `BearerTokenAuthenticationFilter`
que intercepta **antes** que el `JwtAuthenticationFilter` HMAC HS256 custom del proyecto.
Resultado: HTTP 403 en todos los endpoints protegidos en STG.

### Opciones evaluadas

| Opción | Descripción | Complejidad | Riesgo |
|---|---|---|---|
| A | Configurar `JwtDecoder` bean HS256 nativo (NimbusJwtDecoder.withSecretKey) | Baja | Bajo |
| B | Migrar a RS256 (keypair) | Media | Medio — requiere rotar secretos en STG |
| C | `HttpServletRequest.getAttribute` en todos los controllers | Alta (tocado 8+ controllers) | Alto — hack frágil |

### Solución elegida: **Opción A**
Reemplazar `JwtAuthenticationFilter` custom por configuración estándar de Spring Security 6:
```java
@Bean
JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withSecretKey(
        new SecretKeySpec(secret.getBytes(), "HmacSHA256")
    ).build();
}

// SecurityConfig:
http.oauth2ResourceServer(jwt -> jwt.decoder(jwtDecoder()))
    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS));
```
- Elimina `JwtAuthenticationFilter` y su `OncePerRequestFilter`
- `@AuthenticationPrincipal Jwt` funciona nativamente
- `BearerTokenAuthenticationFilter` pasa a ser el único filtro JWT — no hay conflicto
- Zero cambios en controllers

---

## Sprint Backlog

| # | ID | Título | Tipo | SP | Prioridad | Semana |
|---|---|---|---|---|---|---|
| 1 | DEBT-022 | Fix 403 STG: NimbusJwtDecoder HS256 nativo | Tech Debt | 5 | CRÍTICO — Bloqueante STG | S1 día 1 |
| 2 | RV-015 | `@Transactional(readOnly=true)` en DashboardExportUseCase | Tech Debt | 1 | Must Have | S1 |
| 3 | RV-016 | `takeUntilDestroyed()` en DashboardComponent | Tech Debt | 2 | Must Have | S1 |
| 4 | RV-013 | catch específico en PdfReportGenerator | Tech Debt | 1 | Should Have | S1 |
| 5 | RV-014 | catch específico en ExcelReportGenerator | Tech Debt | 1 | Should Have | S1 |
| 6 | RV-017 | JWT exp check en AuthGuard | Tech Debt | 1 | Should Have | S1 |
| 7 | US-1201 | FEAT-012: [pendiente definición PO] | Feature | 13 | Must Have | S2 |
| | | **TOTAL** | | **24** | | |

> US-1201..USxx serán definidos por Requirements Analyst una vez aprobado el Gate 1
> y confirmada la feature por el PO.

---

## Distribución semanal

### Semana 1 — 11 SP · Deuda técnica 100% saldada
- **Día 1:** DEBT-022 (5 SP) — Fix STG bloqueante
- **Día 2-3:** RV-015 + RV-016 (3 SP) — transaccionalidad + memory leak Angular
- **Día 4-5:** RV-013 + RV-014 + RV-017 (3 SP) — catch específico + JWT exp

### Semana 2 — 13 SP · FEAT-012 inicio
- US-1201..USxx según definición aprobada en Gate 1

---

## Criterios de aceptación mínimos (DoD)

- [ ] DEBT-022: Todos los endpoints responden 200 en STG con Bearer token válido
- [ ] DEBT-022: Test de integración IT con token HS256 generado por `JwtTestUtils`
- [ ] RV-015: `@Transactional(readOnly=true)` verificado en DashboardExportUseCaseTest
- [ ] RV-016: Sin memory leaks en DashboardComponent (Angular `DestroyRef`)
- [ ] RV-013/014: catch tipado compila y cubre `DocumentException`, `IOException`
- [ ] RV-017: `AuthGuard.canActivate()` decodifica `exp` y redirige si vencido
- [ ] 0 regresiones en suite existente (≥143 tests passing)
- [ ] Rama `feature/FEAT-012-sprint14` creada desde `develop`

---

## Riesgos Sprint 14

| ID | Descripción | Prob | Impacto | Respuesta |
|---|---|---|---|---|
| R-S14-01 | NimbusJwtDecoder con HS256 requiere secret ≥256 bits; secret actual puede ser corto | M | A | Verificar longitud en Day 1; si es corto rotar en STG con backward compat |
| R-S14-02 | `@AuthenticationPrincipal Jwt` mapea claims diferentes a los del `JwtAuthenticationFilter` custom | M | M | Verificar claim `sub` vs `userId` en todos los controllers que lo usen |
| R-S14-03 | FEAT-012 no definida puede bloquear la Semana 2 | M | M | Gate 1 requiere confirmación del PO sobre el scope; si no hay definición se usa capacidad para DEBT adicional |

---

## Retrospectiva Sprint 13 — Acciones incorporadas

| Acción | Aplicada en S14 |
|---|---|
| Build Angular `application` (esbuild) verificado en CI | ✅ — Jenkinsfile actualizado en S13 |
| Seed SQL de datos de prueba documentado | ✅ — `scripts/seed-test-data.sql` en repo |
| DEBT-022 identificado y priorizado como CRÍTICO | ✅ — primer item del backlog |

---

## Definición de FEAT-012 (pendiente confirmación PO)

Candidatos identificados en roadmap BankPortal:

| Candidato | Descripción | SP estimado |
|---|---|---|
| FEAT-012-A | Gestión de perfil de usuario (datos personales + cambio de contraseña) | 13 |
| FEAT-012-B | Notificaciones push/email (alertas de movimiento, presupuesto) | 15 |
| FEAT-012-C | Historial de extractos descargables (PDF mensual) | 11 |
| FEAT-012-D | Gestión de tarjetas (activar/bloquear, ver límites) | 13 |

**Recomendación SM:** FEAT-012-A — Gestión de perfil — menor complejidad técnica,
alta visibilidad para el usuario, bloquea pocos otros flows.

---

*SOFIA Scrum Master Agent — Step 1 Gate 1 pending*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1*
*BankPortal Sprint 14 — 2026-03-23*
