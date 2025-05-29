import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
