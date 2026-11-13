# ASTON OS — Enterprise Risk Mitigation & Due Diligence

**Documento:** ENTERPRISE-RISK-MITIGATION  
**Clasificación:** Due diligence técnica y de gobierno — documento de trabajo  
**Versión:** 1.0  
**Fecha:** 2026-11-13  
**Repositorio:** `adminastonpay-blip/aston-trust-infrastructure`  
**Rama:** `chore/security-standardization`  
**Estado:** Propuesta documentada; sujeto a revisión técnica, legal y de gobierno  
**Regla de evidencia:** ninguna capacidad se considera validada por estar descrita en este documento. Cuando corresponda se utiliza literalmente: **“Capacidad propuesta, pendiente de validación en entorno real”.**

---

## 1. Executive Risk Assessment

### Resumen ejecutivo

ASTON OS se encuentra en una etapa en la que la arquitectura, los controles de seguridad y la evidencia de desarrollo deben distinguirse rigurosamente de la operación validada. Los cinco riesgos prioritarios identificados no son afirmaciones de que haya ocurrido un incidente; son escenarios que deben mitigarse y probarse antes de presentar garantías a clientes, auditores o inversores.

| Riesgo | Exposición principal | Evaluación preliminar | Tratamiento requerido |
|---|---|---|---|
| Dependencia de proveedor (vendor lock-in) | Componentes de ejecución, almacenamiento, identidad, IA y eventos vinculados a Cloudflare u otros proveedores | Alto hasta demostrar portabilidad | Adaptadores, contratos internos, exportación de datos y pruebas de sustitución |
| Evasión de SafetyInterlock | Una ruta de ejecución podría invocar directamente una capacidad de IA sin pasar por el control central | Crítico si existe una ruta no mediada; estado real no demostrado aquí | Inventario de capacidades, aislamiento de permisos, pruebas negativas y verificación de rutas |
| Auditoría criptográfica y anclaje | Confundir integridad verificable por lotes con anclaje inmediato en Bitcoin | Medio/alto por riesgo de promesa incorrecta y latencia | Modelo explícito de lotes, raíces Merkle, política de publicación y verificación independiente |
| Límites regulatorios | Confundir evidencia técnica con custodia, administración o ejecución de sanciones financieras | Alto si se mezclan funciones | Separación contractual, técnica y operativa; revisión jurídica por jurisdicción |
| Dependencia de fundador/persona clave | Conocimiento, credenciales, decisiones y operación concentrados | Alto mientras no exista continuidad demostrable | Gobierno, documentación, segregación de funciones y equipo de respaldo |

Las calificaciones son una evaluación cualitativa inicial, no el resultado de un análisis cuantitativo ni de una auditoría independiente. Deben revisarse con propietarios de riesgo, datos de incidentes, arquitectura efectiva, jurisdicciones y controles implementados.

### Criterio de aceptación para due diligence

ASTON OS no debe declarar un riesgo mitigado únicamente porque exista un diseño, una política o un workflow. Para cada control se requiere: (1) responsable identificado, (2) implementación inspeccionable, (3) prueba reproducible, (4) resultado fechado y asociado a un commit o versión, y (5) evidencia de operación en el entorno que corresponda. La validación de CI no equivale a validación de producción.

### Estado operativo y restricción vigente

Al emitir esta versión se mantiene una pausa operativa preventiva vinculada a incidentes reportados en Cloudflare Workers y Durable Objects. Hasta que ambos estados estén **Resolved** y exista autorización expresa para reanudar, este plan no autoriza pruebas E2E, despliegues, cambios de configuración, cambios de workflows ni acciones en Cloudflare. La documentación no modifica esa restricción.

---

## 2. Arquitectura Anti-Lock-in

### Objetivo

Reducir el acoplamiento entre el dominio de ASTON OS y los servicios concretos de infraestructura. La portabilidad no se demuestra mediante una lista de proveedores alternativos: requiere que los límites internos sean explícitos y que una implementación alternativa pueda satisfacer los mismos contratos sin cambiar las reglas de negocio.

