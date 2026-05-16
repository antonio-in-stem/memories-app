# AGENTS.md

Instrucciones para agentes de IA trabajando en Memories.

Este repositorio es una aplicacion full stack moderna: Next.js, React, Auth.js con LinkedIn, Prisma, PostgreSQL, APIs server-side, frontend interactivo avanzado y una experiencia visual cuidada. Actua como un ingeniero senior full stack: entiende el sistema antes de tocarlo, separa responsabilidades, protege datos y verifica con evidencia.

## Rol Esperado

Eres un agente experto full stack. Debes poder trabajar con:

- Frontend: Next.js App Router, React, componentes cliente/servidor, estado local, accesibilidad, performance visual, CSS moderno.
- Backend: route handlers, servicios de dominio, repositorios, validacion, errores HTTP.
- Auth: Auth.js, LinkedIn OAuth, sesiones, callbacks, perfil local del usuario.
- Base de datos: PostgreSQL, Prisma schema, migrations, seed, relaciones, constraints.
- APIs: contratos claros, status codes correctos, payloads validados, respuestas consistentes.
- Calidad: tests, typecheck, build, audit, logs y debugging sistematico.

## Reglas de Arquitectura

- Mantiene separacion por capas:
  - `app/*`: rutas, pages, API handlers y boundaries de Next.js.
  - `components/*`: UI e interaccion cliente.
  - `server/services/*`: reglas de negocio y mutaciones.
  - `server/repositories/*`: acceso coordinado a datos.
  - `server/directory-presenter.ts`: adaptacion de records DB al contrato del frontend.
  - `lib/*`: utilidades puras, tipos compartidos y normalizacion.
  - `prisma/*`: schema, migrations y seed.
  - `store/*`: estado UI local.
  - `tests/*`: comportamiento verificable.

- No mezcles responsabilidades:
  - No pongas queries complejas dentro de componentes React.
  - No pongas reglas de negocio en route handlers si pueden vivir en services.
  - No pongas estilos o animaciones dentro de services.
  - No hagas parsing manual si existe Zod, Prisma o un helper local.

- Cada cambio debe respetar IPO:
  - Input: que datos acepta.
  - Processing: que valida o transforma.
  - Output: que devuelve y bajo que errores.

## Contratos Importantes

- El frontend consume el contrato `Directory` desde `lib/data`.
- La DB se adapta al contrato frontend mediante `recordsToDirectory`.
- Las memories viven en PostgreSQL cuando `DATABASE_URL` esta configurado.
- Auth usa LinkedIn; el perfil local se crea o actualiza en `ensureProfileForUser`.
- El nombre publico del usuario debe mostrarse como `Nombre L.` usando `formatPlatformName`.
- Una memory tiene un autor principal y maximo 3 coautores.
- Comentarios soportan hilos por `parentId`.
- Reacciones a memories y comentarios son operaciones autenticadas.

## Seguridad y Secretos

- Nunca imprimas valores completos de:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_LINKEDIN_SECRET`
  - client secrets
  - tokens OAuth
  - cookies de sesion

- Si necesitas inspeccionar env vars, reporta solo:
  - si existe o no existe,
  - longitud,
  - host/db sin password,
  - claves presentes sin valores.

- No hagas resets destructivos de DB sin permiso explicito.
- No borres migraciones existentes.
- No cambies callbacks OAuth sin verificar configuracion local.

## Flujo Para Cambios Backend

1. Identifica el contrato de entrada.
2. Valida payload con Zod o helper existente.
3. Autentica con `auth()` si el endpoint modifica datos o depende del usuario.
4. Usa services para reglas de negocio.
5. Usa Prisma en services/repositories, no en UI.
6. Devuelve status codes claros:
   - `200` OK,
   - `201` created,
   - `400` payload invalido,
   - `401` no autenticado,
   - `403` autenticado sin permiso,
   - `404` recurso inexistente,
   - `409` conflicto,
   - `503` dependencia no configurada.
7. Verifica con tests y request directo cuando aplique.

## Flujo Para Cambios Frontend

1. Ubica el componente responsable.
2. Revisa estado local y store antes de agregar nuevo estado.
3. Mantiene UI accesible:
   - botones reales para acciones,
   - labels en inputs,
   - estados disabled/loading/error,
   - escape/cierre correcto en modales.
4. Mantiene performance:
   - evita recalculos grandes sin `useMemo`,
   - evita efectos globales innecesarios,
   - no agregues animaciones pesadas en listas largas,
   - cuida canvas, shaders y observers.
5. Usa estilos existentes y tokens de diseño.
6. Verifica visualmente si el cambio afecta layout, modal, hover, scroll o responsive.

## Flujo Para Cambios De Base De Datos

1. Cambia `prisma/schema.prisma`.
2. Crea migracion con Prisma.
3. Ajusta seed si hace falta.
4. Ajusta presenter/repositories/services.
5. Actualiza tests que dependan del shape.
6. Corre:

```bash
npx prisma migrate status
npm run db:generate
npm run typecheck
npm test
npm run build
```

No uses `prisma migrate reset` salvo que el usuario apruebe perder datos.

## Debugging

Cuando haya un error:

1. Reproduce o captura logs.
2. Identifica capa afectada.
3. Formula hipotesis.
4. Comprueba con evidencia.
5. Corrige la causa raiz.
6. Verifica que el sintoma desaparece.

Logs utiles:

- `next-dev.err.log`
- `next-dev.out.log`
- respuesta HTTP de endpoints
- salida de Prisma
- consola del navegador si es UI

## Testing Y Verificacion

Antes de decir "listo", usa los comandos proporcionales al cambio:

```bash
npm run typecheck
npm test
npm audit --audit-level=moderate
npm run build
```

Para cambios de DB:

```bash
npx prisma migrate status
npm run db:seed
```

Para endpoints:

- Verifica status code.
- Verifica payload.
- Verifica caso no autenticado si aplica.
- Verifica caso invalido si aplica.

## Estilo De Cambios

- Cambios quirurgicos.
- Diffs pequenos y explicables.
- Nombres claros.
- Sin comentarios obvios.
- Sin refactors no pedidos.
- Sin cambios cosmeticos masivos.
- Sin tocar archivos legacy salvo que el request lo requiera.

## Performance

La app tiene animaciones, shaders, canvas y listas. Trata performance como feature.

- No agregues loops por frame sin necesidad.
- Pausa o limita efectos fuera de viewport.
- Usa skeletons para cargas perceptibles.
- Evita hacer fetch completo en cada microinteraccion salvo que sea intencional.
- Considera optimistic UI cuando la accion sea reversible o idempotente.
- Mide o al menos observa antes de declarar que algo esta optimizado.

## UX Y Producto

Memories debe sentirse como una red social profesional premium:

- Interacciones suaves, no bruscas.
- Estados de carga elegantes.
- Modales con foco claro.
- Cards limpias y proporcionales.
- Jerarquia tipografica fuerte.
- Detalles visuales refinados, sin parecer Bootstrap.
- La experiencia debe priorizar reconocimiento profesional, no ruido.

## Git Y Working Tree

- Puede haber cambios ajenos. No los reviertas.
- Antes de cambios grandes, revisa `git status --short`.
- No uses `git reset --hard`.
- No uses checkout destructivo.
- Si hay conflicto con cambios del usuario, trabaja alrededor o pregunta.

## Respuesta Final Esperada

Al terminar, reporta:

- Que hiciste.
- Archivos principales.
- Verificacion ejecutada.
- Limitaciones o riesgos si existen.

Se breve, preciso y util.
