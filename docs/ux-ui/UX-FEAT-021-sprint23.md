# UX/UI Design — FEAT-021 Depósitos a Plazo Fijo · Sprint 23
**Versión:** 1.0 · **Fecha:** 2026-04-06  
**Agente:** UX/UI Designer Agent v2.0 · **SOFIA v2.7**  
**Sprint:** 23 | **Feature:** FEAT-021  
**Prototipo:** docs/ux-ui/prototypes/PROTO-FEAT-021-sprint23.html  
**Estado:** PENDIENTE APROBACIÓN PO+TL

---

## 1. Resumen de Diseño

FEAT-021 introduce el módulo de Depósitos a Plazo Fijo. El reto UX central es **convertir un producto financiero percibido como complejo** (TIN, TAE, IRPF, FGD) en una experiencia clara y de confianza para el usuario de Banco Meridian. La estrategia de diseño se apoya en tres pilares:

1. **Progresividad:** Simulador público sin fricción → apertura autenticada con pasos cortos.
2. **Transparencia fiscal:** Cuadro IRPF visible antes de contratar, no después.
3. **Seguridad percibida:** Badge FGD + confirmación 2FA como señales de confianza.

**Flujos principales:** 3 (Consulta, Simulación→Apertura, Gestión post-contratación)  
**Pantallas:** 11 (lista, detalle, simulador, apertura ×3 pasos, renovación, cancelación, vacío, loading, error)

---

## 2. Actores y Contexto de Uso

| Actor | Contexto | Dispositivo prioritario | Auth |
|---|---|---|---|
| Cliente Banco Meridian | Revisa posición de ahorro | Desktop / Mobile web | JWT |
| Visitante (captación) | Evalúa rentabilidad antes de contratar | Desktop | No |
| Cliente post-contratación | Gestiona renovación o cancela | Desktop | JWT + 2FA |

**Pain points identificados:**
- IRPF: los usuarios no saben qué retención les corresponde → mostrar cálculo automático
- FGD: mayoría ignora el límite de 100.000€ → badge informativo con tooltip
- Cancelación anticipada: miedo a penalización desconocida → mostrar importe exacto antes de confirmar

---

## 3. User Flows

### Flujo A — Simulación + Apertura (US-F021-03 + US-F021-04)
```
[Acceso a /deposits] → [Ver simulador público]
  → Introduce importe + plazo
  → Sistema calcula TIN/TAE/IRPF en tiempo real
  → [¿Autenticado?]
      NO → Botón "Contratar" → Redirect login → Vuelta al simulador
      SÍ → Paso 1 Apertura (datos cuenta origen)
           → Paso 2 OTP (verificación 2FA)
           → Confirmación resumen
           → POST /deposits → Éxito
```

### Flujo B — Gestión de renovación (US-F021-05)
```
[Lista depósitos] → [Seleccionar depósito ACTIVE]
  → [Detalle] → Sección "Al vencimiento"
  → Selector: RENEW_AUTO | RENEW_MANUAL | CANCEL_AT_MATURITY
  → PATCH /deposits/{id}/renewal → Toast confirmación
```

### Flujo C — Cancelación anticipada (US-F021-06)
```
[Detalle depósito] → [Botón "Cancelar depósito"]
  → Modal: Resumen penalización (importe exacto)
  → [Confirmar] → Input OTP
  → POST /deposits/{id}/cancel → Éxito / Error
```

---

## 4. Arquitectura de Información

```
/deposits                       ← Lista paginada (US-F021-01)
/deposits/simulate              ← Simulador público (US-F021-03)
/deposits/:id                   ← Detalle + IRPF (US-F021-02)
/deposits/new                   ← Apertura paso 1 (US-F021-04)
/deposits/new/confirm           ← Apertura paso 2 + OTP
/deposits/:id/renewal           ← Modal renovación inline (US-F021-05)
/deposits/:id/cancel            ← Modal cancelación inline (US-F021-06)
```

**Sidebar:** Ítem "🏦 Depósitos" bajo grupo "Ahorro" — nuevo grupo en sidebar.

---

## 5. Wireframes (pantallas clave)

### P1 — Lista de depósitos
```
┌─────────────────────────────────────────────────────────┐
│  BankPortal                              👤 Juan García  │
├─────────────────────────────────────────────────────────┤
│ [Sidebar]  │  🏦 Mis Depósitos                [Simular] │
│ Inicio     ├─────────────────────────────────────────── │
│ Cuentas    │  ┌─ Tarjeta depósito ──────────────────┐  │
│ ▶ Depósitos│  │ Depósito 12 meses   ACTIVO  🛡FGD   │  │
│ Tarjetas   │  │ 10.000,00 €   TIN 3,25%   TAE 3,30% │  │
│            │  │ Apertura 01/04/26 · Vence 01/04/27  │  │
│            │  │              [Ver detalle]           │  │
│            │  └─────────────────────────────────────┘  │
│            │  ┌─ Tarjeta depósito ──────────────────┐  │
│            │  │ Depósito 6 meses    VENCIDO          │  │
│            │  │  5.000,00 €   Vencido 01/01/26       │  │
│            │  │              [Ver detalle]           │  │
│            │  └─────────────────────────────────────┘  │
│            │                            [+ Nuevo depósito]│
└─────────────────────────────────────────────────────────┘
NOTA: Cards en lugar de tabla — más scannable en mobile.
Badge 🛡FGD solo si importe ≤ 100.000€ (RN-F021-05).
```

