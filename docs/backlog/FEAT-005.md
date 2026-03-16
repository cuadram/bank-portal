# FEAT-005 — Panel de Auditoría de Seguridad

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-005 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Seguridad y Control de Acceso |
| Solicitante | Seguridad TI + Compliance — Banco Meridian |
| Fecha creación | 2026-05-23 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Rama git | `feature/FEAT-005-security-audit-panel` |

---

## Descripción de negocio

Con FEAT-001 (2FA), FEAT-002 (Sesiones), FEAT-003 (Dispositivos) y FEAT-004
(Notificaciones) operativos, el portal genera un volumen creciente de eventos de
seguridad auditados en `audit_log`. Estos eventos son actualmente visibles solo para
el equipo técnico vía BD directa.

FEAT-005 da al usuario final acceso a su propio historial de auditoría de seguridad:
un dashboard con resumen visual de actividad, exportación de registros para revisión
personal o requerimientos legales, y una pantalla unificada de configuración de todas
sus preferencias de seguridad.

Esto cubre el requisito PCI-DSS 4.0 req. 10.7 (acceso del titular al historial de
actividad de su cuenta) y reduce la fricción de soporte al permitir que el usuario
verifique su propia actividad antes de escalar un incidente.

---

## Objetivo y valor de negocio

- **Transparencia**: el usuario ve exactamente qué acciones de seguridad ocurrieron en su cuenta
- **Autoservicio compliance**: el usuario puede generar evidencia de sus propias acciones para auditorías internas o requerimientos legales
- **Configuración centralizada**: una sola pantalla para gestionar todos los aspectos de seguridad en lugar de navegar entre múltiples paneles
- **Cumplimiento PCI-DSS 4.0 req. 10.7**: titular de la cuenta puede consultar el historial de actividad de seguridad
- **KPI**: reducción del 20% en tickets de soporte relacionados con "¿qué pasó con mi cuenta?"

---

## Alcance funcional

### Incluido en FEAT-005
- Dashboard de seguridad con resumen visual de actividad (últimos 30 días)
- Exportación del historial de eventos de seguridad en PDF y CSV
- Pantalla unificada de preferencias de seguridad (2FA, sesiones, dispositivos, notificaciones)

### Excluido (backlog futuro)
- Análisis de comportamiento con ML — backlog largo plazo
- Alertas de fraude automáticas — backlog largo plazo
- Geolocalización física precisa — GDPR pendiente
- Dashboard administrativo para el equipo de seguridad del banco — FEAT-006+

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| `audit_log` tabla inmutable (V4) | BD | ✅ Disponible |
| FEAT-001/002/003 eventos en audit_log | Código | ✅ Operativos |
| `user_notifications` tabla (V7) | BD | ✅ v1.4.0 PROD |
| `NotificationService` integrada con FEAT-001/002/003 | Código | ⏳ Sprint 6 (FEAT-004 cont.) |
| Generación de PDF (iText / OpenPDF) | Librería | ⏳ Sprint 6 |

---

## User Stories

| ID | Título | SP | Prioridad |
|---|---|---|---|
| US-401 | Dashboard de seguridad con resumen de actividad | 4 | Must Have |
| US-402 | Exportar historial de eventos en PDF y CSV | 3 | Must Have |
| US-403 | Pantalla unificada de preferencias de seguridad | 3 | Should Have |

**Total estimado: 10 SP** (Sprint 6 arranca con US-401/402/403)

---

### US-401 — Dashboard de seguridad

**Como** usuario autenticado,
**quiero** ver un resumen visual de la actividad de seguridad de mi cuenta en los últimos 30 días,
**para** detectar patrones inusuales o confirmar que todo está en orden.

**Estimación:** 4 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Vista general del dashboard
  Dado que accedo a "Seguridad → Panel de auditoría"
  Cuando la página carga
  Entonces veo tarjetas resumen con:
    - Total de logins en los últimos 30 días
    - Número de sesiones activas actuales
    - Dispositivos de confianza registrados
    - Notificaciones no leídas
  Y veo un gráfico de actividad diaria (barras) de los últimos 30 días

