# Plan de Pruebas — FEAT-022: Bizum P2P
**Sprint 24 · BankPortal · Banco Meridian · SOFIA v2.7 · QA Tester Agent**

---

## 1. Alcance y objetivo

Verificar (VER) y validar (VAL) que la implementación FEAT-022 cumple los 7 US,
11 RNs y 5 RNF-delta del SRS, la fidelidad al prototipo HITL (LA-023-02),
y los estándares de seguridad PSD2/GDPR. Trazabilidad CMMI L3 completa.

---

## 2. Entorno de pruebas

| Item | Valor |
|---|---|
| Backend | http://localhost:8080 (Docker Compose) |
| Frontend | http://localhost:4201 |
| BD | PostgreSQL 16 — bankportal (Docker) |
| Redis | Redis 7 (Docker) |
| OTP STG bypass | `123456` (totp.stg-bypass-code en application-staging.yml) |
| Flyway | V27__bizum.sql ejecutada — tablas bizum_* presentes |
| Seed usuario | a.delacuadra@nemtec.es — Bizum activado en seed V27 |

**Docker Compose (manual — shell sin permisos):**
```bash
docker compose -f infra/compose/docker-compose.yml up -d
docker exec bankportal-postgres psql -U bankportal -d bankportal -c "SELECT * FROM bizum_activations;"
```

---

## 3. Pirámide de testing

| Nivel | Artefactos existentes | Nuevos en QA |
|---|---|---|
| Unitarios | TC001-014 (BizumLimitService + SendPayment + RequestMoney) | — |
| Integración | SpringContextIT.java | TC-F022-021..025 (@SpringBootTest) |
| E2E / Smoke | — | TC-F022-020 (Playwright outline) |
| Funcionales API | — | TC-F022-001..019 (REST + Gherkin) |

---

## 4. Casos de prueba funcionales — API REST

### TC-F022-001 — Activar Bizum (US-F022-01)
**Tipo:** API funcional · **RN:** RN-F022-01, RN-F022-02 · **Prioridad:** Alta

```gherkin
Dado que el usuario está autenticado (JWT válido)
  Y no tiene Bizum activado
  Y el teléfono "+34699111222" no está registrado
Cuando POST /api/v1/bizum/activate { phone: "+34699111222", accountId: "<uuid>" }
Entonces HTTP 201
  Y response.phoneMasked = "+34 *** 1222"
  Y response.status = "ACTIVE"
  Y bizum_activations contiene gdpr_consent_at NOT NULL
```
**Resultado esperado:** 201, phoneMasked, gdprConsentAt persistido

---

### TC-F022-002 — Activar Bizum — teléfono ya registrado (RN-F022-01)
**Tipo:** API negativo · **RN:** RN-F022-01 · **Prioridad:** Alta

```gherkin
Dado que el teléfono "+34699111222" ya está en bizum_activations
Cuando POST /api/v1/bizum/activate { phone: "+34699111222", accountId: "<uuid>" }
Entonces HTTP 409
  Y response.code = "PHONE_ALREADY_REGISTERED"
```

---

### TC-F022-003 — Enviar pago Bizum — happy path (US-F022-02)
**Tipo:** API funcional · **RN:** RN-F022-03, RN-F022-06 · **Prioridad:** Crítica

```gherkin
Dado que el usuario tiene Bizum activo
  Y el saldo de su cuenta es > 45.00 EUR
Cuando POST /api/v1/bizum/payments { recipientPhone: "+34699222333", amount: 45.00, concept: "Cena", otp: "123456" }
Entonces HTTP 201
  Y response.status = "COMPLETED"
  Y response.ref empieza por "BIZUM-"
  Y response.amountSent = 45.00
  Y bizum_payments contiene el registro con status COMPLETED
  Y ratelimit:{userId}:bizum:{date} incrementado en 45
```
**Evidencia BD:**
```sql
SELECT * FROM bizum_payments ORDER BY created_at DESC LIMIT 1;
```

---

### TC-F022-004 — Enviar pago — OTP inválido (RN-F022-03)
**Tipo:** API seguridad · **RN:** RN-F022-03 / PSD2 Art.97 · **Prioridad:** Crítica