### Diseño propuesto

1. **Clean Architecture / arquitectura hexagonal.** Mantener el dominio y los casos de uso independientes de SDKs y APIs de proveedores. Las dependencias externas deben entrar por puertos/interfaces definidos por ASTON.
2. **Adaptadores por capacidad.** Separar, como mínimo, ejecución HTTP, persistencia relacional, almacenamiento de objetos, caché/estado efímero, colas/eventos, identidad/autorización, inferencia de modelos, embeddings y anclaje criptográfico.
3. **Contratos versionados.** Definir esquemas, errores, límites de tamaño, consistencia, idempotencia, timeouts y semántica de reintentos. Los contratos deben incluir pruebas de conformidad.
4. **Modelo de datos portable.** Evitar que reglas de negocio dependan de tipos propietarios. Documentar formatos de exportación, claves, relaciones, timestamps, retención, borrado y restauración.
5. **Configuración fuera del dominio.** Los endpoints, nombres de bindings, credenciales y selección de proveedor se inyectan por configuración segura; no se codifican en reglas de negocio.
6. **Plan de salida.** Mantener inventario de servicios, datos, dependencias, costes de salida, límites de API y procedimiento de migración/rollback. Las credenciales deben poder rotarse sin modificar el dominio.

### Qué falta para probar la portabilidad

- Publicar un mapa actualizado de dependencias y un diagrama de contexto/despliegue basado en el código real.
- Identificar qué módulos importan directamente SDKs o tipos específicos de Cloudflare.
- Definir contratos y pruebas de conformidad para cada adaptador.
- Implementar al menos un adaptador alternativo para cada dependencia crítica priorizada.
- Ejecutar pruebas de paridad funcional, consistencia, recuperación, rendimiento y costes.
- Demostrar exportación y restauración de datos con integridad comprobada.
- Documentar un ejercicio de sustitución en staging, con tiempos medidos y rollback.

**Estado:** **Capacidad propuesta, pendiente de validación en entorno real.** No se afirma que ASTON OS pueda ejecutarse hoy en AWS, on-premises u otro proveedor sin cambios. La existencia de interfaces o planes de adaptación, por sí sola, no acredita portabilidad.

---

## 3. SafetyInterlock y Evasión

### Amenaza

Si un componente puede invocar directamente una capacidad de inferencia —por ejemplo, una llamada equivalente a `env.AI.run()` en un runtime Cloudflare— sin pasar por SafetyInterlock, la política central podría ser eludida. Esto puede ocurrir por una ruta de código no inventariada, un binding accesible desde un módulo no autorizado, una función auxiliar que invoque el modelo directamente o una integración futura que omita el control.

### Distinción esencial: ausencia de código vs. bloqueo efectivo

- **“No tenemos código que lo haga”** significa que, en el código inspeccionado, no se encontró una llamada directa o una ruta conocida. Es una observación limitada a ese árbol, commit, configuración y alcance de búsqueda. No demuestra que la ruta sea imposible.
- **“Está bloqueado a nivel de red/entorno”** significa que la arquitectura y los permisos impiden la invocación incluso si un componente intenta realizarla. Debe existir una frontera de seguridad efectiva —por ejemplo, aislamiento de capacidades, bindings no disponibles para módulos no autorizados, servicio intermediario obligatorio y controles de identidad/permisos— y una prueba adversarial que confirme el rechazo.

Un control de aplicación no debe describirse como control de red. Tampoco debe afirmarse que Cloudflare bloquea por sí mismo una invocación directa si no se ha demostrado qué permisos, bindings y rutas de ejecución están realmente disponibles.

### Mitigación propuesta

