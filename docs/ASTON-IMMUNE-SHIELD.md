<!--
SPDX-FileCopyrightText: 2026 Aston OS
SPDX-License-Identifier: Apache-2.0
-->

# ASTON IMMUNE SHIELD
## Capa de gobernanza, contención y evidencia para entornos OT e infraestructura crítica

**Estado del documento:** Concepto estratégico / arquitectura propuesta  
**Versión:** 0.1  
**Fecha:** 15 de noviembre de 2026  
**Clasificación:** Documento de producto y posicionamiento; no constituye una especificación de despliegue aprobada ni una certificación de seguridad.

> **Principio rector:** proteger procesos físicos exige decisiones locales, límites explícitos de autoridad, mecanismos seguros de degradación y evidencia verificable. Ningún agente de IA debe poder improvisar acciones físicas fuera de una política autorizada.

---

## 1. Resumen ejecutivo

**ASTON Immune Shield** es una propuesta de capa de confianza y gobernanza para proteger operaciones críticas que incorporan software, automatización e inteligencia artificial. Su objetivo es ayudar a operadores a detectar decisiones no autorizadas, limitar el alcance de componentes comprometidos, coordinar respuestas defensivas permitidas y conservar evidencia verificable para auditoría e investigación.

La propuesta se dirige a operadores de infraestructura crítica, integradores industriales y organismos públicos que necesitan supervisar sistemas distribuidos, incluidos entornos de cadena de frío, energía, logística y edificios o instalaciones automatizadas.

Immune Shield no reemplaza PLCs, SCADA, sistemas instrumentados de seguridad (SIS), firewalls industriales, EDR, herramientas OT de detección ni procedimientos operativos. Se integra como una capa complementaria de autorización, aislamiento lógico, coordinación y evidencia.

**Estado real:** este documento describe una arquitectura objetivo y una hipótesis comercial. No afirma que Immune Shield esté implementado, desplegado, certificado, validado en infraestructura crítica ni que alcance una latencia determinada.

## 2. El problema: la velocidad de los incidentes digitales frente al impacto físico

Los sistemas de tecnología operacional (OT) controlan o supervisan procesos donde una decisión digital puede tener consecuencias materiales. Algunos ejemplos:

- **Cadena de frío:** cambios no autorizados en consignas de temperatura, alarmas, refrigeración, sensores, cámaras y sistemas de transporte refrigerado pueden poner en riesgo productos farmacéuticos, alimentos y otros bienes sensibles.
- **Energía:** alteraciones de telemetría, configuraciones o comandos en sistemas de supervisión pueden afectar disponibilidad, continuidad y seguridad operativa.
- **Logística e instalaciones:** la automatización de almacenes, puertas, climatización y equipos industriales puede propagar un fallo digital a procesos físicos.

Una arquitectura que dependa exclusivamente de una nube central puede añadir latencia de red, depender de conectividad externa y crear un punto de concentración operacional. En una situación crítica, la decisión de aplicar una política local de contención no debería depender de una ida y vuelta innecesaria a un servicio remoto.

Sin embargo, **no toda decisión puede ni debe delegarse a un agente autónomo**. Los controladores industriales y los sistemas de seguridad funcional tienen requisitos de tiempo real, disponibilidad, integridad y certificación propios. Una capa de IA no debe sustituir sus enclavamientos ni alterar sus funciones de seguridad.

### Necesidad

Una arquitectura defensiva útil debe:

1. evaluar autorizaciones cerca del entorno que necesita protección;
2. limitar qué componentes pueden comunicarse o ejecutar acciones;
3. contener comportamientos sospechosos sin poner en peligro el proceso físico;
4. mantener la operación segura cuando la nube, el agente o la conectividad fallen;
5. registrar decisiones y cambios con evidencia que pueda revisarse posteriormente.

## 3. Arquitectura propuesta

