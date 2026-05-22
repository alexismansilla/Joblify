# Joblify — Portal de Acreditación para Ferias de Empleo

Plataforma web para gestionar ferias de empleo: acreditación de candidatos con credenciales impresas, captura de leads por empresas vía escaneo QR, y clasificación de interés a través de WhatsApp Business API.

## Funcionalidades Principales

- **Check-in de candidatos**: Búsqueda por RUT, nombre o teléfono. Genera credencial con QR en Canvas (62mm) e imprime directamente a impresora Brother QL-800 vía QZ Tray.
- **Portal de empresas** (`/empresa/[token]`): Cada empresa tiene un link único para ver sus leads capturados, filtrarlos por área/experiencia/tipo de búsqueda y exportar CSV (requiere plan Basic o superior).
- **Clasificación de interés vía WhatsApp**: El candidato escanea el QR de la empresa → recibe mensaje interactivo con botones (Muy interesado / Quiero más info / Solo explorando) → la respuesta queda registrada automáticamente.
- **Carga masiva de contactos**: Importación desde Excel/CSV con mapeo inteligente de columnas y manejo de colisiones de `qr_token`.
- **Registro manual**: Formulario web para crear candidatos o empresas desde el panel de administración.
- **Dashboard de matches**: Estadísticas agregadas en tiempo real (total, distribución por tipo, tasa de adopción, top 20 empresas) usando una RPC optimizada — sin cargar tabla completa.
- **Gestión de autoridades**: Tabla separada con carga masiva y credenciales diferenciadas para VIPs/autoridades.

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js (App Router) | 16 | Framework fullstack con Server Actions |
| React | 19 | UI |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 4 | Estilos |
| Supabase / PostgreSQL | — | Base de datos |
| WhatsApp Business API | — | Mensajería y clasificación |
| QZ Tray | 2.2 | Impresión térmica directa |
| Vitest | 4 | Testing |

### Dependencias relevantes

| Librería | Uso |
|----------|-----|
| `@supabase/supabase-js` | Cliente PostgreSQL |
| `exceljs` | Lectura de archivos Excel/CSV |
| `qrcode` | Generación de códigos QR |
| `qz-tray` | WebSocket con impresoras térmicas (RSA SHA-512) |
| `jspdf` | PDF como fallback de impresión |
| `framer-motion` | Animaciones |
| `lucide-react` | Iconos |

---

## Estructura del Proyecto

```
joblify/
├── app/
│   ├── page.tsx                        # Check-in: búsqueda e impresión de credenciales
│   ├── layout.tsx
│   ├── empresa/[token]/page.tsx        # Portal de empresa: leads, filtros, exportación CSV
│   ├── connect/[id]/page.tsx           # Landing del escaneo QR (redirige a WhatsApp)
│   ├── matches/page.tsx                # Dashboard analítico de conexiones
│   ├── admin/
│   │   ├── page.tsx                    # Dashboard admin (carga de datos, tabla de contactos)
│   │   ├── contactos/[id]/page.tsx     # Credencial individual + impresión
│   │   ├── autoridades/page.tsx        # Gestión de autoridades
│   │   └── registro-manual/page.tsx   # Registro manual de contactos
│   ├── api/
│   │   ├── contacts/route.ts           # GET paginado con búsqueda (usado por ContactTable)
│   │   ├── qz-sign/route.ts            # Firma RSA para QZ Tray
│   │   └── whatsapp/webhook/route.ts   # Webhook WhatsApp Business API
│   ├── actions/
│   │   ├── contacts.ts                 # Server actions para contactos
│   │   ├── contactsParser.ts           # Parsing y mapeo de columnas CSV/Excel
│   │   ├── authorities.ts              # Server actions para autoridades
│   │   └── authoritiesParser.ts        # Parsing CSV/Excel de autoridades
│   └── components/
│       ├── ContactTable.tsx            # Tabla paginada con búsqueda en tiempo real
│       ├── FileUpload.tsx              # Carga de archivos de contactos
│       ├── AuthorityTable.tsx          # Tabla de autoridades con impresión
│       ├── AuthorityFileUpload.tsx     # Carga de archivos de autoridades
│       ├── IdentityStatus.tsx          # Badge de identidad del usuario
│       ├── AdminNavbar.tsx             # Navegación del panel admin
│       └── ui/Input.tsx
├── lib/
│   ├── supabase.ts                     # Cliente público Supabase
│   ├── supabaseAdmin.ts                # Cliente admin (service_role, lazy singleton)
│   ├── qz.ts                           # Integración QZ Tray
│   ├── credentialRenderer.ts           # Canvas 732×732px → badge 62mm Brother QL-800
│   ├── authorityCredentialRenderer.ts  # Canvas para autoridades
│   ├── certs/qz-private-key.ts         # Clave privada RSA para QZ Tray
│   ├── templates/
│   │   └── whatsappTemplates.ts        # Plantillas de mensajes WhatsApp
│   └── services/
│       ├── contactService.ts           # CRUD, búsqueda, matches, portal empresas
│       ├── whatsappService.ts          # Envío de mensajes (texto, interactivos, vCard)
│       └── authorityService.ts         # CRUD autoridades
├── scripts/
│   ├── clean-duplicates.ts             # Ejecuta RPC remove_duplicate_contacts
│   ├── load-test.ts                    # Simula N escaneos concurrentes al webhook
│   ├── test-edge-cases.ts              # Valida webhook con datos incompletos
│   ├── test-whatsapp.ts                # Test de envío de mensajes WhatsApp
│   └── migration-feria-empleo.sql      # Migración SQL del esquema de la feria
├── data/
│   ├── README.md                       # Guía de formato y columnas aceptadas
│   └── schema.json                     # Esquema de validación de columnas
└── __test__/                           # Tests Vitest
```

