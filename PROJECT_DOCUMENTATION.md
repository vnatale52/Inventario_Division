# Documentación Completa del Proyecto: Sistema de Gestión de Inventario División

Este documento consolida toda la información técnica, manuales de uso y guías de despliegue en un único recurso coherente.

---

## 📑 Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Características Principales](#2-características-principales)
3. [Inicio Rápido (Local)](#3-inicio-rápido-local)
4. [Guía de Uso](#4-guía-de-uso)
    - [Para Usuarios](#para-usuarios-normales)
    - [Para Administradores](#para-administradores)
5. [Jerarquía y Seguridad](#5-jerarquía-y-seguridad)
6. [Arquitectura y Detalles Técnicos](#6-arquitectura-y-detalles-técnicos)
7. [Persistencia de Datos](#7-persistencia-de-datos)
8. [Guía de Despliegue en Render](#8-guía-de-despliegue-en-render)
9. [Solución de Problemas](#9-solución-de-problemas)

---

## 1. Descripción General

Aplicación web completa para administrar el inventario de expedientes administrativos. Diseñada para reemplazar sistemas manuales con una solución moderna que incluye gestión de usuarios, roles jerárquicos estrictos, filtrado automático de permisos y persistencia segura de datos.

**Tecnologías:**
- **Frontend:** React 19, Vite, TailwindCSS
- **Backend:** Node.js, Express
- **Base de Datos:** PostgreSQL
- **Seguridad:** JWT, bcrypt

---

## 2. Características Principales

- ✅ **Gestión de Usuarios Dinámica**: Jerarquía definida en CSV, sin código hardcoded.
- ✅ **Filtrado por Roles**: "Lo que ves es lo que puedes tocar". Cada usuario solo ve sus propios expedientes.
- ✅ **Validación Robusta**: Al agregar registros, el sistema valida que el usuario asignado sea real y válido (Case-Insensitive).
- ✅ **Admin Override**: Los administradores tienen permisos globales de visualización, edición y creación.
- ✅ **Layouts Personalizados**: Cada usuario guarda sus preferencias de columnas en su navegador.
- ✅ **Backups Seguros**: Descargas CSV con datos filtrados según el permiso del usuario que lo solicita.
- ✅ **Interfaz de Administración**: Panel web exclusivo para admins para gestionar usuarios sin tocar archivos.

---

## 3. Inicio Rápido (Local)

### Prerequisitos
- Node.js 18+
- PostgreSQL (o SQLite para dev)
- Git

### Instalación Automática
Simplemente ejecuta el script incluido:
```bash
./start.bat
```
Esto iniciará:
- Backend en `http://localhost:3001`
- Frontend en `http://localhost:5173`

### Instalación Manual
1. **Frontend:**
   ```bash
   cd app/client && npm install && npm run dev
   ```
2. **Backend:**
   ```bash
   cd app/server && npm install && npm run dev
   ```
3. **Inicializar Usuarios:**
   ```bash
   cd app/server && node seed_users.js
   ```

---

## 4. Guía de Uso

### Para Usuarios Normales

1. **Login Inicial**:
   - Usa tu nombre asignado (ej. "Vincenzo"). Clave inicial: `123`.
   - **Importante**: Cambia tu contraseña inmediatamente usando el botón azul con llave en el header.

2. **Gestión de Inventario**:
   - **Ver**: Automáticamente verás solo los registros asignados a tu usuario.
   - **Agregar**: Click en "+ Add Record".
     - *Nota*: Si intentas asignar un registro a un usuario que no existe en el sistema, el sistema te bloqueará.
   - **Editar**: Click en el lápiz.
   - **Borrar**: Click en la papelera.

3. **Personalización**:
   - Arrastra los bordes de las columnas para cambiar su tamaño.
   - Arrastra el borde inferior del encabezado para cambiar la altura.
   - Click en "Save Layout" para guardar tu vista.

4. **Backups**:
   - Click en "Backup" para descargar un CSV.
   - El archivo incluirá solo tus registros visibles.

### Para Administradores

1. **Acceso Total**:
   - Login como `admin`.
   - Ves todos los registros de todos los usuarios.
   - Puedes editar o borrar cualquier registro.
   - Puedes agregar registros ignorando las restricciones de usuario (Admin Override).

2. **Gestión de Usuarios (Web UI)**:
   - Click en el botón morado **"Manage Users"**.
   - **Tabla**: Muestra la jerarquía actual.
   - **Agregar Fila**: Crea nuevos usuarios para todos los roles a la vez.
   - **Editar/Borrar**: Modifica nombres o elimina grupos.
   - **Guardar**: Click en "Save Changes". Esto actualiza la base de datos inmediatamente.

---

## 5. Jerarquía y Seguridad

La seguridad se basa en roles definidos en `usuarios.csv`.

**Roles Disponibles:**
- INSPECTOR
- SUPERVISOR
- REVISOR DIV
- JEFE DIV
- REVISOR DEPTO
- REVISOR DIREC
- ADMIN (Rol especial de sistema)

**Reglas de Filtrado (Endpoint `/api/data`):**
- Si eres `INSPECTOR` "Vincenzo", el backend filtra: `WHERE INSPECTOR = 'Vincenzo'`.
- Si eres `ADMIN`, el filtro se desactiva: `WHERE 1=1`.

---

## 6. Arquitectura y Detalles Técnicos

### Estructura de Archivos
```
Inventario División/
├── usuarios.csv                 # Definición de jerarquía (Fuente de verdad inicial)
├── columnas.csv                 # Definición de esquema de base de datos
├── app/
│   ├── server/                  # API Rest (Express + PG)
│   │   ├── seed_users.js        # Script de sincronización Usuarios -> DB
│   │   └── migrate_csv_to_pg.js # Script de migración Inventario -> DB
│   └── client/                  # SPA (React + Vite)
```

### Flujo de Datos Dinámico
El sistema **no tiene columnas hardcodeadas**.
1. `columnas.csv` define qué columnas existen.
2. `migrate_csv_to_pg.js` lee ese archivo y crea la tabla en PostgreSQL.
3. El Frontend consulta `/api/data`, recibe la lista de columnas y renderiza la tabla dinámicamente.

---

## 7. Persistencia de Datos
---

## 8. Guía de Despliegue en Render

El proyecto está configurado con un **Blueprint** (`render.yaml`) para despliegue automático.

### Comandos de Construcción (Build Commands)

Estos comandos aseguran la integridad de los datos en cada deploy:

**Backend (`inventory-backend`):**
```bash
npm install && node seed_users.js && node migrate_csv_to_pg.js
```
- `seed_users.js`: Asegura que el admin y roles existan.
- `migrate_csv_to_pg.js`: Intenta migrar datos SOLO si es un deploy limpio (BD vacía).

**Frontend (`inventory-frontend`):**
```bash
rm -rf node_modules dist && npm install && npm run build
```
- Limpieza total para evitar errores de caché en React.

### Pasos para Desplegar
1. Ve a Render Dashboard -> New -> Blueprint.
2. Conecta este repositorio.
3. Asigna nombre al grupo (ej. `inventario-prod`).
4. Click en **Apply**.
5. **Post-Deploy**: Actualiza la variable `VITE_API_URL` en el servicio Frontend con la URL real del Backend.

---

## 9. Solución de Problemas

**Error 403 Forbidden al validar usuarios:**
- *Causa*: El backend restringía la lectura de la lista de usuarios.
- *Solución*: Ya fue parcheado. Ahora cualquier usuario autenticado puede leer la lista para validación.

**Botón "Add Record" deshabilitado:**
- *Causa*: El usuario logueado no coincide con ningún usuario válido en el CSV.
- *Solución*: Logueate como Admin o agrega tu usuario al sistema.

**Error "ReferenceError" o pantalla blanca:**
- *Solución*: Limpia la caché del navegador (`Ctrl + Shift + R`) tras un nuevo despliegue.

---
*Documentación generada automáticamente combinando README, WALKTHROUGH y RENDER_DEPLOYMENT.*