La arquitectura se organiza en cuatro planos complementarios. Cloudflare Edge puede aportar una capa distribuida de servicios de política y coordinación, mientras que un componente local en el sitio industrial conserva la autoridad operacional y la capacidad de respuesta segura cuando la conectividad externa no está disponible.

### 3.1 Plano de política distribuida — SafetyInterlock

**SafetyInterlock** es el punto de control de autorización propuesto para operaciones protegidas.

- Recibe una solicitud estructurada con identidad del agente o servicio, acción solicitada, recurso, contexto y política aplicable.
- Evalúa si la acción está permitida y si satisface las condiciones predefinidas.
- Emite una decisión explícita o un permiso limitado, acotado por acción, recurso, contexto y vigencia.
- Deniega por defecto cuando faltan identidad, evidencia, política, conectividad requerida o condiciones de autorización.
- Registra la decisión y su referencia de evidencia.

**Cloudflare Edge** puede alojar componentes de evaluación y distribución de políticas para reducir la distancia de red entre ciertos clientes y servicios. No debe asumirse que la ejecución en Edge garantiza por sí sola una latencia inferior a 10 ms.

**Objetivo de rendimiento a validar:** estudiar un presupuesto de latencia inferior a 10 ms para el tramo de evaluación local o Edge en condiciones definidas. Ese valor es un objetivo de ingeniería, no una capacidad actual declarada. Debe medirse por región, ruta, carga, tamaño de política, disponibilidad y configuración; además, deben publicarse percentiles (p50/p95/p99), tasa de errores y condiciones de prueba.

Para bucles de control con requisitos deterministas o de seguridad funcional, la decisión crítica debe permanecer en el controlador local o en un gateway industrial certificado para el caso de uso. Una llamada a Cloudflare no debe insertarse en un lazo de control duro que no tolere latencia variable o pérdida de conectividad.

### 3.2 Plano local OT — Gateway de sitio y límites físicos

Cada instalación mantiene un **OT Site Gateway** o componente equivalente, desplegado y validado por el operador e integrador industrial.

Responsabilidades propuestas:

- aplicar una lista explícita de acciones permitidas y denegadas;
- verificar permisos firmados y su vigencia cuando corresponda;
- imponer límites locales de tasa, alcance y recursos;
- mantener listas de control y políticas cacheadas con versión y expiración;
- rechazar permisos vencidos, repetidos, mal formados o fuera de contexto;
- aislar el dominio OT del tráfico no autorizado;
- mantener una ruta segura de operación local si la conexión con servicios Edge se interrumpe.

El gateway no debe anular PLCs, SIS, relés de protección, enclavamientos físicos ni procedimientos de emergencia. La posición segura ante una anomalía depende del análisis de peligros de cada proceso y debe ser definida por el responsable de seguridad funcional y el operador.

### 3.3 Plano de aislamiento — Sandboxes y zonas de contención

Los **sandboxes** se utilizan para ejecutar y evaluar componentes digitales no confiables sin concederles acceso directo a los controladores físicos.

Casos de uso:

- probar nuevas versiones de agentes, modelos, herramientas y políticas;
- reproducir eventos con datos sintéticos o telemetría sanitizada;
- ejecutar simulaciones de comandos y evaluar sus efectos previstos;
- analizar archivos, integraciones y actualizaciones antes de promoverlas;
- aislar adaptadores, conectores o servicios auxiliares comprometidos.

**Límite esencial:** no se propone colocar un PLC, SIS o controlador de seguridad funcional dentro de un sandbox genérico ni sustituir su entorno certificado. El sandbox rodea componentes de software y simulaciones; los controladores físicos siguen protegidos por segmentación OT, controles industriales, procedimientos de cambio y mecanismos de seguridad independientes.

La promoción desde sandbox a staging y luego a producción requiere revisión, pruebas, aprobación del operador y un procedimiento de reversión.

### 3.4 Plano de coordinación — Enjambre de agentes defensivos

Un conjunto de agentes especializados puede asistir en la detección, clasificación y coordinación de respuestas. Por ejemplo:

