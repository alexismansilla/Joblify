# Networking Pro - Gestión de Contactos para Eventos

Esta plataforma web permite gestionar el networking en eventos profesionales de manera eficiente. Facilita la [carga de bases de datos de asistentes desde Excel](./data/README.md), genera credenciales con QR personalizados para impresión térmica, y rastrea conexiones a través de WhatsApp Business API con clasificación automática.

## Funcionalidades Principales

- **Carga Masiva de Contactos**: Procesamiento de archivos `.csv` con mapeo inteligente de columnas (Nombre, Email, Teléfono, RUT, Empresa, Cargo). [Ver guía de carga](./data/README.md).
- **Registro Manual**: Formulario web para crear contactos individuales desde el panel de administración.
- **Credenciales con QR**: Generación de credenciales renderizadas en Canvas (nombre con word-wrap, empresa, línea divisoria y QR opcional) en formato 62mm x 62mm para etiquetas Brother QL-800.
- **Impresión Térmica Directa**: Integración con **QZ Tray** mediante WebSocket con autenticación RSA SHA-512 (challenge-response). Detección automática de impresora Brother QL-800.
- **Integración WhatsApp Business API**: Webhook que recibe mensajes entrantes, extrae tokens QR del formato `@XXXXXXXX`, crea registros de match, y envía mensajes interactivos con botones para clasificar la conexión (Negocio / Mentoría / Casual). Incluye envío de tarjeta de contacto (vCard).
- **Dashboard de Matches**: Analítica en tiempo real con volumen total de conexiones, tasa de identificación, distribución por tipo de conexión (porcentajes con conteo al hacer hover), top 10 perfiles más conectados, e historial de actividad por usuario.
- **Gestión de Autoridades**: Tabla separada para autoridades con carga masiva desde Excel y credenciales diferenciadas.
- **Sistema de Identidad**: Reconocimiento basado en el número de WhatsApp del escáner, sin necesidad de login tradicional.

---

## Stack Tecnológico

### Core

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js (App Router) | 16 | Framework fullstack con Server Actions |
| React | 19 | UI |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 4 | Estilos |

### Librerías

