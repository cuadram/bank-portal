# ADR-009 — Clave dual HMAC para rotación de trust tokens sin ventana de impacto

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-009 |
| **Deuda** | DEBT-006 |
| **Sprint** | 5 · 2026-05-12 |
| **Estado** | Propuesto → Pendiente aprobación Tech Lead |
| **Relacionado** | ADR-008 (trust token cookie HttpOnly), FEAT-003 US-201/203 |

---

## Contexto

`MarkDeviceAsTrustedUseCase` y `ValidateTrustedDeviceUseCase` firman y verifican
trust tokens con HMAC-SHA256 usando una única clave (`TRUSTED_DEVICE_HMAC_KEY`).

Cuando se rota esta clave por razones de seguridad (rotación preventiva cada 30–90 días
o rotación de emergencia ante compromiso), todos los trust tokens activos quedan
inmediatamente inválidos. El usuario pierde su sesión de dispositivo confiable sin aviso
y debe reautenticarse con OTP en el siguiente login. En un banco con usuarios que se
conectan diariamente, esto genera tickets de soporte y erosiona la confianza en la
plataforma.

El problema fue detectado en QA Sprint 4 (WARN-F3-001) y registrado como DEBT-006.

---

## Decisión

**Clave dual con ventana de gracia de 30 días.**

El sistema mantiene dos claves HMAC simultáneas:

| Variable | Rol | Operación |
|---|---|---|
| `TRUSTED_DEVICE_HMAC_KEY` | Clave activa | Sign + Verify |
| `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS` | Clave anterior | Verify only (durante gracia) |

### Algoritmo de verificación (orden de prioridad)

```
1. Intentar verificar el token con HMAC_KEY (clave activa)
   → OK: aceptar, actualizar lastUsedAt, retornar true

2. Si falla Y HMAC_KEY_PREVIOUS no está vacía:
   Intentar verificar con HMAC_KEY_PREVIOUS (clave anterior)
   → OK: aceptar (token aún válido en ventana de gracia), retornar true
         + loguear TRUSTED_DEVICE_GRACE_VERIFY en audit_log

3. Si ambas fallan:
   → Solicitar OTP (comportamiento estándar)
```

### Protocolo de rotación operativa

```
Paso 1: Generar NEW_KEY = openssl rand -hex 32
Paso 2: PREVIOUS_KEY = valor actual de HMAC_KEY
Paso 3: Actualizar secrets:
          TRUSTED_DEVICE_HMAC_KEY          = NEW_KEY
          TRUSTED_DEVICE_HMAC_KEY_PREVIOUS = PREVIOUS_KEY
Paso 4: Rolling restart del deployment
Paso 5: Smoke test — login con dispositivo de confianza existente (debe funcionar)
Paso 6: Tras 30 días: vaciar TRUSTED_DEVICE_HMAC_KEY_PREVIOUS
```

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Clave dual con ventana de gracia 30 días** ✅ | Sin impacto en UX · Rotación operativa sencilla · Ventana finita (no acumula claves indefinidamente) · Patrón estándar en industria (JWT kid rotation) | Dos verificaciones HMAC por login (overhead O(1), insignificante) · Requiere un segundo secret en K8s |
| Invalidar todos los tokens y notificar | Limpio · Sin complejidad adicional | Impacto UX masivo · Tickets de soporte · Erosión de confianza |
| Ventana de gracia basada en tiempo de emisión del token | Muy preciso | Requiere parsear el payload del token en cada verificación · Mayor complejidad |
| Refresh tokens para trust (renovar firma automáticamente) | Más robusto a largo plazo | Sobre-ingeniería para el problema actual · Introduce estado adicional en BD |
| Redis para lista de tokens a re-firmar | Migración elegante | Complejidad operativa alta · Redis como dependencia crítica adicional para este flujo |

---

## Consecuencias

### Positivas
- Rotación de clave sin impacto en usuarios activos — todos los trust tokens siguen siendo válidos durante la ventana de gracia.
- Ventana de 30 días se alinea con el TTL natural de los trust tokens — al cabo de 30 días, todos los tokens habrán expirado o se habrán renovado con la nueva clave.
- Un único secret adicional (`TRUSTED_DEVICE_HMAC_KEY_PREVIOUS`) — bajo overhead operativo.
- Auditable: `TRUSTED_DEVICE_GRACE_VERIFY` en audit_log da visibilidad de cuántos tokens siguen usando la clave anterior durante la transición.

### Trade-offs
- Dos verificaciones HMAC en el peor caso (token emitido con clave anterior, durante ventana de gracia). El overhead es O(1) y submicrosegundo — completamente negligible.
- Si `HMAC_KEY_PREVIOUS` no se vacía tras 30 días, la ventana de gracia se extiende indefinidamente. El runbook de rotación debe incluir el paso de vaciado. Registrado como riesgo operativo R-S5-004.

### Cambios en código
- `ValidateTrustedDeviceUseCase`: añadir método `verifyWithFallback(token, fingerprint)` que intenta ambas claves.
- `application.yml`: nueva propiedad `trusted-device.hmac-key-previous`.
- `README-CREDENTIALS.md`: documentado (ya actualizado en Sprint 5 día 1).

### Cambios en infraestructura
- K8s Secret `bankportal-trusted-device-secrets`: nuevo campo `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS`.
- Jenkins Credentials: nuevo `bankportal-trusted-device-hmac-key-previous` (vacío en instalación nueva).

---

## Impacto en seguridad

| Escenario | Análisis |
|---|---|
| Clave activa comprometida | Rotar inmediatamente → tokens emitidos con clave comprometida dejan de ser válidos tras 30 días de gracia. La ventana de gracia es un riesgo aceptable dado que el attacker necesitaría también el fingerprint del dispositivo (ADR-008). |
| Clave anterior comprometida | Ya no se usa para sign. Solo para verify durante 30 días. Al vencimiento, ya no aplica. |
| Atacante con token válido y clave anterior | El fingerprint binding (ADR-008) sigue siendo el control primario — sin el fingerprint correcto el token no pasa la verificación. |

**Conclusión:** la clave dual no degrada el nivel de seguridad — la defensa principal sigue siendo el binding al fingerprint del dispositivo (ADR-008). La clave HMAC es un control secundario que previene forgery.

---

## Riesgo nuevo

| ID | Descripción | Mitigación |
|---|---|---|
| R-S5-004 | `HMAC_KEY_PREVIOUS` no vaciada tras 30 días → ventana de gracia se extiende | Añadir al runbook de rotación el paso explícito de vaciado + alerta de monitorización si `TRUSTED_DEVICE_GRACE_VERIFY` sigue apareciendo en audit_log tras 35 días |

---

*Generado por SOFIA Architect Agent · BankPortal · DEBT-006 · Sprint 5 · 2026-05-12*
*🔒 GATE: aprobación Tech Lead requerida antes de iniciar DEBT-006*
