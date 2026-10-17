"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Droplets, HelpCircle } from "lucide-react";
import type { WellStatusType } from "@/server/map/types";

export function getStatusColor(status: WellStatusType): string {
  switch (status) {
    case "critical":
      return "#dc2626"; // red-600
    case "warning":
      return "#f59e0b"; // amber-500
    case "normal":
      return "#059669"; // emerald-600
    case "unknown":
    default:
      return "#64748b"; // slate-500
  }
}

export function getStatusShape(status: WellStatusType): string {
  switch (status) {
    case "critical":
      return "[clip-path:polygon(30%_0%,70%_0%,100%_30%,100%_70%,70%_100%,30%_100%,0%_70%,0%_30%)]";
    case "warning":
      return "[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]";
    case "normal":
      return "rounded-full";
    case "unknown":
    default:
      return "rounded-md";
  }
}

export interface MapMarkerProps {
  status: WellStatusType;
  isCluster?: boolean;
  count?: number;
  isSelected?: boolean;
  isOwned?: boolean;
  name?: string;
  onClick?: () => void;
}

export function MapMarker({
  status,
  isCluster,
  count,
  isSelected,
  isOwned,
  name,
  onClick,
}: MapMarkerProps) {
  if (isCluster) {
    const clusterColor =
      status === "critical"
        ? "bg-red-600 border-red-700 text-white"
        : status === "warning"
          ? "bg-amber-500 border-amber-600 text-white"
          : status === "normal"
            ? "bg-emerald-600 border-emerald-700 text-white"
            : "bg-slate-600 border-slate-700 text-white";

    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Cluster of ${count || 0} wells, worst status ${status}`}
        className={`flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-full border-4 shadow-lg transition-transform hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none ${clusterColor} ${
          isSelected ? "scale-110 ring-4 ring-blue-500" : ""
        }`}
      >
        <span className="text-sm font-bold tracking-tight">{count}</span>
      </button>
    );
  }

  // Individual markers: different shape + color + icon
  switch (status) {
    case "critical":
      // Hexagon / Octagon-like shape (cut corners) with Red
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Well: ${name || "Well"}, status critical`}
          className={`flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center border-2 border-red-800 bg-red-600 text-white shadow-md transition-transform [clip-path:polygon(30%_0%,70%_0%,100%_30%,100%_70%,70%_100%,30%_100%,0%_70%,0%_30%)] hover:scale-110 focus:ring-2 focus:ring-red-400 focus:outline-none ${
            isSelected ? "scale-125 ring-2 ring-black" : ""
          } ${isOwned ? "ring-2 ring-blue-400" : ""}`}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </button>
      );

    case "warning":
      // Diamond shape with Amber
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Well: ${name || "Well"}, status warning`}
          className={`flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center border-2 border-amber-800 bg-amber-500 text-white shadow-md transition-transform [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)] hover:scale-110 focus:ring-2 focus:ring-amber-400 focus:outline-none ${
            isSelected ? "scale-125 ring-2 ring-black" : ""
          } ${isOwned ? "ring-2 ring-blue-400" : ""}`}
        >
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      );

    case "normal":
      // Circle shape with Emerald
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Well: ${name || "Well"}, status normal`}
          className={`flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-full border-2 border-emerald-800 bg-emerald-600 text-white shadow-md transition-transform hover:scale-110 focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
            isSelected ? "scale-125 ring-2 ring-black" : ""
          } ${isOwned ? "ring-2 ring-blue-400" : ""}`}
        >
          <Droplets className="h-5 w-5" aria-hidden="true" />
        </button>
      );

    case "unknown":
    default:
      // Square shape with Slate
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Well: ${name || "Well"}, status unknown`}
          className={`flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-md border-2 border-slate-700 bg-slate-500 text-white shadow-md transition-transform hover:scale-110 focus:ring-2 focus:ring-slate-400 focus:outline-none ${
            isSelected ? "scale-125 ring-2 ring-black" : ""
          } ${isOwned ? "ring-2 ring-blue-400" : ""}`}
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      );
  }
}
