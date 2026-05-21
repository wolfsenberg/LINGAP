import type { User } from "@/types";

export function getFirstName(name?: string | null) {
  const cleanName = name?.trim();
  return cleanName ? cleanName.split(/\s+/)[0] : "Donor";
}

export function getUserInitials(user?: User | null) {
  const parts = user?.name.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "U";
  return `${parts[0][0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}