| Librería | Uso |
|----------|-----|
| [@supabase/supabase-js](https://supabase.com/) | Cliente PostgreSQL (base de datos) |
| [exceljs](https://github.com/exceljs/exceljs) | Lectura y procesamiento de archivos Excel |
| [qrcode](https://github.com/soldair/node-qrcode) | Generación de códigos QR |
| [qz-tray](https://qz.io/) | Comunicación WebSocket con impresoras térmicas |
| [jspdf](https://github.com/parallax/jsPDF) | Generación de PDF como fallback de impresión |
| [framer-motion](https://www.framer.com/motion/) | Animaciones |
| [lucide-react](https://lucide.dev/) | Iconos |
| [vitest](https://vitest.dev/) | Testing unitario e integración |

---

## Estructura del Proyecto

```
networking-pro/
├── app/
│   ├── page.tsx                        # Portal de check-in (buscar e imprimir credenciales)
│   ├── layout.tsx                      # Layout raíz
│   ├── globals.css
│   ├── api/
│   │   ├── qz-sign/route.ts            # Firma RSA para QZ Tray
│   │   └── whatsapp/webhook/route.ts   # Webhook WhatsApp Business API
│   ├── admin/
│   │   ├── page.tsx                    # Dashboard admin (carga de datos)
│   │   ├── contactos/[id]/page.tsx     # Página de credencial individual
│   │   ├── autoridades/page.tsx        # Gestión de autoridades
│   │   └── registro-manual/page.tsx    # Registro manual de contactos
│   ├── connect/[id]/page.tsx           # Landing del escaneo QR (redirige a WhatsApp)
│   ├── matches/page.tsx                # Dashboard analítico de conexiones
│   ├── components/
│   │   ├── FileUpload.tsx              # Carga de archivos CSV/Excel de contactos
│   │   ├── ContactTable.tsx            # Tabla paginada de contactos con búsqueda
│   │   ├── AuthorityTable.tsx          # Tabla de autoridades
│   │   ├── AuthorityFileUpload.tsx     # Carga de archivos CSV/Excel de autoridades
│   │   ├── IdentityStatus.tsx          # Badge de identidad del usuario
│   │   ├── AdminNavbar.tsx             # Navegación admin compartida
│   │   └── ui/Input.tsx                # Componente input reutilizable
│   └── actions/
│       ├── contacts.ts                 # Server actions para contactos
│       ├── contactsParser.ts           # Parsing y mapeo de columnas CSV/Excel (contactos)
│       ├── authorities.ts              # Server actions para autoridades
│       └── authoritiesParser.ts        # Parsing y mapeo de columnas CSV/Excel (autoridades)
├── lib/
│   ├── supabase.ts                     # Cliente Supabase
│   ├── qz.ts                           # Integración QZ Tray
│   ├── credentialRenderer.ts           # Renderizado de credenciales en Canvas
│   ├── authorityCredentialRenderer.ts  # Credenciales de autoridades
│   ├── certs/
│   │   └── qz-private-key.ts          # Clave privada RSA para firma QZ Tray
│   ├── templates/
│   │   └── whatsappTemplates.ts        # Plantillas de mensajes WhatsApp
│   └── services/
│       ├── contactService.ts           # Queries de contactos
│       ├── whatsappService.ts          # Integración WhatsApp API
│       └── authorityService.ts         # Queries de autoridades
├── data/
│   ├── README.md                       # Guía de formato y columnas aceptadas
│   ├── asistente_FIT.csv               # Plantilla de ejemplo para asistentes
│   ├── autoridades_FIT.csv             # Plantilla de ejemplo para autoridades
│   └── schema.json                     # Esquema de validación de columnas
├── scripts/
│   ├── clean-duplicates.ts             # Limpieza de contactos duplicados
│   ├── test-whatsapp.ts                # Test de envío de mensajes WhatsApp
│   └── test-wa.ts                      # Test auxiliar de WhatsApp API
├── certificates/                       # Certificados locales QZ Tray (no versionados)
│   ├── digital-certificate.txt
│   └── private-key.pem
└── public/
    └── digital-certificate.txt         # Certificado público QZ Tray
```

---

## Arquitectura de Datos (Supabase / PostgreSQL)

La persistencia de datos utiliza PostgreSQL sobre Supabase, con un esquema diseñado para alta disponibilidad de lectura y trazabilidad de conexiones sin autenticación tradicional.

### Tablas

**`contacts`** — Asistentes del evento

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` | PK, generado automáticamente |
| `name` | `text` | Nombre completo |
| `first_name` / `last_name` | `text` | Opcionales |
| `email` | `text` | Opcional |
| `phone` | `text` | WhatsApp normalizado |
| `rut` | `text` | RUT/DNI/Pasaporte, opcional |
| `qr_token` | `text` | Único, 10 chars (`generate_uid`) |
| `company` | `text` | Empresa u organización |
| `position` | `text` | Cargo |
| `industry` / `profile` | `text` | Opcionales |
| `created_at` | `timestamptz` | Automático |

**`matches`** — Conexiones registradas por escaneo QR

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` | PK |
| `contact_id` | `uuid` | FK → contacto escaneado |
| `scanner_id` | `uuid` | FK → contacto que escaneó (nullable) |
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

### Permisos de Base de Datos (RLS)

La app **no tiene sistema de login**. El acceso a Supabase se divide en dos capas según el origen de la operación:

- **`anon key`** (pública, visible en el browser): solo puede leer datos.
- **`service_role key`** (privada, solo server-side vía Server Actions): puede escribir. Nunca se expone al browser.

--------------------------------------

- **`contacts`**: No se pueden editar ni borrar desde el cliente.
- **`matches`**: Cualquiera puede crear una conexión. La clasificación (negocio/mentoría/casual) llega después desde el webhook de WhatsApp, que corre en el servidor.
- **`authorities`**: Lectura pública para mostrar la lista en el panel. Escritura y borrado solo desde el servidor via `supabaseAdmin` (cliente con `service_role`).

### Lógica de Base de Datos y Funciones SQL

Se utilizan funciones personalizadas en PL/pgSQL para automatizar procesos críticos:

| Función | Propósito |
|---------|-----------|
| `generate_uid(length)` | Genera tokens alfanuméricos únicos para los códigos QR, minimizando colisiones. |
| `remove_duplicate_contacts()` | Limpieza inteligente basada en coincidencia de Nombre + Email/Teléfono. |
| `purge_contacts()` | Reseteo controlado de la base de datos para nuevos eventos. |

### Identificación de Usuario "Sin Login"

La arquitectura soporta un flujo de identidad híbrido:
1. **Identidad Persistente**: Al escanear por primera vez, se asocia el `scanner_phone` (desde WhatsApp) con un registro en `contacts`.
2. **Fallback por Token**: Si el usuario no está en la base, se utiliza su número de teléfono como identificador único en la tabla `matches` hasta que complete su perfil.
3. **Constraint de Unicidad**: El campo `qr_token` garantiza que cada credencial impresa sea única y rastreable permanentemente.

---

## Rutas y API

| Ruta | Descripción |
|------|-------------|
| `/` | Portal de check-in (búsqueda e impresión de credenciales) |
| `/connect/[id]` | Landing de escaneo QR (registra match y redirige a WhatsApp) |
| `/admin` | Dashboard de administración con carga de Excel |
| `/admin/contactos/[id]` | Credencial individual de un contacto |
| `/admin/registro-manual` | Formulario de registro manual |
| `/admin/autoridades` | Gestión de autoridades y VIPs |
| `/matches` | Dashboard analítico de conexiones |
| `POST /api/qz-sign` | Firma server-side del challenge RSA para QZ Tray |
| `GET/POST /api/whatsapp/webhook` | Webhook de WhatsApp (verificación y recepción de mensajes) |

---

## Flujo de Trabajo

### Escaneo y Registro de Match

1. El usuario escanea un QR físico que contiene un enlace a `/connect/[qr_token]`.
2. Se registra un match en la base de datos asociado al token del QR escaneado.
3. Se redirige al usuario a WhatsApp con un mensaje personalizado para completar la identificación.

### Clasificación de Conexión vía WhatsApp

1. El webhook recibe el mensaje entrante con el token QR (formato `@XXXXXXXX`).
2. Se crea el registro de match vinculando scanner con el contacto del QR.
3. Se envía un mensaje interactivo con botones: **Negocio** / **Mentoría** / **Casual**.
4. Al seleccionar una opción, se actualiza el `connection_type` del match.
5. Se envía la tarjeta de contacto (vCard) del dueño del QR.

### Modos de Salida para Credenciales

- `NEXT_PUBLIC_QR_OUTPUT_MODE=PRINT`: Imprime via QZ Tray; si falla, ofrece PDF.
- `NEXT_PUBLIC_QR_OUTPUT_MODE=PDF`: Descarga directamente el PDF.

---

## Testing

Tests unitarios y de integración con **Vitest**. Los test files están co-ubicados junto a su código fuente.

```bash
npm test          # Ejecutar todos los tests
npm run test:watch # Modo watch
```

**Cobertura de tests:**

| Archivo | Tests | Tipo |
|---------|-------|------|
| `lib/services/whatsappService.test.ts` | 8 | Normalización de teléfonos chilenos |
| `lib/services/contactService.test.ts` | 10 | Búsqueda por identificador (mock Supabase) |
| `lib/services/whatsappService.integration.test.ts` | 6 | Envío de contact card (mock fetch) |
| `app/api/whatsapp/webhook/route.test.ts` | 17 | Webhook GET/POST handlers |
| `app/actions/contacts.test.ts` | 30 | Parsing CSV/Excel, mapeo de columnas |
| `lib/credentialRenderer.test.ts` | 7 | Word-wrap de texto en canvas |

---

## Configuración Local

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar las variables de entorno en `.env`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
   SUPABASE_SERVICE_ROLE_KEY= # Requerido para scripts de mantenimiento

   # QR / Impresión
   NEXT_PUBLIC_QR_OUTPUT_MODE=PRINT
   NEXT_PUBLIC_PRINTER_NAME=Brother QL-800

   # WhatsApp Business API
   WHATSAPP_ACCESS_TOKEN=
   WHATSAPP_PHONE_ID=
   WHATSAPP_VERIFY_TOKEN=
   NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS=

   # QZ Tray (clave privada RSA para firma de challenges)
   QZ_PRIVATE_KEY=
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## Seguridad y Acceso Admin

### Credenciales de Acceso

Las rutas `/admin` y `/matches` están protegidas con HTTP Basic Auth. El navegador mostrará un popup de usuario y contraseña al intentar acceder.

| Campo    | Valor por defecto        |
|----------|--------------------------|
| Usuario  | `x_connect_master77`     |
| Password | `zQ#9mKdL!2vP$wN@xT`    |

Para cambiar las credenciales sin tocar el código, definir en `.env` o en Vercel → Settings → Environment Variables:

```env
ADMIN_USERNAME=tu_usuario
ADMIN_PASSWORD=tu_contraseña
```

Si esas variables no están definidas, se usan los valores de la tabla anterior.

---

### Rate Limiting

El archivo `proxy.ts` incluye protección automática contra abuso de los endpoints de API. Funciona así:

**¿Qué hace?**
Cuenta cuántas veces una misma IP hace requests en una ventana de 60 segundos. Si supera el límite, devuelve `429 Too Many Requests` y bloquea esa IP hasta que pase el minuto.

**Límites configurados:**

| Endpoint | Límite |
|----------|--------|
| `/api/whatsapp/webhook` | 60 requests / minuto por IP |
| `/api/contacts` | 120 requests / minuto por IP |
| Resto de `/api/` | 300 requests / minuto por IP |

**Ejemplo concreto:**
Un asistente escanea su QR con WhatsApp → llega un webhook → cuenta como 1 request de esa IP. Si el mismo número envía más de 60 mensajes en un minuto (imposible en uso normal), se bloquea automáticamente.

**Importante:** el rate limiting es por instancia del servidor. En Vercel Pro con múltiples instancias edge, cada instancia tiene su propio contador independiente, por lo que los límites efectivos pueden ser un poco más altos en producción. Para el evento de 2000 personas es suficiente.

---

## Scripts de Mantenimiento

Existen scripts en la carpeta `scripts/` para tareas administrativas. Para ejecutarlos se recomienda usar `tsx`:

```bash
# Limpiar contactos duplicados (usa el procedimiento almacenado remove_duplicate_contacts)
npx tsx scripts/clean-duplicates.ts

# Test de envío de mensajes por WhatsApp
npx tsx scripts/test-whatsapp.ts
```

---

## Despliegue

La aplicación está configurada para desplegarse en **Vercel** con soporte nativo de Next.js. Las páginas de admin y matches usan `force-dynamic` para asegurar datos siempre actualizados.

Cada commit directo a la rama `main` dispara automáticamente un deploy a producción. No es necesario ningún paso manual — el pipeline de Vercel toma el commit, construye la app y la publica.
