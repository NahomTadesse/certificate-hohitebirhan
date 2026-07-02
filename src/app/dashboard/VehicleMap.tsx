// components/VehicleMap.tsx
"use client";

import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { getGoogleMapsConfig } from "@/lib/googleMapsConfig";
import { useState } from "react";
import { MapPin, Truck, User, Phone, Clock, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 9.033,
  lng: 38.74,
};

interface VehicleTrackingData {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  vehicleVin: string;
  vehicleType: string;
  vehicleStatus: string;
  driverId: number;
  driverName: string;
  driverPhone: string;
  driverLicenseNo: string;
  ts: string;
  lat: number;
  lon: number;
  speedKph: number;
  headingDeg: number;
  source: string;
}

interface VehicleMapProps {
  vehicles: VehicleTrackingData[];
  height?: string;
  zoom?: number;
  showAllMarkers?: boolean;
}

export default function VehicleMap({ 
  vehicles, 
  height = '500px',
  zoom = 12,
  showAllMarkers = true 
}: VehicleMapProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTrackingData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  const { googleMapsApiKey, libraries } = getGoogleMapsConfig();
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
    libraries,
  });

  const onMapLoad = (map: google.maps.Map) => {
    setMapLoaded(true);
    
    // If we have vehicles, center on the first one
    if (vehicles.length > 0) {
      const firstVehicle = vehicles[0];
      setMapCenter({ lat: firstVehicle.lat, lng: firstVehicle.lon });
      map.panTo({ lat: firstVehicle.lat, lng: firstVehicle.lon });
    }
  };

  // Custom marker icon based on vehicle type and status
  const getMarkerIcon = (vehicle: VehicleTrackingData) => {
    const isMoving = vehicle.speedKph > 5;
    const statusColor = 
      vehicle.vehicleStatus === 'IN_SERVICE' ? '#10B981' : // Green
      vehicle.vehicleStatus === 'AVAILABLE' ? '#3B82F6' : // Blue
      vehicle.vehicleStatus === 'MAINTENANCE' ? '#F59E0B' : // Amber
      '#6B7280'; // Gray

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: statusColor,
      fillOpacity: 0.9,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      rotation: isMoving ? vehicle.headingDeg : 0,
    };
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Open in Google Maps
  const openInGoogleMaps = (lat: number, lng: number, plate: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place=${encodeURIComponent(plate)}`;
    window.open(url, '_blank');
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={mapCenter}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={{ lat: vehicle.lat, lng: vehicle.lon }}
            icon={getMarkerIcon(vehicle)}
            onClick={() => setSelectedVehicle(vehicle)}
            title={vehicle.vehiclePlate}
          />
        ))}

        {selectedVehicle && (
          <InfoWindow
            position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lon }}
            onCloseClick={() => setSelectedVehicle(null)}
          >
            <div className="p-3 max-w-xs bg-white dark:bg-gray-900 rounded-lg">
              {/* Vehicle Plate - Large and Clear */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white font-mono">
                    {selectedVehicle.vehiclePlate}
                  </h3>
                </div>
                <Badge 
                  className={`
                    ${selectedVehicle.vehicleStatus === 'IN_SERVICE' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                    ${selectedVehicle.vehicleStatus === 'AVAILABLE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
                    ${selectedVehicle.vehicleStatus === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                  `}
                >
                  {selectedVehicle.vehicleStatus}
                </Badge>
              </div>

              {/* Driver Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedVehicle.driverName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedVehicle.driverPhone}
                  </span>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span className="text-gray-500 dark:text-gray-400 block">Type</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedVehicle.vehicleType}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span className="text-gray-500 dark:text-gray-400 block">Speed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedVehicle.speedKph.toFixed(1)} km/h
                  </span>
                </div>
              </div>

              {/* Time and Location */}
              <div className="space-y-1 mb-3 text-xs">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(selectedVehicle.ts)} at {formatTime(selectedVehicle.ts)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span className="font-mono">
                    {selectedVehicle.lat.toFixed(6)}, {selectedVehicle.lon.toFixed(6)}
                  </span>
                </div>
              </div>

              {/* Google Maps Button */}
              <Button
                size="sm"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => openInGoogleMaps(
                  selectedVehicle.lat, 
                  selectedVehicle.lon, 
                  selectedVehicle.vehiclePlate
                )}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Vehicle Count Legend */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''} Live
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>In Service</span>
          <div className="w-3 h-3 rounded-full bg-blue-500 ml-2"></div>
          <span>Available</span>
        </div>
      </div>
    </div>
  );
}