### P2 — Simulador (sin autenticación)
```
┌─────────────────────────────────────────────────────────┐
│  BankPortal                   [Simulador de Depósitos]  │
├─────────────────────────────────────────────────────────┤
│  ¿Cuánto quieres depositar?                             │
│  ┌────────────────────────────┐  Plazo (meses)          │
│  │  10.000 €                  │  ┌──────────────┐       │
│  └────────────────────────────┘  │  12 meses    │       │
│                                  └──────────────┘       │
│  ──────────────────────────────────────────────────     │
│  💰 Resultado estimado                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TIN 3,25%  ·  TAE 3,30%                        │   │
│  │  Intereses brutos          325,00 €              │   │
│  │  Retención IRPF (19%)      -61,75 €              │   │
│  │  ─────────────────────────────────────           │   │
│  │  Intereses netos           263,25 €              │   │
│  │  Importe total vencimiento 10.263,25 €           │   │
│  └─────────────────────────────────────────────────┘   │
│  🛡 Cubierto por el FGD hasta 100.000€ por titular     │
│                    [Contratar este depósito ──────────] │
└─────────────────────────────────────────────────────────┘
NOTA: Cálculo en tiempo real (debounce 300ms). Sin llamada API.
Botón "Contratar" → redirect login si no autenticado.
```

### P3 — Detalle + Cuadro IRPF
```
┌─────────────────────────────────────────────────────────┐
│  ◀ Volver   Depósito 12 meses               [ACTIVO 🟢]│
├─────────────────────────────────────────────────────────┤
│  ┌──── Datos del depósito ──────┐  ┌─ Cuadro fiscal ─┐ │
│  │ Importe:   10.000,00 €       │  │ Intereses brutos │ │
│  │ TIN:       3,25%             │  │    325,00 €      │ │
│  │ TAE:       3,30%             │  │                  │ │
│  │ Apertura:  01/04/2026        │  │ IRPF (19%)       │ │
│  │ Vencimiento: 01/04/2027      │  │    -61,75 €      │ │
│  │ Renovación: RENEW_MANUAL [✏] │  │ ─────────────    │ │
│  └──────────────────────────────┘  │ Netos: 263,25 €  │ │
│                                    └──────────────────┘ │
│  ──────────────────────────────────────────────────     │
│  [Modificar renovación]          [Cancelar depósito]    │
└─────────────────────────────────────────────────────────┘
NOTA: Selector de renovación editable inline (no navega a otra página).
Botón cancelar → modal con penalización antes de confirmar (RN-F021-09).
```

---

## 6. Inventario de Componentes Angular

| Componente | Tipo | Descripción |
|---|---|---|
| `DepositListComponent` | Container | Lista cards + filtros estado |
| `DepositCardComponent` | Presentational | Card individual, @Input: deposit |
| `DepositDetailComponent` | Container | Detalle + cuadro IRPF + acciones |
| `DepositSimulatorComponent` | Smart | Cálculo reactivo sin API (FEAT-021-C) |
| `DepositApplicationComponent` | Smart | Stepper 2 pasos + OTP |
| `RenewalSelectorComponent` | Presentational | Inline selector 3 opciones |
| `CancelDepositDialogComponent` | Overlay | Modal con penalización + OTP |
| `IrpfTableComponent` | Presentational | Cuadro fiscal reutilizable |
| `FgdBadgeComponent` | Presentational | Badge FGD con tooltip informativo |

**Ruta lazy en AppRoutingModule:**
```typescript
{ path: 'deposits', loadChildren: () =>
    import('./features/deposits/deposits.module').then(m => m.DepositsModule) }
```

---

## 7. Especificaciones de Formularios

### Formulario Simulador
| Campo | Tipo | Validación | Error |
|---|---|---|---|
| importe | number | min 1000, required | "Mínimo 1.000€" |
| plazo | select | 1-60, required | "Plazo entre 1 y 60 meses" |

### Formulario Apertura (Paso 1)
| Campo | Tipo | Validación | Error |
|---|---|---|---|
| cuentaOrigenId | select | required | "Selecciona una cuenta de origen" |
| importe | number (readonly) | — | — (viene del simulador) |
| plazo | number (readonly) | — | — (viene del simulador) |

