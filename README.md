# Sistema de Gestión de Inventario

Aplicación web para administrar el inventario de expedientes administrativos con diferentes roles de usuario.

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

Simplemente haz doble clic en `start.bat` en la raíz del proyecto. Esto iniciará automáticamente:
- Backend (API) en `http://localhost:3001`
- Frontend (Aplicación) en `http://localhost:5173`

### Opción 2: Inicio Manual

#### 1. Iniciar el Backend

```bash
cd app/server
npm run dev
```

El servidor API estará disponible en `http://localhost:3001`

#### 2. Iniciar el Frontend (en otra terminal)

```bash
cd app/client
npm run dev
```

La aplicación web estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
Inventario División/
├── app/
│   ├── server/          # Backend (Express API)
│   │   ├── index.js     # Servidor principal
│   │   └── package.json
│   └── client/          # Frontend (React + Vite)
│       ├── src/
│       └── package.json
├── Inventario.csv       # Datos del inventario
├── columnas.csv         # Definición de columnas
├── start.bat            # Script de inicio automático
└── README.md
```

## 🔧 Tecnologías

### Backend
- **Express.js** - Framework web
- **CORS** - Manejo de peticiones cross-origin
- **csv-parser** - Lectura de archivos CSV

### Frontend
- **React 19** - Librería UI
- **Vite** - Build tool y dev server
- **TailwindCSS** - Framework CSS
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **React Query** - Gestión de estado del servidor
- **Framer Motion** - Animaciones

## 📝 API Endpoints

### `GET /`
Información sobre la API y endpoints disponibles

### `GET /api/data`
Obtiene todas las columnas y datos del inventario

**Respuesta:**
```json
{
  "columns": [...],
  "inventory": [...]
}
```

### `POST /api/data`
Agregar, actualizar o eliminar filas del inventario

**Body:**
```json
{
  "type": "ADD" | "UPDATE" | "DELETE",
  "row": { ... }
}
```

### `POST /api/columns`
Agregar o eliminar columnas

**Body:**
```json
{
  "type": "ADD" | "DELETE",
  "column": { ... }
}
```

### `POST /api/email`
Generar contenido de email para una fila

**Body:**
```json
{
  "row": { ... }
}
```

## 👥 Roles de Usuario

- **INSPECTOR** - Inspección de expedientes
- **SUPERVISOR** - Supervisión de inspecciones
- **REVISOR DIV** - Revisión a nivel división
- **JEFE DIV** - Jefatura de división
- **REVISOR DEPTO** - Revisión a nivel departamento
- **REVISOR DIREC** - Revisión a nivel dirección

## 🐛 Solución de Problemas

### Error "Cannot GET /"

Este error aparece cuando intentas acceder a `http://localhost:3001/` directamente. El backend es solo una API y no sirve páginas HTML.

**Solución:**
- Accede a `http://localhost:5173` (frontend)
- O visita `http://localhost:3001/` para ver la documentación de la API en JSON

### Los puertos ya están en uso

Si recibes un error de que el puerto ya está en uso:

```bash
# Windows - Liberar puerto 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Windows - Liberar puerto 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Problemas con dependencias

```bash
# Reinstalar dependencias del backend
cd app/server
rm -rf node_modules package-lock.json
npm install

# Reinstalar dependencias del frontend
cd app/client
rm -rf node_modules package-lock.json
npm install
```

## 📦 Archivos CSV

### Inventario.csv
Contiene los datos del inventario. Formato:
- Línea 1: Números de columna
- Línea 2: Nombres de columna
- Línea 3+: Datos

### columnas.csv
Define el esquema de las columnas. Campos:
- Número Columna
- Descripción
- Tipo de dato
- longitud
- obligatorio

## 🔐 Backup

La aplicación incluye funcionalidad de backup para preservar los datos del inventario.

## 📧 Generación de Emails

Puedes generar emails automáticos con información de expedientes usando el endpoint `/api/email`.

## 📄 Licencia

ISC
