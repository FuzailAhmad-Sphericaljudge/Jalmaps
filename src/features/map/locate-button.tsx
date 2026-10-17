"use client";

import React, { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";

export interface LocateButtonProps {
  onLocationFound: (location: { lat: number; lng: number; accuracy: number }) => void;
  onError?: (errorMessage: string) => void;
  className?: string;
}

export function LocateButton({ onLocationFound, onError, className = "" }: LocateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLocate = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      onError?.("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const { latitude, longitude, accuracy } = pos.coords;
        onLocationFound({
          lat: latitude,
          lng: longitude,
          accuracy,
        });
      },
      (err) => {
        setLoading(false);
        let msg = "Unable to retrieve your location.";
        if (err.code === 1) {
          msg = "Location permission was denied.";
        } else if (err.code === 2) {
          msg = "Location information is unavailable.";
        } else if (err.code === 3) {
          msg = "Location request timed out.";
        }
        onError?.(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={loading}
      aria-label="Locate me on map"
      title="Locate me on map"
      className={`flex h-12 min-h-[48px] w-12 min-w-[48px] items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-md transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
      ) : (
        <Crosshair className="h-6 w-6 text-gray-700" aria-hidden="true" />
      )}
    </button>
  );
}
