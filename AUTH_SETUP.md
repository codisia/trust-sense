# Authentication Setup Guide

## How It Works

Trust Sense now supports **two authentication methods**:

### 1. **Backend Auth** (Recommended for Local Development)
- ✅ Uses local SQLite database
- ✅ No external dependencies
- ✅ Fast and simple
- ✅ Perfect for testing

#### Registration Flow:
1. User clicks "REGISTER" on login page
2. Enters email, username, password
3. Account created in backend database
4. User gets JWT token immediately
5. Token stored in localStorage as `ts_token`
6. User can now run analysis

#### Login Flow:
1. User enters email & password
2. Backend validates credentials
3. Backend returns JWT token
4. Token stored in localStorage
5. All API requests include `Authorization: Bearer <token>` header

---

### 2. **Supabase Auth** (For Production/Multi-tenant)
- ✅ Uses Supabase PostgreSQL
- ✅ Pre-configured email verification
- ✅ OAuth support (Google, etc.)
- ⚠️ Requires Supabase project setup

---

## Testing Authentication

### Step 1: Register
```
Email: test@example.com
Username: testuser
Password: Test1234
```

### Step 2: Login
```
Email: test@example.com
Password: Test1234
```

### Step 3: Run Analysis
1. Go to Dashboard
2. Paste text in analysis box
3. Click "Analyze Text"
4. Should work ✅ (if logged in with valid token)

---

## Troubleshooting

### ❌ "Missing Bearer token" Error
**Cause:** No authentication token found
**Solution:**
1. Make sure you've registered AND logged in
2. Check browser DevTools → Application → Local Storage
3. Should see `ts_token` key with JWT value
4. Refresh page after login

### ❌ "Incorrect email or password"
**Cause:** User doesn't exist or wrong credentials
**Solution:**
1. Register first if not already registered
2. Double-check email spelling
3. Make sure backend is running on port 8000

### ❌ "Database error saving new user"
**Cause:** Backend database tables don't exist
**Solution:**
1. Check if backend container is running: `docker compose ps`
2. Backend uses SQLite (file-based), no migration needed
3. Users table created automatically on first registration

---

## Database Structure

### Backend Database (SQLite / PostgreSQL)
Located at: `backend/trust_sense.db` (SQLite)

**Tables:**
- `users` - User accounts (email, username, password_hash, role)
- `analyses` - Analysis results
- `organizations` - Multi-tenant organizations
- `organization_members` - Org membership tracking

### Supabase Database
If using Supabase auth, these tables are pre-created:
- `auth.users` - Supabase user accounts (managed automatically)
- Your app's `public.*` tables (created via migration)

---

## API Endpoints

### Authentication

**Register (Backend)**
```
POST /auth/register
Body: { email, username, password, role }
Response: { id, email, username, role, created_at }
```

**Login (Backend)**
```
POST /auth/login
Body: { email, password }
Response: { access_token, token_type: "bearer", user: {...} }
```

### Analysis (Requires Token)
```
POST /api/analyze-text
Headers: Authorization: Bearer <token>
Body: { text }
Response: { trust_score, risk_level, emotions, ... }
```

---

## Environment Variables

### Backend (`.env`)
```
SUPABASE_URL=https://detawdfanzmrkqbcfmus.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_JWT_SECRET=7b50a4a6-31a3-46be-931d-e80f47d7c08b
```

### Frontend (`.env.production`)
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://detawdfanzmrkqbcfmus.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Quick Test

### Terminal 1: Start Backend
```bash
docker compose up backend
```

### Terminal 2: Start Frontend
```bash
docker compose up frontend
```

### Browser: Test Flow
1. Go to http://localhost:5173
2. Register: `test@example.com` / `test` / `Test1234`
3. Login with same credentials
4. Go to Dashboard
5. Paste text and click Analyze
6. Should see results (no Bearer token error) ✅

---

## Production Deployment

For production, update:
1. Use PostgreSQL database instead of SQLite
2. Enable Supabase email verification
3. Add Google OAuth config
4. Set secure JWT secret
5. Use HTTPS URLs
6. Enable rate limiting

See `DEPLOYMENT_GUIDE.md` for detailed steps.
