# UX Design System — BankPortal · Banco Meridian
**Versión:** 1.0  
**Creado:** 2026-03-28  
**Agente:** UX/UI Designer Agent v1.0  
**Estado:** ACTIVO — Referencia canónica para todos los sprints

---

## 1. Principios de Diseño

### 1.1 Pilares

| Pilar | Descripción | Aplicación |
|-------|-------------|-----------|
| **Confianza** | La banca requiere comunicar seguridad y solidez | Azul corporativo, iconografía seria, textos directos |
| **Claridad** | El usuario debe entender qué hace en cada paso | Labels descriptivos, mensajes sin jerga técnica |
| **Seguridad** | Operaciones sensibles requieren fricción intencional | Pasos de confirmación, enmascarado de datos |
| **Accesibilidad** | WCAG 2.1 AA obligatorio por regulación bancaria | Contraste ≥ 4.5:1, navegación teclado, ARIA |
| **Eficiencia** | El usuario completa tareas en el mínimo de pasos | Máximo 3 pasos en flujos principales, autofill |

---

## 2. Design Tokens

### 2.1 Paleta de colores

```scss
// === COLORES PRIMARIOS ===
$color-primary-900: #0D3E6E;    // Texto sobre fondo primario
$color-primary-700: #1B5E99;    // Color primario principal (botones, links)
$color-primary-500: #2E7BC4;    // Hover / active primario
$color-primary-100: #E3F0FB;    // Background primario suave (chips activos)
$color-primary-50:  #F0F7FF;    // Background seleccionado

// === COLORES DE ACENTO (Éxito / Acción secundaria) ===
$color-accent-700: #00695C;     // Texto sobre fondo accent
$color-accent-500: #00897B;     // Accent principal
$color-accent-100: #E0F2F1;     // Background accent suave

// === ADVERTENCIAS Y ERRORES ===
$color-warn-700:   #C62828;     // Error crítico / texto sobre warn light
$color-warn-500:   #E53935;     // Error estándar
$color-warn-100:   #FFEBEE;     // Background error
$color-warn-50:    #FFF5F5;     // Background error muy suave

// === ALERTAS / INFO ===
$color-info-700:   #1565C0;     // Info oscuro
$color-info-500:   #1976D2;     // Info estándar
$color-info-100:   #E3F2FD;     // Background info

// === AMARILLO / ADVERTENCIA ===
$color-amber-700:  #F57F17;     // Advertencia
$color-amber-100:  #FFF8E1;     // Background advertencia

// === NEUTROS ===
$color-neutral-900: #1A2332;    // Texto principal (headings)
$color-neutral-700: #374151;    // Texto body
$color-neutral-600: #4A5568;    // Texto secundario
$color-neutral-500: #6B7280;    // Texto placeholder / helper
$color-neutral-400: #9CA3AF;    // Texto deshabilitado
$color-neutral-300: #D1D5DB;    // Bordes input
$color-neutral-200: #E8ECF0;    // Bordes separadores
$color-neutral-100: #F5F7FA;    // Background cards
$color-neutral-50:  #F9FAFB;    // Background de página
$color-white:       #FFFFFF;    // Blanco

// === OVERLAY ===
$color-overlay-light: rgba(255,255,255,0.9);
$color-overlay-dark:  rgba(26,35,50,0.6);
```

### 2.2 Tipografía

```scss
// Font family
$font-family-base:    'Inter', 'Roboto', sans-serif;
$font-family-mono:    'JetBrains Mono', 'Courier New', monospace;  // Para IBANs, cuentas

// Scale tipográfica
$font-display-1:  32px / 40px / 700;    // Títulos de página principales
$font-display-2:  24px / 32px / 600;    // Títulos de sección
$font-heading-1:  20px / 28px / 600;    // Headings dentro de card
$font-heading-2:  18px / 26px / 600;    // Sub-headings
$font-heading-3:  16px / 24px / 600;    // Labels de sección
$font-body-lg:    16px / 24px / 400;    // Body texto importante
$font-body:       14px / 22px / 400;    // Body estándar
$font-body-sm:    13px / 20px / 400;    // Texto secundario
$font-label:      12px / 18px / 500;    // Labels, chips, badges
$font-caption:    11px / 16px / 400;    // Captions, footnotes
$font-number-lg:  28px / 36px / 700;    // Saldos principales
$font-number:     18px / 24px / 600;    // Importes en tablas
$font-iban:       14px / 22px / 400 / $font-family-mono;  // IBANs y cuentas
```

### 2.3 Espaciado

