# Configuración de Render para Inventario División

## Cambios Necesarios Después del Despliegue

### 1. Variables de Entorno

Después de que Render cree los servicios, necesitas actualizar:

#### Frontend (`inventory-frontend`)
- **VITE_API_URL**: Actualizar con la URL real del backend
  - Ejemplo: `https://inventory-backend-xxxx.onrender.com`
  - Ir a: Dashboard → inventory-frontend → Environment → Edit
  - Cambiar el valor de `VITE_API_URL`
  - Guardar y redesplegar

### 2. Archivos CSV

Los siguientes archivos CSV deben estar en el repositorio (ya están):
- ✅ `usuarios.csv` - Tabla de usuarios
- ✅ `columnas.csv` - Definición de columnas

### 3. Guía de Migración de Datos (Importante)

Existen dos tipos de datos que se manejan de forma diferente:

#### A. Usuarios (`usuarios.csv`) - AUTOMÁTICO 🟢
- **Proceso**: Se ejecuta automáticamente en cada despliegue (Build).
- **Script**: `node seed_users.js` (definido en `render.yaml`).
- **Acción requerida**: Ninguna.
- **Comportamiento**: Crea usuarios nuevos y actualiza roles. No resetea contraseñas de usuarios existentes.

#### B. Inventario (`Inventario.csv`) - MANUAL 🟠
- **Proceso**: Se debe ejecutar manualmente una sola vez al inicio.
- **Script**: `node migrate_csv_to_pg.js`.
- **Acción requerida**:
  1. Ir al Dashboard de Render → Backend Service.
  2. Pestaña **Shell**.
  3. Ejecutar: `cd app/server && node migrate_csv_to_pg.js`
- **Comportamiento**: Carga los datos iniciales del inventario a la base de datos. Solo necesario la primera vez.

### 4. Verificación Post-Despliegue

Después del despliegue, verifica:

1. **Backend funcionando**:
   ```bash
   curl https://inventory-backend-xxxx.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password123"}'
   ```

2. **Frontend accesible**:
   - Abre `https://inventory-frontend-xxxx.onrender.com`
   - Intenta login con `admin` / `password123`

3. **Gestión de usuarios (ADMIN)**:
   - Login como admin
   - Verifica que el botón "Manage Users" sea visible
   - Prueba agregar/editar usuarios

### 5. Consideraciones de Seguridad

⚠️ **IMPORTANTE**: Después del primer despliegue:

1. **Cambiar contraseñas**:
   - Todos los usuarios tienen contraseña `password123`
   - Implementa un endpoint para cambio de contraseña
   - O actualiza manualmente en la base de datos

2. **JWT_SECRET**:
   - Render genera automáticamente un valor seguro
   - No necesitas cambiarlo manualmente

### 6. Limitaciones del Plan Free de Render

- **Disco efímero**: Los cambios a `usuarios.csv` desde la UI se perderán al redesplegar
- **Solución**: Usa la interfaz web de administración para gestionar usuarios
- **Persistencia**: Los usuarios se guardan en PostgreSQL (persistente)
- **CSV**: Solo se usa para el seeding inicial

### 7. Flujo de Actualización de Usuarios

**Opción A - Via UI (Recomendado)**:
1. Login como admin
2. Usar "Manage Users"
3. Los cambios se guardan en PostgreSQL (persistente)
4. El CSV se actualiza pero se perderá en próximo deploy

**Opción B - Via Git**:
1. Modificar `usuarios.csv` localmente
2. Commit y push a GitHub
3. Render redesplega automáticamente
4. `seed_users.js` actualiza la base de datos

## Resumen de Cambios en render.yaml

```yaml
buildCommand: npm install && node seed_users.js  # ← Agregado seeding
```

Esto asegura que los usuarios se creen automáticamente cada vez que se despliega.

## Pasos Detallados para Desplegar (Blueprint)

### ⚠️ AVISO IMPORTANTE: Base de Datos Existente
Mencionaste que ya creaste `inventory-db`. El **Blueprint** (`render.yaml`) está diseñado para crear y configurar su propia base de datos automáticamente.

**Recomendación**: Para evitar conflictos de nombres o configuraciones, **elimina la base de datos `inventory-db` que creaste manualmente** antes de proceder. El Blueprint creará una nueva configuración perfecta automáticamente.

### Guía Paso a Paso en Render

1.  **Iniciar**:
    - Ve a tu Dashboard de Render (https://dashboard.render.com).
    - Haz clic en el botón azul **"New +"**.
    - Selecciona **"Blueprint"**.

2.  **Conectar Repositorio**:
    - Verás una lista de tus repositorios de GitHub.
    - Busca `Inventario_Division` y haz clic en **"Connect"**.

3.  **Configuración del Blueprint**:
    - Render detectará automáticamente el archivo `render.yaml`.
    - **Service Group Name**: Escribe un nombre, por ejemplo: `inventario-prod`.
    - **Branch**: Asegúrate que diga `main`.
    - Verás una lista de recursos que se crearán:
        - `inventory-db` (Database)
        - `inventory-backend` (Web Service)
        - `inventory-frontend` (Static Site)
    - Haz clic en el botón azul **"Apply"** (o "Create Blueprint").

4.  **Esperar Despliegue**:
    - Render comenzará a crear los servicios en orden.
    - Primero la base de datos, luego el backend, luego el frontend.
    - Espera a que todos muestren estado **Deploy Succeeded** o estén en verde.

5.  **Post-Despliegue (Crucial para que funcione)**:
    - Una vez finalizado, sigue el paso 1 de "Cambios Necesarios Después del Despliegue" (arriba) para actualizar el `VITE_API_URL` en el frontend.
    - Luego sigue el paso 4 para migrar los datos.

## Notas Adicionales

- El seeding es **idempotente**: ejecutar múltiples veces no crea duplicados
- Los usuarios existentes se actualizan con el rol del CSV
- El usuario `admin` siempre se crea automáticamente
