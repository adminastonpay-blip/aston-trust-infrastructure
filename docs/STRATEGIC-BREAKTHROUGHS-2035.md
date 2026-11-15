<!--
SPDX-FileCopyrightText: 2026 Aston OS
SPDX-License-Identifier: Apache-2.0
-->

# ASTON Strategic Breakthroughs 2035
## Three Blue Oceans for the Autonomous Economy
### Tres océanos azules para la economía autónoma

**Document status / Estado:** Long-term strategic architecture — proposed, research-led, not a delivery commitment  
**Horizon / Horizonte:** 2026–2035  
**Owner / Responsable:** ASTON Trust Fabric  
**Classification / Clasificación:** Strategic / Investor discussion draft  
**Decision boundary / Límite:** This document does not authorize production changes, custody of funds, hardware provisioning, regulated activity, or claims of implementation, certification, or production readiness. / Este documento no autoriza cambios productivos, custodia de fondos, aprovisionamiento de hardware, actividades reguladas ni afirmaciones de implementación, certificación o disponibilidad productiva.

---

# ENGLISH

## 1. Strategic thesis

ASTON aims to become a neutral, interoperable trust layer for consequential actions performed by autonomous agents and connected machines. The three breakthroughs below extend the existing Trust Fabric thesis—identity, bounded delegation, SafetyInterlock, evidence and independent verification—into financial settlement, privacy-preserving assurance and physical-world data.

These are **three strategic category bets**, not three products already shipped. They complement the existing Trust Fabric assets:

- **Fabric:** enforcement, policy, identity, risk and evidence services.
- **Protocol:** versioned, portable formats and interfaces.
- **Network:** independent issuers, verifiers, customers and ecosystem partners.

The strategic advantage must come from customer trust, independent verifiability, integrations and adoption—not from claiming ownership of a closed network or dependence on one cloud, wallet, blockchain, chip or model vendor.

## 2. Pillar I — Agentic Escrow
### The financial referee / The “Visa for Machines” ambition

**Opportunity.** Agents will increasingly buy data, compute, APIs, software actions and physical services from other agents. Buyers need bounded authority; sellers need credible payment assurance; both need a neutral way to resolve whether agreed delivery conditions were met.

**Target architecture.**

1. **Agent identity and mandate:** Bind Agent A and Agent B to verifiable identities, controlling organizations, key status and scoped delegation.
2. **Funding interface:** Integrate Cloudflare Wallets as a potential agent wallet and funding interface when its relevant wallet, virtual-wallet and payment functions are generally available to the account and geography. Keep a provider-neutral wallet/payment adapter so ASTON is not coupled to one provider.
3. **Payment protocol:** Integrate x402 as an HTTP payment negotiation and verification/settlement interface. x402 is a protocol, not by itself a universal escrow custodian or dispute-resolution service. Use an explicitly supported escrow payment flow or a separately reviewed escrow/payment-channel contract or regulated provider.
4. **Policy and authorization:** SafetyInterlock evaluates the exact transaction context before funds are committed or released: identities, amount, asset, network, payee, task, delivery criteria, expiry, budget, sanctions/eligibility checks where applicable, and human approval thresholds.
5. **Evidence package:** Agent B returns the deliverable plus a signed manifest, content digest, timestamp/freshness data, issuer identity and any applicable upstream attestations.
6. **Independent verification:** ASTON verifies the manifest signature, identity policy, digest against the delivered bytes, freshness, schema and agreed acceptance predicates. Where the deliverable is a software artifact, verify its SLSA provenance against the exact artifact digest. SLSA provenance establishes build-origin claims; it does **not** prove that arbitrary data is true, accurate, complete or fit for purpose.
7. **Settlement decision:** Release, partial release, refund, dispute or timeout follows a pre-agreed deterministic policy. The settlement executor acts only on a valid, single-use authorization bound to the transaction and evidence digest.
8. **Audit receipt:** Both parties receive a signed, independently verifiable receipt binding payment reference, delivery digest, policy version, decision and settlement result.

**Reference flow.**

`Agent A → mandate & budget → SafetyInterlock → escrow/payment rail`  
`Agent B → signed deliverable + manifest → evidence verification`  
`Policy outcome → release / partial release / refund / dispute`  
`Both agents → signed settlement receipt + audit evidence`

**Critical controls.**