---

## Arquitectura de Datos (Supabase / PostgreSQL)

### Tablas

**`contacts`** — Candidatos y empresas del evento

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` | PK |
| `name` | `text` | Nombre completo |
| `first_name` / `last_name` | `text` | Opcionales |
| `email` | `text` | Opcional |
| `phone` | `text` | Normalizado a E.164 (`+569XXXXXXXX`) |
| `rut` | `text` | RUT/DNI/Pasaporte, opcional |
| `qr_token` | `text` | Único, 10 chars — identifica la credencial impresa |
| `company` | `text` | Empresa u organización |
| `position` | `text` | Cargo |
| `profile` | `text` | Área profesional |
| `industry` | `text` | Sector |
| `experience_level` | `text` | Nivel de experiencia |
| `job_search_type` | `text` | Tipo de búsqueda laboral |
| `opportunity_description` | `text` | Descripción de oportunidades (empresas) |
| `access_token` | `text` | Token único para link de portal de empresa |
| `plan` | `text` | `free` \| `basic` \| `pro` \| `premium` |
| `created_at` | `timestamptz` | Automático |

**`matches`** — Conexiones registradas por escaneo QR

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` | PK |
| `contact_id` | `uuid` | FK → empresa cuyo QR fue escaneado |
| `scanner_id` | `uuid` | FK → candidato que escaneó (nullable) |
| `scanner_phone` | `text` | Fallback si no hay `scanner_id` |
| `connection_type` | `text` | `negocio` \| `mentoria` \| `casual` |
| `created_at` | `timestamptz` | Automático |

