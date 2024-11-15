"use client";

import { useEffect, useState } from "react";
import Map, { Marker } from "react-map-gl";
import { MapPin } from "lucide-react";

export default function MapComponent() {
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 11
  });

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken="YOUR_MAPBOX_TOKEN"
      style={{ width: "100%", height: "100%" }}
    >
      <Marker longitude={-122.4} latitude={37.8}>
        <MapPin className="h-6 w-6 text-primary -translate-x-1/2 -translate-y-1/2" />
      </Marker>
    </Map>
  );
}