- Never treat a wallet handle, API key or x402 payment payload as sufficient proof of legal identity or organizational authority.
- Use idempotency keys, replay protection, transaction nonces, amount ceilings, expiry, chain/network binding and duplicate-settlement controls.
- Treat facilitator responses, RPC providers and chain reorganizations as trust and availability risks; verify settlement finality according to the selected network's rules.
- Keep customer private keys outside ASTON unless a separately approved custody architecture and legal model explicitly require otherwise.
- Separate the evidence verifier from the settlement executor; no single agent or untrusted data source can authorize its own payment.
- Define dispute evidence, appeal authority, timeout handling, partial delivery, service failure, oracle failure and refund mechanics before handling real value.
- Obtain jurisdiction-specific legal advice on custody, money transmission, payment services, sanctions, AML/KYC, consumer protection, tax and stablecoin exposure. A software protocol does not remove regulated obligations.

**Value proposition.** Become a trusted transaction-control and evidence layer for machine-to-machine commerce—the ambition behind **“the Visa for Machines.”** This is a positioning metaphor, not a claim of Visa affiliation, card-network equivalence, regulatory authorization or market leadership.

**Dependencies and maturity.** Cloudflare Wallets is a potential integration, not an assumed dependency. Its official documentation currently describes handle reservation and says a reserved handle does not yet send, receive or hold funds; availability of the actual wallet/payment capabilities must be checked before implementation. x402 payment flows and escrow semantics are scheme- and network-specific. No ASTON custody, escrow contract, payment integration or production settlement is claimed by this roadmap.

## 3. Pillar II — ZK-Agent Attestation
### Sovereign privacy and verifiable AI governance

**Opportunity.** Banks, hospitals, insurers and other regulated organizations need to demonstrate that an AI agent followed a policy without exposing underlying customer records, prompts, medical details, transaction data or other sensitive inputs to every auditor or counterparty.

**Target architecture.**

1. **Policy definition:** Express the relevant policy as a versioned, deterministic predicate with explicit inputs, permitted ranges, exceptions and policy owner.
2. **Execution and evidence capture:** The agent/runtime records the policy version, execution context, commitments to sensitive inputs, relevant outputs and evidence references.
3. **Proof generation:** A prover generates a zero-knowledge proof that the defined computation or predicate was satisfied, using a suitable proof system (for example, a reviewed SNARK or STARK design) and a circuit/program that exactly represents the approved policy.
4. **Public statement:** Publish only the minimum public inputs needed by the verifier: policy/circuit version, issuer or tenant context where appropriate, time window, commitment roots, proof-system identifier and proof.
5. **Verification:** An independent verifier checks the proof, circuit identity, public inputs, policy version, key/trust status and revocation state. SafetyInterlock can require a valid proof before a protected action or data disclosure.
6. **Audit and governance:** Preserve the proof, policy version, verifier version, decision receipt and revocation context. Support selective disclosure or separate auditor access where legal obligations require it.

**Illustrative flow.**

`Bank agent + private PII → policy execution → commitments / witness`  
`ZK prover → proof of approved predicate`  
`Independent verifier → valid / invalid / indeterminate`  
`ASTON policy gate → permit only if mandatory proof checks pass`

**Example claim.** “For transaction set X and policy version P, the approved constraints were satisfied” without revealing the underlying transaction records—provided the circuit correctly encodes the policy and the proof's public inputs bind to the intended dataset and period.

**Critical controls and limitations.**

- A ZK proof proves a precisely encoded mathematical statement; it does not prove that the policy is lawful, complete, fair or correctly chosen.
- Circuit correctness, compiler/toolchain integrity, trusted setup (if applicable), verifier correctness, key ceremonies, upgrades and circuit-version governance require independent review.
- Prevent witness/public-input substitution by binding proofs to dataset commitments, tenant, audience, policy version, time window and unique challenge.
- Model missing, stale, revoked and indeterminate evidence explicitly; mandatory checks fail closed.
- A proof does not automatically make a workflow GDPR-compliant. Data controllers still need lawful basis, purpose limitation, minimization, retention controls, data-subject rights, processor contracts and cross-border transfer analysis.
- ZK may still leak metadata such as timing, volume, policy choice or repeated queries. Apply privacy threat modeling and rate controls.
- Start with narrow, auditable predicates (budget limits, approved model/version, permitted region, required human approval) rather than claiming proof of arbitrary AI behavior.