1. Inventariar todos los puntos de entrada a inferencia, herramientas, agentes y funciones que puedan obtener acceso a credenciales o bindings de IA.
2. Centralizar la autorización y la ejecución de modelos en una frontera de capacidad controlada por SafetyInterlock.
3. Evitar que módulos no autorizados reciban acceso directo al binding o secreto que permite invocar el modelo.
4. Aplicar mínimo privilegio y separar módulos por permisos. Una comprobación de política no debe depender de que cada desarrollador recuerde llamarla.
5. Registrar decisión, identidad del módulo/actor, política aplicada, versión y resultado, sin exponer secretos ni datos sensibles.
6. Incorporar pruebas estáticas y de arquitectura para detectar invocaciones directas, además de pruebas dinámicas negativas.

### Plan de prueba

Con la pausa de Cloudflare levantada y autorización expresa:

- Ejecutar búsqueda estática y revisión de dependencias para enumerar todas las llamadas a IA.
- Crear una prueba adversarial identificada como `PROMPT_INJ_01` y pruebas complementarias de llamada directa, ruta alternativa, módulo no autorizado y ausencia de contexto de autorización.
- Intentar invocar la capacidad desde un componente que no haya pasado por SafetyInterlock.
- Verificar que la solicitud sea denegada antes de la inferencia, que no se produzca efecto lateral y que el evento de rechazo quede auditado.
- Ejecutar en entorno aislado/staging, con logs y commit SHA preservados. Repetir tras cambios relevantes.

**Criterio de aprobación:** no basta con que la prueba encuentre un error de aplicación. Debe demostrarse que la ruta no autorizada carece de capacidad efectiva para invocar el modelo. La evidencia debe identificar el límite probado y no extrapolarlo a controles de red que no fueron examinados.

**Estado:** **Capacidad propuesta, pendiente de validación en entorno real.** La ausencia de una llamada directa en una búsqueda de código no se presentará como bloqueo de red ni como prueba de imposibilidad de bypass.

---

## 4. Auditoría Criptográfica

### Modelo de integridad propuesto

El sistema de auditoría debe poder demostrar que un conjunto de registros no fue alterado desde que se comprometió criptográficamente. Un modelo de Merkle Tree permite agrupar hashes de eventos y calcular una raíz que representa el lote.

Flujo conceptual:

1. Normalizar cada evento y definir qué campos forman parte del compromiso criptográfico.
2. Calcular un hash por evento, con versión de esquema, identificador, timestamp y reglas de canonicalización documentadas.
3. Agrupar los hashes en un lote y construir el árbol de Merkle.
4. Persistir los registros, metadatos del lote, raíz, versión del algoritmo y pruebas de inclusión.
5. Publicar o anclar periódicamente el compromiso del lote en un sistema externo, como Bitcoin, según una política de frecuencia y coste.
6. Verificar posteriormente que un evento pertenece al lote y que la raíz publicada coincide con la evidencia preservada.

### Batching y anclaje periódico

El anclaje en Bitcoin se plantea como un proceso periódico y por lotes, no como una transacción individual por cada acción del usuario. El batching reduce costes y evita prometer confirmación instantánea en cada evento, pero introduce una ventana entre la creación del evento y el anclaje externo. Esa ventana debe medirse, documentarse y comunicarse.

La política deberá definir:
- tamaño máximo del lote y/o intervalo máximo entre lotes;
- comportamiento ante congestión, indisponibilidad o fees elevados;
- confirmaciones requeridas antes de considerar un anclaje final;
- reintentos, duplicados, reorganizaciones de cadena y recuperación;
- custodia y disponibilidad de los datos y pruebas de inclusión;
- protección de metadatos y minimización de información publicada on-chain.

La raíz de Merkle prueba consistencia con el conjunto comprometido, pero no demuestra por sí sola que el evento original fuera verdadero, que el reloj fuera correcto o que el proceso de captura estuviera libre de manipulación. La procedencia y los controles de origen deben auditarse por separado.

### Límites de las afirmaciones

No se afirmará “anclaje instantáneo”, “inmutabilidad absoluta” ni “auditoría en tiempo real en Bitcoin” sin evidencia que lo sustente. El objetivo es integridad verificable de registros y anclaje externo periódico, sujeto a la política y a la confirmación de la red.

