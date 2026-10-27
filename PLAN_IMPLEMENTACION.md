# Plan de Implementación — Cosmetia Belleza (v3 · DEMO funcional)

**Objetivo:** una **demo que funcione de verdad** (clic por clic, con datos reales en BD), corriendo en tu servidor local con Docker. **Sin pagos** — la cita se confirma directo al agendar.

Basado en: `REF/Presupuesto SaaS Cosmetologia.pdf` + mockups en `REF/*.jpeg`

---

## 1. Qué es esta demo

Un marketplace de cosmetología que un cliente podría tocar en vivo: busca una cosmetóloga, ve su disponibilidad, agenda una cita, y la especialista la ve en su calendario y la completa. Después se puede dejar una reseña.

| Item | Decisión |
|------|----------|
| Pagos (Webpay/MercadoPago) | **FUERA** — cita se confirma al agendar |
| Infraestructura | Servidor local + Docker Compose, $0 |
| Mapas | Leaflet + OpenStreetMap, $0 |
| Correos | Solo log/consola (o Brevo free si se quiere ver el correo real) |
| Duración | **4 semanas** (desarrollo asistido con IA) · 6–8 semanas si es a mano |
| Inversión | $0 en licencias/infra · solo tiempo |

---

## 2. Alcance de la demo

### 2.1 SÍ incluido (debe funcionar)

| # | Módulo | Qué se demuestra |
|---|--------|------------------|
| D1 | **Home** (fiel a mockups) | Logo, nav (PROFESIONALES \| TRATAMIENTOS \| BLOG \| UBICACIÓN), buscador, cards de profesionales con rating, mapa "citas disponibles en tu zona", sidebar del blog |
| D2 | **Búsqueda y ficha** | Listado con filtro por especialidad/tratamiento y comuna, ficha del profesional con foto, bio, tratamientos y precios |
| D3 | **Registro/Login** | Paciente y especialista (email+password, JWT) |
| D4 | **Disponibilidad** | La especialista define bloques recurrentes (ej: L-V 10–14) + días bloqueados; el sistema genera los huecos libres |
| D5 | **Agendamiento** | Paciente elige tratamiento → hueco libre → confirma → cita queda `CONFIRMADA` en ambos calendarios (sin paso de pago) |
| D6 | **Panel paciente** | Mis citas (próximas/historial), cancelar |
| D7 | **Dashboard especialista** | Calendario semanal, confirmar/completar/no presentado, gestión de disponibilidad |
| D8 | **Reseñas** | Solo tras cita `COMPLETADA`; rating 1–5 + texto; promedio en la ficha |
| D9 | **Blog** | 3 artículos seed de los mockups, listado + detalle, diseño de la sidebar |
| D10 | **Admin básico** | Lista de usuarios, marcar especialista verificado (subió certificado), moderar/borrar reseñas |

### 2.2 NO incluido (post-demo)

Pagos y comisiones · liquidaciones · webhooks · correos transaccionales · validación automática Superintendencia · app móvil · producción pública 24/7 · SEO avanzado · RPA.

### 2.3 Máquina de estados de la cita (simplificada)

```
(agendar) ──▶ CONFIRMADA ──especialista──▶ COMPLETADA ──▶ paciente deja RESEÑA
                    │
                    ├──▶ CANCELADA (paciente o admin)
                    └──▶ NO_PRESENTADO (especialista)
```

---

## 3. Stack (sin cambios de la v2, mínimo necesario)

```
Tu servidor (Ubuntu + Docker)
├── caddy        reverse proxy + TLS
├── web          React 18 + Vite + TS + Tailwind (build estático)
├── api          NestJS + TypeScript
├── postgres:16  única BD (jsonb para perfiles/blog)
└── minio        fotos de perfil (opcional en demo: se puede servir de /assets)
```

- API REST `/api/v1` + OpenAPI, JWT con roles `PACIENTE` / `ESPECIALISTA` / `ADMIN`
- Diseño: design tokens de los mockups (malva `#C48B9F`, granate `#9E5F70`, fondo rosa `#F7E4E7`, Poppins)
- Exposición a internet (si se quiere mostrar fuera de tu red): Cloudflare Tunnel gratis, opcional

**Modelo de datos (core):** User · ProfessionalProfile · Treatment · AvailabilityRule · AvailabilityException · Appointment (`UNIQUE(professional_id, start_at)` anti doble-reserva) · Review · BlogPost · Credential (certificado subido como archivo + estado verificación)

---

## 4. Cronograma (4 semanas)

| Semana | Trabajo | Resultado al viernes |
|--------|---------|----------------------|
| **W1** | Docker Compose + DB + auth/roles + CRUD de perfiles y tratamientos + **seed de datos demo** | Login funciona; 5 especialistas con perfil en la BD |
| **W2** | Disponibilidad + generación de huecos + búsqueda/filtros + home y ficha (FE) | Se puede buscar y ver huecos libres |
| **W3** | Agendamiento + panel paciente + dashboard especialista + reseñas | **Flujo core completo punta a punta** |
| **W4** | Admin, blog (3 posts), pulido visual contra mockups, bugs, seed final | **Demo presentable** |

---

## 5. Datos demo (para que la demo no se vea vacía)

Seed incluido en W1 (los archivos de seed con credenciales demo no se publican en el repo):

- **5 especialistas** con fotos de stock (unsplash), bio, ubicaciones reales en Viña del Mar/Valparaíso, ratings 4.2–4.9
- **8 tratamientos** (Limpieza facial, Peelings, Microneedling, Radiofrecuencia, Depilación láser, Masaje reductor, HydraFacial, Diseño de cejas) con precios en CLP
- Disponibilidad variada (mañana/tarde/fin de semana) para que siempre haya huecos
- **1 admin** (credenciales solo en el archivo de seed privado)
- **3 pacientes** de prueba con citas históricas y 6 reseñas
- **3 artículos del blog** de los mockups

---

## 6. Entregables finales

1. Repo con `docker compose up -d` → todo corriendo (web en `:80`, API en `:3000`)
2. Seed reproducible (`npm run seed`)
3. Deck de demo de 5 slides + guion de recorrido (6 min): home → buscar → agendar → panel especialista completa → reseña → admin
4. README con instrucciones de arranque y credenciales de prueba

---

## 7. Riesgos de la demo

| Riesgo | Mitigación |
|--------|------------|
| Doble agenda | `UNIQUE(professional_id, start_at)` + transacción al reservar |
| Huecos generados mal (horarios repetidos/excepciones) | Tests unitarios de la generación de slots |
| Diseño alejado de los mockups | Comparación visual semanal; tokens fijados desde W1 |
| Se cae al prender la laptop (servidor local) | Mostrar con el server en tu máquina principal o UPS; no es producción |

---

## 8. Si luego quieres llevarla a producción

Camino mínimo desde esta demo: (1) integrar MercadoPago (split nativo) o Webpay con liquidación manual, (2) correos transaccionales, (3) backups automáticos + VPS de respaldo, (4) Ley 21.719 (consentimientos, cifrado), (5) validación Superintendencia semi-automática. Estimado: +4–6 semanas.
