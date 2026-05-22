import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCountdown(target: string) {
  const now = Date.now();
  const then = new Date(target).getTime();
  const diff = Math.max(then - now, 0);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return `${days}d ${hours}h remaining`;
}

export function shortenAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
