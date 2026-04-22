# Guía de Carga de Datos - Plataforma de Networking

Este directorio contiene las plantillas necesarias para realizar la carga masiva de contactos y autoridades en el sistema.

> [!IMPORTANT]
> **Recomendación de Formato**: Aunque el sistema soporta archivos `.xlsx`, se recomienda encarecidamente cargar los datos en formato **`.csv` (codificación UTF-8)** para garantizar la mejor compatibilidad y velocidad de procesamiento.

## 1. Contactos de Asistentes (`asistente_FIT.csv`)

El sistema procesa archivos `.csv` con mapeo inteligente de cabeceras. Asegúrese de que las columnas coincidan con alguna de las opciones aceptadas.

| Campo | Cabeceras Aceptadas (Case Insensitive) | Notas |
|-------|---------------------------------------|-------|
| **Nombres** | `nombres`, `nombre`, `first name`, `first_name`, `name` | **Obligatorio** |
| **Apellidos** | `apellidos`, `apellido`, `last name`, `last_name` | Opcional (se une con nombre) |
| **Email** | `e-mail`, `email`, `correo` | Opcional |
| **Teléfono** | `teléfono móvil`, `telefono movil`, `teléfono`, `telefono`, `phone` | Ideal formato +569... |
| **RUT/DNI** | `rut/dni/pasaporte`, `rut`, `dni`, `pasaporte`, `identification_number` | Sin puntos con guion |
| **Empresa** | `empresa u organización`, `empresa`, `organizacion`, `company` | Opcional |
| **Cargo** | `cargo`, `position`, `puesto` | Opcional |

### Ejemplo de Estructura (`asistente_FIT.csv`)
```csv
Rut/Dni/Pasaporte,Nombres,Apellidos,E-mail,Teléfono Móvil,Empresa U Organización,Cargo
12345678-9,Juan,Pérez,juan@ejemplo.cl,+56912345678,Sistemia,Gerente
```

---

## 2. Autoridades y VIPs (`autoridades_FIT.csv`)

Las autoridades tienen un flujo de credenciales diferenciado y no generan matches automáticos por QR de la misma forma que los asistentes.

| Campo | Cabeceras Aceptadas | Notas |
|-------|---------------------|-------|
| **Nombre** | `nombre`, `nombres`, `name` | **Obligatorio** |
| **Apellido** | `apellido`, `apellidos`, `last name` | Opcional |
| **Cargo** | `cargo`, `position` | Opcional |
| **Organización** | `organización`, `organizacion`, `organization`, `empresa` | Opcional |

### Ejemplo de Estructura (`autoridades_FIT.csv`)
```csv
Nombre,Apellido,Cargo,Organización
Rodrigo,Wainraihgt,Alcalde,Municipalidad de Puerto Montt
```

---

## Cómo realizar la carga

1. Acceda al panel de administración: `/admin`.
2. Para **Contactos**: Use el componente de carga en la página principal de `/admin`.
3. Para **Autoridades**: Diríjase a `/admin/autoridades` y use el botón de "Cargar Archivo".
4. El sistema validará los datos y mostrará el conteo de registros insertados.