**Value proposition.** Enable privacy-preserving assurance for AI governance: prove selected controls without routinely disclosing the underlying sensitive records. This can reduce unnecessary data exposure, but it is not a substitute for legal compliance, a privacy program or a bank/hospital's own control framework.

**Dependencies and maturity.** The current ATI repository contains commitment-oriented scaffolding; full production SNARK/STARK circuits and a complete ZK verification service are not claimed as shipped. This pillar is a research and product-development track.

## 4. Pillar III — Physical Attestation Edge
### Trust for robotics, industrial systems and the physical AI economy

**Opportunity.** Drones, industrial sensors, robots and edge devices increasingly produce data that triggers consequential agent decisions. Consumers need evidence about which device signed the data, whether the message is fresh, and what is known about the device's software and sensor state.

**Target architecture.**

1. **Hardware root of trust:** Use a device such as ESP32 paired with a secure element such as Microchip ATECC608, where the selected module supports the required cryptographic operations. Generate or provision device keys securely; private keys should remain non-exportable where supported.
2. **Device identity and enrollment:** Bind the public key to a device identity, owner, hardware model, manufacturing/provisioning record and certificate or attestation credential. Define revocation and ownership transfer.
3. **Boot and firmware trust:** Combine secure boot, signed firmware, anti-rollback protection, secure update, configuration measurement and debug-port controls. A secure element signature alone does not prove firmware integrity or sensor truth.
4. **Fresh data envelope:** The device signs a canonical message containing payload digest, monotonic counter or nonce, timestamp, device identity, firmware measurement where available, sensor metadata and calibration reference.
5. **Edge ingestion:** A Cloudflare Worker or another edge verifier validates message format, signature, device trust chain, freshness, replay state, firmware policy and revocation status. Keep the verifier portable and avoid making one cloud provider the sole trust authority.
6. **Policy and action gate:** SafetyInterlock or a downstream policy enforcement point decides whether the evidence is sufficient for the requested action. Unknown, stale, malformed or revoked device evidence is rejected or quarantined.
7. **Evidence record:** Store a privacy-minimized signed receipt with payload digest, device identity, verifier/policy versions and decision. Retain raw telemetry only according to customer policy and applicable law.

**Illustrative flow.**

`Sensor / drone → secure element signs fresh payload`  
`Edge verifier → identity + signature + freshness + firmware policy`  
`SafetyInterlock → allow / quarantine / deny`  
`Evidence ledger → signed receipt and independent audit`

**Critical controls and limitations.**

- ATECC608 can protect key material and perform cryptographic operations; it does not independently attest that a sensor is calibrated, uncompromised, correctly installed or measuring reality accurately.
- Device trust requires a provisioning chain, secure boot/firmware measurement, anti-rollback, signed OTA, revocation, physical tamper analysis and lifecycle controls.
- Protect against replay, cloned identities, extracted credentials, counter reset, clock drift, sensor spoofing, malicious firmware, supply-chain substitution and denial of service.
- Use calibration certificates, plausibility checks, redundant sensors and physical safety systems for safety-critical decisions.
- Define offline behavior, local fail-safe behavior, key rotation, device decommissioning and incident response.
- A Cloudflare Edge deployment is one possible verification location, not a guarantee of low latency, global availability or hardware attestation by itself.

**Value proposition.** Provide a portable evidence and policy layer for physical AI: robotics, industrial automation, logistics, drones, energy and connected infrastructure.

**Dependencies and maturity.** ESP32/ATECC608 is an illustrative reference design, not a validated ASTON hardware bill of materials. Device provisioning, firmware attestation, Cloudflare edge verification and end-to-end field tests remain future work.

## 5. Shared Trust Fabric — common control plane

All three pillars should reuse the same cross-cutting capabilities rather than become disconnected products:

- Portable agent/device identity and lifecycle.
- Scoped delegation and least-privilege authority.
- Versioned policy and SafetyInterlock enforcement.
- Signed evidence envelopes, content digests and independent verification.
- Revocation, replay prevention, key rotation and audit receipts.
- Tenant isolation, privacy minimization and retention controls.
- Provider-neutral interfaces and exportable evidence.
- Human override, dispute and emergency-stop mechanisms.
- Clear separation between open protocol/specification and proprietary orchestration or risk logic.

**Core invariant:** no payment, sensitive disclosure or physical-world action proceeds when a mandatory trust check is failed, missing, expired or indeterminate.

