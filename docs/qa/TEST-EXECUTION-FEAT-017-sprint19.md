# Test Execution Log - FEAT-017 - Sprint 19

**BankPortal - Banco Meridian - SOFIA v2.2**

| Campo | Valor |
|---|---|
| Sprint | 19 |
| Feature | FEAT-017 Domiciliaciones y Recibos |
| Fecha | 2026-03-27T13:38:03.602539Z |
| Agente | Developer Agent |
| Stack | Java 21 JUnit 5 Mockito AssertJ / Angular 17 Jasmine Karma |

---

## Unit Tests - Backend Java

### IbanValidatorTest

```
[INFO] Running IbanValidatorTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.087s

[TEST] validSpanishIban                    PASSED  0.021s
[TEST] validGermanIban                     PASSED  0.008s
[TEST] ibanWithSpaces                      PASSED  0.006s
[TEST] invalidIbansThrow[ES000000...]      PASSED  0.012s  wrong checksum
[TEST] invalidIbansThrow[XX9121000...]     PASSED  0.004s  non-SEPA country
[TEST] invalidIbansThrow[ES12]             PASSED  0.003s  too short
[TEST] invalidIbansThrow[]                 PASSED  0.003s  blank
[TEST] nullIbanThrows                      PASSED  0.002s  null input
```

**Result: 8/8 PASSED**

---

### MandateCreateServiceTest

```
[INFO] Running MandateCreateServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.143s

[TEST] createMandate_happyPath
  ibanValidator.validate() called OK
  mandateRepo.hasDuplicateActive() -> false
  mandateRepo.save() called with status=ACTIVE
  Response status=ACTIVE creditorName=Gym Club SA
  PASSED  0.098s

[TEST] createMandate_duplicateThrows
  hasDuplicateActive() -> true
  MandateDuplicateException: Active mandate already exists
  mandateRepo.save() NEVER called
  PASSED  0.021s

[TEST] createMandate_invalidIbanThrows
  ibanValidator throws InvalidIbanException
  Exception propagated correctly
  mandateRepo.save() NEVER called
  PASSED  0.024s
```

**Result: 3/3 PASSED**

---

### MandateCancelServiceTest

```
[INFO] Running MandateCancelServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.198s

[TEST] cancelMandate_happyPath
  mandateRepo.findByIdAndUserId() -> Optional[mandate]
  calendar.getBusinessDayCutoff(today, 2) -> today+2
  debitRepo.hasPendingDebitBeforeCutoff() -> false
  mandate.cancel() -> status=CANCELLED cancelledAt=today
  mandateRepo.save(mandate) called
  PASSED  0.112s

[TEST] cancelMandate_psd2D2BlocksWhenPendingDebitExists
  hasPendingDebitBeforeCutoff() -> true
  MandateCancellationBlockedPsd2Exception thrown
  mandateRepo.save() NEVER called
  PASSED  0.056s

[TEST] cancelMandate_notFound
  findByIdAndUserId() -> Optional.empty()
  MandateNotFoundException thrown
  PASSED  0.030s
```

**Result: 3/3 PASSED**

---

### HolidayCalendarServiceTest

```
[INFO] Running HolidayCalendarServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.062s

[TEST] skipWeekend
  2026-05-08 Friday + 2 business days
  Skip Sat 2026-05-09  Skip Sun 2026-05-10
  Count Mon 2026-05-11 (1)  Tue 2026-05-12 (2)
  Result: 2026-05-12  PASSED  0.021s

[TEST] saturdayIsNotBusinessDay     PASSED  0.003s  2026-05-09 -> false
[TEST] mondayIsBusinessDay          PASSED  0.002s  2026-05-11 -> true
[TEST] nationalHolidayIsNotBusDay   PASSED  0.002s  2026-05-01 -> false
```

**Result: 4/4 PASSED**

---

## Unit Tests - Frontend Angular

```
Chrome Headless 124.0.0.0 (Mac OS X)
  DirectDebitService
    PASS should be created (12ms)
    PASS getMandates() calls GET /api/v1/direct-debits/mandates (8ms)
    PASS createMandate() calls POST /api/v1/direct-debits/mandates (6ms)
    PASS cancelMandate() calls DELETE mandates/{id} (5ms)
  ibanValidator
    PASS valid Spanish IBAN returns null (5ms)
    PASS valid German IBAN returns null (3ms)
    PASS IBAN with spaces normalised (3ms)
    PASS empty value returns null (2ms)
    PASS wrong checksum returns invalidIban error (4ms)
    PASS non-SEPA country returns notSepaCountry error (3ms)
```

**Result: 10/10 PASSED**

---

## Resumen total

| Suite | Tests | PASS | FAIL | Tiempo |
|---|---|---|---|---|
| IbanValidatorTest (Java) | 8 | 8 | 0 | 0.087s |
| MandateCreateServiceTest (Java) | 3 | 3 | 0 | 0.143s |
| MandateCancelServiceTest (Java) | 3 | 3 | 0 | 0.198s |
| HolidayCalendarServiceTest (Java) | 4 | 4 | 0 | 0.062s |
| DirectDebitService spec (Angular) | 4 | 4 | 0 | 0.031s |
| ibanValidator spec (Angular) | 6 | 6 | 0 | 0.020s |
| **TOTAL** | **28** | **28** | **0** | **0.541s** |

**ALL TESTS PASSED - 28/28 - 0 failures - 0 errors**

---

*Developer Agent - CMMI TS SP 2.2 3.1 - SOFIA v2.2 - BankPortal - Sprint 19*