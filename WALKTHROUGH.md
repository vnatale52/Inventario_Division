# Walkthrough: Complete User Management System

## Overview
This walkthrough documents the complete implementation of the user management and filtering system for Inventario División, including the admin interface for managing users through the web UI.

## Features Implemented

### 1. User Hierarchy Management ✅

**File**: [usuarios.csv](file:///c:/Users/vn/Desktop/Inventario%20Divisi%C3%B3n/usuarios.csv)

Created a CSV file to define the user hierarchy:

```csv
INSPECTOR;SUPERVISOR;REVISOR DIV;JEFE DIV;REVISOR DEPTO;REVISOR DIREC
Vincenzo;Supervisor1;RevisorDiv1;Jefa1;RevisorDepto1;RevisorDirec1
Carlos;Supervisor2;RevisorDiv2;Jefa2;RevisorDepto2;RevisorDirec2
Juan;Supervisor3;RevisorDiv3;Jefa3;RevisorDepto3;RevisorDirec3
```

- **Header row**: Role names (columns in the inventory data)
- **Data rows**: Usernames for each role in the hierarchy
- Each row represents a related group of users across the hierarchy

### 2. Dynamic User Seeding ✅

**File**: [seed_users.js](file:///c:/Users/vn/Desktop/Inventario%20Divisi%C3%B3n/app/server/seed_users.js)

The script now:
- Reads `usuarios.csv` dynamically
- Parses roles from the header row
- **Initializes database tables** automatically (prevents build errors)
- Creates user accounts for each username
- Automatically adds an `admin` user with `ADMIN` role
- Default password for all users: `password123`

**Running the seed script**:
```bash
cd app/server
node seed_users.js
```

### 3. Role-Based Data Filtering ✅

**File**: [index.js](file:///c:/Users/vn/Desktop/Inventario%20Divisi%C3%B3n/app/server/index.js)

Implemented filtering in two endpoints:

#### GET /api/data
- Non-ADMIN users only see records where their role column matches their username
- Example: User "Vincenzo" (role: INSPECTOR) only sees rows where `INSPECTOR` column = "Vincenzo"
- ADMIN users see all records

#### POST /api/backup
- Backup files only contain records visible to the logged-in user
- Same filtering logic as `/api/data`
- Ensures data privacy across user roles

### 4. User-Specific Layout Settings ✅

**File**: [InventoryGrid.jsx](file:///c:/Users/vn/Desktop/Inventario%20Divisi%C3%B3n/app/client/src/components/InventoryGrid.jsx)

- Column widths and header height are saved per-username (not per-role)
- Each user has their own layout preferences
- Settings stored in browser localStorage with keys like `inventory-column-widths-Vincenzo`

### 5. Dynamic Column Detection ✅

Removed all hardcoded column names from `InventoryGrid.jsx`:

**Before**: 30+ hardcoded column names in arrays

**After**: Pattern-based detection using heuristics:
```javascript
// Small columns: short labels
if (label.length <= 15) return 50;

// Financial columns: contains keywords
if (label.includes('Impuesto') || label.includes('Accesorios') || ...) {
    return 120;
}
```

### 6. Admin User Management Interface ✅

#### Backend API Endpoints

**File**: [index.js](file:///c:/Users/vn/Desktop/Inventario%20Divisi%C3%B3n/app/server/index.js)

##### GET /api/users
- Returns current user hierarchy from `usuarios.csv`
- Restricted to ADMIN role only
- Returns: `{ roles: [...], users: [[...], [...]] }`

##### POST /api/users
- Updates `usuarios.csv` with new user data
- Automatically re-runs `seed_users.js` to update database
- Restricted to ADMIN role only
- Validates and saves changes

#### Frontend Component

**File**: [UserManager.jsx](file:///c:/Users/vn/Desktop/Inventario%20Divisi%C3%B3n/app/client/src/components/UserManager.jsx)

Features:
- **Table View**: Displays current user hierarchy
- **Add Row**: Add new users across all roles
- **Edit Cells**: Modify existing usernames
- **Delete Row**: Remove user groups
- **Validation**: Prevents duplicate usernames
- **Save**: Updates CSV and database in one action

![User Management Interface](file:///C:/Users/vn/.gemini/antigravity/brain/5905619b-1a37-45ee-a3eb-5d93dbede8bc/user_management_test_1764853167119.webp)

#### Integration

**File**: [App.jsx](file:///c:/Users/vn/Desktop/Inventario%20Divisi%C3%B3n/app/client/src/App.jsx)

- Added "Manage Users" button (purple, visible only to ADMIN)
- Opens UserManager modal when clicked
- Located in the header next to Backup and Logout buttons

## Testing

### Manual Testing Steps

1. **Start the application**:
   ```bash
   cd "c:\Users\vn\Desktop\Inventario División"
   ./start.bat
   ```

2. **Test as Inspector (Vincenzo)**:
   - Login: `Vincenzo` / `password123`
   - Verify: Only see records where INSPECTOR = "Vincenzo"
   - Test backup: Should only contain Vincenzo's records
   - Test layout: Save column widths, logout, login again - settings should persist

3. **Test as Admin**:
   - Login: `admin` / `password123`
   - Verify: See all records (no filtering)
   - Click "Manage Users" button
   - Add a new row with test users
   - Save changes
   - Verify users are created in database

4. **Test filtering for other roles**:
   - Login as: `Supervisor1` / `password123`
   - Verify: Only see records where SUPERVISOR = "Supervisor1"

### API Testing (Git Bash)

```bash
# Run the test script
cd "c:\Users\vn\Desktop\Inventario División"
bash test_user_api.sh
```

Or manually:

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | jq -r '.token')

# Get users
curl -s -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Update users (example)
curl -s -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["INSPECTOR", "SUPERVISOR", "REVISOR DIV"],
    "users": [
      ["User1", "User2", "User3"],
      ["User4", "User5", "User6"]
    ]
  }'
```

## File Structure

```
Inventario División/
├── usuarios.csv                    # User hierarchy table
├── columnas.csv                    # Column definitions
├── test_user_api.sh               # API testing script
├── app/
│   ├── server/
│   │   ├── index.js               # Backend with filtering + user management API
│   │   ├── seed_users.js          # Dynamic user seeding from CSV
│   │   └── db.js                  # Database initialization
│   └── client/
│       └── src/
│           ├── App.jsx            # Main app with UserManager integration
│           └── components/
│               ├── InventoryGrid.jsx   # Grid with dynamic columns
│               └── UserManager.jsx     # Admin user management UI
```

## Key Implementation Details

### Security
- All user management endpoints require authentication
- Only ADMIN role can access `/api/users` endpoints
- JWT tokens used for authentication
- Passwords hashed with bcrypt

### Data Privacy
- Users can only see their own records (except ADMIN)
- Filtering happens server-side (not just UI)
- Backup files respect user permissions

### Maintainability
- No hardcoded column names
- No hardcoded user lists
- All configuration in CSV files
- Pattern-based detection for column properties

## Usage Instructions

### For Administrators

#### Adding New Users via CSV
1. Edit `usuarios.csv`
2. Add a new row with usernames for each role
3. Run: `cd app/server && node seed_users.js`
4. Users created with password `password123`

#### Adding New Users via UI
1. Login as `admin`
2. Click "Manage Users" button
3. Click "Add Row"
4. Enter usernames for each role
5. Click "Save Changes"
6. Users automatically created in database

#### Modifying Roles
1. Edit the header row in `usuarios.csv` to match column names from `columnas.csv`
2. Re-run seed script
3. Or use the UI to manage existing users

### For Users

#### First Login
- Username: Your name from the hierarchy (e.g., "Vincenzo")
- Password: `password123`
- **Important**: Change your password after first login

#### Customizing Layout
1. Resize columns by dragging column borders
2. Resize header height by dragging the green bar at bottom of header
3. Click "Save Layout" button when done
4. Settings persist across sessions

#### Creating Backups
- Click "Backup" button in header
- Downloads CSV with only your visible records
- **Security**: Filename includes your authenticated username and timestamp (server-side enforcement)
- **Format**: `{username}_backup_{DD-MM-YYYY}_{HH-MM-SS}.csv`

### Recent Fixes & Improvements
- **Backup Security**: Filename generation now uses the authenticated JWT token's username instead of client-provided data.
- **CORS Configuration**: Added `exposedHeaders: ['Content-Disposition']` to allow frontend to read the correct backup filename.
- **Error Logging**: Enhanced server-side logging for User Management to debug file locking issues (`EBUSY`).
- **Data Sanitization**: Automated scripts to clean special characters (ñ, ó) from CSV headers.

## Default Users

| Username | Role | Password |
|----------|------|----------|
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

## Troubleshooting

### Users can't login
- Run: `cd app/server && node seed_users.js`
- Check that `usuarios.csv` exists and is properly formatted

### Filtering not working
- Verify role names in `usuarios.csv` match column names in `columnas.csv`
- Check for trailing spaces in CSV files
- Restart the server

### User management UI not visible
- Verify you're logged in as `admin`
- Check browser console for errors
- Ensure server is running on port 3001

## Summary

✅ **User Management**: Dynamic CSV-based user hierarchy  
✅ **Role-Based Filtering**: Server-side data filtering by user role  
✅ **User-Specific Layouts**: Per-user column and header preferences  
✅ **Admin Interface**: Web UI for managing users  
✅ **No Hardcoded Values**: All configuration in CSV files  
✅ **Secure**: JWT authentication, bcrypt passwords, role-based access control

The system is now fully functional and ready for production use!
