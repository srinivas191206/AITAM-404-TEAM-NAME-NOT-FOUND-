import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

// Twilio Client Setup with Mock Safety
const twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

const isTwilioConfigured =
  twilioSid.startsWith('AC') &&
  twilioAuthToken.length > 10 &&
  !twilioSid.includes('dummy');

const twilioClient = isTwilioConfigured
  ? twilio(twilioSid, twilioAuthToken)
  : null;

// Real-time Guardian Sessions Store
interface GuardianSession {
  assistedUserId: string;
  guardianSocketId: string;
  safeZoneCenter?: { latitude: number; longitude: number };
  safeZoneRadiusMeters?: number;
}
const activeSessions: Map<string, GuardianSession> = new Map();

// --- REST Endpoints ---

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Access+ Backend Relay',
    twilioConfigured: isTwilioConfigured,
    activeGuardianSessions: activeSessions.size,
    timestamp: new Date().toISOString(),
  });
});

// Emergency SOS Trigger
app.post('/api/emergency/sos', async (req: Request, res: Response) => {
  const {
    userId,
    userName,
    mode,
    latitude,
    longitude,
    emergencyContacts,
    triggerType, // 'manual' | 'sensor_fall' | 'sensor_impact'
  } = req.body;

  console.log(`[SOS TRIGGERED] Type: ${triggerType}, User: ${userName} (${userId}), Lat: ${latitude}, Lon: ${longitude}`);

  const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  const messageBody = `EMERGENCY ALERT from Access+!\n${userName || 'An assisted user'} (${mode || 'Accessibility'} Mode) triggered an SOS.\nTrigger: ${triggerType || 'Manual'}\nLocation: ${mapsUrl}`;

  const smsResults = [];

  if (emergencyContacts && Array.isArray(emergencyContacts)) {
    for (const contact of emergencyContacts) {
      if (contact.phone) {
        if (twilioClient && twilioPhoneNumber) {
          try {
            const result = await twilioClient.messages.create({
              body: messageBody,
              from: twilioPhoneNumber,
              to: contact.phone,
            });
            console.log(`[Twilio SMS Sent] To: ${contact.phone}, SID: ${result.sid}`);
            smsResults.push({ phone: contact.phone, status: 'sent', sid: result.sid });
          } catch (err: any) {
            console.error(`[Twilio Error] To: ${contact.phone}`, err.message);
            smsResults.push({ phone: contact.phone, status: 'error', error: err.message });
          }
        } else {
          console.log(`[Twilio SIMULATION] SMS to ${contact.phone}: "${messageBody}"`);
          smsResults.push({ phone: contact.phone, status: 'simulated_success', note: 'Twilio test mode' });
        }
      }
    }
  }

  // Broadcast SOS event via WebSocket to all listening guardians
  io.emit('sos_alert', {
    userId,
    userName: userName || 'Assisted User',
    mode,
    latitude,
    longitude,
    triggerType,
    mapsUrl,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'SOS processed and broadcast successfully',
    smsResults,
    broadcasted: true,
  });
});

// Geocoding Proxy (Nominatim OSM)
app.get('/api/geocode', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    if (lat && lon) {
      url += `&viewbox=${parseFloat(lon) - 0.1},${parseFloat(lat) + 0.1},${parseFloat(lon) + 0.1},${parseFloat(lat) - 0.1}&bounded=0`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AccessPlusAccessibilityApp/1.0',
      },
    });

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error('Geocode error:', error.message);
    return res.status(500).json({ error: 'Failed to geocode location' });
  }
});

// Walking Route Proxy (OSRM Foot Routing)
app.get('/api/route', async (req: Request, res: Response) => {
  const { startLat, startLon, destLat, destLon } = req.query;

  if (!startLat || !startLon || !destLat || !destLon) {
    return res.status(400).json({ error: 'startLat, startLon, destLat, destLon are required' });
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${startLon},${startLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error('Route error:', error.message);
    return res.status(500).json({ error: 'Failed to calculate route' });
  }
});

// --- Socket.IO Real-time Subsystem ---
io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Assisted user location telemetry stream
  socket.on('user_location_update', (data) => {
    // data: { userId, latitude, longitude, speed, heading, timestamp }
    socket.broadcast.emit(`guardian_location_${data.userId}`, data);
    socket.broadcast.emit('all_assisted_locations', data);
  });

  // Guardian register safe-zone
  socket.on('register_safe_zone', (data) => {
    // data: { userId, centerLat, centerLon, radiusMeters }
    activeSessions.set(data.userId, {
      assistedUserId: data.userId,
      guardianSocketId: socket.id,
      safeZoneCenter: { latitude: data.centerLat, longitude: data.centerLon },
      safeZoneRadiusMeters: data.radiusMeters || 50,
    });
    console.log(`[Safe Zone Registered] User ${data.userId}: Radius ${data.radiusMeters}m`);
  });

  // Safe zone breach alert from device or server
  socket.on('safe_zone_breach', (data) => {
    console.warn(`[SAFE ZONE BREACH] User: ${data.userId} is out of safe boundary!`);
    io.emit(`guardian_alert_${data.userId}`, {
      type: 'SAFE_ZONE_BREACH',
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Access+ Backend Relay Server running on port ${PORT}`);
  console.log(` Twilio Integration: ${isTwilioConfigured ? 'ENABLED' : 'SIMULATION MODE'}`);
  console.log(`=============================================`);
});
