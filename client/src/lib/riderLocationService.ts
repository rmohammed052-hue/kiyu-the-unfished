import { Socket } from 'socket.io-client';

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface RiderLocationUpdate {
  riderId: number;
  orderId?: number;
  position: Position;
  batteryLevel?: number;
}

class RiderLocationService {
  private watchId: number | null = null;
  private socket: Socket | null = null;
  private riderId: number | null = null;
  private orderId: number | null = null;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 5000; // 5 seconds minimum between updates
  private positionHistory: Position[] = [];
  private maxHistorySize: number = 10;
  private isTracking: boolean = false;

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences() {
    const savedInterval = localStorage.getItem('riderLocationUpdateInterval');
    if (savedInterval) {
      this.updateInterval = parseInt(savedInterval, 10);
    }
  }

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  setUpdateInterval(intervalMs: number) {
    this.updateInterval = Math.max(3000, intervalMs); // Minimum 3 seconds
    localStorage.setItem('riderLocationUpdateInterval', String(this.updateInterval));
  }

  // Smooth position using moving average
  private smoothPosition(newPosition: Position): Position {
    this.positionHistory.push(newPosition);
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }

    if (this.positionHistory.length < 3) {
      return newPosition; // Not enough data for smoothing
    }

    const avgLat = this.positionHistory.reduce((sum, pos) => sum + pos.latitude, 0) / this.positionHistory.length;
    const avgLng = this.positionHistory.reduce((sum, pos) => sum + pos.longitude, 0) / this.positionHistory.length;

    return {
      ...newPosition,
      latitude: avgLat,
      longitude: avgLng,
    };
  }

  // Check if enough time has passed since last update (rate limiting)
  private shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    this.lastUpdateTime = now;
    return true;
  }

  // Get battery level (if Battery API is available)
  private async getBatteryLevel(): Promise<number | undefined> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      } catch (err) {
        console.warn('Battery API not available:', err);
      }
    }
    return undefined;
  }

  // Send location update to server
  private async sendLocationUpdate(position: Position) {
    if (!this.socket || !this.riderId) {
      console.warn('Cannot send location: socket or riderId not set');
      return;
    }

    if (!this.shouldUpdate()) {
      return; // Rate limiting
    }

    const smoothedPosition = this.smoothPosition(position);
    const batteryLevel = await this.getBatteryLevel();

    const update: RiderLocationUpdate = {
      riderId: this.riderId,
      orderId: this.orderId || undefined,
      position: smoothedPosition,
      batteryLevel,
    };

    this.socket.emit('rider_location_update', update);
  }

  // Start tracking rider location
  startTracking(riderId: number, socket: Socket, orderId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isTracking) {
        console.warn('Already tracking location');
        resolve(true);
        return;
      }

      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      this.riderId = riderId;
      this.socket = socket;
      this.orderId = orderId || null;
      this.positionHistory = [];
      this.lastUpdateTime = 0;

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos: Position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          this.sendLocationUpdate(pos);
          this.isTracking = true;
          resolve(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  // Stop tracking
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.riderId = null;
    this.orderId = null;
    this.positionHistory = [];
    this.lastUpdateTime = 0;
  }

  // Get current position once (without watching)
  getCurrentPosition(): Promise<Position> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: Position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          resolve(pos);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    });
  }

  // Check if currently tracking
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Get rider ID being tracked
  getTrackingRiderId(): number | null {
    return this.riderId;
  }

  // Get order ID being tracked
  getTrackingOrderId(): number | null {
    return this.orderId;
  }
}

export const riderLocationService = new RiderLocationService();