```gherkin
Cuando POST /api/v1/bizum/payments { ..., otp: "000000" }
Entonces HTTP 401
  Y response.code = "OTP_INVALID"
  Y bizum_payments NO contiene nuevo registro
```

---

### TC-F022-005 — Enviar pago — límite por operación superado (RN-F022-04)
**Tipo:** API negativo · **RN:** RN-F022-04 · **Prioridad:** Alta

```gherkin
Cuando POST /api/v1/bizum/payments { ..., amount: 500.01, otp: "123456" }
Entonces HTTP 422
  Y response.code = "LIMIT_EXCEEDED"
```

---

### TC-F022-006 — Enviar pago — límite diario superado (RN-F022-05)
**Tipo:** API negativo · **RN:** RN-F022-05 · **Prioridad:** Alta

```gherkin
Dado que el usuario ya ha enviado 1800 EUR hoy (Redis)
Cuando POST /api/v1/bizum/payments { ..., amount: 300.00, otp: "123456" }
Entonces HTTP 422
  Y response.code = "LIMIT_EXCEEDED"
```
**Setup Redis:**
```bash
docker exec bankportal-redis redis-cli SET "ratelimit:<userId>:bizum:<date>" 1800 EX 86400
```

---

### TC-F022-007 — Enviar pago — Bizum no activo (RN-F022-03)
**Tipo:** API negativo · **RN:** RN-F022-01 · **Prioridad:** Alta

```gherkin
Dado que el usuario NO tiene Bizum activado
Cuando POST /api/v1/bizum/payments { ... }
Entonces HTTP 403
  Y response.code = "BIZUM_NOT_ACTIVE"
```

---

### TC-F022-008 — Solicitar dinero — happy path (US-F022-03)
**Tipo:** API funcional · **RN:** RN-F022-07 · **Prioridad:** Alta

```gherkin
Dado que el usuario tiene Bizum activo
Cuando POST /api/v1/bizum/requests { recipientPhone: "+34699333444", amount: 30.00, concept: "Split" }
Entonces HTTP 201
  Y response.status = "PENDING"
  Y response.expiresAt ≈ NOW + 24h (±5s)
  Y bizum_requests contiene expires_at = created_at + 24h
```
**Verificar TTL:**
```sql
SELECT EXTRACT(EPOCH FROM (expires_at - created_at)) FROM bizum_requests ORDER BY created_at DESC LIMIT 1;
-- Esperado: ~86400
```

---

### TC-F022-009 — Aceptar solicitud con OTP (US-F022-04 / RN-F022-08)
**Tipo:** API funcional · **RN:** RN-F022-08 · **Prioridad:** Crítica

```gherkin
Dado que existe una bizum_requests con status PENDING no expirada
Cuando PATCH /api/v1/bizum/requests/{id} { action: "ACCEPTED", otp: "123456" }
Entonces HTTP 200
  Y bizum_requests.status = "ACCEPTED"
  Y bizum_payments contiene pago COMPLETED
  Y Redis incrementado
```

---

### TC-F022-010 — Aceptar solicitud — expirada (RN-F022-07)
**Tipo:** API negativo · **RN:** RN-F022-07 · **Prioridad:** Alta

```gherkin
Dado que bizum_requests.expires_at < NOW()
Cuando PATCH /api/v1/bizum/requests/{id} { action: "ACCEPTED", otp: "123456" }
Entonces HTTP 422
  Y response.code = "REQUEST_EXPIRED"
```
**Setup:**
```sql
UPDATE bizum_requests SET expires_at = NOW() - INTERVAL '1 hour' WHERE id = '<id>';
```

---

### TC-F022-011 — Rechazar solicitud (US-F022-04)
**Tipo:** API funcional · **Prioridad:** Media

```gherkin
Cuando PATCH /api/v1/bizum/requests/{id} { action: "REJECTED" }
Entonces HTTP 200
  Y bizum_requests.status = "REJECTED"
  Y resolved_at NOT NULL
  Y NO se crea bizum_payments
```

---

### TC-F022-012 — Historial paginado (US-F022-05 / RN-F022-09)
**Tipo:** API funcional · **RN:** RN-F022-09 · **Prioridad:** Alta