**Estado:** **Capacidad propuesta, pendiente de validación en entorno real.** Deben presentarse vectores de prueba, verificadores independientes, resultados de lotes reales y evidencia de anclaje antes de afirmar operación efectiva.

---

## 5. Límites Regulatorios

### Separación de responsabilidades

ASTON OS se define en este documento como software de registro, orquestación y evidencia técnica/forense. La producción de evidencia no convierte al software ni a su operador en custodio de activos, intermediario financiero, administrador de fondos o autoridad facultada para ejecutar sanciones.

En particular:

- **ASTON OS:** puede registrar eventos, conservar evidencia, aplicar reglas técnicas configuradas, generar alertas, calcular resultados y producir un expediente verificable, sujeto a controles y validación.
- **Custodio/operador financiero autorizado:** mantiene el control legal y operativo de los activos, cuando corresponda.
- **Entidad responsable de staking/slashing:** define y ejecuta las decisiones financieras conforme a contratos, reglas del protocolo y marco jurídico aplicable.
- **Asesoría legal/compliance:** determina licencias, obligaciones, restricciones y responsabilidades por jurisdicción.

### Staking y slashing

ASTON OS no debe presentarse como ejecutor de la sanción financiera ni como entidad que toma custodia de fondos. Su función prevista es aportar evidencia forense y trazabilidad para que la entidad responsable evalúe y, si corresponde, ejecute una decisión mediante sus propios controles y autorizaciones.

Toda integración que pueda iniciar transferencias, bloquear activos, modificar saldos o ejecutar slashing requiere una revisión separada de arquitectura, autorización, seguridad, contratos y regulación. La mera generación de una señal o evidencia no debe desencadenar automáticamente una operación financiera irreversible.

### Trabajo pendiente

- Matriz de jurisdicciones y actividades reguladas.
- Dictamen de asesoría legal local y transfronteriza.
- Identificación de entidades responsables, custodios y contrapartes.
- Contratos que asignen responsabilidades y mecanismos de disputa.
- Separación de credenciales, permisos, infraestructura y registros entre software y operadores financieros.
- Revisión de cualquier interfaz o automatización que pueda tener efecto económico.

Este apartado no constituye asesoramiento legal ni una conclusión de que una actividad esté exenta de regulación. La clasificación depende de la actividad real, los flujos de fondos, los contratos y las jurisdicciones involucradas.

**Estado:** **Capacidad propuesta, pendiente de validación en entorno real** para cualquier integración financiera; revisión legal obligatoria antes de operar.

---

## 6. Gobierno Corporativo

### Riesgo de persona clave

La concentración de arquitectura, credenciales, conocimiento operativo, decisiones y relaciones comerciales en una sola persona crea riesgo de continuidad, seguridad y ejecución. La mitigación no consiste solamente en contratar personal: requiere que las tareas críticas puedan ser comprendidas, autorizadas y ejecutadas por más de una persona.

### Plan de continuidad

1. **Documentación operativa:** runbooks para despliegue, rollback, incidentes, recuperación, backups, rotación de credenciales, respuesta a vulnerabilidades y restauración.
2. **Inventario de activos y accesos:** repositorios, dominios, cuentas cloud, claves, proveedores, contratos, certificados y responsables. Nunca incluir secretos en la documentación.
3. **Segregación de funciones:** separar desarrollo, revisión, aprobación, despliegue y acceso a producción. Las acciones de alto impacto requieren doble control.
4. **Gestión de credenciales:** mínimo privilegio, MFA, rotación, almacenamiento seguro, recuperación y procedimiento de salida de colaboradores.
5. **Continuidad técnica:** al menos dos personas capacitadas para cada operación crítica; suplencias y simulacros documentados.
6. **Backups y recuperación:** objetivos RPO/RTO definidos, restauraciones probadas y evidencia fechada.
7. **Gobierno de cambios:** revisión por pares, PRs, protección de ramas, aprobación explícita y registro de excepciones.
8. **Gestión de incidentes:** severidades, responsables, comunicación, preservación de evidencia, análisis de causa raíz y seguimiento de acciones correctivas.

