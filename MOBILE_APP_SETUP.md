# 📱 Mobile App Setup & Testing Guide

## ✅ Current Status
- React Native 0.71.0 configured
- All dependencies installed (812 packages)
- Metro bundler ready
- API integration prepared

---

## 🚀 Option 1: Expo (EASIEST - No Setup Required!)

### Quickest Way to Test (2 minutes)

```powershell
# Install Expo CLI globally (first time only)
npm install -g expo-cli

# Navigate to mobile app
cd mobile-app

# Start development server
expo start
```

**Output:**
```
Metro Bundler ready at ws://localhost:19000
Scan QR code with Expo app
```

### Then on Your Phone/Tablet:
1. Download **Expo** app from App Store or Google Play
2. Open Expo app
3. Scan QR code from terminal
4. App loads in ~15 seconds
5. Hot reload as you edit code

**Pros:** No emulator, works on any phone  
**Cons:** Slightly different from production build

---

## 🚀 Option 2: Android Emulator (Recommended for Windows)

### Prerequisites
```
Windows 10+ (you have this)
8GB+ RAM (more = better)
.NET Framework 3.1+
Java Development Kit (JDK) 11+
Android Studio
```

### Step-by-Step Setup (15 minutes)

#### 1. Download Android Studio
- Go to: https://developer.android.com/studio
- Download installer
- Run installer, keep all defaults
- Install location: `C:\Android` (recommended)

#### 2. Configure Android SDK
- Open Android Studio
- Tools → SDK Manager
- Install:
  - Android SDK Platform 31 (min)
  - Android SDK Build-Tools 31.0.0
  - Android Emulator
  - Accept licenses

#### 3. Create Virtual Device (AVD)
```
Android Studio → Tools → AVD Manager

Create Virtual Device:
  - Device: Pixel 6 (or any modern phone)
  - OS: Android 12 (API 31+)
  - RAM: 4GB (at least)
  - Storage: 6GB
  - Name: "TrustSensePhone"

Launch the emulator (takes 1-2 min to start)
```

#### 4. Configure Environment Variables
```powershell
# Open PowerShell as Administrator

# Add Android to PATH
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk", "User")

# Verify
echo $env:ANDROID_HOME
```

#### 5. Run Mobile App
```powershell
# Start Metro bundler
cd mobile-app
npm start

# In ANOTHER terminal
npm run android

# Wait 1-2 minutes for app to compile and load
```

**Success:** App appears on emulator screen!

---

## 🚀 Option 3: iOS Simulator (Mac Only)

### Prerequisites
```
macOS 12+
Xcode 13+
CocoaPods
Node 14+
```

### Setup
```bash
# Install Xcode from App Store

# Install CocoaPods
sudo gem install cocoapods

# Navigate to mobile app
cd mobile-app

# Install iOS dependencies
npx pod-install

# Start development
npm start

# In another terminal
npm run ios

# Simulator opens automatically
```

---

## 📋 What You'll See in the App

### Features Included
✅ Content analysis tab  
✅ Analysis history tab  
✅ Dashboard with stats  
✅ News/media feed section  
✅ Real-time trust scores  
✅ Share analysis results  
✅ Offline data storage  

### API Integration
- Backend: `http://localhost:8001` (configurable in App.jsx)
- Endpoints used:
  - POST `/api/platforms/mobile/quick-analyze`
  - GET `/api/platforms/mobile/history`
  - GET `/api/platforms/mobile/feed`

---

## 🧪 Testing the App

### Test 1: Launch & Navigation
1. ✅ App starts without crashing
2. ✅ See main analyze screen
3. ✅ Bottom tabs work (Analyze, History, Dashboard, Feed)
4. ✅ Tap each tab - screens switch smooth

### Test 2: Text Analysis
```
1. Type sample text: "Breaking news: new study finds..."
2. Tap "Analyze"
3. See loading spinner (2-3 sec)
4. If backend running: Shows real score
5. If backend offline: Shows mock data (75%)
```

### Test 3: History
```
1. Go to History tab
2. Previous analyses should appear
3. Tap any item to view details
4. Can see date, content, score
```

### Test 4: Dashboard
```
1. Shows stats: Total analyses, avg score, etc.
2. Mock charts if backend offline
3. Real data if backend online
```

---

