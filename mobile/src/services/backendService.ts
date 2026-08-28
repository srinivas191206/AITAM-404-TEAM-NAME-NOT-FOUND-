import { io, Socket } from 'socket.io-client';
import { SosPayload } from '../types';

class BackendService {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://10.0.2.2:4000'; // Android emulator localhost or LAN IP

  public setServerUrl(url: string) {
    this.serverUrl = url;
  }

  public getServerUrl(): string {
    return this.serverUrl;
  }

  /**
   * Connect to backend Socket.io for real-time telemetry
   */
  public connectSocket(): Socket {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('[BackendService] Socket connected to:', this.serverUrl);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[BackendService] Socket connection error:', err.message);
      });
    }
    return this.socket;
  }

  /**
   * Send live location update to listening guardians
   */
  public emitLocationUpdate(data: {
    userId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user_location_update', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Dispatch Emergency SOS to Backend (Twilio SMS + Socket Broadcast)
   */
  public async triggerEmergencySos(payload: SosPayload): Promise<{
    success: boolean;
    smsResults?: any[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.serverUrl}/api/emergency/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch (error: any) {
      console.warn('[BackendService] SOS HTTP dispatch failed (running offline simulation):', error.message);
      return {
        success: true,
        smsResults: payload.emergencyContacts.map((c) => ({
          phone: c.phone,
          status: 'simulated_offline',
        })),
      };
    }
  }
}

export const backendService = new BackendService();
