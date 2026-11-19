# ASTON OS — Manual de Procedimiento y Continuidad

**Versión:** 1.0.0-draft  
**Fecha de apertura:** 2026-11-19  
**Estado:** DOCUMENTACIÓN PROPUESTA — pendiente de revisión y aprobación por PR  
**Repositorio rector propuesto:** `adminastonpay-blip/aston-trust-infrastructure`  
**Rama de trabajo:** `docs/aston-operating-manual-continuity`

> Este manual conserva el hilo de trabajo y establece cómo avanzar sin perder trazabilidad. No constituye autorización para desplegar, migrar bases de datos, modificar secretos/bindings, fusionar PRs ni cambiar sistemas productivos.

---

## 1. Propósito y autoridad documental

Este repositorio funciona como punto de referencia documental para la arquitectura, gobernanza y continuidad de ASTON. El manual coordina el trabajo entre repositorios; no reemplaza el código, las pruebas, los contratos técnicos ni la autoridad de cada repositorio.

Orden de referencia:

1. **Master Specification:** define arquitectura, principios, límites y objetivos.
2. **Este Manual de Procedimiento:** define cómo se trabaja, registra, revisa y retoma el proyecto.
3. **Master Planner:** descompone objetivos en tareas, dependencias, responsables, evidencias y gates. Debe mantenerse como documento separado y derivarse de auditorías verificadas.
4. **Repositorios de implementación:** son la fuente de verdad para código, configuración, pruebas y workflows.
5. **Evidencia de ejecución:** logs, resultados de CI, artefactos, hashes, despliegues y validaciones fechadas.

Documento de arquitectura relacionado: `docs/ASTON-IMMUNE-FABRIC-2040-MASTER-SPEC.md`, actualmente conocido en la rama `docs/aston-immune-fabric-2040-master-spec`. Antes de tratarlo como integrado en `main`, verificar su PR/merge y SHA. No asumir que una rama equivale a una versión aprobada.

## 2. Repositorios dentro del mapa de trabajo

Mapa provisional establecido por la especificación:

| Repositorio | Responsabilidad provisional |
|---|---|
| `adminastonpay-blip/agente-OS-15.5-hector-zapata` | Runtime ASTON OS, agentes, orquestación, rutas y ejecución |
| `adminastonpay-blip/aston-trust-infrastructure` | Arquitectura, gobernanza, políticas y documentación Trust Fabric |
| `adminastonpay-blip/aston-attestation-sdk` | SDK de atestación, integridad, verificación y evidencia |
| `adminastonpay-blip/aston-risk-protocol` | Vocabulario, contratos y protocolo de riesgo |

`aston-ots-verifier` puede figurar como componente auxiliar si una auditoría demuestra dependencia; no se incorpora al alcance principal sin justificarlo.

Este mapa es **provisional**. Cada responsabilidad debe confirmarse contra el árbol, los call paths, las dependencias y la evidencia del repositorio correspondiente.

## 3. Reglas obligatorias de procedimiento

### 3.1 Antes de cada tarea

1. Identificar el repositorio, rama base y SHA exacto.
2. Leer el estado actual del archivo y los cambios pendientes.
3. Revisar PRs abiertas y evitar duplicar trabajo.
4. Definir alcance, riesgo, dependencias y criterio de aceptación.
5. Elegir el cambio mínimo que resuelva el problema.
6. Mantener una rama aislada y descriptiva.
7. Registrar qué queda explícitamente fuera de alcance.

### 3.2 Durante el trabajo

- No borrar ni reemplazar componentes funcionales por conveniencia.
- No fusionar proyectos ni repositorios sin una decisión arquitectónica documentada.
- No modificar producción, Cloudflare, D1, KV, R2, Vectorize, Durable Objects, bindings o secretos como parte de una tarea documental.
- No ejecutar migraciones ni despliegues sin autorización expresa y plan de reversión.
- No introducir credenciales, secretos, tokens ni PII en código, logs o documentación.
- No confiar en datos de tenant enviados por el cliente; la identidad y el tenant deben derivarse de una fuente autenticada y verificable.
- No inventar sintaxis de APIs: inspeccionar versiones, tipos y usos existentes antes de implementar.
- Si una comprobación no puede realizarse, marcarla como PENDING o NOT_CHECKED; no convertirla en PASS.