## 6. Ten-year sequence and investment gates

| Horizon | Strategic milestone | Evidence required to advance |
|---|---|---|
| 2026–2027 | Validate Trust Fabric core and first customer problem | Reproducible end-to-end demo, design-partner interviews, threat model, independent code/crypto review |
| 2027–2028 | Agentic Escrow research prototype | Testnet-only payment flow, scheme/network compatibility matrix, duplicate/replay tests, dispute simulation, legal analysis |
| 2028–2029 | ZK-Agent Attestation research prototype | Narrow policy circuits, public test vectors, independent circuit/verifier review, privacy leakage assessment |
| 2029–2030 | Physical Attestation Edge lab prototype | Secure provisioning, signed telemetry, secure boot/anti-rollback evidence, replay/tamper tests on selected hardware |
| 2030–2032 | Cross-pillar pilots | Paid pilots, customer security approval, operational metrics, incident exercises and independent verification |
| 2032–2035 | Interoperable trust network expansion | Multiple independent issuers/verifiers, repeatable deployments, partner distribution, proven unit economics and governance |

These are planning horizons, not delivery promises. Progress depends on customer demand, technical validation, regulatory analysis, partner availability and financing.

## 7. Strategic scorecard — what makes this investable

Track evidence, not slogans:

1. Customer problem validated by paid design partners.
2. Time-to-integrate and recurring production usage.
3. Number of independent issuers and verifiers interoperating.
4. Percentage of critical actions with independently verifiable evidence.
5. False-accept and false-reject rates from adversarial test suites.
6. Revocation propagation and recovery performance measured under test.
7. Payment disputes, duplicate settlement and loss rates in controlled pilots.
8. ZK proof generation/verification cost, latency and privacy leakage under benchmark.
9. Device attestation coverage, replay resistance and field failure rates.
10. Gross margin, retention, expansion revenue and partner-sourced pipeline.

No market-leadership, “Visa” equivalence, regulatory approval, zero-risk, guaranteed privacy or production-readiness claim should be made without evidence and legal review.

## 8. Strategic references