```gherkin
Dado que el usuario tiene >= 3 operaciones previas
Cuando GET /api/v1/bizum/transactions?page=0&size=3
Entonces HTTP 200
  Y response es array con <= 3 elementos
  Y TODOS los phoneMasked tienen formato "+XX *** YYYY"
  Y NINGÚN phoneMasked expone el número completo
```
**Verificar enmascaramiento estricto:**
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/bizum/transactions |   python3 -c "import json,sys; data=json.load(sys.stdin);   assert all('***' in t['phoneMasked'] for t in data), 'FALLO ENMASCARAMIENTO'"
```

---

### TC-F022-013 — BigDecimal HALF_EVEN en pago (ADR-034)
**Tipo:** API precisión · **Prioridad:** Alta

```gherkin
Cuando POST /api/v1/bizum/payments { amount: 45.555, otp: "123456" }
Entonces HTTP 201
  Y response.amountSent = 45.56   (HALF_EVEN: .555 → .56)
  Y bizum_payments.amount = 45.56 (verificar en BD)
```

---

### TC-F022-014 — Rate limit Redis reset medianoche UTC (ADR-039)
**Tipo:** API integración · **RN:** RN-F022-05 · **Prioridad:** Alta

```gherkin
Dado que el key ratelimit:{userId}:bizum:{ayer} existe en Redis
Cuando GET /api/v1/bizum/status (nuevo día UTC)
Entonces dailyUsed = 0 (key de ayer expiró, nuevo key vacío)
```
**Setup:**
```bash
docker exec bankportal-redis redis-cli SET "ratelimit:<userId>:bizum:<yesterday>" 1500 EX 1
sleep 2
# verificar que el nuevo día parte de cero
```

---

### TC-F022-015 — Enmascaramiento teléfono en historial (RN-F022-09)
**Tipo:** Seguridad / privacidad · **Prioridad:** Crítica

```gherkin
Dado que se ha enviado un pago a "+34699222333"
Cuando GET /api/v1/bizum/transactions
Entonces phoneMasked = "+34 *** 2333"
  Y el número completo "+34699222333" NO aparece en NINGÚN campo del response
```

---

### TC-F022-016 — OTP bypass STG funciona (configuración staging)
**Tipo:** Configuración entorno · **Prioridad:** Media

```gherkin
Dado que application-staging.yml tiene totp.stg-bypass-code=123456
Cuando POST /api/v1/bizum/payments { ..., otp: "123456" }
Entonces HTTP 201 (el bypass permite la operación en STG)
```

---

### TC-F022-017 — Endpoint GET /status devuelve límites (US-F022-06 / RNF-D022-05)
**Tipo:** API funcional · **Prioridad:** Media

```gherkin
Cuando GET /api/v1/bizum/status
Entonces HTTP 200
  Y response.active = true/false
  Y response.dailyLimit = 2000
  Y response.perOperationLimit = 500
  Y response.dailyUsed refleja lo consumido hoy
