# SKILLS.md

Guia operativa para agentes de IA trabajando en este repositorio. Estas habilidades no son slogans: son modos de ejecucion. Cada una define cuando usarla, que pasos seguir, que evidencias producir y cuando detenerse.

## Principios Base

- Lee antes de tocar. El repo siempre tiene mas contexto que tu memoria.
- Cambia lo minimo necesario para cumplir el objetivo.
- Verifica con comandos reales antes de declarar algo resuelto.
- No inventes contratos: busca tipos, rutas, servicios, tests y patrones existentes.
- Protege secretos. Nunca imprimas `.env`, `.env.local`, `.venv.local`, tokens, client secrets ni URLs completas con passwords.
- Respeta cambios ajenos. Si el working tree esta sucio, no reviertas nada que no hayas hecho.
- Usa `rg` para buscar. Es la herramienta primaria para entender el repo.

## Skill: Investigar

**Objetivo:** ver un error, encontrar su origen real y proponer o implementar una solucion basada en evidencia.

Usa esta skill cuando:

- Hay un error de runtime, build, typecheck, API, base de datos, OAuth, UI o test.
- El usuario dice "revisa logs", "no funciona", "server error", "se rompe", "esta lento" o algo equivalente.
- Hay sintomas ambiguos y varias causas posibles.

Proceso:

1. Reproduce o captura el sintoma.
   - Revisa logs relevantes: `next-dev.err.log`, `next-dev.out.log`, consola, respuesta HTTP, stack trace.
   - Si es frontend, usa navegador o screenshot cuando aplique.
   - Si es backend/API, usa requests directos y status codes.

2. Delimita el sistema afectado.
   - Frontend: componente, estado, CSS, render, hydration, eventos.
   - Backend: route handler, service, repository, auth/session.
   - DB: Prisma schema, migrations, seed, query, constraints.
   - Infra/config: env vars, OAuth callback, puerto, build/dev mismatch.

3. Formula hipotesis pequeñas.
   - Escribe mentalmente: "Si X es la causa, deberia ver Y".
   - Comprueba una hipotesis a la vez.
   - No parches por intuicion si todavia no sabes que falla.

4. Encuentra la causa raiz.
   - Identifica el primer punto donde el estado esperado diverge.
   - Distingue causa raiz de sintomas secundarios.

5. Corrige de forma minima.
   - Agrega o ajusta tests si el bug puede regresar.
   - Mantente dentro del modulo responsable.

6. Verifica.
   - Corre el comando mas cercano al fallo.
   - Luego corre la suite necesaria: `npm run typecheck`, `npm test`, `npm run build`.
   - Para DB/Auth, verifica status de Prisma y endpoints sin exponer secretos.

Evidencia esperada:

- Sintoma observado.
- Causa raiz.
- Archivos tocados.
- Comandos de verificacion y resultado.

Anti-patrones:

- "Creo que..." sin logs ni reproduccion.
- Cambiar frontend cuando el error viene de API.
- Resetear DB o borrar datos sin permiso explicito.
- Imprimir secretos para "debuggear".

## Skill: Aprender

**Objetivo:** cuando no sabes como funciona algo, construir un plan de accion para entender la parte necesaria del repo sin perderte.

Usa esta skill cuando:

- Te piden trabajar en una zona desconocida.
- No sabes donde vive una funcionalidad.
- El repo tiene arquitectura o patrones que aun no entiendes.
- Hay tecnologia nueva o integraciones no familiares.

Proceso:

1. Ubica el mapa inicial.
   - Lista estructura raiz.
   - Lee `README.md`, `AGENTS.md`, `SKILLS.md`, `DESIGN.md`, docs relevantes y `package.json`.
   - Identifica stack, scripts, entrypoints y convenciones.

2. Sigue el flujo de datos.
   - Para UI: `app/page.tsx` -> componentes -> store/hooks -> API.
   - Para API: route handler -> service -> repository -> Prisma.
   - Para DB: Prisma schema -> migrations -> seed -> presenter.
   - Para auth: `auth.ts` -> provider -> adapter -> session usage.

3. Busca por nombres reales.
   - Usa `rg "nombreFuncion|endpoint|modelo|clase|texto visible"`.
   - Abre pocos archivos, pero bien escogidos.

4. Crea un modelo mental corto.
   - Que entra.
   - Que transforma.
   - Que sale.
   - Que invariantes no se deben romper.

5. Decide el punto de intervencion.
   - Elige el archivo con responsabilidad natural.
   - Evita crear abstracciones si existe un patron local suficiente.

Resultado esperado:

- Un resumen breve del flujo.
- Lista de archivos relevantes.
- Riesgos o dudas reales.
- Siguiente paso concreto.

Anti-patrones:

- Leer archivos al azar.
- Cambiar codigo mientras todavia no sabes quien consume esa pieza.
- Duplicar logica porque no encontraste el helper existente.

