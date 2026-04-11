# ADR-021 — Estrategia de Historial de Contraseñas

## Metadata

| Campo | Valor |
|---|---|
| ID | ADR-021 |
| Feature | FEAT-012-A |
| Fecha | 2026-03-23 |
| Estado | Aceptado |
| Autor | SOFIA Architect Agent |

## Contexto

RNF-012-05 exige que el sistema impida reutilizar cualquiera de las últimas 3
contraseñas del usuario. Se necesita persisitir hashes de contraseñas anteriores.
Hay dos opciones viables.

## Decisión

Tabla independiente `password_history (id, user_id, password_hash, created_at)`
con máximo 3 registros por usuario (se purga el más antiguo al añadir uno nuevo).

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Tabla `password_history` independiente** | SRP — no contamina `users`; fácil de purgar; historial extensible | Una JOIN adicional al cambiar contraseña |
| Columnas `pw_hash_1`, `pw_hash_2`, `pw_hash_3` en `users` | Sin JOIN | Violación 1NF; no extensible; migraciones costosas si cambia N |

## Consecuencias

- **Positivas:** Diseño limpio, fácil aumentar `N` sin migración destructiva.
- **Trade-offs:** Un INSERT + posible DELETE en `password_history` en cada cambio.
- **Impacto:** Solo el nuevo módulo `profile` — sin impacto en `users` existente.