```scss
// Sistema de 4px
$spacing-1:  4px;
$spacing-2:  8px;
$spacing-3:  12px;
$spacing-4:  16px;
$spacing-5:  20px;
$spacing-6:  24px;
$spacing-8:  32px;
$spacing-10: 40px;
$spacing-12: 48px;
$spacing-16: 64px;

// Padding de componentes
$padding-card:      $spacing-6;       // 24px
$padding-card-sm:   $spacing-4;       // 16px — mobile
$padding-form:      $spacing-6;       // 24px entre secciones
$padding-modal:     $spacing-8;       // 32px
$padding-page:      $spacing-8;       // 32px lateral en desktop
$padding-page-sm:   $spacing-4;       // 16px lateral en mobile

// Gaps (flex/grid)
$gap-xs:  $spacing-2;   // 8px  — entre elementos pequeños
$gap-sm:  $spacing-4;   // 16px — entre campos de formulario
$gap-md:  $spacing-6;   // 24px — entre secciones dentro de card
$gap-lg:  $spacing-8;   // 32px — entre tarjetas
$gap-xl:  $spacing-12;  // 48px — entre secciones de página
```

### 2.4 Border Radius

```scss
$radius-xs:   2px;   // Tags muy pequeños
$radius-sm:   4px;   // Botones pequeños, chips
$radius-md:   8px;   // Cards, form fields, botones estándar
$radius-lg:   12px;  // Cards grandes, modales
$radius-xl:   16px;  // Cards destacadas
$radius-full: 9999px; // Avatares, badges circulares, pills
```

### 2.5 Elevación / Sombras

```scss
$shadow-0: none;
$shadow-1: 0 1px 2px rgba(0,0,0,0.05);                        // Cards en reposo
$shadow-2: 0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);  // Cards hover
$shadow-3: 0 4px 12px rgba(0,0,0,0.10);                       // Dropdowns, tooltips
$shadow-4: 0 8px 24px rgba(0,0,0,0.12);                       // FABs, overlays
$shadow-5: 0 16px 48px rgba(0,0,0,0.16);                      // Modales, drawers
```

### 2.6 Duración de transiciones

```scss
$duration-instant:  0ms;    // Sin animación (reduce-motion)
$duration-fast:     150ms;  // Hover, focus, toggle
$duration-normal:   250ms;  // Entradas/salidas de elementos
$duration-slow:     400ms;  // Modales, drawers, transiciones de página
$duration-skeleton: 1500ms; // Animación skeleton loop

$easing-default:   cubic-bezier(0.4, 0, 0.2, 1);  // Material standard
$easing-enter:     cubic-bezier(0, 0, 0.2, 1);     // Decelerate
$easing-exit:      cubic-bezier(0.4, 0, 1, 1);     // Accelerate
```

---

## 3. Biblioteca de Componentes

### 3.1 Botones

| Variante | Uso | Color | Cuando usar |
|----------|-----|-------|-------------|
| `mat-flat-button` primary | CTA principal | Primary | Submit, Confirmar, Continuar |
| `mat-stroked-button` | Acción secundaria | Primary | Cancelar, Volver |
| `mat-button` | Acción terciaria / link | Neutral | Ver detalles, Más info |
| `mat-icon-button` | Acción compacta en tabla | Neutral | Editar, Ver, Eliminar |
| `mat-flat-button` warn | Acción destructiva confirmada | Warn | Eliminar definitivamente |

**Reglas:**
- Solo 1 botón primary por formulario/pantalla
- Botón destructivo SIEMPRE en modal de confirmación, nunca inline
- Estado loading: spinner interno + `disabled` durante submit
- Orden en formularios: [Secundaria] [espaciado] [Primaria →]

### 3.2 Form Fields

Usar siempre `appearance="outline"` con `mat-form-field`:

```html
<mat-form-field appearance="outline" class="field-full-width">
  <mat-label>Nombre del campo</mat-label>
  <input matInput [formControlName]="fieldName" [placeholder]="'Ejemplo...'">
  <mat-hint>Texto de ayuda opcional</mat-hint>
  <mat-error>{{ getErrorMessage(fieldName) }}</mat-error>
</mat-form-field>
```

**Mensajes de error — función helper:**
```typescript
getErrorMessage(field: string): string {
  const control = this.form.get(field);
  if (control?.hasError('required')) return 'Este campo es obligatorio';
  if (control?.hasError('minlength')) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
  if (control?.hasError('maxlength')) return `Máximo ${control.errors?.['maxlength'].requiredLength} caracteres`;
  if (control?.hasError('email')) return 'Introduce un email válido';
  if (control?.hasError('pattern')) return 'Formato no válido';
  if (control?.hasError('invalidIban')) return 'IBAN no válido';
  return 'Campo inválido';
}
```

### 3.3 Badges de Estado