- [Cloudflare Wallets — official documentation](https://developers.cloudflare.com/wallets/) — current availability and account eligibility must be checked; a reserved handle is not a funded wallet.
- [Cloudflare Wallets announcement](https://blog.cloudflare.com/wallets/) — announced account and virtual-wallet concept.
- [x402 specification](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md) — protocol payment flows, including scheme-specific escrow semantics.
- [x402 facilitator documentation](https://github.com/x402-foundation/x402/blob/main/docs/core-concepts/facilitator.md) — verify/settle responsibilities and payment-flow caveats.
- [Espressif secure element documentation](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/secure_element.html) — secure-element integration reference.
- [Microchip ATECC608 product family](https://www.microchip.com/en-us/product/ATECC608B) — secure-element capabilities and device-specific limitations.

---

# ESPAÑOL

## 1. Tesis estratégica

ASTON aspira a convertirse en una capa neutral e interoperable de confianza para acciones relevantes ejecutadas por agentes autónomos y máquinas conectadas. Los tres avances siguientes extienden la tesis del Trust Fabric —identidad, delegación limitada, SafetyInterlock, evidencia y verificación independiente— hacia la liquidación financiera, la garantía de privacidad y los datos del mundo físico.

Son **tres apuestas estratégicas de categoría**, no tres productos ya entregados. Complementan los activos existentes:

- **Fabric:** aplicación de controles, políticas, identidad, riesgo y evidencia.
- **Protocol:** formatos e interfaces versionados y portables.
- **Network:** emisores, verificadores, clientes y socios independientes.

La ventaja estratégica debe provenir de la confianza de clientes, la verificabilidad independiente, las integraciones y la adopción; no de un ecosistema cerrado ni de la dependencia de un único proveedor de nube, billetera, blockchain, chip o modelo.

## 2. Pilar I — Agentic Escrow
### El árbitro financiero / La ambición de ser la “Visa de las Máquinas”

**Oportunidad.** Los agentes comprarán datos, cómputo, APIs, acciones de software y servicios físicos a otros agentes. Los compradores necesitan autoridad limitada; los vendedores, garantías de pago; y ambas partes, un mecanismo neutral para determinar si se cumplieron las condiciones de entrega.

**Arquitectura objetivo.**

1. **Identidad y mandato:** vincular a los agentes A y B con identidades verificables, organizaciones responsables, estado de claves y delegaciones acotadas.
2. **Interfaz de fondeo:** integrar Cloudflare Wallets como posible interfaz de billetera y fondeo cuando sus funciones reales de billetera, billeteras virtuales y pagos estén disponibles para la cuenta y geografía correspondientes. Mantener un adaptador neutral para evitar dependencia de un único proveedor.
3. **Protocolo de pago:** integrar x402 como interfaz HTTP para negociar, verificar y liquidar pagos. x402 es un protocolo; por sí solo no constituye un custodio universal de escrow ni un sistema de resolución de disputas. Usar un flujo escrow expresamente soportado o un contrato/canal de escrow separado y revisado, o un proveedor regulado.
4. **Política y autorización:** SafetyInterlock evalúa el contexto exacto antes de comprometer o liberar fondos: identidades, importe, activo, red, beneficiario, tarea, criterios de entrega, vencimiento, presupuesto, controles de elegibilidad y umbrales de aprobación humana.
5. **Paquete de evidencia:** el agente B entrega el resultado junto con un manifiesto firmado, digest del contenido, datos de vigencia, identidad del emisor y atestaciones de origen aplicables.
6. **Verificación independiente:** ASTON verifica firma, política de identidad, digest contra los bytes recibidos, vigencia, esquema y condiciones de aceptación. Si la entrega es un artefacto de software, verifica la provenance SLSA contra el digest exacto. La provenance SLSA acredita afirmaciones sobre el origen de compilación; **no** demuestra que datos arbitrarios sean verdaderos, exactos, completos o adecuados.
7. **Decisión de liquidación:** liberar, liberar parcialmente, reembolsar, abrir disputa o aplicar vencimiento según una política determinista acordada previamente. El ejecutor de liquidación solo actúa con una autorización válida, de un solo uso y vinculada a la transacción y al digest de evidencia.
8. **Recibo de auditoría:** ambas partes reciben un comprobante firmado y verificable que vincula referencia de pago, digest de entrega, versión de política, decisión y resultado de liquidación.

**Flujo de referencia.**

`Agente A → mandato y presupuesto → SafetyInterlock → escrow/riel de pago`  
`Agente B → entrega firmada + manifiesto → verificación de evidencia`  
`Resultado de política → liberar / parcial / reembolsar / disputar`  
`Ambos agentes → recibo de liquidación firmado + evidencia de auditoría`

**Controles críticos.**

- No considerar un handle de billetera, API key o payload x402 como prueba suficiente de identidad legal o autoridad organizacional.
- Usar claves de idempotencia, protección anti-replay, nonces, topes de importe, vencimientos, vinculación a red y controles contra liquidaciones duplicadas.
- Tratar las respuestas del facilitador, proveedores RPC y reorganizaciones de cadena como riesgos de confianza y disponibilidad; verificar la finalidad según las reglas de la red elegida.
- Mantener las claves privadas del cliente fuera de ASTON, salvo que una arquitectura de custodia y un modelo legal aprobados lo requieran expresamente.
- Separar el verificador de evidencia del ejecutor de liquidación; ningún agente ni fuente de datos no confiable puede autorizar su propio pago.
- Definir evidencia de disputa, apelación, vencimiento, entrega parcial, fallo del servicio, fallo de oráculo y reembolso antes de manejar valor real.
- Obtener asesoramiento legal por jurisdicción sobre custodia, transmisión de dinero, servicios de pago, sanciones, AML/KYC, protección al consumidor, impuestos y exposición a stablecoins. Un protocolo de software no elimina obligaciones regulatorias.

**Propuesta de valor.** Convertirse en una capa confiable de control transaccional y evidencia para el comercio máquina a máquina: la ambición detrás de **“la Visa de las Máquinas”**. Es una metáfora de posicionamiento, no una afirmación de afiliación con Visa, equivalencia con una red de tarjetas, autorización regulatoria o liderazgo de mercado.

**Dependencias y madurez.** Cloudflare Wallets es una integración potencial, no una dependencia garantizada. Su documentación oficial indica que hoy la reserva de un handle no permite enviar, recibir ni mantener fondos; la disponibilidad de las funciones reales debe verificarse antes de implementarlas. Los flujos y semánticas escrow de x402 dependen del esquema y la red. Esta hoja de ruta no afirma que ASTON ya tenga custodia, contrato escrow, integración de pagos o liquidación productiva.

## 3. Pilar II — ZK-Agent Attestation
### Privacidad soberana y gobernanza de IA verificable

**Oportunidad.** Bancos, hospitales, aseguradoras y otras organizaciones reguladas necesitan demostrar que un agente de IA respetó una política sin exponer a cada auditor o contraparte los registros de clientes, prompts, datos médicos, transacciones u otras entradas sensibles.

**Arquitectura objetivo.**

1. **Definición de política:** expresar la política como un predicado determinista y versionado, con entradas, rangos permitidos, excepciones y responsable explícitos.
2. **Ejecución y captura de evidencia:** el agente/runtime registra la versión de política, contexto de ejecución, compromisos criptográficos sobre entradas sensibles, resultados relevantes y referencias de evidencia.
3. **Generación de prueba:** un prover genera una prueba de conocimiento cero de que el cálculo o predicado definido se cumplió, mediante un sistema adecuado (por ejemplo, un diseño SNARK o STARK revisado) y un circuito/programa que represente exactamente la política aprobada.
4. **Declaración pública:** publicar solo las entradas públicas mínimas que necesita el verificador: versión de política/circuito, contexto de emisor o tenant cuando corresponda, ventana temporal, raíces de compromisos, identificador del sistema de prueba y prueba.
5. **Verificación:** un verificador independiente comprueba la prueba, identidad del circuito, entradas públicas, versión de política, estado de confianza y revocación. SafetyInterlock puede exigir una prueba válida antes de una acción protegida o divulgación de datos.
6. **Auditoría y gobernanza:** preservar prueba, versión de política, versión del verificador, recibo de decisión y contexto de revocación. Permitir divulgación selectiva o acceso separado para auditores cuando las obligaciones legales lo requieran.

**Flujo ilustrativo.**

`Agente bancario + PII privada → ejecución de política → compromisos / witness`  
`Prover ZK → prueba del predicado aprobado`  
`Verificador independiente → válido / inválido / indeterminado`  
`Control de política ASTON → permiso solo si pasan las verificaciones obligatorias`

**Ejemplo de afirmación.** “Para el conjunto de transacciones X y la política versión P, se cumplieron las restricciones aprobadas”, sin revelar los registros subyacentes, siempre que el circuito codifique correctamente la política y las entradas públicas vinculen la prueba al conjunto de datos y período previstos.

**Controles críticos y limitaciones.**

- Una prueba ZK demuestra una afirmación matemática codificada con precisión; no demuestra que la política sea legal, completa, justa o correcta.
- La corrección del circuito, integridad de compiladores/herramientas, trusted setup cuando corresponda, verificador, ceremonias de claves, actualizaciones y gobernanza de versiones requieren revisión independiente.
- Evitar sustitución de witness/entradas públicas vinculando la prueba a compromisos del dataset, tenant, audiencia, versión de política, ventana temporal y desafío único.
- Modelar explícitamente evidencia faltante, vencida, revocada e indeterminada; las verificaciones obligatorias fallan en modo cerrado.
- Una prueba no convierte automáticamente un flujo en compatible con GDPR. Los responsables del tratamiento siguen necesitando base legal, limitación de finalidad, minimización, retención, derechos de titulares, contratos con encargados y análisis de transferencias internacionales.
- ZK puede filtrar metadatos como horarios, volúmenes, elección de políticas o consultas repetidas. Se necesita modelado de privacidad y controles de frecuencia.
- Empezar con predicados acotados y auditables (límites de presupuesto, modelo/versión aprobados, región permitida, aprobación humana requerida) en vez de afirmar que se prueba cualquier comportamiento de IA.

**Propuesta de valor.** Habilitar garantía de gobernanza de IA con preservación de privacidad: demostrar controles seleccionados sin divulgar rutinariamente los registros sensibles subyacentes. Puede reducir exposición innecesaria de datos, pero no reemplaza el cumplimiento legal, un programa de privacidad ni el marco de control propio de un banco u hospital.

**Dependencias y madurez.** El repositorio ATI actual contiene scaffolding basado en compromisos; no se afirma que haya circuitos SNARK/STARK productivos ni un servicio ZK completo de verificación. Este pilar es una línea futura de investigación y desarrollo de producto.

## 4. Pilar III — Physical Attestation Edge
### Confianza para robótica, sistemas industriales e IA física

**Oportunidad.** Drones, sensores industriales, robots y dispositivos edge generan datos que activan decisiones relevantes de agentes. Los consumidores necesitan evidencia de qué dispositivo firmó los datos, si el mensaje es reciente y qué se conoce del software y estado del sensor.

**Arquitectura objetivo.**

1. **Raíz de confianza en hardware:** usar un dispositivo como ESP32 junto con un elemento seguro como Microchip ATECC608, siempre que el módulo seleccionado soporte las operaciones criptográficas necesarias. Generar o provisionar claves de forma segura; mantener las claves privadas no exportables cuando el hardware lo permita.
2. **Identidad y enrolamiento:** vincular la clave pública a identidad del dispositivo, propietario, modelo de hardware, registro de fabricación/aprovisionamiento y certificado o credencial de atestación. Definir revocación y transferencia de titularidad.
3. **Confianza de arranque y firmware:** combinar secure boot, firmware firmado, protección anti-rollback, actualización segura, medición de configuración y controles de puertos de depuración. La firma de un elemento seguro por sí sola no prueba integridad del firmware ni veracidad del sensor.
4. **Sobre de datos recientes:** el dispositivo firma un mensaje canónico que contiene digest del payload, contador monotónico o nonce, timestamp, identidad del dispositivo, medición de firmware cuando esté disponible, metadatos del sensor y referencia de calibración.
5. **Ingesta edge:** un Worker de Cloudflare u otro verificador edge valida formato, firma, cadena de confianza del dispositivo, vigencia, estado anti-replay, política de firmware y revocación. Mantener el verificador portable y evitar que un único proveedor cloud sea la autoridad exclusiva.
6. **Control de política y acción:** SafetyInterlock o un punto de aplicación de políticas decide si la evidencia alcanza para la acción solicitada. Evidencia desconocida, vencida, malformada o revocada se rechaza o pone en cuarentena.
7. **Registro de evidencia:** almacenar un recibo firmado y minimizado con digest, identidad del dispositivo, versiones de verificador/política y decisión. Conservar telemetría cruda solo según política del cliente y legislación aplicable.

**Flujo ilustrativo.**

`Sensor / dron → elemento seguro firma payload reciente`  
`Verificador edge → identidad + firma + vigencia + política de firmware`  
`SafetyInterlock → permitir / cuarentena / denegar`  
`Evidence ledger → recibo firmado y auditoría independiente`

**Controles críticos y limitaciones.**

- ATECC608 puede proteger material de claves y realizar operaciones criptográficas; no acredita por sí solo que un sensor esté calibrado, no haya sido manipulado, esté correctamente instalado o mida la realidad con exactitud.
- La confianza del dispositivo requiere cadena de aprovisionamiento, secure boot/medición de firmware, anti-rollback, OTA firmado, revocación, análisis de manipulación física y controles de ciclo de vida.
- Proteger contra replay, clonación de identidades, extracción de credenciales, reinicio de contadores, deriva de reloj, spoofing de sensores, firmware malicioso, sustitución en la cadena de suministro y denegación de servicio.
- Usar certificados de calibración, controles de plausibilidad, sensores redundantes y sistemas físicos de seguridad para decisiones críticas.
- Definir comportamiento offline, modo seguro local, rotación de claves, baja de dispositivos y respuesta a incidentes.
- Un despliegue en Cloudflare Edge es una posible ubicación de verificación, no una garantía de baja latencia, disponibilidad global ni atestación de hardware por sí mismo.

**Propuesta de valor.** Ofrecer una capa portable de evidencia y políticas para la IA física: robótica, automatización industrial, logística, drones, energía e infraestructura conectada.

**Dependencias y madurez.** ESP32/ATECC608 es un diseño de referencia ilustrativo, no una lista de materiales ASTON validada. Aprovisionamiento, atestación de firmware, verificación edge en Cloudflare y pruebas integrales de campo son trabajos futuros.

## 5. Trust Fabric compartido — plano de control común

Los tres pilares deben reutilizar capacidades transversales, no convertirse en productos desconectados:

- Identidad portable de agentes/dispositivos y gestión de ciclo de vida.
- Delegación acotada y autoridad de mínimo privilegio.
- Políticas versionadas y aplicación mediante SafetyInterlock.
- Sobres de evidencia firmados, digests y verificación independiente.
- Revocación, protección anti-replay, rotación de claves y recibos de auditoría.
- Aislamiento por tenant, minimización de privacidad y controles de retención.
- Interfaces neutrales respecto del proveedor y evidencia exportable.
- Override humano, disputas y mecanismos de parada de emergencia.
- Separación clara entre protocolo/especificación abierta y orquestación o lógica de riesgo propietaria.

**Invariante central:** ningún pago, divulgación sensible ni acción en el mundo físico continúa si una verificación obligatoria falla, falta, venció o resulta indeterminada.

## 6. Secuencia de diez años y puertas de inversión

| Horizonte | Hito estratégico | Evidencia necesaria para avanzar |
|---|---|---|
| 2026–2027 | Validar el núcleo Trust Fabric y el primer problema de cliente | Demo integral reproducible, entrevistas con design partners, modelo de amenazas y revisión independiente de código/criptografía |
| 2027–2028 | Prototipo de investigación Agentic Escrow | Flujo de pago solo en testnet, matriz de compatibilidad esquema/red, pruebas de duplicación/replay, simulación de disputas y análisis legal |
| 2028–2029 | Prototipo de investigación ZK-Agent Attestation | Circuitos de políticas acotadas, vectores de prueba públicos, revisión independiente de circuitos/verificador y evaluación de filtración de privacidad |
| 2029–2030 | Prototipo de laboratorio Physical Attestation Edge | Aprovisionamiento seguro, telemetría firmada, evidencia de secure boot/anti-rollback y pruebas de replay/manipulación en hardware seleccionado |
| 2030–2032 | Pilotos entre pilares | Pilotos pagos, aprobación de seguridad de clientes, métricas operativas, simulacros de incidentes y verificación independiente |
| 2032–2035 | Expansión de red de confianza interoperable | Múltiples emisores/verificadores independientes, despliegues repetibles, distribución mediante socios, economía unitaria y gobernanza demostradas |

Son horizontes de planificación, no promesas de entrega. El avance depende de demanda de clientes, validación técnica, análisis regulatorio, disponibilidad de socios y financiación.

## 7. Cuadro estratégico — qué lo vuelve invertible

Medir evidencia, no slogans:

1. Problema de cliente validado por design partners pagos.
2. Tiempo de integración y uso productivo recurrente.
3. Cantidad de emisores y verificadores independientes interoperando.
4. Porcentaje de acciones críticas con evidencia verificable independientemente.
5. Tasas de aceptación incorrecta y rechazo incorrecto en pruebas adversariales.
6. Propagación de revocación y recuperación medidas bajo prueba.
7. Disputas de pago, liquidaciones duplicadas y pérdidas en pilotos controlados.
8. Costo/latencia de generación y verificación ZK y filtración de privacidad bajo benchmark.
9. Cobertura de atestación de dispositivos, resistencia a replay y fallos de campo.
10. Margen bruto, retención, expansión de ingresos y pipeline originado por socios.

No se debe afirmar liderazgo de mercado, equivalencia con “Visa”, aprobación regulatoria, riesgo cero, privacidad garantizada ni disponibilidad productiva sin evidencia y revisión legal.

## 8. Referencias estratégicas

- [Cloudflare Wallets — documentación oficial](https://developers.cloudflare.com/wallets/) — verificar disponibilidad y elegibilidad; reservar un handle no equivale a tener una billetera fondeada.
- [Anuncio de Cloudflare Wallets](https://blog.cloudflare.com/es-la/wallets/) — concepto anunciado de billeteras de cuenta y virtuales.
- [Especificación x402](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md) — flujos de pago y semántica escrow específica de cada esquema.
- [Documentación del facilitador x402](https://github.com/x402-foundation/x402/blob/main/docs/core-concepts/facilitator.md) — responsabilidades de verify/settle y particularidades de los flujos.
- [Documentación de Espressif sobre secure element](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/secure_element.html) — referencia de integración.
- [Familia de productos Microchip ATECC608](https://www.microchip.com/en-us/product/ATECC608B) — capacidades y limitaciones específicas del elemento seguro.

---

**Governance note / Nota de gobernanza:** Any transition from this roadmap to implementation requires a separate architecture decision, threat model, legal review where relevant, named owner, test plan, acceptance criteria and explicit authorization. / Todo paso de esta hoja de ruta a implementación requiere una decisión arquitectónica separada, modelo de amenazas, revisión legal cuando corresponda, responsable identificado, plan de pruebas, criterios de aceptación y autorización expresa.
