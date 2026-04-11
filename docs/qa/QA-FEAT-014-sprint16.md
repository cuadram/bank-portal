# QA-FEAT-014 — Plan y Ejecución de Pruebas
# Notificaciones Push & In-App

**BankPortal · Banco Meridian · Sprint 16 · Step 6**

| Campo | Valor |
|---|---|
| QA Agent | SOFIA QA Tester Agent |
| Feature | FEAT-014 — Notificaciones Push & In-App |
| Sprint | 16 · 2026-03-24 |
| Build | feature/FEAT-014-sprint16 (post-CR fixes v1.1) |
| SRS referencia | SRS-FEAT-014 v1.0 |
| CR referencia | CR-FEAT-014-sprint16.md (6 fixes aplicados) |
| CMMI | VER SP 2.2 · VER SP 3.1 · VAL SP 1.1 |

---

## Resumen de ejecución

| Métrica | Valor |
|---|---|
| Casos totales | 36 |
| PASS | **36** |
| FAIL | **0** |
| BLOCKED | 0 |
| Defectos nuevos | **0** |
| Cobertura funcional | 100% (todos los criterios Gherkin de FEAT-014.md) |
| Severidad media de riesgo | Baja — todos los blockers corregidos en CR |

**Decisión QA:** ✅ **APROBADO — listo para Step 7 DevOps**

---

## Módulo 1 — Suscripción Web Push

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F014-01 | Usuario concede permiso → POST /push/subscribe → HTTP 201 + subscriptionId | ✅ PASS | |
| QA-F014-02 | Usuario deniega permiso → no se llama al backend; banner informativo visible | ✅ PASS | |
| QA-F014-03 | Segundo intento con mismo endpoint → HTTP 200 idempotente (no duplica subscription) | ✅ PASS | UNIQUE(endpoint) funciona |
| QA-F014-04 | Límite 5 suscripciones → 6ª solicitud retorna HTTP 400 con mensaje descriptivo | ✅ PASS | DEBT-026 aceptado (overflow +1 en carga concurrente extrema) |
| QA-F014-05 | DELETE /push/subscribe/{id} con userId incorrecto → HTTP 403 | ✅ PASS | IDOR protection `deleteByIdAndUserId` |
| QA-F014-06 | Subscription con endpoint 410 Gone → WebPushService elimina subscription automáticamente | ✅ PASS | |

---

## Módulo 2 — Historial de notificaciones

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F014-07 | GET /notifications → lista paginada con `category`, `severity`, `read` correctos | ✅ PASS | FIX-02 verificado: category/severity persisten en BD |
| QA-F014-08 | GET /notifications?category=TRANSACTION → solo notificaciones TRANSACTION | ✅ PASS | |
| QA-F014-09 | GET /notifications?category=SECURITY → solo notificaciones SECURITY | ✅ PASS | |
| QA-F014-10 | GET /notifications/unread-count → count correcto pre y post marcado | ✅ PASS | |
| QA-F014-11 | PATCH /notifications/{id}/read → `read=true`, `read_at` poblado | ✅ PASS | |
| QA-F014-12 | POST /notifications/mark-all-read → todas leídas, unread-count=0 | ✅ PASS | |
| QA-F014-13 | DELETE /notifications/{id} con userId distinto → HTTP 403 | ✅ PASS | IDOR check |
| QA-F014-14 | GET /notifications sin autenticación → HTTP 401 | ✅ PASS | |

---

## Módulo 3 — Preferencias por canal

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F014-15 | GET /preferences → devuelve defaults para cada eventType | ✅ PASS | |
| QA-F014-16 | PATCH /preferences {eventType, pushEnabled:false} → canal push desactivado | ✅ PASS | |
| QA-F014-17 | PATCH /preferences {eventType:null} → HTTP 400 "eventType is required" | ✅ PASS | FIX-08 verificado |
| QA-F014-18 | Preferencia pushEnabled:false → dispatch() no invoca WebPushService | ✅ PASS | |
| QA-F014-19 | Preferencia emailEnabled:true + importe < threshold → no se envía email | ✅ PASS | umbral 1.000€ respetado |
| QA-F014-20 | Preferencia emailEnabled:true + importe > threshold → email enviado | ✅ PASS | |

---

## Módulo 4 — Despacho multicanal (NotificationHub)

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F014-21 | TransferCompletedEvent → Hub despacha push + SSE + email según prefs | ✅ PASS | FIX-01: @Async sin @Transactional en dispatch() |
| QA-F014-22 | dispatch() falla persist() → push/SSE ya enviados no se revierten (atomicidad canal vs BD) | ✅ PASS | Comportamiento documentado: BD eventual |
| QA-F014-23 | SecurityAlertService recibe PasswordChangedEvent severity=HIGH → todos los canales activos forzados | ✅ PASS | HIGH ignora preferencia de canal |
| QA-F014-24 | DeviceRegisteredEvent → notificación SECURITY generada + persistida con category=SECURITY | ✅ PASS | |
| QA-F014-25 | KycApprovedEvent → notificación KYC generada + persistida con category=KYC | ✅ PASS | |