| Estado | Color | Label |
|--------|-------|-------|
| ACTIVO / COMPLETADO | accent (#00897B bg) | ✓ Activo |
| PENDIENTE | amber (#F57F17 bg) | ⏳ Pendiente |
| ERROR / CANCELADO | warn (#E53935 bg) | ✕ Cancelado |
| INFO / PROCESANDO | info (#1976D2 bg) | ⟳ Procesando |
| INACTIVO | neutral-400 bg | — Inactivo |

### 3.4 Empty States

```
┌─────────────────────────────────────────────┐
│                                             │
│            [Ilustración SVG 120px]          │
│                                             │
│         No tienes [entidades] aún           │
│                                             │
│   Cuando crees [X] aparecerán aquí.         │
│                                             │
│        [+ Crear primera [entidad]]          │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.5 Skeleton Loaders

```html
<!-- Skeleton para lista de 3 elementos -->
<div class="skeleton-list" *ngIf="loading$ | async">
  <div class="skeleton-row" *ngFor="let i of [1,2,3]">
    <div class="skeleton-avatar"></div>
    <div class="skeleton-content">
      <div class="skeleton-line w-60"></div>
      <div class="skeleton-line w-40"></div>
    </div>
    <div class="skeleton-badge"></div>
  </div>
</div>
```

---

## 4. Patrones de Navegación

### 4.1 Estructura de rutas BankPortal

```
/app
  ├── /dashboard              → Vista principal (saldo, accesos rápidos)
  ├── /accounts               → Cuentas
  │   ├── /list
  │   └── /detail/:id
  ├── /cards                  → Tarjetas (FEAT-016)
  │   ├── /list
  │   ├── /detail/:id
  │   └── /settings/:id
  ├── /transfers              → Transferencias (FEAT-014/015)
  │   ├── /new
  │   ├── /scheduled
  │   └── /history
  ├── /direct-debits          → Domiciliaciones SEPA (FEAT-017)
  │   ├── /list
  │   ├── /detail/:id
  │   └── /new
  └── /profile                → Perfil y configuración
```

### 4.2 Breadcrumb estándar

```
Inicio > [Sección L1] > [Subsección L2] > [Vista actual]
```
- Máximo 4 niveles
- "Inicio" siempre clickable → /dashboard
- Último elemento no clickable (página actual)

---

## 5. Accesibilidad — Estándares BankPortal

### 5.1 Contraste mínimo

| Uso | Ratio mínimo | Combinaciones aprobadas |
|-----|-------------|------------------------|
| Texto normal < 18px | 4.5:1 | #1A2332 sobre #F9FAFB (15.1:1) ✓ |
| Texto grande ≥ 18px | 3:1 | #1B5E99 sobre #FFFFFF (8.2:1) ✓ |
| Elementos UI (border, focus) | 3:1 | #1B5E99 sobre #FFFFFF ✓ |

### 5.2 Foco visual

```scss
// Focus ring estándar — NO usar outline:none nunca
*:focus-visible {
  outline: 2px solid $color-primary-700;
  outline-offset: 2px;
  border-radius: $radius-sm;
}
```

### 5.3 ARIA patterns obligatorios

```html
<!-- Tabla de datos -->
<table mat-table [dataSource]="data" aria-label="Lista de [entidades]">

<!-- Modal -->
<mat-dialog-container role="dialog" aria-modal="true" aria-labelledby="dialog-title">

<!-- Loading spinner -->
<mat-spinner aria-label="Cargando..." aria-live="polite"></mat-spinner>

<!-- Errores de servidor -->
<div role="alert" class="error-banner" *ngIf="serverError">
  {{ serverError }}
</div>

<!-- Campos de formulario con descripción extra -->
<input [attr.aria-describedby]="'hint-' + fieldName + ' error-' + fieldName">
```

---

## 6. Responsive Breakpoints

```scss
// Breakpoints Angular Material (compatibles)
$bp-xs:   0px;      // < 600px    mobile
$bp-sm:   600px;    // 600-960px  tablet
$bp-md:   960px;    // 960-1280px desktop
$bp-lg:   1280px;   // 1280-1920px wide
$bp-xl:   1920px;   // > 1920px   ultrawide

// Mixins de uso
@mixin mobile {
  @media (max-width: #{$bp-sm - 1}) { @content; }
}
@mixin tablet {
  @media (min-width: $bp-sm) and (max-width: #{$bp-md - 1}) { @content; }
}
@mixin desktop {
  @media (min-width: $bp-md) { @content; }
}
```

### Adaptaciones por breakpoint

| Elemento | Mobile (< 600) | Tablet (600-960) | Desktop (> 960) |
|----------|---------------|-------------------|-----------------|
| Nav | Bottom nav / hamburger | Side nav colapsado | Side nav expandido |
| Cards | Full width | 2 columnas | 3-4 columnas |
| Tablas | Cards apiladas | Scroll horizontal | Tabla completa |
| Modales | Bottom sheet (full) | Dialog 80% | Dialog 560px max |
| Formularios | 1 columna | 1-2 columnas | 2 columnas |
| Botones | Full width | Auto | Auto |

---

## 7. Historial de Versiones

| Versión | Sprint | Cambios |
|---------|--------|---------|
| 1.0 | S20 | Versión inicial — Design System BankPortal documentado |

---

*UX Design System v1.0 · BankPortal · Banco Meridian · 2026*  
*SOFIA v2.3 · UX/UI Designer Agent · Experis ManpowerGroup*
