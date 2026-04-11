# Análisis Funcional — FEAT-021: Depósitos a Plazo Fijo
**Sprint 23 · BankPortal · Banco Meridian · FA-Agent v2.7**

---

## FA-021-A — Consulta de Depósitos Activos

**Descripción funcional:** El cliente accede al portal y navega a la sección "Depósitos". El sistema presenta el listado paginado de todos sus depósitos a plazo fijo con información esencial: importe contratado, TIN/TAE, plazo, fechas de apertura y vencimiento, y estado actual (Activo, Vencido, Cancelado). Los depósitos con importe igual o inferior a 100.000€ muestran el badge del Fondo de Garantía de Depósitos para informar al cliente de la cobertura regulatoria.

**Actor:** Cliente autenticado de Banco Meridian.

**Reglas de negocio:** RN-F021-05 (FGD badge), RN-F021-10 (aislamiento entre clientes).

**Regulación:** Ley 44/2002 · FGD RDL 16/2011.

---

## FA-021-B — Detalle de Depósito y Cuadro de Liquidación IRPF

**Descripción funcional:** Al seleccionar un depósito del listado, el cliente accede al detalle completo incluyendo el cuadro de liquidación fiscal. El sistema calcula y muestra: intereses brutos al vencimiento, retención IRPF aplicada por tramos legales (19%/21%/23% según el importe de los intereses), e intereses netos que recibirá el cliente. Todos los cálculos se realizan con precisión decimal exacta para evitar errores de redondeo.

**Actor:** Cliente autenticado de Banco Meridian.

**Reglas de negocio:** RN-F021-04 (tramos IRPF), RN-F021-06 (BigDecimal), RN-F021-10.

**Regulación:** IRPF Art.25 Ley 35/2006 · Ley 44/2002.

---

## FA-021-C — Simulador de Depósito a Plazo Fijo

**Descripción funcional:** Herramienta de captación disponible sin necesidad de autenticación. El visitante o cliente introduce el importe que desea depositar y el plazo deseado (en meses). El sistema calcula instantáneamente la rentabilidad completa: TIN y TAE aplicables, intereses brutos al vencimiento, retención IRPF estimada por tramos, intereses netos y el importe total que recibirá. Los tipos de interés se obtienen de la configuración del producto (no hardcodeados) para permitir actualizaciones sin redespliegue.

**Actor:** Visitante o cliente (sin autenticación requerida).

**Reglas de negocio:** RN-F021-01 (mínimo 1.000€), RN-F021-02 (plazo 1-60 meses), RN-F021-03 (TIN configurable), RN-F021-04 (IRPF), RN-F021-06 (BigDecimal).

**Regulación:** Ley 44/2002 (información precontractual) · IRPF Art.25 Ley 35/2006.

---

## FA-021-D — Apertura de Depósito con Confirmación 2FA (SCA)

**Descripción funcional:** El cliente decide contratar un depósito tras revisar la simulación. Selecciona la cuenta de origen desde la que se debitará el importe, revisa las condiciones y confirma la operación introduciendo su código OTP de autenticación de segundo factor. El sistema valida la autenticación reforzada exigida por PSD2, comprueba la disponibilidad de saldo, registra el depósito en el sistema y debita el importe de la cuenta origen. El cliente recibe confirmación inmediata con el número de contrato y las condiciones pactadas.

**Actor:** Cliente autenticado de Banco Meridian.

**Reglas de negocio:** RN-F021-01, RN-F021-02, RN-F021-03, RN-F021-07 (renovación RENEW_MANUAL por defecto), RN-F021-08 (OTP obligatorio), RN-F021-10.

**Regulación:** PSD2 Dir.2015/2366 (SCA) · Ley 44/2002.

---

## FA-021-E — Instrucción de Renovación al Vencimiento

**Descripción funcional:** El cliente puede en cualquier momento durante la vida del depósito indicar qué debe ocurrir cuando llegue la fecha de vencimiento. Dispone de tres opciones: renovación automática (el sistema renueva el depósito al mismo plazo con el TIN vigente en ese momento), renovación manual (el sistema espera instrucción explícita del cliente al vencimiento) o cancelación al vencimiento (el importe más intereses netos se abonan en la cuenta origen). La instrucción por defecto es renovación manual para garantizar el control del cliente.

**Actor:** Cliente autenticado de Banco Meridian.

**Reglas de negocio:** RN-F021-07 (renovación manual por defecto), RN-F021-10.

**Regulación:** Ley 44/2002 (derecho a instrucciones al vencimiento).

---

## FA-021-F — Cancelación Anticipada con Penalización

**Descripción funcional:** Si el cliente necesita recuperar liquidez antes del vencimiento pactado, puede solicitar la cancelación anticipada del depósito. El sistema informa previamente de la penalización que se aplicará (calculada como porcentaje sobre los intereses devengados hasta la fecha de cancelación) y el importe neto que recibirá. El cliente confirma la operación con su OTP. El sistema cancela el depósito, calcula el importe final aplicando la penalización y abona el resultado en la cuenta origen.

**Actor:** Cliente autenticado de Banco Meridian.

**Reglas de negocio:** RN-F021-08 (OTP), RN-F021-09 (penalización configurable), RN-F021-10.

**Regulación:** Ley 44/2002 · PSD2 SCA.

---

## FA-021-G — Módulo Angular Depósitos — Frontend Portal

**Descripción funcional:** El portal web incorpora el módulo de Depósitos accesible desde el menú lateral de navegación. El módulo comprende cinco pantallas integradas: listado de depósitos, detalle con cuadro de liquidación fiscal, simulador público, formulario de contratación y tabla de amortización simplificada. El diseño respeta el Design System BankPortal v1.0 (tipografías, colores, espaciados) y cumple los criterios de accesibilidad WCAG 2.1 AA.

**Actor:** Cliente autenticado · Visitante (solo simulador).

**Reglas de negocio:** RN-F021-05 (badge FGD).

**Regulación:** WCAG 2.1 AA.

---

## FA-DEBT-023A — Cierre Deuda Técnica Sprint 23

**Descripción funcional:**

- **DEBT-036 — IBAN real en audit log:** El registro de auditoría de exportaciones pasa a incluir el IBAN real de la cuenta en lugar de un valor derivado, mejorando la trazabilidad de las operaciones de exportación de datos (LA-020-03).

- **DEBT-037 — Regex PAN Maestro 19 dígitos:** La validación de números de tarjeta se actualiza para aceptar correctamente los PAN Maestro de 19 dígitos, que hasta ahora eran rechazados erróneamente. Se añade validación Luhn. Resuelve CWE-20 (CVSS 2.1).

- **DEBT-044 — TAE/TIN externalizado:** Los tipos de interés TAE (préstamos) y TIN (depósitos) pasan de estar hardcodeados en el código a inyectarse desde `application.properties` por perfil de entorno, eliminando la necesidad de recompilar ante cambios de producto.

---

## Resumen FA Sprint 23

| Métrica | Valor |
|---|---|
| Funcionalidades nuevas | 8 (FA-021-A a FA-021-G + FA-DEBT-023A) |
| Reglas de negocio nuevas | 10 (RN-F021-01 a RN-F021-10) |
| Total acumulado funcionalidades | **86** |
| Total acumulado reglas de negocio | **198** |
| Sprints cubiertos | S1–S23 |
| Regulación nueva | Ley 44/2002 · IRPF Art.25 Ley 35/2006 · FGD RDL 16/2011 |

---

*Generado por FA-Agent v2.7 — SOFIA v2.7 — Sprint 23 — 2026-04-06*