### 3.3 Pull requests y aprobaciones

- Todo cambio debe realizarse en una rama independiente.
- Abrir PR con objetivo, alcance, archivos afectados, riesgos, pruebas, limitaciones y rollback.
- No desactivar reglas de protección ni forzar fusiones.
- No fusionar una PR solo porque el código compila o algunos checks pasan.
- Requerir revisión humana y checks exigidos por el repositorio.
- El usuario conserva la decisión final de merge y deploy.
- Una PR abierta no equivale a cambio integrado; una PR fusionada no equivale a producción.

## 4. Estados de madurez y evidencia

Usar exactamente estos estados:

- **DESIGNED:** especificado; no prueba implementación.
- **IMPLEMENTED:** existe código/configuración; no prueba comportamiento correcto.
- **TESTED:** pruebas identificadas y ejecutadas con resultados reproducibles.
- **VALIDATED:** pruebas suficientes para el alcance declarado, incluidos escenarios adversariales cuando correspondan.
- **PRODUCTION:** desplegado y verificado en el entorno productivo indicado.

Cada afirmación de estado debe incluir:

- repositorio y ruta;
- rama y commit SHA;
- entorno;
- fecha;
- alcance de la prueba;
- resultado y evidencia;
- limitaciones conocidas.

Estados auxiliares de verificación: `VERIFIED`, `FAILED`, `PENDING`, `INDETERMINATE`, `SIMULATED`, `NOT_CHECKED`. Nunca presentar `SIMULATED`, `PENDING` o `NOT_CHECKED` como verificado.

## 5. Protocolo de auditoría

Para cada repositorio, registrar:

1. URL, visibilidad, rama por defecto y SHA de HEAD.
2. Árbol de archivos y módulos relevantes.
3. PRs abiertas, ramas activas y cambios no integrados.
4. Workflows, checks, permisos y resultados recientes.
5. Tests disponibles, comandos y resultados efectivamente ejecutados.
6. Dependencias, licencias y alertas de seguridad disponibles.
7. Rutas de ejecución y puntos de enforcement reales.
8. Bindings/configuración declarados frente a evidencia de despliegue.
9. Brechas, severidad, impacto, propietario y recomendación.
10. Evidencia enlazada y fecha de última comprobación.

Una auditoría de código fuente no demuestra que el sistema esté desplegado. Un workflow exitoso no demuestra cobertura completa. Una configuración presente no demuestra que el binding remoto exista.

## 6. Riesgos y bloqueos conocidos al abrir este manual

Estos puntos se registran como contexto de continuidad, no como auditoría recién ejecutada:

### P1 — Aislamiento multi-tenant de RAG

En la revisión previa de la PR `fix/lineage-tenant-isolation` del repositorio `agente-OS-15.5-hector-zapata` se observó una brecha potencial: la ruta de ingesta RAG no persistía tenant en todos los registros/metadata y la consulta Vectorize revisada no aplicaba filtro de tenant. La PR aislaba lineage, pero no demostraba aislamiento completo de recuperación RAG.

**Acción requerida:** revalidar la rama y el SHA actuales; inspeccionar todos los caminos de ingesta, consulta y ETL; verificar el filtro real soportado por la versión de Vectorize; agregar pruebas de aislamiento entre tenants, tenant ausente y vectores legacy sin tenant. No fusionar mientras esta brecha siga sin resolver.

### P1 — Cobertura de SafetyInterlock

La cobertura del control gate en todos los caminos de ejecución (API, agentes, tools/MCP, colas, retries, admin/break-glass, recovery, conectores y rutas alternativas) debe demostrarse mediante inventario de call paths y pruebas. No asumir que un gate parcial cubre todo el runtime.

### P2 — Evidencia de despliegue e infraestructura

La existencia de configuración Cloudflare o bindings en dashboard no demuestra despliegue validado. Registrar evidencia por entorno; no modificar infraestructura desde este procedimiento.

### P2 — Criptografía, attestation y timestamping

Distinguir código implementado, pruebas locales, verificación externa y anclaje público efectivamente confirmado. No hacer afirmaciones globales de SLSA, inmutabilidad o timestamp Bitcoin sin evidencia específica.

## 7. Línea base de continuidad al 2026-11-19

La siguiente línea base procede de conversaciones y revisiones anteriores y requiere reconfirmación contra GitHub antes de usarse como estado actual:

- Repositorio de implementación principal: `agente-OS-15.5-hector-zapata`.
- PR #36: fail-closed ante secreto PII HMAC ausente/corto; abierta en el último estado conocido, no fusionada. Requiere configurar el secreto seguro en Cloudflare antes de desplegar.
- PR #37: aislamiento de lineage por tenant; abierta en el último estado conocido. No considerar resuelto el aislamiento RAG completo.
- Se informó previamente ASTON OS CORE 23/23 tests; debe verificarse commit, suite y ejecución antes de repetirlo como dato vigente.
- SafetyInterlock, Trust Fabric, gobernanza de agentes, detección, attestation y recovery tienen grados parciales de implementación según revisiones previas; no declarar validación integral sin nueva evidencia.
- La Master Specification 2040 es una línea base de arquitectura en borrador, no prueba de implementación ni autorización de producción.

## 8. Secuencia de trabajo y gates

### Fase A — Baseline y auditoría (actual)

- Confirmar ramas por defecto y SHA de los cuatro repositorios.
- Auditar PRs, workflows, tests, dependencias y call paths.
- Construir matriz de módulos, contratos y dependencias.
- Registrar brechas con evidencia y severidad.
- Gate A: inventario reproducible y brechas priorizadas; sin cambios de runtime.

### Fase B — Contratos e integración

- Resolver autoridad de identidad/tenant, permisos, tokens, riesgo y evidencia.
- Definir versiones y compatibilidad de contratos.
- Definir propiedad de cada módulo y límites entre repos.
- Gate B: ADRs revisados y contratos aceptados.

### Fase C — Integración controlada

- Ejecutar solo tareas aprobadas, una por PR.
- Añadir pruebas unitarias, integración, aislamiento y regresión.
- Mantener rollback y separación de entornos.
- Gate C: checks, revisión y evidencia de integración.

### Fase D — Validación adversarial y piloto

- Pruebas de abuso, tenant confusion, replay, escalación, bypass, supply chain, evidencia y recuperación.
- Validación independiente para afirmaciones de seguridad relevantes.
- Piloto acotado con criterios de salida y rollback.
- Gate D: informe de validación firmado y límites declarados.

### Fase E — Escala y evolución 2030–2040

- Despliegues y modelos de operación solo tras pruebas.
- Agilidad criptográfica y preparación post-cuántica basadas en evidencia.
- Medición de resiliencia, RTO/RPO y operación degradada.
- Gate E: revisión periódica de riesgos, compatibilidad y evidencia.

## 9. Formato obligatorio de cada tarea del Master Planner

Cada tarea debe tener:

- ID único;
- objetivo y justificación;
- repositorio/ruta;
- rama base y SHA;
- dependencias;
- estado de madurez;
- riesgo/severidad;
- archivos previstos;
- pruebas y criterios de aceptación;
- evidencia requerida;
- rollback;
- autorización requerida;
- PR/commit final y resultado.

No iniciar tareas cuyo alcance, propietario o criterio de aceptación no estén claros.

## 10. Registro de continuidad — sesión de apertura

**Fecha:** 2026-11-19  
**Acción:** creación propuesta de este manual en rama documental independiente.  
**Cambios autorizados:** documentación solamente.  
**No autorizados:** merge, deploy, cambios de runtime, Cloudflare, secretos, bindings o migraciones.  
**Próximo paso:** completar auditoría read-only de los cuatro repositorios del mapa principal, fijar sus SHA actuales y crear el Master Planner basado exclusivamente en evidencia.  
**Bloqueo prioritario:** cerrar y volver a probar el aislamiento RAG multi-tenant antes de considerar completa la PR de lineage.

---

## 11. Plantilla para retomar cualquier sesión

Al comenzar una nueva sesión, actualizar esta sección con evidencia:

- Última fecha de actualización:
- Repositorio y SHA revisados:
- Última PR/commit:
- Último cambio integrado:
- Checks verificados:
- Pendientes P0/P1:
- Tarea activa:
- Próximo paso único:
- Bloqueos:
- Acciones expresamente no autorizadas:

**Regla de continuidad:** si no hay evidencia nueva, conservar el estado anterior y marcarlo como pendiente de reconfirmación. No reiniciar el proyecto ni alterar porcentajes de progreso por estimación.