- **Monitor Agent:** analiza eventos y telemetría autorizada.
- **Policy Agent:** compara solicitudes y comportamientos con políticas aprobadas.
- **Containment Advisor:** propone opciones de contención dentro de un catálogo preaprobado.
- **Evidence Agent:** prepara registros, hashes, referencias y cronología de eventos.
- **Recovery Advisor:** ayuda a seguir procedimientos de recuperación aprobados.

El enjambre no recibe autoridad ilimitada. Cada agente tiene identidad, permisos mínimos, límites de recursos y un conjunto explícito de herramientas. La coordinación no amplía automáticamente los permisos de sus integrantes.

**Contramedidas permitidas:** la primera versión debe priorizar acciones digitales reversibles y de bajo riesgo, como denegar una solicitud no autorizada, revocar un permiso, poner en cuarentena un conector digital o bloquear una ruta de comunicación previamente definida, siempre dentro de la política y del diseño aprobado por el operador.

**Acciones sobre procesos físicos:** cambios de consignas, parada/arranque de equipos, apertura/cierre de válvulas, desconexión de cargas u otras acciones con impacto físico requieren un procedimiento de seguridad específico y autorización humana explícita, salvo que una función automática ya esté formalmente diseñada, validada y aprobada por el operador dentro de su sistema de control industrial. Immune Shield no debe improvisar ni ejecutar represalias contra sistemas externos.

## 4. Flujo operativo de referencia

1. Un sensor, sistema OT, servicio o agente genera un evento o solicita una acción.
2. El gateway local valida origen, formato, contexto y límites básicos.
3. SafetyInterlock evalúa la política aplicable, localmente o mediante un servicio Edge cuando la arquitectura y el presupuesto de latencia lo permiten.
4. La solicitud recibe una decisión explícita: permitir con alcance limitado, denegar o escalar para aprobación.
5. Si se detecta un comportamiento anómalo, los agentes defensivos pueden recomendar o ejecutar únicamente acciones digitales previamente autorizadas.
6. Los componentes aislados se analizan en sandbox; las pruebas no se conectan directamente a equipos físicos.
7. Evidence Agent registra la secuencia relevante, sujeto a las políticas de privacidad, retención y acceso.
8. El operador revisa el incidente y autoriza los pasos de recuperación que correspondan.

### Comportamiento ante fallos

- **Pérdida de conexión con la nube:** el sitio debe seguir aplicando la política local vigente y su procedimiento de contingencia. No se debe depender de una respuesta remota para mantener la seguridad física.
- **Permiso inválido o vencido:** denegar la acción protegida y registrar el motivo.
- **Agente comprometido o fuera de política:** revocar o limitar su identidad y aislar su componente digital conforme al plan aprobado.
- **Gateway no disponible:** el sistema de control industrial conserva sus mecanismos independientes de seguridad y operación; la respuesta concreta se define en el análisis de riesgos del sitio.
- **Evidencia incompleta:** marcar el registro como incompleto. No convertir ausencia de evidencia en una afirmación de seguridad.

## 5. Evidencia criptográfica y auditabilidad

Immune Shield pretende generar un rastro verificable de decisiones y cambios relevantes, que puede incluir:

- identidad técnica del componente que solicita una acción;
- versión de la política evaluada;
- decisión de SafetyInterlock y alcance del permiso;
- marca temporal y contexto disponible;
- hashes de artefactos o registros relevantes;
- firmas digitales cuando exista una identidad y una gestión de claves adecuadas;
- referencias a aprobaciones humanas y cambios operativos.

Los hashes y las firmas pueden ayudar a detectar alteraciones y verificar integridad y procedencia bajo un modelo de confianza definido. **No prueban por sí solos que un sensor midió correctamente, que una acción física ocurrió como se informó, que el emisor era legítimo o que una instalación cumple una norma.** Esas conclusiones requieren controles de identidad, raíz de confianza, validación de sensores, cadena de custodia y auditoría independientes.

