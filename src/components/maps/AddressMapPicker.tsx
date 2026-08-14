"use client";

import { useCallback, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";

type LatLng = { lat: number; lng: number };

type AddressParts = {
  label?: string;
  line1?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type Props = {
  value: LatLng | null;
  onChange: (location: LatLng, addressParts?: AddressParts) => void;
};

const DEFAULT_CENTER: LatLng = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad
const LIBRARIES: "places"[] = ["places"];

// Maps Google's address component types onto our form fields:
//  - label (Society / Building Name)  <- premise, e.g. "Shreeji Residency"
//  - line1 (Area / Street)            <- route, e.g. "Ashram Road"
//  - landmark                         <- the named locality/neighbourhood,
//    since that's what people in India actually use as a landmark
//    reference ("near Navrangpura") — falls back to a finer-grained
//    sublocality if the same value would otherwise duplicate line1.
function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  fallbackName?: string
): AddressParts {
  const byType: Record<string, string> = {};
  for (const comp of components ?? []) {
    for (const type of comp.types) {
      if (!byType[type]) byType[type] = comp.long_name;
    }
  }

  const route = byType.route;
  const sublocality1 = byType.sublocality_level_1 ?? byType.sublocality ?? byType.neighborhood;
  const sublocality2 = byType.sublocality_level_2;

  const line1 = route ?? sublocality1;
  const landmark = line1 === sublocality1 ? sublocality2 : sublocality1;

  return {
    label: byType.premise ?? fallbackName,
    line1,
    landmark,
    city: byType.locality,
    state: byType.administrative_area_level_1,
    pincode: byType.postal_code,
  };
}

export default function AddressMapPicker({ value, onChange }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries: LIBRARIES,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [center, setCenter] = useState<LatLng>(value ?? DEFAULT_CENTER);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    setCenter(location);
    onChange(location, parseAddressComponents(place.address_components, place.name));
  }, [onChange]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const location = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setCenter(location);
      onChange(location);

      // Tapping/dragging a pin doesn't come with place data the way a
      // search result does — reverse-geocode so those fields still get
      // auto-filled from the pinned location.
      if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
      geocoderRef.current.geocode({ location }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          onChange(location, parseAddressComponents(results[0].address_components));
        }
      });
    },
    [onChange]
  );

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-dashed border-sand bg-sand/20 p-4 text-sm text-ink/60">
        Map picker needs a Google Maps API key. Add{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        to your <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">.env</code>{" "}
        file to enable it. You can still fill the address fields manually below.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-sand bg-sand/10 text-sm text-ink/50">
        Loading map…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Autocomplete
        onLoad={(ac) => (autocompleteRef.current = ac)}
        onPlaceChanged={handlePlaceChanged}
        options={{ componentRestrictions: { country: "in" } }}
      >
        <input
          type="text"
          placeholder="Search for your address"
          className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
        />
      </Autocomplete>
      <div className="overflow-hidden rounded-lg border border-sand">
        <GoogleMap
          center={center}
          zoom={value ? 16 : 12}
          mapContainerStyle={{ width: "100%", height: "260px" }}
          onClick={handleMapClick}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          {value && <Marker position={value} draggable onDragEnd={handleMapClick} />}
        </GoogleMap>
      </div>
      <p className="text-xs text-ink/50">
        Search above, or tap the map to drop a pin. Drag the pin to fine-tune. We&apos;ll
        fill in the address details below — you can edit anything before saving.
      </p>
    </div>
  );
}
