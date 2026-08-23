export interface InventoryItem {
  _id: string;
  itemName: string;
  category: string;
  description?: string;
  stockCount: number;
  unitPrice: number;
  createdAt: string;
}

export interface UserProfile {
  name: string,
  businessCategory: string,
  preferredLanguage: string,
  region: string,
}