## 🔗 Connecting to Backend

### If Backend is Running
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload --port 8001

# Terminal 2: Mobile App
cd mobile-app
npm start
npm run android  # or npm run ios / expo start
```

### In Mobile App
- Analysis will show real scores from backend
- History will persist to backend database
- Feed will load real media items

### If Backend is Offline  
- App still works with mock data
- Useful for UI testing without backend
- Scores will always be 75% (hardcoded)

---

## 📝 App Configuration

### API URL (in mobile-app/App.jsx)
```javascript
const API_URL = 'http://localhost:8001'
```

Change to:
- Remote server: `https://api.trustsense.com`
- Different port: `http://localhost:9000`

### Rebuild After Changes
```bash
# If Metro is running, it auto-reloads
# Just save the file and check the emulator/phone

# Force rebuild if needed:
npm start -- --reset-cache
```

---

## 📊 Hot Reload Demo

### Live Editing (Hot Module Replacement)
```
1. App running on emulator
2. Edit "App.jsx" - change button text
3. Save file (Ctrl+S)
4. Emulator automatically refreshes
5. New button text appears!
```

**No rebuild needed** - this is React Native's superpower!

---

## 📱 Full Device Testing

### Using Physical Android Phone
```
1. Enable Developer Mode:
   - Settings → About → Build Number (tap 7x)
   
2. Enable USB Debugging:
   - Settings → Developers → USB Debugging ON
   
3. Connect phone via USB
   - Macrosoft: Allow permissions

4. Identify device:
   npm start
   npm run android
   
5. Choose device from list
```

### Using Physical iPhone
```
1. Phone must be on same WiFi as Mac
2. Connect phone to Mac via USB
3. Trust the Mac on phone
4. npm start
5. npm run ios
```

---

## 🆘 Troubleshooting

### "Metro Bundler not working"
```powershell
# Kill existing process
Get-Process -Name "node" | Stop-Process -Force

# Start fresh
npm start -- --reset-cache
```

### "Emulator won't start"
```
1. Open Android Studio → AVD Manager
2. Right-click device → Wipe Data
3. Delete the device
4. Create new one again
5. Launch
```

### "React Native: Command not found"
```powershell
npm install -g react-native-cli
```

### "Port 8081 already in use"
```powershell
# Kill process using port 8081
Get-NetTCPConnection -LocalPort 8081 | Stop-Process

# Or use different port
npm start -- --port 8082
```

### "ANDROID_HOME not found"
```powershell
# Check if set correctly
echo $env:ANDROID_HOME

# If empty, set it
$ANDROID_HOME = "$env:USERPROFILE\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, "User")

# Restart PowerShell
```

---

## 🎯 Recommended Setup Path

### Quick Test (15 min)
1. ✅ Use Expo + phone
2. ✅ Scan QR code
3. ✅ Test features instantly

### Full Development (1-2 hours)
1. ✅ Install Android Studio (30 min)
2. ✅ Create Android emulator (20 min)
3. ✅ Run app on emulator (10 min)
4. ✅ Test all features
5. ✅ Make code changes & hot reload

### Production Build
```bash
# Android APK
npm run android -- --release

# iOS App
npm run ios -- --release

# These create production builds (larger, optimized)
```

---

## 💾 Project Structure

```
mobile-app/
├── index.js              # Entry point
├── App.jsx              # Main component
├── package.json         # Dependencies
├── babel.config.js      # JS compiler config
├── metro.config.js      # Metro bundler config
└── node_modules/        # 812 packages
```

---

## ✨ Features Implemented

### UI Screens
- Home/Analyze screen
- History screen
- Dashboard with stats
- News feed screen

### Functionality  
- Text content analysis
- Analysis history storage
- Dashboard metrics
- Result sharing
- Loading states
- Error handling

### Backend Integration
- axios HTTP client
- URL: `http://localhost:8001`
- Real-time analysis results

---

## 🚀 Next: Run the App!

**Choose your method:**

```bash
# Method 1: Expo (Easiest!)
npm install -g expo-cli
cd mobile-app
expo start

# Method 2: Android Emulator
cd mobile-app
npm start
npm run android

# Method 3: iOS Simulator (Mac)
cd mobile-app
npm start
npm run ios
```

All three methods will show the same app!

---

**Mobile app is ready to deploy!**