## Skill: Estudiar

**Objetivo:** dominar el repo de pies a cabeza para poder hacer cambios grandes con criterio senior.

Usa esta skill cuando:

- Hay que planear una feature amplia.
- Hay que refactorizar arquitectura.
- Hay que evaluar performance, escalabilidad o seguridad.
- El usuario pide una revision profunda.

Proceso:

1. Inventario del sistema.
   - Stack: Next.js, React, Prisma, Auth.js, PostgreSQL, Zustand, Framer Motion, R3F/Three, GSAP, Tailwind/CSS.
   - Capas: `app`, `components`, `server`, `lib`, `store`, `prisma`, `tests`, `data`.
   - Contratos publicos: API routes, types de `lib/data`, Prisma models, session shape.

2. Mapa de responsabilidades.
   - `app/*`: routing, server rendering, API handlers.
   - `components/*`: experiencia visual e interaccion cliente.
   - `server/services/*`: reglas de negocio, auth, mutaciones.
   - `server/repositories/*`: lectura/escritura coordinada de datos.
   - `server/directory-presenter.ts`: conversion DB -> contrato frontend.
   - `lib/*`: utilidades puras, contratos, normalizadores.
   - `prisma/*`: modelo persistente, migraciones, seed.
   - `store/*`: estado UI local.

3. Revisa contratos e invariantes.
   - Una memory tiene autor, destinatario, shoutout, body, imagen opcional, likes y comentarios.
   - Coautores maximo 3.
   - Comentarios soportan hilos por `parentId`.
   - Auth usa LinkedIn y crea/actualiza perfil local.
   - Nombres publicos se muestran como `Nombre L.`.

4. Revisa verificacion existente.
   - Tests de normalizacion de data.
   - Tests de presenter DB -> Directory.
   - Tests de nombres y payloads.
   - Scripts: `typecheck`, `test`, `build`, `db:*`.

5. Detecta deuda y riesgos.
   - Archivos demasiado grandes.
   - Logica UI mezclada con efectos pesados.
   - Endpoints sin tests de integracion.
   - Migrations vs DB local.
   - Performance de animaciones/canvas.

6. Produce una sintesis.
   - Diagrama mental de flujo.
   - Puntos de extension seguros.
   - Zonas delicadas.
   - Recomendaciones priorizadas.

Resultado esperado:

- Conocimiento operativo del repo.
- Capacidad de explicar cualquier request en terminos de capas.
- Capacidad de estimar impacto antes de tocar codigo.

Anti-patrones:

- Convertir estudio en refactor no pedido.
- Optimizar sin medir.
- Asumir que todo vive en frontend cuando ya hay backend.

## Skill: Intervenir

**Objetivo:** modificar codigo de forma quirurgica, precisa y verificable, sin alterar comportamiento o estilo no relacionado.

Usa esta skill cuando:

- El usuario pide un cambio puntual.
- Hay un bug con causa raiz clara.
- Hay que agregar una feature dentro de patrones existentes.
- Hay que tocar codigo sensible en auth, API, DB o UI.

Proceso:

1. Define el alcance.
   - Que comportamiento cambia.
   - Que archivos son responsables.
   - Que archivos no deben tocarse.

2. Escribe o ajusta tests si aplica.
   - Para logica pura: test unitario.
   - Para payloads/API/services: test de validacion o service.
   - Para bug reproducible: test que falle antes del fix.

3. Edita con precision.
   - Usa `apply_patch` para cambios manuales.
   - Mantiene nombres, estilo y patrones del repo.
   - No hagas refactors cosmeticos.
   - No cambies formato global si no es necesario.

4. Verifica localmente.
   - Corre el test afectado.
   - Corre `npm run typecheck`.
   - Corre `npm test`.
   - Corre `npm run build` si tocaste app, API, Prisma, imports o config.

5. Reporta con sobriedad.
   - Que se cambio.
   - Donde.
   - Como se verifico.
   - Riesgos restantes si existen.

Checklist de intervencion:

- El diff toca solo lo necesario.
- No hay secretos en logs ni commits.
- No se rompio el contrato de `Directory`.
- No se rompio SSR/client boundary.
- No se introdujeron queries innecesariamente pesadas.
- Los errores devuelven status codes correctos.
- La UI mantiene estados loading/error/disabled.

Anti-patrones:

- "Ya que estoy aqui..." y refactorizar media app.
- Cambiar schema sin migracion.
- Cambiar API sin actualizar consumidores.
- Cambiar estilos globales que afectan pantallas no relacionadas.
- Revertir cambios ajenos.

## Comandos de Verificacion Recomendados

```bash
npm run typecheck
npm test
npm audit --audit-level=moderate
npm run build
npx prisma migrate status
npm run db:seed
```

Usa todos cuando el cambio cruza varias capas. Usa un subconjunto cuando el cambio sea pequeño y el riesgo sea bajo.