La retención, protección de claves, sincronización de tiempo, acceso a registros y privacidad deben definirse por contrato y por el análisis de riesgos del operador.

## 6. Modelo de negocio: Active Defense Assurance

### Propuesta comercial

La hipótesis comercial es ofrecer **Active Defense Assurance** —una capa de gobernanza y evidencia para defensa operacional— a:

- organismos gubernamentales y entidades responsables de infraestructura crítica;
- operadores de energía y servicios esenciales;
- operadores de cadena de frío farmacéutica y alimentaria;
- centros logísticos, puertos, almacenes automatizados y transporte refrigerado;
- integradores OT, proveedores de automatización y operadores multisede.

La referencia a la cadena de frío europea representa un segmento potencial de mercado, no un cliente, contrato, validación ni adopción existente.

### Qué compra el cliente

El cliente no compra una promesa genérica de “inmunidad”. Compra un programa delimitado que puede incluir:

1. evaluación de arquitectura, activos y flujos autorizados;
2. diseño de políticas y límites de autoridad;
3. integración piloto con un gateway o entorno de pruebas;
4. simulación de escenarios y pruebas de contención digital;
5. configuración de evidencia y panel de revisión;
6. ejercicios de respuesta y entrega de hallazgos;
7. soporte y revisión periódica según el contrato.

### Estructura de ingresos propuesta

- **Assessment inicial:** evaluación de arquitectura, riesgos y preparación del sitio.
- **Piloto de alcance acotado:** una instalación, un flujo OT seleccionado y un conjunto definido de escenarios en entorno de pruebas o staging.
- **Licencia o suscripción:** por sitio, gateway, activo supervisado o volumen de eventos, sujeto a validación comercial.
- **Servicios empresariales:** integración, políticas, pruebas, formación, soporte y ejercicios de resiliencia.
- **Programa multisede:** despliegue progresivo, gobierno central de políticas y evidencia consolidada, manteniendo autoridad local en cada sitio.

Los precios, niveles de servicio, responsabilidad, cobertura geográfica y condiciones de soporte deben establecerse luego de entrevistas con compradores e integradores y de una evaluación de costes y riesgos.

### Uso del término “seguro”

La expresión **“Seguro de Defensa Activa”** puede funcionar como metáfora comercial de una garantía operacional o programa de assurance, pero puede interpretarse como un producto de seguro regulado. ASTON no debe vender, intermediar ni prometer cobertura aseguradora sin la estructura, licencia y aprobación legal que correspondan en cada jurisdicción.

Hasta contar con ese análisis, el nombre comercial recomendado es **Active Defense Assurance** o **Operational Trust & Resilience Layer**. No se debe prometer indemnización, cobertura de pérdidas ni prevención garantizada de incidentes.

## 7. Límites del producto: qué es y qué no es

### ASTON Immune Shield es

- una capa complementaria de gobernanza para agentes, servicios y acciones digitales;
- un mecanismo de autorización explícita y control de permisos;
- una arquitectura propuesta de contención lógica y aislamiento de software;
- un sistema de coordinación defensiva con autoridad acotada;
- una capa de evidencia criptográfica y auditabilidad;
- una integración que debe adaptarse a los sistemas OT existentes y al análisis de riesgos del operador.

### ASTON Immune Shield no es

- un antivirus tradicional ni un reemplazo de EDR/XDR;
- un firewall industrial ni un reemplazo de segmentación OT;
- un reemplazo de PLC, SCADA, DCS o SIS;
- un sistema de seguridad funcional certificado;
- un sistema autónomo autorizado para manipular equipos físicos sin límites;
- una garantía de prevención total, continuidad ininterrumpida o inmunidad ante ataques;
- una certificación de cumplimiento regulatorio o de seguridad;
- una capacidad ya desplegada o validada en infraestructura crítica.

La posición correcta es: **ASTON gobierna y aporta evidencia sobre acciones digitales; los controles OT y de seguridad funcional existentes siguen siendo responsables de proteger el proceso físico.**

