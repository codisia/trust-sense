# 🔧 API Configuration Guide

Your Trust Sense app is currently showing **"Mock analysis mode"** because AI APIs are not configured. Here's how to fix it:

## Current Status

- ❌ Groq API: NOT CONFIGURED
- ❌ HuggingFace API: NOT CONFIGURED  
- ❌ Anthropic Claude API: NOT CONFIGURED

## Solution: Get Free API Keys

### Option 1: Groq (RECOMMENDED - Free & Fast)

**Best for getting started quickly!**

1. Visit: https://console.groq.com/keys
2. Sign up (free) or log in
3. Click "Create API Key"
4. Copy your API key (starts with `gsk_`)
5. Edit `.env` file in project root
6. Paste into `GROQ_API_KEY=`
7. Restart backend

### Option 2: HuggingFace (FREE)

1. Visit: https://huggingface.co/settings/tokens
2. Sign up (free) or log in
3. Click "New token"
4. Give it a name (e.g., "Trust Sense")
5. Copy your token (starts with `hf_`)
6. Edit `.env` file
7. Paste into `HUGGINGFACE_API_KEY=`
8. Restart backend

### Option 3: Anthropic Claude (PAID)

Best accuracy but requires payment.

1. Visit: https://console.anthropic.com/
2. Sign up and add payment method
3. Generate API key
4. Paste into `.env` as `ANTHROPIC_API_KEY=`

## Quick Setup

```bash
# 1. Open .env file (in project root)
# .env

GROQ_API_KEY=gsk_YOUR_KEY_HERE
HUGGINGFACE_API_KEY=hf_YOUR_KEY_HERE
ANTHROPIC_API_KEY=

# 2. Save the file
# 3. Restart backend
```

## Verify Configuration

Run the diagnostic script:

```bash
python test_apis.py
```

This will show which APIs are configured and ready to use.

## Restart Backend

After adding keys to `.env`:

### On Windows (PowerShell/CMD):
```powershell
# Kill running backend (Ctrl+C in terminal)
# Then restart
cd backend
pip install -r requirements.txt
python app/main.py
```

### On Linux/Mac:
```bash
cd backend
python app/main.py
```

## Test It

1. Go to http://localhost:3000 (or your frontend)
2. Run the same analysis again
3. Check logs - should see:
   - 🟢 Using Groq API... (or HuggingFace/Claude)
   - Instead of: ❌ Using rule-based analysis

## Troubleshooting

### Still getting "Mock analysis mode"?

1. **Check .env is saved**: Make sure changes were saved
2. **Check format**: Ensure no quotes around keys
   ```
   ✅ GROQ_API_KEY=gsk_abc123
   ❌ GROQ_API_KEY="gsk_abc123"
   ❌ GROQ_API_KEY='gsk_abc123'
   ```
3. **Restart backend**: Changes only take effect after restart
4. **Check logs**: Run `python test_apis.py` to see what's configured

### API key gives "Invalid" error?

- Double-check the key is copied correctly (no extra spaces)
- Some APIs have rate limits on free tier - try another API
- Check that the key has proper permissions in the service

## Priority

The app tries APIs in this order (falls back if one fails):

1. **Claude** (most accurate) - Paid
2. **Groq** (fast, free) - Recommended ⭐
3. **HuggingFace** (offline capable) - Free
4. **Rule-based analysis** - No API needed (current fallback)

**Recommendation**: Start with Groq (free tier is generous), then add HuggingFace as backup.

---

**Questions?** Check:
- Console output for specific error messages
- Run `python test_apis.py` or review logs
