# UX/UI Design — FEAT-019: Centro de Privacidad y Perfil
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 21 | **SOFIA Step:** 2c — UX/UI Designer v2.0 | **Fecha:** 2026-03-31

---

## 1. Análisis de Contexto UX

### Usuarios objetivo
- **Usuario final:** Clientes de Banco Meridian con acceso a BankPortal
- **Administrador:** Personal interno de Banco Meridian (panel GDPR admin)

### Principios de diseño aplicados
- **Claridad ante todo:** Los derechos GDPR son conceptos legales complejos — el UI debe traducirlos a lenguaje accesible
- **Confianza:** El Centro de Privacidad debe proyectar seguridad y control real al usuario
- **Acción reversible:** Consentimientos son toggles — reversibles. Eliminación de cuenta: flujo con múltiples confirmaciones explícitas
- **WCAG 2.1 AA:** Controles de toggle con aria-label, estados focus visible, contraste ≥ 4.5:1

### Navegación nueva
```
Navbar (shell.component.ts):
  [+] Mi Perfil          → /perfil           (reemplaza placeholder)
  [+] Centro de Privacidad → /privacidad     (módulo nuevo)
```

---

## 2. Arquitectura de pantallas

```
/perfil
├── Vista principal — datos personales + teléfono
├── Edición inline de campos
└── Sesiones activas (pestaña secundaria)

/privacidad
├── Centro de Privacidad — hub de derechos GDPR
├── Gestión de consentimientos (toggles + historial)
├── Portabilidad de datos (solicitud + estado + descarga)
└── Eliminación de cuenta (flujo multi-paso)
```

---

## 3. Wireframes de Referencia

### Pantalla 1: Mi Perfil (vista principal)
```
┌─────────────────────────────────────────────┐
│  ← Mi Perfil                    [Editar]    │
├─────────────────────────────────────────────┤
│  👤  Juan García López                      │
│      Cuenta verificada  ✓                   │
├─────────────────────────────────────────────┤
│  DATOS PERSONALES                           │
│  ┌─────────────────────────────────────┐   │
│  │ Nombre         Juan García López    │   │
│  │ Teléfono       +34 ***-**-89       │   │
│  │ Email          j***@banco.com  🔒  │   │
│  │ Dirección      Calle Mayor 12, ...  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ──────────────────────────────────────    │
│  SESIONES ACTIVAS              [Ver todas] │
│  ● Este dispositivo  Chrome · Ahora        │
│  ○ iPhone 14         iOS · hace 2h         │
└─────────────────────────────────────────────┘
```

### Pantalla 2: Centro de Privacidad
```
┌─────────────────────────────────────────────┐
│  ← Centro de Privacidad                    │
├─────────────────────────────────────────────┤
│  🔒 Control de tus datos                   │
│  Gestiona cómo usamos tu información       │
├─────────────────────────────────────────────┤
│  ┌──── MIS CONSENTIMIENTOS ──────────────┐ │
│  │ Marketing            [  ●  ] ON      │ │
│  │ Analítica            [ ○   ] OFF     │ │
│  │ Comunicaciones       [  ●  ] ON      │ │
│  │ Seguridad            [  ●  ] 🔒      │ │
│  └────────────────────────────────────── ┘ │
│                                             │
│  ┌──── MIS DATOS ─────────────────────── ┐ │
│  │ 📥 Descargar mis datos    [Solicitar] │ │
│  │ Portabilidad GDPR — JSON firmado      │ │
│  └────────────────────────────────────── ┘ │
│                                             │
│  ┌──── ZONA AVANZADA ─────────────────── ┐ │
│  │ 🗑️  Eliminar mi cuenta   [Solicitar] │ │
│  │ Esta acción es irreversible           │ │
│  └────────────────────────────────────── ┘ │
└─────────────────────────────────────────────┘
```

### Pantalla 3: Eliminación de Cuenta — Flujo multi-paso
```
Paso 1/3: Información
┌──────────────────────────────────────────┐
│ ⚠️ Antes de continuar                   │
│                                          │
│ Al eliminar tu cuenta:                  │
│ ✗ Perderás acceso a BankPortal          │
│ ✗ Tus datos personales serán borrados   │
│ ✓ Tus movimientos históricos se        │
│   conservarán por obligación legal      │
│                                          │
│ [Cancelar]           [Continuar →]      │
└──────────────────────────────────────────┘

Paso 2/3: Verificación OTP
┌──────────────────────────────────────────┐
│ 🔐 Verificación de seguridad            │
│                                          │
│ Hemos enviado un código a               │
│ +34 ***-**-89                           │
│                                          │
│ Código: [  _  _  _  _  _  _  ]         │
│                                          │
│ [Cancelar]      [Verificar]             │
└──────────────────────────────────────────┘

Paso 3/3: Confirmación email
┌──────────────────────────────────────────┐
│ 📧 Confirma en tu email                 │
│                                          │
│ Te hemos enviado un email a             │
│ j***@banco.com                          │
│                                          │
│ Haz clic en el enlace del email         │
│ para confirmar la eliminación.          │
│ El enlace caduca en 24 horas.           │
│                                          │
│ [Cancelar solicitud]                    │
└──────────────────────────────────────────┘
```

---

## 4. Design Tokens (hereda Design System BankPortal)

```css
/* Colores principales */
--color-primary: #1B3E7E;        /* Azul Banco Meridian */
--color-accent: #C84A14;         /* Naranja XFORGE */
--color-success: #2E7D32;
--color-warning: #E65100;
--color-danger: #C62828;
--color-neutral: #F5F5F5;

/* Toggle de consentimiento */
--toggle-on: #2E7D32;
--toggle-off: #9E9E9E;
--toggle-locked: #1B3E7E;        /* Seguridad — bloqueado en azul */

/* Zona avanzada (eliminación) */
--danger-zone-bg: #FFF3F3;
--danger-zone-border: #C62828;
```

---

## 5. Accesibilidad — Checklist WCAG 2.1 AA

| Check | Estado |
|---|---|
| Toggles con aria-label descriptivo ("Activar/Desactivar consentimiento de Marketing") | ✓ Diseñado |
| Estados focus visible en todos los controles interactivos | ✓ Diseñado |
| Contraste mínimo 4.5:1 para texto normal | ✓ Verificado |
| Mensajes de error con aria-live="polite" | ✓ Diseñado |
| Flujo de eliminación con confirmaciones en texto claro (no solo iconos) | ✓ Diseñado |
| Toggle de Seguridad con aria-disabled="true" y tooltip explicativo | ✓ Diseñado |

---

## 6. Notas de implementación Angular

```typescript
// Rutas a registrar en app-routing.module.ts (LA-FRONT-001)
{ path: 'perfil', loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule) },
{ path: 'privacidad', loadChildren: () => import('./features/privacy/privacy.module').then(m => m.PrivacyModule) },

// Nav items a añadir en shell.component.ts (LA-FRONT-001)
{ label: 'Mi Perfil', icon: 'person', route: '/perfil' },
{ label: 'Centro de Privacidad', icon: 'lock', route: '/privacidad' }

// IMPORTANTE: verificar que /perfil NO tiene placeholder antes de mergear (LA-FRONT-002)
```

---

*Generado por SOFIA v2.3 — UX/UI Designer v2.0 — Step 2c — Sprint 21 — 2026-03-31*  
*Gate HITL-PO-TL pendiente: requiere aprobación PO + Tech Lead para continuar*