**`authorities`** — Autoridades y VIPs del evento

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` | PK |
| `name` | `text` | Nombre completo |
| `position` | `text` | Cargo |
| `organization` | `text` | Organización |
| `created_at` | `timestamptz` | Automático |

### Acceso a Base de Datos

La app no tiene login de usuarios. El acceso a Supabase se divide en dos capas:

- **`anon key`** (pública, browser): solo lectura.
- **`service_role key`** (privada, solo Server Actions): escritura. Nunca se expone al browser.

### Funciones SQL (PL/pgSQL)

| Función | Propósito |
|---------|-----------|
| `generate_uid(length)` | Genera tokens alfanuméricos únicos para QR |
| `remove_duplicate_contacts()` | Limpieza basada en Nombre + Email/Teléfono |
| `get_matches_dashboard()` | Stats agregadas + top 20 empresas en una sola query RPC |

---

## Rutas y API

| Ruta | Descripción |
|------|-------------|
| `/` | Check-in: búsqueda por RUT/nombre/teléfono e impresión de credencial |
| `/empresa/[token]` | Portal de empresa: leads capturados, filtros, exportación CSV |
| `/connect/[id]` | Landing del escaneo QR (registra match y redirige a WhatsApp) |
| `/matches` | Dashboard analítico de conexiones (protegido con Basic Auth) |
| `/admin` | Panel de administración (protegido con Basic Auth) |
| `/admin/contactos/[id]` | Credencial individual con impresión |
| `/admin/registro-manual` | Formulario de registro manual |
| `/admin/autoridades` | Gestión de autoridades y VIPs |
| `GET /api/contacts` | Lista paginada con búsqueda (usada por ContactTable) |
| `POST /api/qz-sign` | Firma server-side del challenge RSA para QZ Tray |
| `GET/POST /api/whatsapp/webhook` | Webhook WhatsApp Business API |

---

## Flujo Principal

### Check-in de candidato
1. El operador busca al candidato por RUT, nombre o teléfono en `/`.
2. Se genera una credencial en Canvas (nombre, empresa, QR) de 62mm.
3. Se imprime directo a Brother QL-800 vía QZ Tray. Si falla, descarga PDF.

### Captura de lead (empresa escanea candidato)
1. El candidato escanea el QR de la empresa → llega a `/connect/[qr_token]`.
2. Se registra un match en la base de datos.
3. El candidato es redirigido a WhatsApp con el token en el mensaje.
4. El webhook recibe el mensaje, envía botones interactivos de interés.
5. Al seleccionar un botón, se actualiza `connection_type` del match.
6. Se envía la tarjeta de contacto (vCard) del representante de la empresa.

### Portal de empresa
1. El admin genera un link único desde `/admin/contactos/[id]`.
2. La empresa accede a `/empresa/[token]` sin login.
3. Ve sus leads con filtros por área, experiencia y tipo de búsqueda.
4. Con plan Basic o superior puede exportar CSV.

### Modos de salida para credenciales

```env
NEXT_PUBLIC_QR_OUTPUT_MODE=PRINT   # Imprime via QZ Tray; fallback PDF si falla
NEXT_PUBLIC_QR_OUTPUT_MODE=PDF     # Descarga directamente el PDF
```

---

## Seguridad

### Basic Auth (admin y matches)

Las rutas `/admin` y `/matches` están protegidas con HTTP Basic Auth definido en `proxy.ts`.

```env
ADMIN_USERNAME=tu_usuario
ADMIN_PASSWORD=tu_contraseña
```

### Rate Limiting

| Endpoint | Límite |
|----------|--------|
| `/api/whatsapp/webhook` | 60 req/min por IP |
| `/api/contacts` | 120 req/min por IP |
| Resto de `/api/` | 300 req/min por IP |

---

## Testing

```bash
npm test            # Todos los tests
npm run test:watch  # Modo watch
```

| Archivo | Tipo |
|---------|------|
| `webhook_route.test.ts` | Handlers GET/POST del webhook WhatsApp |
| `contacts.test.ts` | Parsing CSV/Excel, mapeo de columnas |
| `edgeCases.test.ts` | Datos incompletos (null phone, null company, etc.) |
| `contactService.test.ts` | Búsqueda por RUT/email/teléfono |
| `credentialRenderer.test.ts` | Word-wrap de texto en Canvas |
| `whatsappService.test.ts` | Normalización de teléfonos chilenos |
| `whatsappService.integration.test.ts` | Envío de mensajes (mock fetch) |

---

## Configuración Local

```bash
npm install
npm run dev
```

Variables de entorno en `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=
NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS=

# Impresión
NEXT_PUBLIC_QR_OUTPUT_MODE=PRINT
NEXT_PUBLIC_PRINTER_NAME=Brother QL-800
QZ_PRIVATE_KEY=

# Admin
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

---

## Scripts de Utilidad

```bash
# Limpiar duplicados en la base de datos
npx tsx scripts/clean-duplicates.ts

# Test de integración WhatsApp
npx tsx scripts/test-whatsapp.ts

# Load test (simula 50 escaneos concurrentes al webhook)
npx tsx scripts/load-test.ts
npx tsx scripts/load-test.ts --n=100 --url=http://localhost:3000

# Test de casos borde (datos incompletos)
npx tsx scripts/test-edge-cases.ts --url=http://localhost:3000
```

---

## Despliegue

Configurado para **Vercel**. Cada commit a `main` dispara un deploy automático a producción.
