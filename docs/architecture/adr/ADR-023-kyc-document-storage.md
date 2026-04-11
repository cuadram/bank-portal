# ADR-023 — Almacenamiento de documentos KYC: Filesystem local cifrado vs Object Storage

## Metadata

| Campo | Valor |
|---|---|
| ID | ADR-023 |
| Feature | FEAT-013 — US-1302 |
| Fecha | 2026-03-23 |
| Estado | Aceptado |
| Autor | SOFIA Architect Agent |

## Contexto

Los documentos KYC (DNI, NIE, Pasaporte) son datos de identidad especiales bajo
RGPD Art.9 que deben almacenarse cifrados en reposo. Se necesita decidir el backend
de almacenamiento para el MVP de Sprint 15.

## Decisión

**Filesystem local cifrado con AES-256** vía `LocalEncryptedDocumentStorage`.
Clave gestionada por variable de entorno `KYC_ENCRYPTION_KEY` (32 bytes Base64).
Path configurable via `KYC_STORAGE_PATH`.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Filesystem local cifrado AES-256** | Cero dependencias externas; control total; MVP rápido; cifrado RGPD Art.9 | No escalable horizontalmente; backup manual; no CDN |
| AWS S3 / MinIO con SSE | Escalable; redundancia nativa; SDK maduro | Nueva dependencia infra; configuración compleja para MVP; coste |
| HashiCorp Vault con Transit Secrets | Gestión de claves empresarial | Over-engineering para MVP; curva aprendizaje |

## Consecuencias

- **Positivas:** Sin nueva infraestructura para STG. Cifrado AES-256 cumple RGPD Art.9.
  `DocumentStoragePort` desacopla la implementación — migración a S3 en Sprint futuro sin cambiar use cases.
- **Trade-offs:** No válido para despliegues multi-instancia sin NFS/volumen compartido.
- **Plan de migración:** Sprint 18+ — reemplazar `LocalEncryptedDocumentStorage` por `S3DocumentStorage` sin cambiar la interfaz del puerto.
- **Impacto:** Solo el nuevo módulo `kyc` — sin cambios en servicios existentes.
