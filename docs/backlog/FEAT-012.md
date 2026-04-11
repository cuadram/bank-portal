# FEAT-012-A — Gestión de Perfil de Usuario

## Metadata

| Campo | Valor |
|---|---|
| ID | FEAT-012-A |
| Tipo | new-feature |
| Sprint | 14 |
| SP | 13 |
| Release | v1.14.0 |
| SRS | docs/srs/SRS-FEAT-012.md |
| Jira Epic | SCRUM-35 |

## Descripción

Permitir al usuario autenticado gestionar su perfil personal de forma self-service:
consultar y editar datos personales, cambiar contraseña con historial, gestionar
preferencias de notificación, y ver/revocar sesiones activas.

## User Stories

| US | SP | Prioridad |
|---|---|---|
| US-1201 Ver perfil | 2 | Must Have |
| US-1202 Actualizar datos | 3 | Must Have |
| US-1203 Cambiar contraseña | 3 | Must Have |
| US-1204 Preferencias notificación | 2 | Should Have |
| US-1205 Sesiones activas | 3 | Should Have |

## Deuda técnica vinculada

- DEBT-023: Añadir `jti` al payload JWT (bloqueante para US-1205)
