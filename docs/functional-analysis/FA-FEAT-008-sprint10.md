# Análisis Funcional — FEAT-008: Transferencias Bancarias
**Sprint 10 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V11 migración BD, transfers/beneficiaries tablas, US-801/802/803/804]*

---

## Contexto de negocio

Las transferencias bancarias son la operación de mayor riesgo del portal. BankPortal
implementa un flujo de transferencia seguro con verificación SCA para importes elevados,
gestión de beneficiarios frecuentes y límites operativos configurados por el banco para
proteger al cliente.

---

## FA-008-A — Transferencia Inmediata

**Módulo:** Transferencias
**Actores:** Cliente
**Regulación:** PSD2 Art. 97 (SCA para importes > umbral), SEPA Credit Transfer

### Descripción funcional
El cliente realiza una transferencia a otra cuenta (propia o de tercero) indicando
IBAN destino, importe y concepto. BankPortal valida el formato IBAN, verifica que el
importe no supera los límites operativos y, si el importe supera el umbral PSD2, exige
segundo factor de autenticación. La transferencia se ejecuta en tiempo real.

### Reglas de negocio
- **RN-F008-01:** El importe siempre se opera en precisión decimal (DECIMAL 15,2); nunca con punto flotante
- **RN-F008-02:** Las transferencias que superan el límite por operación requieren 2FA (SCA)
- **RN-F008-03:** El límite por operación predeterminado es 2.000€; el límite diario acumulado es 3.000€; el mensual 10.000€

---

## FA-008-B — Libreta de Beneficiarios

**Módulo:** Transferencias / Beneficiarios
**Actores:** Cliente
**Regulación:** PSD2

### Descripción funcional
El cliente guarda beneficiarios frecuentes (alias + IBAN + nombre titular) para
agilizar transferencias posteriores. La libreta se gestiona con alta, consulta y baja
de beneficiarios.

### Reglas de negocio
- **RN-F008-04:** Un cliente no puede tener dos beneficiarios activos con el mismo IBAN
- **RN-F008-05:** La baja de un beneficiario es un borrado lógico (soft delete); el historial de transferencias se conserva

---

## FA-008-C — Límites de Transferencia

**Módulo:** Transferencias
**Actores:** Cliente, Banco (configuración)
**Regulación:** PSD2, Política interna Banco Meridian

### Descripción funcional
Cada cliente tiene límites de transferencia (por operación, diario, mensual) configurados
por el banco en el contrato. BankPortal verifica estos límites antes de ejecutar cada
operación y acumula el importe transferido en Redis con TTL.

### Reglas de negocio
- **RN-F008-06:** Los límites de transferencia son establecidos por el banco; el cliente no puede modificarlos
- **RN-F008-07:** El acumulado diario se calcula en UTC y se resetea a medianoche
