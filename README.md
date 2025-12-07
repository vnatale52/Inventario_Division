# Sistema de Gestión de Inventario División

Aplicación web completa para administrar el inventario de expedientes administrativos con sistema de gestión de usuarios, roles jerárquicos y filtrado de datos por permisos.

## 🌟 Características Principales

- ✅ **Gestión de Usuarios Dinámica** - Usuarios definidos en CSV, sin código hardcoded
- ✅ **Cambio de Contraseña** - Todos los usuarios pueden cambiar su contraseña cuando quieran
- ✅ **Columnas Dinámicas** - Definiciones de columnas cargadas desde columnas.csv (no hardcoded)
- ✅ **Filtrado por Roles** - Cada usuario solo ve sus propios registros
- ✅ **Interfaz de Administración** - Panel web para gestionar usuarios (solo ADMIN)
- ✅ **Layouts Personalizados** - Cada usuario guarda sus preferencias de columnas
- ✅ **Backups Seguros** - Los backups respetan los permisos de cada usuario
- ✅ **Autenticación JWT** - Sistema seguro de login con tokens
- ✅ **Base de Datos PostgreSQL** - Almacenamiento persistente en producción

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ instalado
- PostgreSQL (para producción) o SQLite (desarrollo local)
- Git

### Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/vnatale52/Inventario_Division.git
cd "Inventario División"
```

2. **Configurar base de datos** (desarrollo local):
```bash
cd app/server
cp .env.example .env
# Editar .env con tu configuración de base de datos
```

3. **Instalar dependencias**:
```bash
# Backend
cd app/server
npm install

# Frontend
cd ../client
npm install
```

4. **Crear usuarios iniciales**:
```bash
cd app/server
node seed_users.js
```

### Opción 1: Script Automático (Recomendado)

Simplemente ejecuta `start.bat` en la raíz del proyecto:

```bash
./start.bat
```

Esto iniciará automáticamente:
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

## 👥 Sistema de Usuarios

### Jerarquía de Roles

La aplicación maneja 6 roles jerárquicos definidos en `usuarios.csv`:

| Rol | Descripción |
|-----|-------------|
| **INSPECTOR** | Inspección de expedientes |
| **SUPERVISOR** | Supervisión de inspecciones |
| **REVISOR DIV** | Revisión a nivel división |
| **JEFE DIV** | Jefatura de división |
| **REVISOR DEPTO** | Revisión a nivel departamento |
| **REVISOR DIREC** | Revisión a nivel dirección |
| **ADMIN** | Administrador del sistema (acceso total) |

### Usuarios por Defecto

| Usuario | Rol | Contraseña |
|---------|-----|------------|
| Vincenzo | INSPECTOR | password123 |
| Carlos | INSPECTOR | password123 |
| Juan | INSPECTOR | password123 |
| Supervisor1 | SUPERVISOR | password123 |
| Supervisor2 | SUPERVISOR | password123 |
| Supervisor3 | SUPERVISOR | password123 |
| RevisorDiv1 | REVISOR DIV | password123 |
| RevisorDiv2 | REVISOR DIV | password123 |
| RevisorDiv3 | REVISOR DIV | password123 |
| Jefa1 | JEFE DIV | password123 |
| Jefa2 | JEFE DIV | password123 |
| Jefa3 | JEFE DIV | password123 |
| RevisorDepto1 | REVISOR DEPTO | password123 |
| RevisorDepto2 | REVISOR DEPTO | password123 |
| RevisorDepto3 | REVISOR DEPTO | password123 |
| RevisorDirec1 | REVISOR DIREC | password123 |
| RevisorDirec2 | REVISOR DIREC | password123 |
| RevisorDirec3 | REVISOR DIREC | password123 |
| **admin** | **ADMIN** | **password123** |

⚠️ **IMPORTANTE**: Cambia las contraseñas después del primer login en producción.

### Gestión de Usuarios

#### Opción A: Via Interfaz Web (Recomendado)

1. Login como `admin` / `password123`
2. Click en el botón morado "Manage Users"
3. Agregar, editar o eliminar usuarios
4. Click en "Save Changes"
5. Los usuarios se crean automáticamente en la base de datos

#### Opción B: Via CSV

1. Editar `usuarios.csv`:
```csv
INSPECTOR;SUPERVISOR;REVISOR DIV;JEFE DIV;REVISOR DEPTO;REVISOR DIREC
NuevoUser1;NuevoUser2;NuevoUser3;NuevoUser4;NuevoUser5;NuevoUser6
```

2. Ejecutar el script de seeding:
```bash
cd app/server
node seed_users.js
```

## 📁 Estructura del Proyecto

```
Inventario División/
├── app/
│   ├── server/                    # Backend (Express + PostgreSQL)
│   │   ├── index.js              # Servidor principal con API
│   │   ├── db.js                 # Configuración de base de datos
│   │   ├── seed_users.js         # Script de seeding de usuarios
│   │   └── package.json
│   └── client/                    # Frontend (React + Vite)
│       ├── src/
│       │   ├── App.jsx           # Componente principal
│       │   ├── components/
│       │   │   ├── InventoryGrid.jsx    # Tabla de inventario
│       │   │   ├── UserManager.jsx      # Gestión de usuarios (ADMIN)
│       │   │   ├── Login.jsx            # Pantalla de login
│       │   │   └── ColumnManager.jsx    # Gestión de columnas
│       │   └── api.js            # Cliente API
│       └── package.json
├── usuarios.csv                   # Tabla de jerarquía de usuarios
├── columnas.csv                   # Definición de columnas
├── Inventario.csv                 # Datos iniciales del inventario
├── start.bat                      # Script de inicio automático
├── render.yaml                    # Configuración de despliegue
├── RENDER_DEPLOYMENT.md          # Guía de despliegue
└── README.md
```

## 🔧 Tecnologías

### Backend
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos (producción)
- **bcryptjs** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **CORS** - Manejo de peticiones cross-origin

### Frontend
- **React 19** - Librería UI
- **Vite** - Build tool y dev server
- **TailwindCSS** - Framework CSS
- **React Query** - Gestión de estado del servidor
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## 📝 API Endpoints

### Autenticación

#### `POST /api/auth/register`
Registrar un nuevo usuario

**Body:**
```json
{
  "username": "usuario",
  "password": "contraseña",
  "role": "INSPECTOR"
}
```

#### `POST /api/auth/login`
Iniciar sesión

**Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

#### `POST /api/auth/change-password`
Cambiar contraseña del usuario autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newSecurePassword"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Datos de Inventario

#### `GET /api/data`
Obtiene columnas y datos del inventario (filtrado por rol del usuario)

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "columns": [...],
  "inventory": [...]
}
```

