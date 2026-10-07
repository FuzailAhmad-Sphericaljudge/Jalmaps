import {
  Activity,
  Bell,
  ClipboardList,
  Droplets,
  Gauge,
  Home,
  Map,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/server/auth";

export type NavigationItem = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  href: `/${string}`;
  allowedRoles: readonly UserRole[];
  order: number;
};

const allRoles = ["farmer", "village_admin", "official", "insurer", "admin"] as const;

export const navigationItems: readonly NavigationItem[] = [
  {
    id: "farmer-home",
    labelKey: "farmerHome",
    icon: Home,
    href: "/farmer",
    allowedRoles: ["farmer"],
    order: 0,
  },
  {
    id: "farmer-wells",
    labelKey: "farmerWells",
    icon: Droplets,
    href: "/farmer/wells",
    allowedRoles: ["farmer"],
    order: 1,
  },
  {
    id: "farmer-readings",
    labelKey: "readings",
    icon: Activity,
    href: "/farmer/readings",
    allowedRoles: ["farmer"],
    order: 2,
  },
  {
    id: "farmer-alerts",
    labelKey: "alerts",
    icon: Bell,
    href: "/farmer/alerts",
    allowedRoles: ["farmer"],
    order: 3,
  },
  {
    id: "farmer-reports",
    labelKey: "reports",
    icon: ClipboardList,
    href: "/farmer/reports",
    allowedRoles: ["farmer"],
    order: 4,
  },
  {
    id: "village-home",
    labelKey: "villageOverview",
    icon: Home,
    href: "/village",
    allowedRoles: ["village_admin"],
    order: 0,
  },
  {
    id: "village-wells",
    labelKey: "wells",
    icon: Droplets,
    href: "/village/wells",
    allowedRoles: ["village_admin"],
    order: 1,
  },
  {
    id: "village-map",
    labelKey: "map",
    icon: Map,
    href: "/village/map",
    allowedRoles: ["village_admin"],
    order: 2,
  },
  {
    id: "village-alerts",
    labelKey: "alerts",
    icon: Bell,
    href: "/village/alerts",
    allowedRoles: ["village_admin"],
    order: 3,
  },
  {
    id: "official-home",
    labelKey: "officialOverview",
    icon: Home,
    href: "/official",
    allowedRoles: ["official"],
    order: 0,
  },
  {
    id: "official-map",
    labelKey: "map",
    icon: Map,
    href: "/official/map",
    allowedRoles: ["official"],
    order: 1,
  },
  {
    id: "official-reports",
    labelKey: "reports",
    icon: ClipboardList,
    href: "/official/reports",
    allowedRoles: ["official"],
    order: 2,
  },
  {
    id: "official-alerts",
    labelKey: "alerts",
    icon: Bell,
    href: "/official/alerts",
    allowedRoles: ["official"],
    order: 3,
  },
  {
    id: "insurer-home",
    labelKey: "insurerOverview",
    icon: Home,
    href: "/insurer",
    allowedRoles: ["insurer"],
    order: 0,
  },
  {
    id: "insurer-reports",
    labelKey: "reports",
    icon: ClipboardList,
    href: "/insurer/reports",
    allowedRoles: ["insurer"],
    order: 1,
  },
  {
    id: "insurer-wells",
    labelKey: "wells",
    icon: Droplets,
    href: "/insurer/wells",
    allowedRoles: ["insurer"],
    order: 2,
  },
  {
    id: "admin-home",
    labelKey: "adminOverview",
    icon: Home,
    href: "/admin",
    allowedRoles: ["admin"],
    order: 0,
  },
  {
    id: "admin-users",
    labelKey: "users",
    icon: Users,
    href: "/admin/users",
    allowedRoles: ["admin"],
    order: 1,
  },
  {
    id: "admin-wells",
    labelKey: "wells",
    icon: Droplets,
    href: "/admin/wells",
    allowedRoles: ["admin"],
    order: 2,
  },
  {
    id: "admin-system",
    labelKey: "systemStatus",
    icon: Gauge,
    href: "/admin/system",
    allowedRoles: ["admin"],
    order: 3,
  },
  {
    id: "settings",
    labelKey: "settings",
    icon: Settings,
    href: "/app/settings",
    allowedRoles: allRoles,
    order: 90,
  },
  {
    id: "admin-security",
    labelKey: "security",
    icon: Shield,
    href: "/admin/security",
    allowedRoles: ["admin"],
    order: 91,
  },
];

export function getNavItems(role: UserRole): NavigationItem[] {
  return navigationItems
    .filter((item) => item.allowedRoles.includes(role))
    .sort((left, right) => left.order - right.order);
}