## 8. Principios de diseño y controles no negociables

1. **Fail closed para acciones protegidas:** ante ausencia de permiso válido, la acción se deniega. La estrategia de continuidad del proceso físico se define por el operador y sus sistemas de seguridad, no por una regla genérica de software.
2. **Autoridad mínima:** cada agente, servicio y gateway recibe solo los permisos necesarios.
3. **Separación IT/OT:** segmentación, zonas y conductos explícitos; ninguna conexión directa no aprobada desde agentes hacia controladores.
4. **Human-in-the-loop para impacto físico:** cambios físicos de alto impacto requieren aprobación y procedimientos operativos aprobados.
5. **Sin represalias automáticas:** la respuesta se limita a proteger activos propios autorizados; no se atacan, escanean ni alteran sistemas de terceros.
6. **Aislamiento verificable:** los sandboxes no comparten credenciales ni rutas privilegiadas con controladores físicos.
7. **Resiliencia local:** el sitio mantiene operación segura definida aunque los servicios Edge o la nube no estén disponibles.
8. **Evidencia sobre afirmaciones:** todo resultado se etiqueta como diseñado, implementado, probado o validado, con alcance y evidencia.
9. **Cambios controlados:** versionado, revisión, pruebas, aprobación, rollback y registro de cambios.
10. **Privacidad y soberanía:** minimización de datos, control de acceso, residencia y retención acordes con la jurisdicción y el contrato.

## 9. Validación necesaria antes de comercializar

Immune Shield no debe presentarse como producto listo para producción hasta completar, como mínimo:

### Ingeniería y arquitectura
- modelo de amenazas específico para el sitio y el proceso;
- inventario de activos, flujos, protocolos y dependencias;
- arquitectura de segmentación y gateway revisada por especialistas OT;
- análisis de peligros y definición de estados seguros por proceso;
- mediciones reproducibles de latencia, jitter, disponibilidad y comportamiento bajo carga;
- pruebas de pérdida de nube, Edge, gateway, reloj y conectividad;
- revisión de gestión de identidades, claves, permisos y revocación.

### Seguridad y pruebas
- pruebas en laboratorio/simulador antes de cualquier entorno conectado;
- pruebas de aislamiento de sandbox y de límites de herramientas de agentes;
- pruebas de autorización negativa, repetición, expiración y degradación;
- revisión independiente de arquitectura y código;
- ejercicios de respuesta coordinados con el operador;
- pruebas de recuperación y reversión;
- evidencia de que el sistema no puede eludir controles de seguridad funcional.

### Operación y gobernanza
- responsable operacional y responsable de seguridad funcional designados;
- matriz RACI, procedimientos de escalamiento y gestión de cambios;
- plan de incidentes, continuidad, respaldo y recuperación;
- formación de operadores y criterios de aceptación;
- acuerdos de soporte, responsabilidad, privacidad y retención;
- revisión legal y regulatoria para cada mercado y sector.

### Métricas iniciales a medir
- latencia de decisión p50/p95/p99 por ruta;
- tiempo de detección y tiempo de contención digital;
- falsos positivos y falsos negativos en escenarios definidos;
- porcentaje de decisiones con evidencia completa;
- tasa de denegación correcta ante permisos inválidos;
- tiempo de recuperación y tasa de éxito de rollback;
- disponibilidad local durante pérdida de conectividad externa.

No se publicarán cifras de rendimiento, reducción de incidentes, certificaciones ni resultados de clientes hasta contar con pruebas documentadas y autorización para divulgarlos.

## 10. Ruta de producto sugerida

**Fase 0 — Descubrimiento:** entrevistas con operadores OT, integradores, responsables de seguridad y compradores públicos. Selección de un proceso no crítico para el primer laboratorio.

**Fase 1 — Laboratorio aislado:** gateway de prueba, políticas SafetyInterlock, simulación de telemetría, sandboxes y evidencia. Sin conexión de escritura a equipos físicos.

