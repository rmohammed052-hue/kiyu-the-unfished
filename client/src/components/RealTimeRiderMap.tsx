import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Clock, Search, MapPin, Battery } from "lucide-react";
import { io } from "socket.io-client";

interface RiderLocation {
  riderId: number;
  riderName: string;
  orderId: number;
  orderNumber: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
  batteryLevel?: number;
}

const riderIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const destinationIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17.5, 35],
  popupAnchor: [0, -35],
});

// Component to auto-center map on new rider assignment
function MapController({ center }: { center: LatLng }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  
  return null;
}

export default function RealTimeRiderMap() {
  const [riders, setRiders] = useState<RiderLocation[]>([]);
  const [center, setCenter] = useState<LatLng>(new LatLng(5.6037, -0.1870)); // Accra, Ghana
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRider, setSelectedRider] = useState<number | null>(null);

  const { data: initialRiders = [], isLoading } = useQuery<RiderLocation[]>({
    queryKey: ["/api/admin/active-riders"],
    refetchInterval: 30000, // Refresh every 30 seconds as fallback
  });

  useEffect(() => {
    if (initialRiders.length > 0) {
      setRiders(initialRiders);
      // Center map on first rider if no rider is selected
      if (!selectedRider) {
        setCenter(new LatLng(initialRiders[0].latitude, initialRiders[0].longitude));
      }
    }
  }, [initialRiders, selectedRider]);

  useEffect(() => {
    const socket = io();

    // Listen for real-time rider location updates
    socket.on("admin_rider_location_updated", (locationUpdate: any) => {
      setRiders((prevRiders) => {
        const existingIndex = prevRiders.findIndex(r => r.riderId === locationUpdate.riderId);
        
        const updatedRider: RiderLocation = {
          riderId: locationUpdate.riderId,
          riderName: prevRiders[existingIndex]?.riderName || `Rider ${locationUpdate.riderId}`,
          orderId: locationUpdate.orderId,
          orderNumber: prevRiders[existingIndex]?.orderNumber || `#${locationUpdate.orderId}`,
          latitude: locationUpdate.latitude,
          longitude: locationUpdate.longitude,
          speed: locationUpdate.speed,
          heading: locationUpdate.heading,
          timestamp: new Date(locationUpdate.timestamp).toISOString(),
          batteryLevel: locationUpdate.batteryLevel,
        };

        if (existingIndex >= 0) {
          // Update existing rider
          const updated = [...prevRiders];
          updated[existingIndex] = updatedRider;
          return updated;
        } else {
          // Add new rider
          return [...prevRiders, updatedRider];
        }
      });
    });

    // Listen for rider tracking stopped
    socket.on("admin_rider_tracking_stopped", ({ riderId }) => {
      setRiders((prevRiders) => prevRiders.filter(r => r.riderId !== riderId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Filter riders based on search and status
  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.riderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rider.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && rider.speed !== null && rider.speed > 0) ||
                         (statusFilter === "idle" && (rider.speed === null || rider.speed === 0));
    
    return matchesSearch && matchesStatus;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const centerOnRider = (rider: RiderLocation) => {
    setCenter(new LatLng(rider.latitude, rider.longitude));
    setSelectedRider(rider.riderId);
  };

  return (
    <Card data-testid="card-rider-map">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Live Rider Tracking
            </CardTitle>
            <CardDescription>
              Real-time location of all active delivery riders
            </CardDescription>
          </div>
          <Badge variant="secondary" data-testid="badge-active-riders">
            {filteredRiders.length} Active {filteredRiders.length === 1 ? "Rider" : "Riders"}
          </Badge>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by rider name or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Riders</SelectItem>
              <SelectItem value="active">Moving</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "No riders match your filters" 
                  : "No active deliveries at the moment"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rider List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {filteredRiders.map((rider) => (
                <Button
                  key={rider.riderId}
                  variant={selectedRider === rider.riderId ? "default" : "outline"}
                  size="sm"
                  onClick={() => centerOnRider(rider)}
                  className="justify-start h-auto py-2"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium text-xs">{rider.riderName}</span>
                    <span className="text-xs text-muted-foreground">Order #{rider.orderNumber}</span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Map */}
            <div className="h-[400px] rounded-lg overflow-hidden border" data-testid="map-container">
              <MapContainer
                center={center}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={center} />
                
                {filteredRiders.map((rider) => (
                  <Marker
                    key={rider.riderId}
                    position={[rider.latitude, rider.longitude]}
                    icon={riderIcon}
                    eventHandlers={{
                      click: () => setSelectedRider(rider.riderId),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[220px]" data-testid={`popup-rider-${rider.riderId}`}>
                        <h3 className="font-bold text-sm mb-1">{rider.riderName}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Order #{rider.orderNumber}
                        </p>
                        <div className="space-y-1.5 text-xs">
                          {rider.speed !== null && (
                            <div className="flex items-center gap-2">
                              <Badge variant={rider.speed > 0 ? "default" : "secondary"} className="text-xs">
                                {rider.speed > 0 ? "Moving" : "Idle"}
                              </Badge>
                              <span className="text-muted-foreground">
                                {Math.round(rider.speed * 3.6)} km/h
                              </span>
                            </div>
                          )}
                          {rider.batteryLevel !== undefined && (
                            <p className="flex items-center gap-1.5">
                              <Battery className={`h-3 w-3 ${rider.batteryLevel < 20 ? 'text-red-500' : 'text-green-500'}`} />
                              <span className="font-medium">Battery:</span>
                              <span>{rider.batteryLevel}%</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(rider.timestamp)}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{rider.latitude.toFixed(5)}, {rider.longitude.toFixed(5)}</span>
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
