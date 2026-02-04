# Connectify - Gestión de Contactos y Networking QR

Connectify es una aplicación web moderna diseñada para agilizar el intercambio de contactos en eventos y entornos profesionales. Permite cargar bases de datos desde Excel, generar códigos QR personalizados, imprimirlos en impresoras térmicas y rastrear las conexiones generadas.

## 🚀 Funcionalidades Principales

1.  **Carga Masiva de Contactos**: Procesamiento de archivos `.xlsx` y `.xls` con mapeo inteligente de columnas (Nombre, Email, Teléfono).
2.  **Impresión Térmica Directa**: Integración con **QZ Tray** para imprimir etiquetas QR directamente en hardware térmico sin diálogos de impresión del sistema.
3.  **Generación de PDF**: Sistema de respaldo automático que genera y descarga un PDF con el QR y la información del contacto si la impresora no está disponible.
4.  **Networking con WhatsApp**: Los QR generados dirigen a una página puente que registra la conexión ("Match") y luego abre WhatsApp con un mensaje personalizado.
5.  **Rastreo de Conexiones (Matches)**: Dashboard analítico para ver cuántas personas han escaneado cada QR y, si el "scanner" está identificado, ver exactamente quién fue.
6.  **Gestión de Identidad**: Sistema de reconocimiento basado en `localStorage` para identificar quién está realizando los escaneos sin necesidad de logins complejos.

---

## 🛠️ Stack Tecnológico y Librerías

### Core
*   **Next.js 15 (App Router)**: Framework de React para el frontend y Server Actions para la lógica de backend.
*   **TypeScript**: Tipado estático para asegurar la integridad del código.
*   **Tailwind CSS 4**: Estilizado moderno y responsivo con estética premium.

### Librerías Especializadas
*   **[@supabase/supabase-js](https://supabase.com/)**: Cliente oficial para interactuar con la base de datos PostgreSQL y el almacenamiento.
*   **[exceljs](https://github.com/exceljs/exceljs)**: Utilizada para leer y procesar archivos Excel de forma segura (reemplazando a `xlsx` para mitigar vulnerabilidades).
*   **[qrcode](https://github.com/soldair/node-qrcode)**: Generación de los códigos QR dinámicos.
*   **[qz-tray](https://qz.io/)**: Comunicación vía WebSocket con impresoras térmicas locales.
*   **[jspdf](https://rawgit.com/MrRio/jsPDF/master/docs/index.html)**: Motor de generación de documentos PDF en el cliente.
*   **[framer-motion](https://www.framer.com/motion/)**: Animaciones suaves para una experiencia de usuario fluida.
*   **[lucide-react](https://lucide.dev/)**: Pack de iconos vectoriales consistentes.

---

## 📊 Arquitectura de Datos (Supabase)

La base de datos cuenta con dos tablas principales relacionadas:

### 1. Tabla `contacts`
Almacena la información de los asistentes cargados mediante Excel.
*   `id` (UUID, PK): Identificador único.
*   `name` (Text): Nombre completo.
*   `email` (Text): Correo electrónico.
*   `phone` (Text): Número de teléfono (usado para WhatsApp).
*   `created_at`: Fecha de registro.

### 2. Tabla `matches`
Registra cada vez que un QR es escaneado.
*   `id` (UUID, PK): Identificador del evento de conexión.
*   `contact_id` (UUID, FK): Referencia a quién pertenece el QR (el "Dueño").
*   `scanner_id` (UUID, FK, Nullable): Referencia a quién escaneó el QR (el "Visitante"). Puede ser `null` si el visitante es anónimo.
*   `created_at`: Fecha y hora de la conexión.

---

## ⚙️ Flujo de Trabajo Técnico

### Escaneo y Registro
1.  El usuario escanea un QR físico.
2.  El QR contiene un enlace a `/connect/[id]`.
3.  La aplicación detecta si el navegador tiene un `connectify_user_id` guardado.
4.  Se registra una entrada en la tabla `matches`:
    *   Si hay ID guardado -> El match se asocia a ese contacto.
    *   Si no hay ID -> El match se registra como "Invitado".
5.  El usuario es redirigido automáticamente a la API de WhatsApp con el número del contacto destino.

### Modos de Salida (Variables de Entorno)
El sistema puede alternar su comportamiento mediante una variable en el archivo `.env`:
*   `NEXT_PUBLIC_QR_OUTPUT_MODE=PRINT`: Intenta imprimir por QZ Tray; si falla, ofrece el PDF.
*   `NEXT_PUBLIC_QR_OUTPUT_MODE=PDF`: Salta la búsqueda de impresora y descarga directamente el PDF mejorado (que incluye el logo de WhatsApp en el centro del QR).

---

## 🛠️ Configuración Local

1.  Clonar el repositorio.
2.  Instalar dependencias: `npm install`.
3.  Configurar las variables de entorno en `.env`:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `NEXT_PUBLIC_QR_OUTPUT_MODE`
4.  Iniciar servidor: `npm run dev`.

---

## ✨ Estética y Diseño
La aplicación sigue una línea de diseño **Premium Dark/Light**, utilizando:
*   Bordes ultra-redondeados (`3xl`).
*   Fondos con desenfoque de cristal (`backdrop-blur`).
*   Paleta de colores basada en Zinc e Indigo para un aspecto profesional y limpio.
