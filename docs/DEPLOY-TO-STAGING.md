# CORE 1.0 — Guía de despliegue a Staging

> **Estado: BORRADOR / NO EJECUTAR TODAVÍA.** Esta guía prepara una futura ventana de despliegue. La pausa operativa de Cloudflare sigue vigente. No hacer deploy, migraciones, pruebas E2E ni cambios de cuenta hasta que los incidentes estén resueltos y exista autorización explícita.

## 1. Alcance y condiciones de entrada

El destino previsto es el entorno aislado `staging`, nunca `main` ni producción.

Antes de ejecutar cualquier comando de escritura, confirmar:

1. PR #3 revisado y aprobado; merge exclusivamente a la rama `staging`, por una persona autorizada.
2. Incidentes de Cloudflare `Workers` y `Durable Objects` en estado **Resolved**.
3. Autorización explícita para reanudar la fase de despliegue.
4. Revisión de seguridad y configuración específica de staging completada.
5. Backup/plan de recuperación de los Durable Objects y aprobación de sus migraciones.

**Bloqueo de configuración detectado en el estado actual del repositorio:** `wrangler.jsonc` se llama `aston-core-1-0-local` y declara únicamente `AGENT_IDENTITY` y `STAGING_INVOCATION_LEDGER`. No declara un entorno `staging`, el binding de servicio `MODEL_RUNNER`, el Durable Object `PERMIT_REPLAY_GUARD`, Workers AI, ni la configuración del Worker aislado Model Runner. El código exporta `PermitReplayGuard`, pero la clase no está vinculada en la configuración existente. Por tanto, **no existe todavía un conjunto de comandos de deploy completo y seguro que pueda ejecutarse contra la configuración actual**.

Antes del primer deploy deben prepararse y revisarse dos configuraciones independientes (nombres propuestos, todavía inexistentes):
- `wrangler.staging.jsonc`: Worker PEP/CORE, con bindings y migraciones de staging.
- `wrangler.model-runner.staging.jsonc`: Worker Model Runner, Workers AI, binding SQLite Durable Object `PERMIT_REPLAY_GUARD` y sus migraciones.

También debe definirse el Service Binding desde el Worker PEP hacia el Worker Model Runner. No inventar IDs, nombres de servicio, account IDs, rutas, certificados ni valores de secretos. Verificar los nombres finales en los archivos aprobados antes de continuar.

## 2. Preparación local (solo lectura / validación)

Requisitos: Node.js 22+, npm y Wrangler compatible fijado por el proyecto.

```bash
git fetch origin
git switch staging
git pull --ff-only origin staging
git status --short
node --version
npm --version
npx wrangler --version
```

Confirmar que el árbol de trabajo está limpio y que `staging` contiene el merge aprobado. Luego:

```bash
npm install --ignore-scripts --no-audit --no-fund --legacy-peer-deps
npm test
```

No continuar si alguna prueba falla. La evidencia previa de 31/31 corresponde al commit probado por RUN #89; repetir la suite sobre el SHA exacto que se pretende desplegar.

Autenticación/identidad de cuenta (lectura):

```bash
npx wrangler whoami
```

Comprobar manualmente que la cuenta y el usuario corresponden al proyecto y al entorno autorizado. No copiar credenciales a logs ni al repositorio.

## 3. Configuración y secretos — no imprimir valores

Los siguientes son los nombres de configuración observados en el código. Deben provisionarse en el Worker correcto y en el entorno `staging` solamente. Los comandos son plantillas de terminal interactiva: Wrangler solicita el valor sin que deba pegarse en un chat, commit o archivo versionado.

### 3.1 Worker PEP/CORE

Secrets:
- `ACCESS_JWKS_JSON` **o** `ACCESS_JWKS_URL` (configurar una sola fuente válida; JWKS real del Access de staging).
- `PERMIT_SIGNING_PRIVATE_KEY` (clave privada Ed25519 del emisor de permits; custodiar fuera del repositorio).
- `STAGING_HARNESS_TOKEN` (token aleatorio de staging; mantener la ruta de harness deshabilitada salvo ventana de prueba aprobada).

Comandos, una vez creado y revisado `wrangler.staging.jsonc` con el entorno y bindings correctos:

```bash
npx wrangler secret put ACCESS_JWKS_JSON --config wrangler.staging.jsonc --env staging
# Alternativa a la anterior, no ambas:
npx wrangler secret put ACCESS_JWKS_URL --config wrangler.staging.jsonc --env staging
npx wrangler secret put PERMIT_SIGNING_PRIVATE_KEY --config wrangler.staging.jsonc --env staging
npx wrangler secret put STAGING_HARNESS_TOKEN --config wrangler.staging.jsonc --env staging
```

Variables no secretas que también deben configurarse de forma explícita y revisada en el entorno: `ACCESS_ISSUER`, `ACCESS_AUD`, `ACCESS_ADMIN_ROLE` (valor esperado por defecto: `aston-admin`), `ACCESS_TENANT_ID` cuando corresponda, `PEP_CERT_ALLOWLIST`, `PEP_REVOKED_PRINCIPALS`, `MODEL_INVOCATION_COST_MINOR` y `STAGING_HARNESS_ENABLED=false` por defecto. La allowlist debe contener fingerprints SHA-256, issuer/subject RFC2253, principal y tenant verificados fuera de banda. No reutilizar certificados ni tokens de producción.

### 3.2 Worker Model Runner aislado

