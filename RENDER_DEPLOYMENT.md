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

### 3. Seeding Automático

El `render.yaml` actualizado ahora ejecuta `node seed_users.js` durante el build, lo que:
- Lee `usuarios.csv`
- Crea todos los usuarios en la base de datos PostgreSQL
- Asigna la contraseña por defecto `password123`

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

## Pasos para Desplegar

1. **Commit y push** (ya hecho ✅)
2. **Conectar repositorio en Render**:
   - New → Blueprint
   - Conectar repositorio GitHub
   - Render detectará `render.yaml`
3. **Esperar despliegue** (~5-10 minutos)
4. **Actualizar VITE_API_URL** en frontend
5. **Redesplegar frontend**
6. **Probar login** con admin/password123

## Notas Adicionales

- El seeding es **idempotente**: ejecutar múltiples veces no crea duplicados
- Los usuarios existentes se actualizan con el rol del CSV
- El usuario `admin` siempre se crea automáticamente