### Formulario OTP (Paso 2)
| Campo | Tipo | Validación | Error |
|---|---|---|---|
| otp | text | 6 dígitos, required | "Código OTP de 6 dígitos" / "OTP incorrecto" |

---

## 8. Design Tokens específicos FEAT-021

```scss
// Depósitos — tokens específicos
--deposit-active:    var(--color-success);       // #00897B
--deposit-matured:   var(--color-text-disabled);  // #9CA3AF
--deposit-cancelled: var(--color-error);          // #E53935
--deposit-fgd-bg:    #E8F4FD;
--deposit-fgd-color: #1565C0;
--deposit-irpf-bg:   #FFF8E1;
--irpf-tramo-1:      #1B5E99; // 19% hasta 6.000€
--irpf-tramo-2:      #E65100; // 21% hasta 50.000€
--irpf-tramo-3:      #B71C1C; // 23% superior
```

---

## 9. Accesibilidad WCAG 2.1 AA

```
[✅] Contraste: azul primario (#1B5E99) sobre blanco = 5.8:1 ✓
[✅] Navegación teclado: tab order Lista → Card → Ver detalle → Acciones
[✅] FGD badge: aria-label="Cubierto por Fondo de Garantía de Depósitos hasta 100.000€"
[✅] IRPF tooltip: role="tooltip" + aria-describedby en el trigger
[✅] Formulario simulador: labels con for/id asociados
[✅] OTP input: autocomplete="one-time-code", inputmode="numeric"
[✅] Modal cancelación: focus trap + Escape para cerrar + aria-modal="true"
[✅] Estados loading: aria-busy="true" en contenedor de lista
[✅] Errores inline: role="alert" en mensajes de validación
[✅] Botones acción destructiva: texto "Cancelar depósito" — no solo icono
```

---

## 10. Microinteracciones

| Acción | Feedback | Duración |
|---|---|---|
| Cambio importe/plazo en simulador | Recálculo inmediato (debounce 300ms) | 300ms |
| Submit apertura | Spinner en botón + disabled | Hasta respuesta |
| OTP correcto | Checkmark animado → éxito | 600ms |
| OTP incorrecto | Shake animation en input + error inline | 400ms |
| Depósito creado | Toast verde 4s + confetti sutil | 4000ms |
| Cancelación exitosa | Toast naranja + badge CANCELLED | 4000ms |
| Hover card depósito | Elevación sombra (shadow-card → shadow-modal) | 200ms |

---

## 11. Responsive Design

| Breakpoint | Adaptación |
|---|---|
| Mobile < 480px | Cards full-width, stepper vertical, simulador stack vertical |
| Tablet 480-768px | 1 columna, cuadro IRPF debajo de datos |
| Desktop > 768px | Grid 2 columnas (datos + cuadro IRPF), cards side-by-side |

---

## 12. Prototipo Visual

**Ruta:** `docs/ux-ui/prototypes/PROTO-FEAT-021-sprint23.html`

**Pantallas incluidas (11):**
1. Lista de depósitos (con datos)
2. Lista vacía (sin depósitos)
3. Lista loading (skeleton)
4. Simulador público
5. Detalle + cuadro IRPF
6. Apertura Paso 1 — Datos e importe
7. Apertura Paso 2 — Confirmación + OTP
8. Apertura Éxito
9. Modal renovación vencimiento
10. Modal cancelación anticipada
11. Error de carga

**Flujos navegables:**
- Simulador → Apertura → OTP → Éxito
- Lista → Detalle → Renovación
- Lista → Detalle → Cancelación

---

## 13. Criterios de Aceptación UX

| US | Criterio UX | Test |
|---|---|---|
| US-F021-01 | Cards muestran importe, TIN, TAE, vencimiento y estado | Visual regression |
| US-F021-01 | Badge FGD visible solo si importe ≤ 100.000€ | Conditional render |
| US-F021-02 | Cuadro IRPF muestra tramo aplicado + importe neto | Cálculo correcto |
| US-F021-03 | Simulador calcula en tiempo real al cambiar importe/plazo | UX test debounce |
| US-F021-03 | Sin autenticación: "Contratar" redirige a login | Navigation test |
| US-F021-04 | Stepper 2 pasos con estado completado visible | Visual test |
| US-F021-04 | OTP shake animation en error | Interaction test |
| US-F021-05 | Selector renovación inline (sin cambio de ruta) | UX test |
| US-F021-06 | Modal muestra penalización exacta antes de confirmar | Pre-confirmation test |
| WCAG | Contraste ≥ 4.5:1 en todos los textos | Automated a11y |

---

*Generado por UX/UI Designer Agent v2.0 — SOFIA v2.7 — Sprint 23 — 2026-04-06*
