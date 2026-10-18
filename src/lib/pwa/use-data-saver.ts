"use client";

import { useEffect, useState } from "react";

interface NetworkInformation extends EventTarget {
  readonly saveData: boolean;
  readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  addEventListener(type: "change", listener: EventListener): void;
  removeEventListener(type: "change", listener: EventListener): void;
}

interface NavigatorWithConnection extends Navigator {
  readonly connection?: NetworkInformation;
}

export function useDataSaver() {
  const [saveData, setSaveData] = useState(() => {
    if (typeof window !== "undefined") {
      const userPref = localStorage.getItem("jalmaps-data-saver");
      if (userPref !== null) {
        return userPref === "true";
      }

      if (typeof navigator !== "undefined" && "connection" in navigator) {
        const conn = (navigator as NavigatorWithConnection).connection;
        if (conn?.saveData) return true;
        if (conn && ["slow-2g", "2g", "3g"].includes(conn.effectiveType)) {
          return true;
        }
      }
    }
    return false;
  });

  useEffect(() => {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as NavigatorWithConnection).connection;
      if (!conn) return;

      const handleChange = () => {
        const userPref = localStorage.getItem("jalmaps-data-saver");
        if (userPref !== null) return; // User pref overrides dynamic

        if (conn.saveData) {
          setSaveData(true);
        } else if (["slow-2g", "2g", "3g"].includes(conn.effectiveType)) {
          setSaveData(true);
        } else {
          setSaveData(false);
        }
      };

      conn.addEventListener("change", handleChange);
      return () => conn.removeEventListener("change", handleChange);
    }
  }, []);

  return saveData;
}
