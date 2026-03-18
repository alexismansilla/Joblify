# Configuración de QZ Tray en Windows para Impresión Directa

Esta guía detalla los pasos necesarios para habilitar la impresión automática (sin diálogos de confirmación) de las credenciales de Connectify en una computadora con Windows 10/11 y una impresora Brother QL-800.

## 1. Requisitos Previos

- **Java Runtime (JRE)**: QZ Tray requiere Java para ejecutarse. [Descargar Java](https://www.java.com/download/).
- **Controlador Brother QL-800**: Instale el driver oficial desde el sitio de Brother. Asegúrese de que la impresora figure en **Dispositivos e Impresoras** como `Brother QL-800`.
- **Papel Continuo**: Use rollos de 62 mm (ej. DK-22205).

## 2. Instalación de QZ Tray

1. Descargue la última versión estable (v2.2+) desde [qz.io/download](https://qz.io/download/).
2. Instale y asegúrese de que el icono de QZ (un rayo verde) aparezca en la bandeja del sistema.
3. **Inicio automático**: Haga clic derecho en el icono de QZ -> `Automatically Start` -> `Enabled`.

## 3. Configuración del Tamaño de Etiqueta (Windows)

Dado que la QL-800 corta papel continuo, Windows necesita conocer el tamaño exacto del corte:

1. Vaya a **Panel de Control** -> **Dispositivos e Impresoras**.
2. Clic derecho en **Brother QL-800** -> **Preferencias de Impresión**.
3. En la pestaña **Page Setup**:
   - **Paper Size**: Seleccione un tamaño personalizado o cree uno de **62 mm x 62 mm**.
   - **Cut**: Asegúrese de que `Cut at the end` o `Corte automático` esté activado.

## 4. Gestión de Certificados y Seguridad

Para que la impresión sea "silenciosa" (sin que QZ pregunte "Allow this site to print?" en cada etiqueta), el proyecto utiliza un certificado digital.

### Uso de la carpeta `certificates/`
Usted tiene una carpeta `certificates` en la raíz del proyecto con dos archivos críticos:
- `digital-certificate.txt`: El certificado público que el frontend envía a QZ Tray. Ya está copiado en `/public/digital-certificate.txt` y se sirve automáticamente.
- **`private-key.pem`**: Esta es su **clave privada**. **NUNCA debe ser compartida ni cargada en el cliente**.

### Configuración del Entorno
Para que la firma de impresión funcione:
1. Abra `certificates/private-key.pem` con un editor de texto (Notepad++).
2. Copie **todo** su contenido (incluyendo `-----BEGIN PRIVATE KEY-----`).
3. Péguelo en su archivo `.env` local o en su proveedor de hosting (ej. Vercel) bajo la variable:
   ```env
   QZ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqh..."
   ```
   *(Nota: Asegúrese de envolverlo en comillas si contiene saltos de línea).*

## 5. El Primer Escaneo (Trust)

La primera vez que abra `/admin` o el portal de impresión:
1. QZ Tray mostrará una ventana preguntando si confía en el sitio.
2. Marque la casilla **"Remember this decision"** (Recordar esta decisión).
3. Haga clic en **"Allow"** (Permitir).

Si el certificado está bien configurado en la variable de entorno, QZ reconocerá la firma y nunca volverá a preguntar.

---

## Solución de Problemas
- **No encuentra la impresora**: Asegúrese de que la variable `NEXT_PUBLIC_PRINTER_NAME` en su `.env` coincida exactamente con el nombre de su impresora en Windows.
- **Error "Signature Error"**: Verifique que la `QZ_PRIVATE_KEY` en el servidor sea idéntica al contenido del `.pem`.
- **Corte incorrecto**: Revise los márgenes y el tamaño definido en las "Preferencias de Impresión" de Windows.