Escenario 2: Historial de eventos recientes
  Dado que estoy en el dashboard de seguridad
  Cuando cargo la sección "Actividad reciente"
  Entonces veo los últimos 10 eventos del audit_log del usuario
  Con: tipo de evento, fecha, dispositivo e IP enmascarada

Escenario 3: Estado global de seguridad
  Dado que el usuario tiene 2FA activo, 1 sesión activa y 2 dispositivos de confianza
  Cuando veo el panel de estado
  Entonces cada ítem tiene un indicador de estado (verde/ámbar/rojo)
  Y el estado global de la cuenta es "Segura" / "Revisar" / "Alerta"
```

---

### US-402 — Exportar historial de seguridad

**Como** usuario autenticado,
**quiero** exportar mi historial de eventos de seguridad en PDF o CSV,
**para** tener evidencia de las actividades de seguridad de mi cuenta.

**Estimación:** 3 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Exportar en PDF
  Dado que accedo a "Panel de auditoría → Exportar"
  Cuando selecciono formato PDF y rango de fechas (últimos 30 / 60 / 90 días)
  Entonces se genera un PDF con:
    - Cabecera con logo Banco Meridian, nombre del usuario y período
    - Tabla de eventos: fecha, tipo, descripción, dispositivo, IP enmascarada
    - Pie de página con fecha de generación y hash de integridad SHA-256
  Y el PDF se descarga directamente en el navegador

Escenario 2: Exportar en CSV
  Dado que selecciono formato CSV
  Cuando confirmo la exportación
  Entonces se descarga un CSV con los mismos campos que el PDF
  Y el CSV incluye cabeceras de columna en la primera fila

Escenario 3: Rango sin eventos
  Dado que selecciono un rango donde no hay eventos
  Cuando confirmo la exportación
  Entonces recibo HTTP 204 con mensaje "No hay eventos en el rango seleccionado"
```

---

### US-403 — Preferencias de seguridad unificadas

**Como** usuario autenticado,
**quiero** gestionar todas mis preferencias de seguridad desde una sola pantalla,
**para** no tener que navegar entre múltiples secciones para configurar mi seguridad.

**Estimación:** 3 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Vista unificada de configuración
  Dado que accedo a "Seguridad → Preferencias"
  Cuando la página carga
  Entonces veo secciones colapsables para:
    - 2FA (estado + enlace a gestión)
    - Timeout de sesión (selector 15/30/60 min — US-103)
    - Dispositivos de confianza (conteo + enlace a gestión)
    - Preferencias de notificaciones (activar/desactivar por tipo de evento)
  Y cada sección muestra el estado actual sin tener que navegar

Escenario 2: Cambiar preferencia de notificaciones
  Dado que desactivo las notificaciones de "Acceso desde dispositivo de confianza"
  Cuando guardo los cambios
  Entonces TRUSTED_DEVICE_LOGIN ya no genera notificaciones visibles
  Y audit_log sigue registrando el evento (no se puede desactivar la auditoría)

Escenario 3: Estado de seguridad visible en preferencias
  Dado que el usuario no tiene 2FA activo
  Cuando ve la sección 2FA
  Entonces el estado muestra "⚠️ 2FA desactivado — se recomienda activarlo"
  Y hay un botón directo "Activar 2FA" sin salir de la pantalla
```

---

## Riesgos FEAT-005

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F5-001 | Generación de PDF síncrona bloquea el response thread con exportaciones grandes | M | B | 🟢 Baja | Generar PDF en @Async + streaming response; timeout de 30s |
| R-F5-002 | Hash de integridad en PDF — el usuario podría no saber cómo verificarlo | B | B | 🟢 Baja | Incluir en el PDF instrucciones para verificar con `sha256sum` |
| R-F5-003 | Preferencias de notificaciones desactivan eventos relevantes — gap PCI-DSS | M | M | 🟡 Media | Separar preferencia de notificación visible del registro en audit_log (siempre activo) |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio
- [x] 3 US con criterios Gherkin completos
- [x] Estimación en SP: 10 SP
- [x] Dependencias identificadas (audit_log ✅, FEAT-004 cont. ⏳)
- [x] Riesgos documentados con mitigación
- [x] Stack confirmado: Java/Spring Boot + Angular + OpenPDF/iText

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 6 Planning · 2026-05-26*
