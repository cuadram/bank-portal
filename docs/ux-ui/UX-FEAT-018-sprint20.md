# UX Design Document
## FEAT-018: Exportación de Movimientos Bancarios (PDF/CSV)
**Sprint:** 20 | **SOFIA Step:** 2c — UX/UI Designer | **Versión:** 1.0  
**Fecha:** 2026-03-30 | **Gate:** HITL-PO-TL (pendiente)  

---

## 1. Análisis de usuarios y contexto

### Actores
- **Usuario titular** — Usuario B2C, acceso mobile-first o desktop. Nivel técnico medio-bajo.
- **Administrador** — Personal Banco Meridian. Acceso a audit log. Desktop.

### Pain points identificados
- Usuarios no saben qué rango de fechas producirá un resultado manejable → **Preview count obligatorio**
- La exportación PDF puede tardar → **Feedback visual de progreso**
- PAN enmascarado puede generar confusión ("¿es mi tarjeta?") → **Alias visible + últimos 4**
- GDPR: usuarios pueden no entender para qué sirve el audit log → **Tooltip informativo**

### Contexto de uso
- **Web desktop:** Panel de movimientos, botón "Exportar" en toolbar superior derecha
- **Mobile web:** Bottom sheet con opciones de exportación
- Flujo modal: no navega fuera de la vista de movimientos

---

## 2. Flujo de usuario

```
[Vista Movimientos]
       │
       ▼
[Click "Exportar movimientos"] ──→ [Panel lateral / Modal Filtros]
                                          │
                              ┌───────────┴───────────┐
                              │  Selección de filtros   │
                              │  • Tipo movimiento      │
                              │  • Rango fechas         │
                              │  • Cuenta/IBAN          │
                              └───────────┬───────────┘
                                          │
                                          ▼
                                  [Preview Count]
                                  "Se exportarán 47 movimientos"
                                          │
                              ┌───────────┴───────────┐
                              │    Selección formato    │
                              │    [PDF]    [CSV]       │
                              └───────────┬───────────┘
                                          │
                                          ▼
                                  [Generando...] (loader)
                                          │
                              ┌───────────┴───────────┐
                              │   Descarga automática  │
                              │   Toast: "Descargado"  │
                              └────────────────────────┘
```

---

## 3. Componentes de pantalla

### 3.1 Botón de acción — Toolbar de movimientos
- Botón secundario: icono descarga + texto "Exportar"
- Posición: toolbar superior derecha de la lista de movimientos
- Accesible: `aria-label="Exportar movimientos de la cuenta"`

### 3.2 Panel de filtros (modal/side panel)
- **Título:** "Exportar movimientos"
- **Campo Cuenta:** Dropdown con IBANs del usuario (pre-seleccionado la cuenta activa)
- **Tipo de movimiento:** Chips seleccionables múltiples (TODOS seleccionado por defecto)
- **Rango fechas:** Date range picker con restricción: mínimo = hoy − 12 meses, máximo = hoy
- **Preview counter:** Chip informativo actualizado en tiempo real: "47 registros seleccionados"
  - Si > 500: chip en color warning + mensaje "Reduce el rango para exportar"

### 3.3 Selector de formato
- Dos botones de toggle: `PDF` | `CSV`
- Iconos diferenciadores: 📄 PDF / 📊 CSV
- Texto helper debajo: "PDF — extracto oficial · CSV — compatible con Excel"

### 3.4 Estados de carga y error
- **Generando:** Spinner + texto "Generando tu extracto..."
- **Éxito:** Toast verde "Extracto descargado correctamente"
- **Error > 500 registros:** Inline error en el date picker "Selecciona un rango menor (máx. 500 registros)"
- **Error red:** Toast rojo "Error al generar el extracto. Inténtalo de nuevo."

---

## 4. Design tokens aplicados (Design System Banco Meridian)

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#1B3E7E` | Botón exportar, header modal |
| `--color-success` | `#2E7D32` | Toast éxito |
| `--color-warning` | `#E65100` | Preview > 500 registros |
| `--color-error` | `#C62828` | Toast error |
| `--font-body` | `Inter 14px/1.5` | Texto filtros |
| `--radius-card` | `12px` | Panel filtros |
| `--elevation-modal` | `box-shadow 0 8px 32px rgba(0,0,0,0.16)` | Modal |

---

## 5. Accesibilidad (WCAG 2.1 AA)

| Elemento | Requisito | Implementación |
|---|---|---|
| Botón exportar | Contraste ≥ 4.5:1 | Texto blanco sobre `#1B3E7E` → ratio 8.1:1 ✅ |
| Date picker | Navegable por teclado | Angular Material DatePicker nativo ✅ |
| Modal | Focus trap | `cdkTrapFocus` en el panel ✅ |
| Toast | Anunciado a lector pantalla | `role="alert" aria-live="polite"` ✅ |
| Preview counter | Descripción comprensible | `aria-label="47 registros seleccionados para exportar"` ✅ |

---

## 6. Criterios de aceptación UX

| # | Criterio |
|---|---|
| UX-01 | El panel de filtros se abre en < 200ms (sin petición de red) |
| UX-02 | El preview count se actualiza al cambiar cualquier filtro (debounce 300ms) |
| UX-03 | La descarga comienza automáticamente sin redirección de página |
| UX-04 | El modal se cierra con Escape y el foco vuelve al botón que lo abrió |
| UX-05 | En mobile, el panel ocupa el 85% del viewport (bottom sheet) |
| UX-06 | El estado de error > 500 registros desactiva el botón de exportación |

---

*Generado por SOFIA v2.3 · UX/UI Designer Agent · Step 2c · Sprint 20 · 2026-03-30*  
*Gate HITL-PO-TL: pendiente de aprobación conjunta PO + Tech Lead*
