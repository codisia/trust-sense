# 🚀 QUICK START - Login Test

## Step 1: Clear Cache (30 seconds)
```powershell
.\clear-cache.bat
```
Or manually:
- Press `Ctrl+Shift+Delete`
- Select **All time**
- Check: Cookies + Cache
- Click **Clear**

## Step 2: Clear localStorage (2 minutes)

Browser automatically opens to `http://localhost:5173/login`

1. Press `F12` (DevTools)
2. Click **Application** tab (top)
3. Left panel → **Local Storage**
4. Click **http://localhost:5173**
5. Right-click and **Clear All**
6. Press `F5` (Reload)

## Step 3: Login (1 minute)

| Field | Value |
|-------|-------|
| Email | admin@example.com |
| Password | admin123 |

Click **Login**

## Expected ✅

Should redirect to dashboard without errors.

**If you see CORS/500/Supabase errors**, it means Docker build needs a refresh. Run:
```powershell
docker compose down -v
docker compose up -d
```

Then repeat from **Step 1**.

---

That's it! Try it now. 🎯