---

## Módulo 5 — SSE + Replay Last-Event-ID

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F014-26 | GET /stream → conexión SSE activa, heartbeat `: heartbeat` cada 30s | ✅ PASS | |
| QA-F014-27 | GET /stream?categories=SECURITY → solo eventos SECURITY recibidos | ✅ PASS | |
| QA-F014-28 | Reconexión con Last-Event-ID dentro de TTL (5 min) → replay eventos perdidos | ✅ PASS | |
| QA-F014-29 | Reconexión con Last-Event-ID expirado (>5 min) → replay completo del buffer | ✅ PASS | FIX-03: degradación graciosa |
| QA-F014-30 | Shutdown servidor → emitters completados (no rotura abrupta), cliente aplica retry SSE | ✅ PASS | FIX-10: @PreDestroy verificado |
| QA-F014-31 | GET /stream sin autenticación → HTTP 401 (whitelist CSRF aplicada correctamente) | ✅ PASS | |

---

## Módulo 6 — Frontend Angular (NotificationModule)

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F014-32 | NotificationBell muestra badge con unread-count > 0 | ✅ PASS | |
| QA-F014-33 | Clic en Bell → drawer abre con historial paginado | ✅ PASS | |
| QA-F014-34 | Filtro por categoría en drawer → llama GET /notifications?category=X | ✅ PASS | |
| QA-F014-35 | Clic "Activar notificaciones" → flujo push subscribe completo (Notification API + SW) | ✅ PASS | |
| QA-F014-36 | Settings → toggle push/inApp/email por tipo de evento → PATCH /preferences | ✅ PASS | |

---

## Regresión — Features anteriores

| Área | Estado |
|---|---|
| FEAT-007 (`/api/v1/notifications` legacy, SseEmitterRegistry original) | ✅ Sin regresión — solo extensión aditiva |
| FEAT-008 TransferService → TransferCompletedEvent | ✅ Sin regresión |
| FEAT-013 KYC → KycApprovedEvent | ✅ Sin regresión |
| SecurityConfig (CSRF whitelist para /stream) | ✅ Verificado — solo `/notifications/stream` excluida |
| AuditLogService (nuevos eventos PUSH_SENT, PUSH_SUBSCRIPTION_CREATED) | ✅ Auditados correctamente |

---

## Pruebas de seguridad

| Check | Estado |
|---|---|
| IDOR en push subscribe/unsubscribe (userId ≠ token) | ✅ Protegido |
| IDOR en historial / read / delete | ✅ Protegido |
| VAPID keys no expuestas en respuesta API | ✅ Solo VAPID_PUBLIC_KEY en endpoint de suscripción |
| SSE sin token válido → 401 | ✅ |
| XSS en `title`/`body` notificación → sanitizado en Angular | ✅ DomSanitizer aplicado |
| Payload cifrado VAPID (AES-128-GCM) no legible en tránsito | ✅ nl.martijndwars:web-push gestiona cifrado |

---

## Pruebas de rendimiento (smoke)

| Escenario | Resultado |
|---|---|
| 50 conexiones SSE simultáneas → CPU < 15% | ✅ |
| dispatch() con 100 suscripciones push → latencia total < 2s | ✅ Async multicanal |
| GET /notifications (1.000 registros, paginación 20) → < 100ms | ✅ |
| Heartbeat 30s × 50 emitters → sin memory leak en emitters map | ✅ |

---

## Defectos encontrados

**Ninguno.** Los 2 findings bloqueantes (RV-F014-01, RV-F014-02) y los 4 menores/sugerencias seleccionados (RV-F014-03, 06, 08, 10) fueron corregidos en Step 5 (Code Review) antes de la entrega a QA.

---

## Cobertura de tests automatizados entregados

| Tipo | Clases | Escenarios |
|---|---|---|
| Unitarios (JUnit 5 + Mockito) | NotificationHubTest · UserNotificationRepositoryTest · SseEmitterRegistryTest · EmailChannelServiceTest · NotificationPreferenceControllerTest | 19 + 5 nuevos post-fix = **24** |
| Funcionales Gherkin (Cucumber) | NotificationFeatureSteps | 28 escenarios |
| Seguridad | NotificationSecurityTest | 6 verificaciones |
| WCAG 2.1 AA (Axe) | NotificationPanelA11yTest | 4 criterios |
| **Total** | | **62 escenarios** |

---

*SOFIA QA Tester Agent — Step 6 | Sprint 16 · FEAT-014*
*CMMI Level 3 — VER SP 2.2 · VER SP 3.1 · VAL SP 1.1*
*BankPortal — Banco Meridian — 2026-03-24*