#### `POST /api/data`
Agregar, actualizar o eliminar filas del inventario

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "type": "ADD" | "UPDATE" | "DELETE",
  "row": { ... }
}
```

### Gestión de Columnas

#### `POST /api/columns`
Agregar o eliminar columnas

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "type": "ADD" | "DELETE",
  "column": {
    "id": 85,
    "label": "Nueva Columna",
    "type": "text",
    "length": "50",
    "required": "no"
  }
}
```

### Utilidades

#### `POST /api/email`
Generar contenido de email para una fila

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "row": { ... }
}
```

#### `POST /api/backup`
Descargar backup CSV (solo registros del usuario)

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "username": "Vincenzo"
}
```

### Gestión de Usuarios (Solo ADMIN)

#### `GET /api/users`
Obtener tabla de usuarios desde usuarios.csv

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "roles": ["INSPECTOR", "SUPERVISOR", ...],
  "users": [
    ["Vincenzo", "Supervisor1", ...],
    ["Carlos", "Supervisor2", ...]
  ]
}
```

#### `POST /api/users`
Actualizar tabla de usuarios y re-seed database

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "roles": ["INSPECTOR", "SUPERVISOR", ...],
  "users": [
    ["User1", "User2", ...],
    ["User3", "User4", ...]
  ]
}
```

## 🔐 Seguridad y Permisos

### Filtrado de Datos

- **Usuarios normales**: Solo ven registros donde su columna de rol coincide con su username
  - Ejemplo: Usuario "Vincenzo" (rol INSPECTOR) solo ve filas donde `INSPECTOR = "Vincenzo"`
- **ADMIN**: Ve todos los registros sin filtrado

### Backups

