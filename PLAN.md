# RetroCam AI - Minimal Dark Mode Camera App

## RetroCam AI MVP Plan

### Design Direction
**Minimal Dark Mode** - Pure black (#000000) backgrounds with subtle amber/gold accents. Clean sans-serif typography. Bottom camera carousel with smooth horizontal scrolling. Big central shutter button with haptic feedback. The aesthetic is "film camera meets iOS minimalism".

### App Icon
Matte black camera icon with subtle gold accent ring, inspired by Leica and vintage rangefinders.

---

### Features

#### 1. Camera System (10 Curated Presets)
**Free Cameras (5):**
- **Classic B&W** - Timeless monochrome with subtle grain
- **Tokyo Night** - Cinematic blue shadows, warm highlights
- **Golden Hour** - Warm amber tones, soft glow
- **Insta 90s** - Vintage Polaroid aesthetic
- **Crisp Clean** - Natural colors, subtle clarity

**Pro Cameras (5 - Locked):**
- **VHS Memory** - Analog tape distortion, chromatic aberration
- **Paris 1987** - Warm film stock, gentle fade
- **NYC Flash** - Hard flash aesthetic, high contrast
- **Tokyo 1998** - Cyberpunk neon, green shadows
- **Dream Sequence** - Soft focus, ethereal glow

Each preset includes: grain, temperature, vignette, blur, contrast, saturation, lightLeak, dust, timestamp settings.

#### 2. Photo Capture Flow
- Real-time camera preview with selected preset applied
- Capture button (shutter animation + haptic)
- Photo review screen with before/after toggle
- Save to gallery with watermark (free users: small "RetroCam" watermark, Pro: no watermark)
- Share sheet integration

#### 3. Import from Gallery
- Pick existing photos to apply effects
- Same preset engine applied post-capture

#### 4. RevenueCat Paywall
- Simple modal paywall showing Pro features
- Monthly/Annual subscription tiers
- "Restore Purchases" button
- Tested with RevenueCat Test Store

#### 5. Viral Touches
- **Random Camera Button** - Shuffle to discover new looks
- **Daily Camera** - Spotlight a different Pro camera each day (free trial of that preset)
- Watermark on free exports creates organic marketing

---

### Tech Stack
- **Expo SDK 54** with file-based routing
- **expo-camera** for real-time preview
- **react-native-skia** for filter rendering
- **expo-image-picker** for gallery import
- **expo-haptics** for shutter feedback
- **react-native-purchases** (RevenueCat) for monetization
- **@react-native-async-storage** for settings
- **lucide-react-native** for icons

---

### Navigation Structure
```
app/
├── _layout.tsx          # Root layout with providers
├── index.tsx            # Main camera screen
├── preview.tsx          # Photo review/save screen
├── gallery.tsx          # Import from camera roll
├── settings.tsx         # Settings & restore purchases
├── paywall.tsx          # Pro upgrade screen
└── +not-found.tsx       # 404 fallback
```

### UI Components
- **CameraPreview** - Fullscreen camera with overlay UI
- **CameraCarousel** - Horizontal scrollable preset selector
- **ShutterButton** - Large capture button with animation
- **PresetCard** - Camera preset thumbnail with preview
- **BeforeAfter** - Toggle between original and filtered
- **Watermark** - Subtle branded overlay for free users

---

### Visual Polish
- Smooth preset transitions (150ms crossfade)
- Shutter button scales on press with haptic
- Camera carousel snaps to center with momentum
- Loading skeletons for preview generation
- Subtle grain overlay texture on UI elements
- Amber (#FFB800) accent color against pure black

---

### First Version Scope
✅ 10 camera presets with JSON engine  
✅ Real-time camera preview  
✅ Photo capture with effects  
✅ Gallery import  
✅ Save with watermark (free) / no watermark (Pro)  
✅ RevenueCat paywall  
✅ Random camera button  
✅ Daily camera spotlight  
⏸️ Video recording (phase 2)  
⏸️ Trending presets (phase 2)  
⏸️ Camera packs as IAPs (phase 2 - start with single Pro sub)

The app will feel premium, fast, and purpose-built for creators who want that vintage aesthetic without complexity.