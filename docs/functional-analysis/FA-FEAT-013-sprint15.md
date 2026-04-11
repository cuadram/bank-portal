# Análisis Funcional — FEAT-013: Onboarding KYC y Verificación de Identidad
**Sprint 15 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V15 migración BD, UploadDocumentUseCase.java, ReviewKycUseCase.java, US-1301/1302]*

---

## Contexto de negocio

La regulación bancaria obliga a verificar la identidad del cliente antes de habilitarle
el acceso a servicios de pago de alto riesgo. BankPortal implementa el proceso KYC
(Know Your Customer) de forma digital: el cliente sube sus documentos de identidad,
el banco los revisa y, si son válidos, se activa el nivel de acceso completo.

---

## FA-013-A — Inicio del Proceso KYC

**Módulo:** KYC / Onboarding
**Actores:** Cliente
**Regulación:** Directiva AML/KYC (UE 2015/849), normativa Banco de España

### Descripción funcional
El cliente que aún no ha verificado su identidad ve en la app un flujo guiado de
onboarding. El proceso solicita la carga de los documentos de identidad (DNI, NIE
o Pasaporte, anverso y reverso) y acepta las condiciones del servicio.

### Reglas de negocio
- **RN-F013-01:** El acceso a transferencias y servicios de pago requiere KYC aprobado
- **RN-F013-02:** El proceso KYC puede interrumpirse y retomarse en cualquier momento antes de enviar

---

## FA-013-B — Carga de Documentos de Identidad

**Módulo:** KYC / Documentos
**Actores:** Cliente
**Regulación:** GDPR (datos biométricos), normativa KYC

### Descripción funcional
El cliente sube las imágenes del documento de identidad elegido (máximo 2 caras).
Los ficheros se cifran en reposo con AES-256 y se almacena solo la ruta al fichero
cifrado, nunca el binario en base de datos.

### Reglas de negocio
- **RN-F013-03:** Los documentos se almacenan cifrados (AES-256); nunca en claro en base de datos (ADR-023)
- **RN-F013-04:** Se verifica el hash SHA-256 del documento al subir para detectar ficheros corruptos
- **RN-F013-05:** Tipos de documento aceptados: DNI, NIE, Pasaporte

---

## FA-013-C — Revisión y Resolución KYC

**Módulo:** KYC / Revisión
**Actores:** Revisor del Banco (interno)
**Regulación:** AML/KYC, normativa Banco de España

### Descripción funcional
El equipo de cumplimiento del banco revisa los documentos subidos y aprueba o rechaza
la verificación con un motivo. El cliente recibe notificación del resultado. Si es
rechazado, puede reiniciar el proceso con documentos corregidos.

### Reglas de negocio
- **RN-F013-06:** El rechazo KYC debe incluir siempre un motivo que se comunica al cliente
- **RN-F013-07:** Un KYC aprobado no caduca mientras los documentos de identidad estén vigentes
