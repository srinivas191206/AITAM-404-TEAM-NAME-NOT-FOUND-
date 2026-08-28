# Access+ (Mobile Accessibility Platform)

**Access+** is an advanced mobile-only accessibility application designed for real physical mobile devices (Android prioritized) supporting **Visual Assistance (Blind Mode)**, **Hearing Assistance (Deaf Mode)**, and **Guardian Mode**.

---

## Key Mobile Architectures

### 1. Visual Assistance (Blind Mode)
- **Voice-First Navigation:** Big touch-to-talk microphone, command parser (`"What's in front of me?"`, `"Read text"`, `"Check currency"`, `"Take me to nearest pharmacy"`).
- **Shared Camera Module:** Single-frame snapshot processing with Google Gemini Multimodal Vision / OCR / Obstacle awareness.
- **Turn-by-Turn Pedestrian Navigation:** Free OpenStreetMap Nominatim geocoding + OSRM foot routing with voice announcements.
- **TTS & Haptic Feedback:** Zero-latency on-device speech synthesis and distinct vibration patterns.

### 2. Hearing Assistance (Deaf Mode)
- **Visual-First Hub:** Ambient sound radar with real-time decibel meter.
- **Live Conversational Captions:** Speech-to-text with adjustable high-contrast typography.
- **Environmental Sound Detection:** Identifies critical sirens, car horns, fire alarms, doorbells, and knocks with color-coded severity banners and vibration pulses.

### 3. Emergency SOS & Fall Detection
- **Sensor Impact Trigger:** Continuous accelerometer $G$-force monitoring ($> 2.8g$ spike) triggers 5-second countdown.
- **Cancelable Countdown:** Audible voice countdown + continuous heavy vibration + full-screen tap-to-cancel target.
- **Twilio SMS & Guardian Broadcast:** Dispatches emergency SMS with live Google Maps GPS coordinates and broadcasts to connected guardian sockets.

### 4. Guardian Mode & Geofencing
- **Telemetry Stream:** Live assisted user coordinates, heading, and distance from safe-zone center.
- **Configurable Safe-Zone:** Configurable radius (30m, 50m, 100m, 200m, 500m) with out-of-bounds alerts.

---

## Running the Application

### 1. Start the Relay Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend will run on `http://localhost:4000`.

### 2. Run the Mobile App on Android Device
```bash
cd mobile
npm install
npx expo start
```
- Press `a` in the Expo terminal to launch on a connected Android phone via ADB or Android Emulator.
- Or scan the QR code with **Expo Go** on your physical Android device.

---

## Configuration & Secrets (`backend/.env`)
```env
PORT=4000
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
GEMINI_API_KEY=AIzaSy...
```
*(If no Twilio credentials are provided, the system automatically enters safe simulation mode to guarantee zero demo crashes).*