**Fase 2 — Piloto en sombra:** integración de solo lectura en un entorno controlado; comparar decisiones sugeridas con las decisiones del operador sin ejecutar contramedidas.

**Fase 3 — Contención digital acotada:** habilitar únicamente acciones digitales reversibles, expresamente aprobadas, con rollback probado y supervisión operacional.

**Fase 4 — Evaluación de sitio:** evaluación independiente, análisis de riesgos, revisión de seguridad funcional y aceptación formal del operador antes de ampliar el alcance.

**Fase 5 — Programa multisede:** solo después de resultados verificables, controles operacionales repetibles y acuerdos comerciales y legales adecuados.

## 11. Posicionamiento institucional

**Nombre:** ASTON Immune Shield  
**Descriptor:** Trust, Governance & Evidence for Critical Operations  
**Propuesta de valor:** Govern digital actions before they can affect physical operations.

**Mensaje breve:**  
ASTON Immune Shield adds a governance and evidence layer around AI-enabled and automated operations. It helps operators enforce explicit permissions, isolate untrusted software components, coordinate bounded defensive responses, and preserve verifiable records—while existing OT and functional-safety systems remain in control of the physical process.

**Mensaje para organismos públicos:**  
A policy-first approach to operational resilience: bounded authority, local safeguards, accountable response, and evidence that can be independently examined.

**Mensaje para cadena de frío:**  
Help protect the integrity of cold-chain operations by governing digital access and automated actions across distributed facilities—without replacing the industrial controls that keep temperature-critical processes safe.

---

## Anexo A — Glosario

- **OT (Operational Technology):** hardware y software que supervisan o controlan procesos físicos.
- **PLC:** controlador lógico programable.
- **SCADA:** supervisión, control y adquisición de datos.
- **DCS:** sistema de control distribuido.
- **SIS:** sistema instrumentado de seguridad.
- **Edge:** infraestructura de cómputo distribuida próxima al usuario o servicio; no equivale necesariamente a control local determinista.
- **Sandbox:** entorno aislado para ejecutar o analizar software sin concederle acceso directo a activos de producción.
- **Fail closed:** denegar una acción protegida cuando no se cumplen las condiciones de autorización; no significa detener indiscriminadamente un proceso físico.
- **Evidencia criptográfica:** registros y pruebas basados en hashes, firmas y referencias verificables, sujetos a un modelo de confianza.

## Anexo B — Registro de afirmaciones

| Afirmación | Estado permitido en este documento | Evidencia necesaria para elevar el estado |
|---|---|---|
| SafetyInterlock en Edge para evaluación de políticas | Arquitectura propuesta | Implementación, pruebas por región y resultados reproducibles |
| Latencia inferior a 10 ms | Objetivo a validar, no garantía | Benchmarks p50/p95/p99 bajo condiciones publicadas |
| Sandboxes para aislar software no confiable | Diseño propuesto | Pruebas de aislamiento y revisión independiente |
| Enjambre de agentes defensivos | Diseño conceptual con autoridad acotada | Prototipo, pruebas adversariales y aprobación operacional |
| Contramedidas autónomas | Solo acciones digitales preaprobadas y reversibles como objetivo futuro | Matriz de autoridad, pruebas de seguridad, rollback y aceptación del operador |
| Protección de infraestructura crítica | Objetivo de producto | Piloto autorizado, evaluación independiente y resultados verificables |
| Venta a gobiernos y operadores europeos | Mercado objetivo | Contratos, requisitos de compra y validación regulatoria por jurisdicción |

---

**Nota de publicación:** este documento es una propuesta estratégica. No debe utilizarse como afirmación de capacidades desplegadas, certificación, garantía de seguridad ni compromiso de rendimiento. Toda implementación en infraestructura crítica requiere evaluación de riesgos específica, revisión por especialistas OT y seguridad funcional, pruebas en entornos controlados y aprobación del operador.