- Los backups solo incluyen registros visibles para el usuario que los genera
- Respeta los mismos permisos que la vista principal

### Layouts

- Cada usuario tiene sus propias preferencias de columnas (anchos, altura de header)
- Se guardan en localStorage con clave por username
- No afectan a otros usuarios

## 🚀 Despliegue en Render

Ver [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) para instrucciones detalladas.

### Resumen Rápido

1. **Conectar repositorio** en Render Dashboard
2. Render detecta automáticamente `render.yaml`
3. **Esperar despliegue** (~5-10 minutos)
4. **Actualizar VITE_API_URL** en el frontend con la URL real del backend
5. **Redesplegar frontend**
6. **Probar login** con admin/password123

## 📦 Archivos CSV

### usuarios.csv
Define la jerarquía de usuarios. Formato:
- **Línea 1**: Nombres de roles (header)
- **Línea 2+**: Usernames para cada rol

Ejemplo:
```csv
INSPECTOR;SUPERVISOR;REVISOR DIV
Vincenzo;Supervisor1;RevisorDiv1
Carlos;Supervisor2;RevisorDiv2
```

### columnas.csv
Define el esquema de las columnas **dinámicamente** (NO hardcoded). Campos:
- Número Columna
- Descripción
- Tipo de dato (opcional)
- Longitud (opcional)
- Obligatorio (opcional)

**Importante:** Las columnas se leen desde este archivo durante la migración inicial y se almacenan en la base de datos PostgreSQL. El sistema es completamente dinámico - modificar este archivo y re-migrar actualizará las columnas automáticamente.

**Flujo de datos:**
1. `columnas.csv` → Script de migración (`migrate_csv_to_pg.js`)
2. Script lee el CSV y guarda en tabla `columns` de PostgreSQL
3. API endpoint `/api/data` consulta la base de datos
4. Frontend renderiza columnas dinámicamente

**Para modificar columnas:**
```bash
# 1. Editar columnas.csv
# 2. Re-migrar
cd app/server
node migrate_csv_to_pg.js
```

### Inventario.csv
Contiene los datos del inventario. Formato:
- **Línea 1**: Números de columna
- **Línea 2**: Nombres de columna
- **Línea 3+**: Datos

## 🐛 Solución de Problemas

### Error "Cannot GET /"

Este error aparece cuando intentas acceder a `http://localhost:3001/` directamente. El backend es solo una API y no sirve páginas HTML.

**Solución:**
- Accede a `http://localhost:5173` (frontend)

### Los puertos ya están en uso

```bash
# Windows - Liberar puerto 3001
tasklist | findstr node
taskkill /F /IM node.exe

# O usar el puerto específico
netstat -ano | findstr :3001
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

### Error de login

1. Verificar que la base de datos esté corriendo
2. Ejecutar el script de seeding:
```bash
cd app/server
node seed_users.js
```

### Usuarios no ven sus datos

1. Verificar que los nombres de roles en `usuarios.csv` coincidan exactamente con los nombres de columnas en `columnas.csv`
2. Verificar que no haya espacios extra en los CSV
3. Revisar los logs del servidor para errores de filtrado

## 🧪 Testing

### Probar API con Git Bash

```bash
# Ejecutar script de pruebas
bash test_user_api.sh
```

O manualmente:

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | jq -r '.token')

# Obtener datos
curl -s -X GET http://localhost:3001/api/data \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Gestión de usuarios (ADMIN)
curl -s -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Probar Filtrado

1. Login como `Vincenzo` / `password123`
2. Verificar que solo se muestran registros donde INSPECTOR = "Vincenzo"
3. Login como `admin` / `password123`
4. Verificar que se muestran todos los registros

## 📚 Documentación Adicional

- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Guía de despliegue en Render
- [Walkthrough](C:\Users\vn\.gemini\antigravity\brain\5905619b-1a37-45ee-a3eb-5d93dbede8bc\walkthrough.md) - Documentación completa de implementación

## 🤝 Contribuir

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

ISC

## 👨‍💻 Autor

Vincenzo Natale - [GitHub](https://github.com/vnatale52)

## 🙏 Agradecimientos

- Equipo de desarrollo
- Usuarios beta testers
- Comunidad open source