### Incorporación de perfiles

La estrategia propuesta es incorporar progresivamente:
- liderazgo técnico/arquitectura con responsabilidad de revisión independiente;
- ingeniería de seguridad y confiabilidad (AppSec/SRE);
- operaciones y compliance, según jurisdicciones y clientes;
- desarrollo comercial/partnerships con capacidad de due diligence contractual;
- asesoría legal y financiera externa cuando la actividad lo requiera.

La incorporación debe acompañarse de autoridad, objetivos, acceso proporcional y mecanismos de rendición de cuentas. Un organigrama proyectado no demuestra que el equipo exista ni que la continuidad esté cubierta.

**Estado:** **Capacidad propuesta, pendiente de validación en entorno real** hasta contar con responsables designados, runbooks aprobados, accesos segregados y ejercicios de continuidad ejecutados.

---

## 7. Matriz de Riesgos

La siguiente matriz es cualitativa y preliminar. “Probabilidad” e “Impacto” no son métricas estadísticas: deberán recalibrarse mediante un taller formal de riesgos y evidencia operativa.

| Riesgo | Probabilidad preliminar | Impacto | Mitigación | Evidencia pendiente |
|---|---|---|---|---|
| Vendor lock-in / dependencia de Cloudflare | Alta | Alto | Clean Architecture, adaptadores, contratos, exportación y plan de salida | Mapa de dependencias; adaptador alternativo; prueba de migración y restauración |
| Bypass de SafetyInterlock / acceso directo a IA | Media (incertidumbre alta) | Crítico | Mediación obligatoria, aislamiento de capacidades, mínimo privilegio y pruebas adversariales | Inventario completo de rutas; prueba negativa directa; resultado `PROMPT_INJ_01` en staging |
| Integridad y latencia del anclaje | Media | Alto | Merkle Trees, batching, política de anclaje, verificador independiente y monitoreo | Lotes reales; pruebas de inclusión; tx/confirmaciones; medición de latencia y recuperación |
| Riesgo regulatorio por staking/slashing | Media (depende del modelo operativo) | Crítico | Separar software, custodia y ejecución; revisión legal por jurisdicción | Dictamen legal; contratos; mapa de fondos; prueba de separación de permisos |
| Fundador/persona clave | Alta mientras no haya redundancia demostrada | Alto | Runbooks, suplencias, doble control, equipo y gobierno | Responsables designados; restauración; simulacro; matriz de accesos y continuidad |

### Escala sugerida

- **Probabilidad:** baja / media / alta, evaluada por escenario y horizonte temporal.
- **Impacto:** moderado / alto / crítico, considerando confidencialidad, integridad, disponibilidad, pérdidas financieras, obligaciones legales y reputación.
- **Evidencia pendiente:** artefacto concreto, reproducible, con responsable, fecha y versión. “Está en roadmap” no es evidencia de mitigación.

---

## 8. Roadmap

Los plazos se cuentan desde la reanudación formal del trabajo, no desde la fecha de este documento. La reanudación requiere que Workers y Durable Objects estén en estado **Resolved** y autorización expresa. Las actividades sujetas a Cloudflare permanecen bloqueadas durante la pausa.

### 0–30 días: inventario y definición de controles

- Congelar una línea base de arquitectura y dependencias por commit.
- Completar inventario de rutas de inferencia, bindings, permisos y llamadas directas.
- Definir contratos de adaptadores y formato de evidencia criptográfica.
- Establecer matriz de responsabilidades, propietarios de riesgo y clasificación de evidencia.
- Documentar RPO/RTO, runbooks prioritarios y política de cambios.
- Solicitar revisión legal inicial del alcance de staking/slashing y custodia.

**Entregables:** diagramas revisados, inventarios, contratos, matriz de riesgos aprobada y lista de pruebas reproducibles.

### 31–90 días: validación controlada en staging

