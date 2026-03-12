# Connectify - Networking y Gestión de Contactos para Eventos

Connectify es una plataforma web para gestionar el networking en eventos profesionales. Permite cargar bases de datos de asistentes desde Excel, generar credenciales con QR personalizados, imprimirlos en impresoras térmicas, y rastrear las conexiones generadas a través de WhatsApp Business API con clasificación automática del tipo de conexión.

## Funcionalidades Principales

- **Carga Masiva de Contactos**: Procesamiento de archivos `.xlsx` y `.csv` con mapeo inteligente de columnas (Nombre, Email, Teléfono, RUT, Empresa, Cargo). Modo dual con ExcelJS para `.xlsx` y fallback a parser CSV.
- **Registro Manual**: Formulario web para crear contactos individuales desde el panel de administración.
- **Credenciales con QR**: Generación de credenciales renderizadas en Canvas (nombre con word-wrap, empresa, línea divisoria y QR opcional) en formato 62mm x 62mm para etiquetas Brother QL-800.
- **Impresión Térmica Directa**: Integración con **QZ Tray** mediante WebSocket con autenticación RSA SHA-512 (challenge-response). Detección automática de impresora Brother QL-800. Fallback a descarga PDF via jsPDF si la impresora no está disponible.
- **Integración WhatsApp Business API**: Webhook que recibe mensajes entrantes, extrae tokens QR del formato `@XXXXXXXX`, crea registros de match, y envía mensajes interactivos con botones para clasificar la conexión (Negocio / Mentoría / Casual). Incluye envío de tarjeta de contacto (vCard).
- **Dashboard de Matches**: Analítica en tiempo real con volumen total de conexiones, tasa de identificación, distribución por tipo de conexión (porcentajes con conteo al hacer hover), top 10 perfiles más conectados, e historial de actividad por usuario.
- **Gestión de Autoridades**: Tabla separada para VIPs, speakers y organizadores con carga masiva desde Excel y credenciales diferenciadas.
- **Sistema de Identidad**: Reconocimiento basado en `localStorage` (`connectify_user_id`) complementado con verificación por número de WhatsApp. Sin necesidad de login tradicional.

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

---

## Estructura del Proyecto

```
connectify/
├── app/
│   ├── page.tsx                        # Portal de check-in (buscar e imprimir credenciales)
│   ├── layout.tsx                      # Layout raíz
│   ├── globals.css
│   ├── api/
│   │   ├── qz-sign/route.ts           # Firma RSA para QZ Tray
│   │   └── whatsapp/webhook/route.ts   # Webhook WhatsApp Business API
│   ├── admin/
│   │   ├── page.tsx                    # Dashboard admin (carga Excel)
│   │   ├── contactos/[id]/page.tsx     # Página de credencial individual
│   │   ├── autoridades/page.tsx        # Gestión de autoridades/VIPs
│   │   └── registro-manual/page.tsx    # Registro manual de contactos
│   ├── connect/[id]/page.tsx           # Landing del escaneo QR (redirige a WhatsApp)
│   ├── matches/page.tsx                # Dashboard analítico de conexiones
│   ├── components/
│   │   ├── FileUpload.tsx              # Carga de archivos Excel
│   │   ├── ContactTable.tsx            # Tabla paginada de contactos con búsqueda
│   │   ├── AuthorityTable.tsx          # Tabla de autoridades
│   │   ├── IdentityStatus.tsx          # Badge de identidad del usuario
│   │   ├── AdminNavbar.tsx             # Navegación admin compartida
│   │   └── ui/Input.tsx                # Componente input reutilizable
│   └── actions/
│       ├── contacts.ts                 # Server actions para contactos
│       └── authorities.ts              # Server actions para autoridades
├── lib/
│   ├── supabase.ts                     # Cliente Supabase
│   ├── qz.ts                          # Integración QZ Tray
│   ├── credentialRenderer.ts           # Renderizado de credenciales en Canvas
│   ├── authorityCredentialRenderer.ts  # Credenciales de autoridades
│   └── services/
│       ├── contactService.ts           # Queries de contactos
│       ├── whatsappService.ts          # Integración WhatsApp API
│       └── authorityService.ts         # Queries de autoridades
├── public/
│   └── digital-certificate.txt         # Certificado público QZ Tray
├── certificates/                       # Certificados locales QZ Tray
└── scripts/                            # Scripts utilitarios
```

---

## Arquitectura de Datos (Supabase)

### Tabla `contacts`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID, PK | Identificador único |
| `name` | Text | Nombre completo |
| `first_name` | Text, nullable | Nombre |
| `last_name` | Text, nullable | Apellido |
| `email` | Text, nullable | Correo electrónico |
| `phone` | Text, nullable | Teléfono (usado para WhatsApp) |
| `rut` | Text, nullable | RUT / DNI / Pasaporte |
| `company` | Text, nullable | Empresa |
| `position` | Text, nullable | Cargo |
| `qr_token` | Text, UNIQUE | Token QR auto-generado (8-10 caracteres, con detección de colisiones) |
| `created_at` | Timestamp | Fecha de registro |

### Tabla `matches`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID, PK | Identificador del match |
| `contact_id` | UUID, FK → contacts | Dueño del QR escaneado |
| `scanner_id` | UUID, FK → contacts, nullable | Quién escaneó (null si anónimo) |
| `scanner_phone` | Text, nullable | Teléfono del scanner (fallback si no está identificado) |
| `connection_type` | Text, nullable | Clasificación: `negocio`, `mentoria`, `casual` |
| `created_at` | Timestamp | Fecha y hora de la conexión |

### Tabla `authorities`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID, PK | Identificador único |
| `name` | Text | Nombre completo |
| `position` | Text, nullable | Cargo |
| `organization` | Text, nullable | Organización |
| `created_at` | Timestamp | Fecha de registro |

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
2. La app verifica si el navegador tiene un `connectify_user_id` en localStorage.
3. Se registra un match en la base de datos:
   - Con ID almacenado: el match se asocia al contacto identificado.
   - Sin ID: el match se registra como anónimo.
4. Se redirige al usuario a WhatsApp con un mensaje personalizado.

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

## Despliegue

La aplicación está configurada para desplegarse en **Vercel** con soporte nativo de Next.js. Las páginas de admin y matches usan `force-dynamic` para datos en tiempo real.