Secrets:
- `PERMIT_SIGNING_PUBLIC_KEY` (parte pública correspondiente a la clave privada configurada en el PEP).
- `VIOLATION_SIGNING_PRIVATE_KEY` (clave Ed25519 separada para informes de violación).
- `VIOLATION_SIGNING_KEY_ID`.
- `PERMIT_SIGNING_KEY_ID`.

Comandos, únicamente después de crear/revisar `wrangler.model-runner.staging.jsonc` y confirmar su binding de Workers AI, el Durable Object replay guard y las migraciones:

```bash
npx wrangler secret put PERMIT_SIGNING_PUBLIC_KEY --config wrangler.model-runner.staging.jsonc --env staging
npx wrangler secret put PERMIT_SIGNING_KEY_ID --config wrangler.model-runner.staging.jsonc --env staging
npx wrangler secret put VIOLATION_SIGNING_PRIVATE_KEY --config wrangler.model-runner.staging.jsonc --env staging
npx wrangler secret put VIOLATION_SIGNING_KEY_ID --config wrangler.model-runner.staging.jsonc --env staging
```

El Model Runner también necesita el binding de Workers AI y el Durable Object `PERMIT_REPLAY_GUARD`; no se crean con `secret put`. Deben declararse en su configuración Wrangler, con clase y migración SQLite correctas. El Worker PEP necesita un Service Binding llamado `MODEL_RUNNER` que apunte al servicio staging correcto. No desplegar si alguno falta.

## 4. Despliegue controlado — solo después de autorización

Primero desplegar el Worker Model Runner aislado; después el Worker PEP/CORE. Estos comandos son futuros y no se han ejecutado:

```bash
npx wrangler deploy --config wrangler.model-runner.staging.jsonc --env staging
npx wrangler deploy --config wrangler.staging.jsonc --env staging
```

Revisar la salida de Wrangler, el nombre del Worker, environment, versión y migraciones. Si el nombre/entorno no coincide exactamente con staging, cancelar. No usar `--env production`, no desplegar desde `main` y no ejecutar comandos de migración manuales no incluidos en las configuraciones revisadas.

## 5. Verificación posterior

Definir `STAGING_WORKER_URL` con el hostname real que Wrangler muestre para el Worker PEP de staging. No asumir ni inventar el hostname.

```bash
curl --fail-with-body --silent --show-error \
  "${STAGING_WORKER_URL}/healthz"
```

Respuesta esperada del código actual: HTTP 200 con JSON `{"ok":true,"service":"aston-core-1.0-reference"}`. Esto comprueba disponibilidad básica, no la cadena completa de autorización.

Comprobar que el harness permanece deshabilitado por defecto:

```bash
curl -i -X POST "${STAGING_WORKER_URL}/v1/audit-target" \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: staging-preflight-0001' \
  --data '{"testId":"PROMPT_INJ_01"}'
```

Con `STAGING_HARNESS_ENABLED=false`, la respuesta esperada es HTTP 404 `STAGING_HARNESS_DISABLED`. No habilitar el harness ni enviar el bearer token hasta que exista una ventana de prueba aprobada.

Luego, y solo con aprobación específica, realizar pruebas E2E de Access real, mTLS real, Service Binding, permit Ed25519, replay Durable Object, revocación, tenant isolation, fail-closed, ledger y el fixture `PROMPT_INJ_01`. Usar identidades, modelos, tenant y datos sintéticos dedicados a staging. Confirmar cero invocaciones en cada caso DENY y una sola invocación en el canary ALLOW. Guardar request IDs, respuestas saneadas, logs y SHA desplegado como evidencia; nunca guardar tokens ni claves privadas.

Observación de logs (solo durante la ventana aprobada):

```bash
npx wrangler tail --config wrangler.staging.jsonc --env staging
npx wrangler tail --config wrangler.model-runner.staging.jsonc --env staging
```

## 6. Criterios de salida / rollback

No considerar staging validado hasta que:
- Los dos Workers y sus bindings estén identificados y desplegados en staging.
- Access, mTLS y Service Binding reales hayan sido verificados.
- Replay guard rechace un segundo uso del mismo permit sin invocar AI.
- Las denegaciones de SafetyInterlock no produzcan llamadas al modelo.
- Revocación, aislamiento de tenant, presupuesto y límites de concurrencia hayan pasado pruebas.
- Se haya verificado el ledger y se conserven evidencias correlacionadas.
- El procedimiento de recuperación de Durable Objects esté probado y aprobado.

Ante cualquier 5xx inesperado, binding ausente, resultado ambiguo, incremento de invocaciones no esperado o discrepancia de entorno: detener las pruebas, no reintentar ciegamente, preservar logs/IDs y escalar para análisis. No borrar/recrear Durable Objects ni limpiar leases/replay state sin procedimiento de recuperación aprobado.

## 7. Límites conocidos

- RUN #89 valida 31 pruebas automatizadas en GitHub Actions/Miniflare para el SHA documentado; no es una prueba E2E alojada en Cloudflare.
- El harness `PROMPT_INJ_01` es un fixture determinista de denegación, no un detector semántico general de prompt injection.
- El Model Runner, replay guard, claves, Workers AI y Service Binding aún no están configurados ni validados en Cloudflare.
- El batching Merkle sigue siendo en memoria y no ancla por sí mismo a Bitcoin/OpenTimestamps.
- Esta guía no autoriza un despliegue ni declara el sistema listo para producción.