```

---

### TC-F022-018 — Solicitud expirada auto por @Scheduled
**Tipo:** Integración · **RN:** RN-F022-07 · **Prioridad:** Media

```gherkin
Dado que existe una bizum_requests con expires_at < NOW()
Cuando el job @Scheduled se ejecuta (cada hora)
Entonces bizum_requests.status = "EXPIRED"
```
**Trigger manual:**
```sql
-- Crear solicitud ya expirada
INSERT INTO bizum_requests (id, requester_user_id, recipient_phone, amount, status, expires_at, created_at)
VALUES (gen_random_uuid(), '<userId>', '+34699000000', 10.00, 'PENDING', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours');
-- Llamar endpoint para forzar expireOldRequests (o esperar ciclo)
```

---

### TC-F022-019 — Error HTTP semántico por tipo de excepción (LA-TEST-003)
**Tipo:** Contrato HTTP · **Prioridad:** Alta

| Excepción | HTTP esperado | code esperado |
|---|---|---|
| BizumNotActiveException | 403 | BIZUM_NOT_ACTIVE |
| PhoneAlreadyRegisteredException | 409 | PHONE_ALREADY_REGISTERED |
| BizumLimitExceededException | 422 | LIMIT_EXCEEDED |
| BizumRequestExpiredException | 422 | REQUEST_EXPIRED |
| BizumRequestNotFoundException | 404 | REQUEST_NOT_FOUND |
| InvalidOtpException | 401 | OTP_INVALID |

---

## 5. Caso de prueba E2E / Smoke (US-F022-07 — Angular)

### TC-F022-020 — Flujo completo Bizum en Angular (Playwright outline)

```gherkin
Escenario: Flujo envío Bizum completo en navegador
  Dado que navego a http://localhost:4201
    Y me autentico como a.delacuadra@nemtec.es
  Cuando hago clic en "💸 Bizum" en el sidebar
  Entonces la URL es /bizum
    Y se muestra el hero panel con el límite diario

  Cuando hago clic en "Enviar"
  Entonces la URL es /bizum/enviar
    Y se muestra el stepper en Paso 1

  Cuando introduzco "+34699222333" en teléfono, "45" en importe, "Cena" en concepto
    Y hago clic en "Continuar"
  Entonces el stepper avanza a Paso 2
    Y se muestra el resumen del pago

  Cuando introduzco "123456" en el campo OTP
    Y hago clic en "Confirmar envío"
  Entonces aparece toast "Bizum de €45,00 enviado"
    Y la URL vuelve a /bizum
```
**Verificar LA-023-01:** no hay `[href]` en ningún elemento navegable
**Verificar LA-023-02:** UI coincide con PROTO-FEAT-022-sprint24.html pantalla screen-bizum-send

---

## 6. Casos de prueba de integración (@SpringBootTest)

### TC-F022-021 — SpringContextIT carga el módulo bizum
```java
@SpringBootTest
class SpringContextIT {
    @Autowired BizumController bizumController;
    @Autowired JpaBizumAdapter jpaBizumAdapter;
    @Autowired CoreBankingMockBizumClient coreClient;

    @Test void contextLoads() {
        assertNotNull(bizumController);
        assertNotNull(jpaBizumAdapter);
        assertNotNull(coreClient);
    }
}
```

### TC-F022-022 — Flyway V27 ejecuta sin errores
```java
@SpringBootTest
class BizumFlywayIT {
    @Autowired DataSource ds;
    @Test void v27TablesExist() throws Exception {
        try (var conn = ds.getConnection(); var rs = conn.getMetaData()
                .getTables(null, null, "bizum_%", new String[]{"TABLE"})) {
            List<String> tables = new ArrayList<>();
            while (rs.next()) tables.add(rs.getString("TABLE_NAME"));
            assertTrue(tables.contains("bizum_activations"));
            assertTrue(tables.contains("bizum_payments"));
            assertTrue(tables.contains("bizum_requests"));
        }
    }
}
```

### TC-F022-023 — JpaBizumAdapter save + findByUserId (schema real)
```java
@SpringBootTest @Transactional
class BizumAdapterIT {
    @Autowired JpaBizumAdapter adapter;
    @Test void saveAndFindActivation() {
        BizumActivation a = new BizumActivation();
        a.setId(UUID.randomUUID()); a.setUserId(UUID.randomUUID());
        a.setPhone("+34699999001"); a.setStatus(BizumStatus.ACTIVE);
        a.setGdprConsentAt(Instant.now()); a.setActivatedAt(Instant.now());
        adapter.save(a);
        assertTrue(adapter.findByPhone("+34699999001").isPresent());
    }
}
```

### TC-F022-024 — expireOldRequests actualiza status en BD real
```java
@SpringBootTest @Transactional
class BizumExpireIT {
    @Autowired JpaBizumAdapter adapter;
    @Test void expiresPendingRequests() {
        BizumRequest r = new BizumRequest();
        r.setId(UUID.randomUUID()); r.setRequesterUserId(UUID.randomUUID());
        r.setRecipientPhone("+34699000001"); r.setAmount(new BigDecimal("10.00"));
        r.setStatus(BizumStatus.PENDING); r.setCreatedAt(Instant.now());
        r.setExpiresAt(Instant.now().minusSeconds(3600));
        adapter.save(r);
        adapter.expireOldRequests();
        var found = adapter.findById(r.getId());
        assertTrue(found.isPresent());
        assertEquals(BizumStatus.EXPIRED, found.get().getStatus());
    }
}
```

### TC-F022-025 — NUMERIC(12,2) preserva escala en BD
```java
@SpringBootTest @Transactional
class BizumPrecisionIT {
    @Autowired JpaBizumAdapter adapter;
    @Test void amountScalePreserved() {
        BizumPayment p = new BizumPayment();
        p.setId(UUID.randomUUID()); p.setSenderUserId(UUID.randomUUID());
        p.setRecipientPhone("+34699000002");
        p.setAmount(new BigDecimal("45.56")); // HALF_EVEN result
        p.setStatus(BizumStatus.COMPLETED); p.setCreatedAt(Instant.now());
        adapter.save(p);
        var found = adapter.findBySenderUserId(p.getSenderUserId(), 0, 1);
        assertEquals(new BigDecimal("45.56"), found.get(0).getAmount());
    }
}
```

---

## 7. Matriz de trazabilidad SRS → TCs

| ID | Descripción | TCs |
|---|---|---|
| US-F022-01 | Activar Bizum | TC-001, TC-002 |
| US-F022-02 | Enviar pago | TC-003, TC-004, TC-005, TC-006, TC-007, TC-013, TC-016 |
| US-F022-03 | Solicitar dinero | TC-008 |
| US-F022-04 | Aceptar/rechazar solicitud | TC-009, TC-010, TC-011 |
| US-F022-05 | Historial | TC-012, TC-015 |
| US-F022-06 | Estado + límites | TC-017, TC-014 |
| US-F022-07 | Frontend Angular | TC-020 |
| RN-F022-01 | Unicidad teléfono | TC-002 |
| RN-F022-02 | GDPR consentimiento | TC-001 |
| RN-F022-03 | OTP SCA obligatorio | TC-004, TC-007 |
| RN-F022-04 | Límite €500/op | TC-005 |
| RN-F022-05 | Límite €2.000/día | TC-006, TC-014 |
| RN-F022-06 | SEPA Instant <10s | TC-003 |
| RN-F022-07 | TTL 24h solicitudes | TC-008, TC-010, TC-018 |
| RN-F022-08 | OTP en aceptar solicitud | TC-009 |
| RN-F022-09 | Enmascaramiento teléfono | TC-012, TC-015 |
| RN-F022-10 | actionUrl rutas Angular | TC-020 |
| RN-F022-11 | Fidelidad prototipo HITL | TC-020 |
| ADR-034 | BigDecimal HALF_EVEN | TC-013, TC-025 |
| ADR-039 | Redis rate limit key | TC-006, TC-014 |
| LA-TEST-003 | HTTP semántico excepciones | TC-019 |

---

## 8. Criterios de entrada y salida

### Criterios de entrada (TODOS obligatorios)
- [x] Docker Compose up — backend + frontend + postgres + redis
- [x] Flyway V27 ejecutada (`bizum_*` tablas presentes)
- [x] OTP bypass `123456` activo en staging
- [x] Token JWT válido disponible para pruebas
- [x] Code Review APPROVED (G-5 aprobado)

### Criterios de salida (exit criteria G-6)
- TC-F022-001..019 ejecutados: ≥ 90% PASS (máx. 2 FAIL no bloqueantes)
- TC-F022-020 E2E: PASS
- TC-F022-021..025 integración: 5/5 PASS
- 0 defectos críticos abiertos
- Cobertura funcional: 11/11 RNs verificadas
- Cobertura de seguridad: OTP, rate limit, enmascaramiento y GDPR validados

---

## 9. Gestión de defectos (CMMI L3)

| Severidad | Criterio | Acción |
|---|---|---|
| Crítico | Fallo en OTP/SCA, datos sin enmascarar, HTTP 500 | NC Jira bloqueante — no se aprueba G-6 |
| Alto | Límite no aplicado, TTL incorrecto, error HTTP semántico | NC Jira — fix antes de G-6 |
| Medio | UX discrepante con prototipo, paginación incorrecta | Issue Jira — fix o deferir |
| Bajo | Texto, alineación, sugerencias UX | Registrado — deferir si no es bloqueante |

---

*QA Tester Agent — SOFIA v2.7 — Step 6 — Sprint 24 — 2026-04-14*