- Implementar o completar los adaptadores prioritarios y pruebas de conformidad.
- Ejecutar pruebas adversariales de SafetyInterlock, incluida `PROMPT_INJ_01`, en entorno autorizado.
- Validar lotes Merkle, pruebas de inclusión y flujo de anclaje en un entorno de prueba; medir latencia y costes.
- Ejecutar exportación/restauración y un ejercicio de continuidad.
- Revisar permisos, secretos, trazabilidad y segregación de funciones.
- Obtener revisión legal documentada antes de cualquier función financiera.

**Entregables:** informes de pruebas con SHA, logs saneados, resultados reproducibles, actas de revisión y plan de remediación. Staging no equivale a producción.

### 91–180 días: resiliencia y preparación de auditoría externa

- Ejecutar ejercicio de sustitución de proveedor para las dependencias priorizadas.
- Repetir pruebas de bypass y regresión tras cambios arquitectónicos.
- Validar recuperación ante fallos, backups y continuidad con personal suplente.
- Completar auditoría independiente del diseño y de la evidencia disponible.
- Cerrar brechas legales, contractuales y de gobierno.
- Preparar expediente de due diligence con resultados, limitaciones y riesgos residuales.

**Entregables:** informe independiente, evidencia de portabilidad dentro del alcance probado, expediente criptográfico, continuidad ensayada y matriz residual aprobada.

Ningún hito de este roadmap constituye autorización automática para desplegar en producción, ejecutar operaciones financieras o modificar Cloudflare.

---

## 9. Preguntas de Inversores (FAQ)

### ¿ASTON OS es independiente de Cloudflare?

No afirmamos independencia operativa actual. La arquitectura anti-lock-in es un objetivo de diseño. La portabilidad solo podrá afirmarse para los componentes que hayan sido adaptados y probados en un segundo entorno. **Capacidad propuesta, pendiente de validación en entorno real.**

### ¿Puede un agente saltarse SafetyInterlock e invocar directamente el modelo?

No debemos responder “es imposible” sin evidencia. Primero hay que demostrar qué módulos tienen acceso efectivo al binding de inferencia y probar que una llamada no autorizada se rechaza antes de ejecutar el modelo. La ausencia de una llamada directa en el código inspeccionado no equivale a un bloqueo de red.

### ¿Cada acción queda anclada instantáneamente en Bitcoin?

No. El diseño descrito utiliza lotes y anclaje periódico. Existe una ventana entre la captura del evento y el anclaje del lote. La frecuencia, latencia, coste y política de confirmaciones deben medirse y publicarse. No prometemos anclaje instantáneo por evento.

### ¿ASTON OS custodia fondos o ejecuta slashing?

La posición de diseño de este documento es que ASTON OS aporta evidencia técnica/forense y no custodia fondos ni ejecuta la sanción financiera. Cualquier integración que pudiera producir efectos financieros requiere una entidad responsable separada, controles explícitos y revisión legal por jurisdicción.

### ¿Está certificado o auditado de forma independiente?

Este documento no declara certificación ni auditoría independiente. Los resultados de CI, pruebas locales y revisiones internas deben identificarse por alcance y commit. Solo un informe independiente con alcance, metodología, fecha y hallazgos permitiría afirmar que se realizó esa auditoría.

### ¿Qué evidencia existe hoy?

Hay evidencia de desarrollo y CI en repositorios concretos, pero debe distinguirse de pruebas E2E y de producción. Por ejemplo, los resultados de CI registrados para el repositorio de agente no demuestran el comportamiento del sistema desplegado en Cloudflare. La evidencia debe revisarse en su enlace y commit correspondiente antes de ser utilizada en una decisión de inversión.

### ¿Qué ocurre si la persona fundadora no está disponible?

No se debe afirmar que el riesgo está resuelto hasta que existan responsables suplentes, documentación operativa, acceso de emergencia controlado y ejercicios de continuidad satisfactorios. El plan está definido; su ejecución debe demostrarse.

### ¿Cuál es el principal riesgo residual?

