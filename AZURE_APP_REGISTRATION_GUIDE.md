# Azure App Registration Guide for Power BI Integration

Complete step-by-step guide to register your application in Azure AD and get the credentials needed for Trust Sense Power BI integration.

---

## Step 1: Access Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your Microsoft account (or organizational account)
3. In the top search bar, search for "**App registrations**"
4. Click on "**App registrations**" from the results

---

## Step 2: Create New Application

1. Click the **"+ New registration"** button at the top
2. You'll see the registration form with these fields:

---

## Step 3: Fill in the Registration Form

### Field 1: Name
- **What to enter:** `Trust Sense Power BI` (or any name you prefer)
- **Why:** This is the display name for your application in Azure

### Field 2: Supported account types
- **Select:** "Accounts in this organizational directory only" ← IMPORTANT
- **Why:** This restricts access to only your organization (most secure for SaaS)

### Field 3: Redirect URI (Optional for now)
- **For Web apps, enter:** `http://localhost:8000/auth/microsoft/callback`
- **Why:** When users log in, they'll be redirected here. You can update this later
- **Leave empty for now** if unsure

**Click "Register" button →**

---

## Step 4: Copy Your Credentials (Overview Page)

After clicking Register, you'll see the **Overview page**. Copy these values:

### The values you see are:

1. **Application (client) ID** ← Copy this value
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - This is your `POWERBI_CLIENT_ID`

2. **Directory (tenant) ID** ← Copy this value
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - This is your `POWERBI_TENANT_ID` (you already have this!)

---

## Step 5: Create a Client Secret

1. In the left sidebar, click **"Certificates & secrets"**
2. Click the **"+ New client secret"** button
3. Fill in the form:
   - **Description:** `Power BI Backend Authentication` (or any description)
   - **Expires:** Select **"24 months"** or **"Never"** (recommendation: 24 months)
4. Click **"Add"** button

### IMPORTANT: Copy the secret value immediately!
- Look for the **"Value"** column (not the ID)
- **Click the copy icon** next to the secret value
- This is your `POWERBI_CLIENT_SECRET`
- **⚠️ This value will ONLY show once!** If you miss it, you'll need to create a new secret

---

## Step 6: Grant API Permissions

1. In the left sidebar, click **"API permissions"**
2. Click **"+ Add a permission"** button
3. Select **"Microsoft Graph"** from the list
4. Select **"Application permissions"** (NOT delegated)
5. Search for and select these permissions:
   - `User.Read.All` - Read all users
   - `User.ReadWrite.All` - Read/write user data
6. Click **"Add permissions"** button

---

## Step 7: Grant Admin Consent (If Required)

If you see a button that says **"Grant admin consent for [Your Organization]"**, click it. This gives the app permission to access organizational resources.

---

## Summary: Values to Send Me

Once you complete all steps, you should have these 4 values:

```
POWERBI_TENANT_ID = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POWERBI_CLIENT_ID = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POWERBI_CLIENT_SECRET = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (long string)
POWERBI_API_URL = https://api.powerbi.com/v1.0/myorg
```

**Send me these values and I'll add them to your `.env` file immediately.**

---

## If You Get Stuck

**404 Error on Registration Link?**
- Use this direct link instead: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade

**Can't see the Application ID?**
- You may need to scroll right on the Overview page
- Or refresh the page

**Lost your Tenant ID?**
- In the Azure Portal, go to "Azure Active Directory" → "Properties"
- Look for "Tenant ID"

**Can't find API Permissions?**
- You might not have the right admin permissions
- Ask your Azure admin to grant you access

---

## Next Steps After Registering

Once I add your Power BI credentials to the `.env` file, your app will be able to:
- ✓ Authenticate with Power BI API
- ✓ Create and upload datasets
- ✓ Sync analysis results to Power BI automatically
- ✓ Create Power BI reports from Trust Sense data

Ready to register? Let me know once you have all 4 values from your Azure app!
