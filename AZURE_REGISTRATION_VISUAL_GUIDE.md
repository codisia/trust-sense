# Azure App Registration - Visual Form Guide

This guide shows you exactly what to fill in on each Azure form screen.

---

## Screen 1: App Registration Form

**URL:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade

### Form Fields:

```
┌─────────────────────────────────────────────────────────────────┐
│ NEW APPLICATION REGISTRATION                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Name *                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Trust Sense Power BI                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  (This is just a label for your app)                            │
│                                                                 │
│  Supported account types *                                      │
│  ○ Accounts in any organizational directory                     │
│  ● Accounts in this organizational directory only ← SELECT THIS │
│  ○ Accounts in any organizational directory or personal...      │
│  (Most secure for SaaS - only your company can use it)          │
│                                                                 │
│  Redirect URI (optional)                                        │
│  [Web dropdown] │ http://localhost:8000/auth/callback           │
│  (You can change this later, leave empty for now if unsure)     │
│                                                                 │
│                                          [Cancel]  [Register]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Click "Register" →**

---

## Screen 2: Overview (After Registration)

After registering, you see the Overview page. **COPY THESE VALUES:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Trust Sense Power BI - Overview                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Display name:  Trust Sense Power BI                            │
│  Application ID (Client ID):                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ a1b2c3d4-e5f6-7890-abcd-ef1234567890        [Copy Icon] │◄──│
│  └─────────────────────────────────────────────────────────┘   │
│  ✓ COPY THIS → POWERBI_CLIENT_ID                               │
│                                                                 │
│  Directory ID (Tenant ID):                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ x1y2z3a4-b5c6-7890-defg-hi1234567890        [Copy Icon] │◄──│
│  └─────────────────────────────────────────────────────────┘   │
│  ✓ COPY THIS → POWERBI_TENANT_ID (you already have this!)      │
│                                                                 │
│  Object ID: z9y8x7w6-v5u4-3210-tsrq-po9876543210              │
│  (Don't need this one)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Screen 3: Certificates & Secrets

1. In left sidebar, click **"Certificates & secrets"**
2. Click **"+ New client secret"** button

```
┌─────────────────────────────────────────────────────────────────┐
│ Certificates & secrets - New client secret                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Description *                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Power BI Backend Auth                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Expires *                                                      │
│  ○ 6 months                                                    │
│  ○ 12 months                                                   │
│  ● 24 months  ← SELECT THIS (or "Never")                      │
│  ○ Never                                                       │
│                                                                 │
│                                      [Cancel]  [Add]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Click "Add" →**

---

## Screen 4: Secret Value (IMPORTANT!)

After clicking Add, you see this page:

```
┌─────────────────────────────────────────────────────────────────┐
│ Certificates & secrets - Client secrets                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️  WARNING: Make sure to copy the Value!                      │
│       After you leave this page, you won't be able to see it.   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Description  │ Value                  │ Expires       │    ││
│  ├──────────────┼──────────────────────────┼───────────────┼────┤│
│  │Power BI B.A. │ Sgf.jK8Xy...           │ 3/4/2028      │ ◄──││
│  │              │ [Long secret string]    │               │    ││
│  │              │ ┌─ COPY THIS ─────────┐ │               │    ││
│  │              │ │  [Copy Icon]         │ │               │    ││
│  │              │ └──────────────────────┘ │               │    ││
│  │              │                          │               │    ││
│  └──────────────┴──────────────────────────┴───────────────┴────┘│
│  ✓ COPY THIS → POWERBI_CLIENT_SECRET                            │
│                                                                 │
│  ⚠️  THIS VALUE SHOWS ONLY ONCE!                                │
│       If you don't copy it now, you'll need to create a new one.│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL: Click the copy icon next to the secret value and save it immediately!**

---

## Screen 5: API Permissions (Optional but Recommended)

In left sidebar, click **"API permissions"**

```
┌─────────────────────────────────────────────────────────────────┐
│ API permissions                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [+ Add a permission]                                            │
│                                                                 │
│ Configured permissions:                                         │
│ Currently no permissions will be requested on behalf of users   │
│                                                                 │
│ Grant admin consent for [Your Organization]  [Button]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Click "[+ Add a permission]" →**

```
┌─────────────────────────────────────────────────────────────────┐
│ Request API permissions - Select an API                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Microsoft APIs                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Microsoft Graph          ← CLICK THIS                  │   │
│ │ Azure Service Management                                │   │
│ │ Microsoft Power BI                                      │   │
│ │ Office 365 Management API                               │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Common Microsoft APIs                                           │
│ (shows other APIs you've used)                                  │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Click "Microsoft Graph" →**

```
┌─────────────────────────────────────────────────────────────────┐
│ Request API permissions - Microsoft Graph                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ What type of permissions does your application require? *      │
│ ○ Delegated permissions (access on behalf of a user)           │
│ ● Application permissions  ← SELECT THIS                       │
│                                                                 │
│ Search for permissions:                                        │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [Search...]  [List applications, User.Read.All showing] │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ☐ Application.ReadWrite.All                                   │
│ ☐ Directory.Read.All                                          │
│ ☑ User.Read.All          ← CHECK THIS                         │
│ ☑ User.ReadWrite.All     ← CHECK THIS                         │
│                                                                 │
│                                  [Cancel]  [Add permissions]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: Values to Collect

After completing all steps, you should collect:

```
✓ POWERBI_TENANT_ID = 
  (from Screen 2: "Directory ID (Tenant ID)")
  You already have this!

✓ POWERBI_CLIENT_ID = 
  (from Screen 2: "Application ID (Client ID)")

✓ POWERBI_CLIENT_SECRET = 
  (from Screen 4: Copy the secret value immediately!)

✓ POWERBI_API_URL = https://api.powerbi.com/v1.0/myorg
  (This is fixed - don't look for it)
```

---

## Send Me These 4 Values

**Format to send:**
```
POWERBI_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POWERBI_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POWERBI_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POWERBI_API_URL=https://api.powerbi.com/v1.0/myorg
```

Don't worry about special formatting - just the values!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find "Certificates & secrets" | Make sure you're on the correct app registration page |
| "Client secret value missing" | You need to COPY it immediately after creating (it only shows once) |
| "Registration link gives 404" | Use direct link: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade |
| "Can't see Application ID" | Scroll right on the Overview page or refresh |
| "Don't have admin permissions" | Ask your Azure AD admin for access |

---

**Once you have all 4 values, send them and I'll add them to your `.env` file! 🎉**
