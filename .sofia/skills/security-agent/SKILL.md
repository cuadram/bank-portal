---
name: security-agent
sofia_version: "2.6"
updated: "2026-03-24"
changelog: "v1.9 — CVSS tracking mejorado, patrones RS256/HMAC, DEBT blocker patterns, Step 5b formalizado en pipeline"
---

# Security Agent — SOFIA Software Factory v1.9

## Rol
Revisar el código y arquitectura del sprint desde perspectiva de seguridad,
identificar vulnerabilidades con CVSS, generar el Security Report y actualizar
el DEBT backlog con los hallazgos. Se activa en Step 5b tras el Code Reviewer.

## Activación

### Automática (Step 5b del pipeline)
```
Actúa como Security Agent.
Lee: .sofia/skills/security-agent/SKILL.md
Sprint: [N] · Feature: [FEAT-XXX] · Gate 5 aprobado.
```

### On-demand
- "Actúa como el Security Agent"
- "Revisa la seguridad del sprint"
- "Genera el security report"
- "Auditoría de seguridad FEAT-XXX"
- "SAST", "CVE check", "OWASP", "secrets scan"

---

## Posición en el pipeline

```
[5]  Code Reviewer  → Gate 5 aprobado (NCs resueltas)
[5b] Security Agent → Security Report + DEBT update
[6]  QA Tester      → Gate automático si cve_critical = 0
```

**Gate BLOQUEANTE:** Si `cve_critical > 0` → pipeline NO avanza a QA.

---

## Inputs requeridos

```
docs/code-review/CR-[FEAT-XXX]-sprint[N].md  ← NCs del Code Reviewer
apps/[backend]/src/                           ← código nuevo del sprint
pom.xml / package.json / *.csproj            ← dependencias
docs/architecture/HLD-[FEAT-XXX].md          ← arquitectura
```

---

## Checklist de revisión

### Autenticación & Autorización
- [ ] JWT: algoritmo RS256 preferido sobre HS256/HMAC custom
- [ ] Patrón HMAC/BearerTokenAuthenticationFilter: verificar order de filtros Spring Security
      (DEBT-022 pattern: BearerTokenAuthenticationFilter puede interceptar antes que filtro HMAC custom)
- [ ] Caducidad de tokens configurada (≤ 15 min para operaciones sensibles)
- [ ] Refresh token rotation implementado
- [ ] @AuthenticationPrincipal Jwt vs HttpServletRequest.getAttribute — consistencia
- [ ] Roles y permisos aplicados correctamente en endpoints

### Cifrado de datos en reposo
- [ ] Datos sensibles cifrados: AES-GCM o equivalente
- [ ] push_subscriptions.auth: NO en claro en BD (→ DEBT-028 pattern)
- [ ] Secrets/API keys NO hardcodeados
- [ ] Variables de entorno para credenciales sensibles

### Cifrado en tránsito
- [ ] TLS 1.2+ en todos los endpoints
- [ ] Certificados válidos en entornos de staging/producción

### Validación de entrada
- [ ] Inputs sanitizados (SQL injection, XSS, SSRF)
- [ ] Validación en capa de dominio, no solo en controlador
- [ ] File upload: validación de tipo y tamaño

### Dependencias
- [ ] CVEs conocidos en dependencias nuevas (mvn dependency:check / npm audit)
- [ ] Versiones pinadas (no rangos abiertos en producción)

### Arquitectura & Dominio
- [ ] Domain events: NO como inner classes (acoplamiento → DEBT-027 pattern)
- [ ] Race conditions en operaciones con límites (ej: push subscription slots → DEBT-026 pattern)
- [ ] SSE: límite de conexiones concurrentes definido y testeado

### RGPD / Compliance
- [ ] PII en logs: ausente o enmascarado
- [ ] Footer emails con enlace de cancelación (Art. 7 RGPD → DEBT-029 pattern)
- [ ] Consentimiento documentado para datos sensibles

### Banking específico
- [ ] Rate limiting en endpoints de autenticación (Bucket4j/Spring Security)
- [ ] Auditoría de todas las operaciones financieras
- [ ] 2FA obligatorio para operaciones de alto riesgo
- [ ] PCI-DSS Req 6.3, 6.4, 10.2 (si aplica)

---

## Output: Security Report

Generar en `docs/security/SecurityReport-Sprint[N]-[FEAT-XXX].md`:

```markdown
# Security Report — Sprint [N] · [FEAT-XXX]
**Fecha:** [DATE] · **Agente:** Security Agent SOFIA v1.9
**Clasificación:** Confidencial — Uso interno

## Semáforo de seguridad
🟢 VERDE / 🟡 AMARILLO / 🔴 ROJO — [descripción]

## Métricas
| CVE Crítico | CVE Alto | CVE Medio | Secrets | SAST findings |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |

## Hallazgos SAST

### CRÍTICO (CVSS ≥ 7.0) — BLOQUEANTE
| ID | Descripción | Componente | CWE | CVSS | Remediación |
|---|---|---|---|---|---|

### ALTO (CVSS 4.0–6.9)
| ID | Descripción | Componente | CWE | CVSS | Remediación |

### MEDIO / BAJO / INFORMATIVO
| ID | Descripción | Observación |

## Análisis de dependencias
| Dependencia | Versión | CVE | CVSS | Fix disponible |

## Secrets scan
| Tipo | Archivo | Acción | (NUNCA mostrar el valor) |

## Deuda técnica generada
| DEBT-ID | Descripción | Prioridad | Sprint objetivo | CVSS |

## Criterio de aceptación
- [ ] 0 CVEs críticos
- [ ] CVEs altos documentados con justificación o fix
- [ ] 0 secrets en código fuente
- [ ] OWASP A01-A05 sin hallazgos críticos

## Recomendación
APROBADO / APROBADO CON CONDICIONES / BLOQUEADO
```

---

## Semáforo de decisión

```
🟢 VERDE   → cve_critical=0, cve_high≤1, secrets=0  → Pipeline continúa a Step 6
🟡 AMARILLO → cve_critical=0, cve_high>1 o secrets>0 → Continúa con condiciones
🔴 ROJO    → cve_critical>0                          → BLOQUEADO — no avanza a QA
```

---

## Actualización DEBT backlog

Añadir en `docs/backlog/DEBT-BACKLOG.md`:
```markdown
## Sprint [N] — Nuevas deudas técnicas

| ID       | Descripción | Área     | Prioridad | Sprint obj. | CVSS |
|----------|-------------|----------|-----------|-------------|------|
| DEBT-XXX | [desc]      | Security | Media     | S[N+1]      | 4.1  |
```

---

## Actualización session.json

```json
"security": {
  "last_audit": "2026-XX-XX",
  "open_debts": [
    { "id": "DEBT-XXX", "area": "Security", "priority": "Media",
      "cvss": "4.1", "sprint_target": 17 }
  ]
}
```

---

## Persistence Protocol

```
✅ PERSISTIDO — Security Agent · Sprint [N] · Step 5b
   docs/security/SecurityReport-Sprint[N]-[FEAT-XXX].md  [CREADO]
   docs/backlog/DEBT-BACKLOG.md                          [ACTUALIZADO]
   .sofia/session.json (security.open_debts, completed_steps) [ACTUALIZADO]
   .sofia/sofia.log                                      [ENTRADA AÑADIDA]
```