En esta etapa, el riesgo más sensible es la brecha entre controles arquitectónicos descritos y controles probados en el entorno real, especialmente la mediación obligatoria de inferencia, la portabilidad y la continuidad operativa. La matriz debe actualizarse cuando exista evidencia nueva.

---

## 10. Anexo de Evidencias

### 10.1 Verificado (alcance limitado)

Los siguientes elementos se consideran verificables únicamente dentro del alcance indicado; no son certificaciones ni evidencia de producción:

- Existe un estándar de seguridad documental en `docs/SECURITY-STANDARD.md` en la rama `chore/security-standardization`. Define controles aprobados y aclara que su inclusión en la política no prueba que estén instalados o pasando.
- En el repositorio `agente-OS-15.5-hector-zapata`, se registraron ejecuciones CI exitosas en el commit `4cb89d6e71bf0c7bedd5a922d1fd03fed02187e9`:
  - [Secret Leak Scan](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/actions/runs/43359979683)
  - [Dependency Vulnerability Audit](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/actions/runs/43359979681)
  - [ASTON OS Audit Staging Validation](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/actions/runs/43359979772)
  - [Cloudflare CI](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/actions/runs/43359979725)
- En `aston-attestation-sdk` se registraron ejecuciones de Dependency Review, Verify SDK, Code scanning y SLSA en los runs documentados durante la fase de estandarización. Esos resultados corresponden a esos workflows, commits y ejecuciones; no prueban el estado de otros repositorios ni el despliegue de ASTON OS.
- Se informó un conjunto de 23/23 pruebas del CORE 1.0 en el contexto de desarrollo/CI. Ese resultado no debe presentarse como E2E de Cloudflare ni como validación de producción sin evidencia adicional del entorno y ejecución.

### 10.2 No validado

- Portabilidad efectiva a AWS, infraestructura on-premises u otro proveedor.
- Bloqueo de red/entorno que haga imposible una llamada directa a `env.AI.run()` desde cualquier módulo no autorizado.
- Resultado de una prueba adversarial `PROMPT_INJ_01` ejecutada contra el entorno desplegado.
- E2E de Cloudflare y comportamiento de producción durante la pausa de incidentes.
- Operación de extremo a extremo de Merkle batching y anclaje Bitcoin con latencia, costes, confirmaciones y recuperación medidos.
- Certificación VBC o cualquier certificación externa no respaldada por un informe verificable.
- Dictamen legal que determine la clasificación de staking/slashing en cada jurisdicción.
- Equipo de continuidad, suplencias y simulacros ejecutados y aprobados.
- RPO/RTO demostrados mediante restauración y recuperación ensayadas.

### 10.3 Propuesta

- Arquitectura hexagonal y adaptadores con contratos de conformidad.
- Mediación obligatoria de inferencia con aislamiento de capacidades y pruebas adversariales.
- Merkle Trees, lotes y anclaje periódico con verificación independiente.
- Separación técnica, contractual y operativa entre ASTON OS y cualquier custodio/ejecutor financiero.
- Gobierno corporativo, doble control, runbooks, suplencias y estrategia de incorporación de perfiles.
- Roadmap de 30/90/180 días condicionado a la reanudación autorizada.

### 10.4 Reglas para incorporar nueva evidencia

Cada evidencia futura debe registrar:
- identificador y descripción del control;
- repositorio, rama, commit SHA y versión;
- entorno (local, CI, staging o producción);
- fecha y responsable;
- procedimiento y resultado reproducible;
- logs, artefactos o informe con integridad verificable;
- limitaciones, excepciones y riesgo residual.

No se debe convertir “propuesto” en “implementado”, “implementado” en “probado”, ni “CI aprobado” en “producción validada” sin evidencia específica para cada transición.

---

**Declaración final:** Este documento describe riesgos, controles propuestos y evidencia limitada disponible a la fecha. No constituye una certificación, auditoría independiente, garantía de seguridad, asesoramiento legal ni autorización de despliegue. Toda capacidad no respaldada por una prueba reproducible debe considerarse no validada.
