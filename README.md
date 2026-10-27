# Cosmetia Belleza — Demo funcional

Marketplace de cosmetología (clientes ↔ especialistas) — **demo sin pagos** que corre en un servidor local con Docker.

Ver plan completo: [`PLAN_IMPLEMENTACION.md`](./PLAN_IMPLEMENTACION.md)

## Configuración secreta

Los secretos **no están en el repo**. Antes de levantar:

```bash
cd deploy
cp .env.example .env   # y completa POSTGRES_PASSWORD y JWT_SECRET
```

Los archivos de seed (datos y cuentas demo) tampoco se publican; si no existen, la app levanta con la base vacía y el admin crea todo desde el panel.

## Arrancar (una sola orden)

```bash
cd deploy
docker compose up --build -d
```

- Primera vez: tarda unos minutos (build de imágenes + migración + seed automático si está disponible).
- Parar: `docker compose down`
- Reiniciar (rápido): `docker compose restart`
- Reset total (borra datos): `docker compose down -v && docker compose up --build -d`
- Contenedores con `restart: unless-stopped` (sobreviven reboots).

## Qué incluye la demo

- **Home** fiel a los mockups: buscador, cards de profesionales, mapa (OpenStreetMap), sidebar del blog
- **Búsqueda** por nombre/especialidad/comuna con mapa
- **Ficha profesional** + agendamiento en vivo (elige tratamiento → fecha → hueco libre → confirma)
- **Panel cliente**: próximas citas, cancelar, historial, valoraciones y sus **órdenes de servicio con historial de eventos**
- **Dashboard especialista**: calendario semanal tipo Google Calendar, citas, **tab Órdenes (iniciar atención / completar con nota / cancelar)**, horario semanal, excepciones, perfil, certificado
- **Admin con tabs**: Dashboard KPI (gráficos de citas por día, **niveles de ocupación**, órdenes por estado, top especialistas), usuarios/verificación, **blog CRUD**, **crear cosmetólogos**, órdenes, moderación de valoraciones
- **Blog** editable desde el admin (crear/editar/publicar/ocultar/eliminar)
- **Foros de discusión**: categorías, crear temas, responder (admin modera: borrar/cerrar)
- **Órdenes de servicio reales**: folio `ORD-AAAA-XXXX`, se crea sola al agendar, estados PENDIENTE → EN_ATENCION → COMPLETADA/CANCELADA con historial y actores
- **Anti doble-reserva**: constraint único en BD + validación server-side

## Estructura

```
apps/api     NestJS + Prisma + PostgreSQL (auth, citas, disponibilidad, valoraciones, blog, foros, órdenes, admin)
apps/web     React 19 + Vite + Tailwind v4 + Leaflet + Recharts (SPA, design tokens de los mockups)
deploy/      docker-compose.yml (db + api + web/nginx) + .env.example
REF/         Presupuesto original y mockups
```

## Desarrollo en local (sin Docker, opcional)

```bash
# DB (solo postgres)
cd deploy && docker compose up -d db

# API
cd apps/api
DATABASE_URL=postgresql://cosmetia:cosmetia@localhost:5432/cosmetia npm install
export JWT_SECRET=dev-secret-local
npx prisma db push
npm run start:dev   # http://localhost:3000/api/v1

# Web (otra terminal)
cd apps/web && npm install && npm run dev   # http://localhost:5173 (proxy a :3000)
```

## Notas

- Sin pagos (demo): la cita se confirma directo al agendar. Para producción se integraría MercadoPago/Webpay.
- Para exponerla fuera de la red local: Cloudflare Tunnel (gratis) apuntando al puerto `8090`.
- Fotos de Unsplash requieren internet; el resto funciona offline.
