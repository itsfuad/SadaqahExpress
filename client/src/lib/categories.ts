export interface Category {
  id: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { id: "all", label: "All Products" },
  { id: "microsoft", label: "Microsoft" },
  { id: "ai", label: "AI Tools" },
  { id: "antivirus", label: "Anti Virus" },
  { id: "vpn", label: "VPN" },
  { id: "streaming", label: "Streaming" },
  { id: "educational", label: "Educational" },
  { id: "editing", label: "Editing" },
  { id: "music", label: "Music" },
  { id: "utilities", label: "Utilities" },
];

// Get categories without "All Products" (for product management)
export const PRODUCT_CATEGORIES = CATEGORIES.filter(cat => cat.id !== "all");

// Get category label by id
export function getCategoryLabel(id: string): string {
  return CATEGORIES.find(cat => cat.id === id)?.label || id;
}
