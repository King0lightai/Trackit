export interface Project {
  id: string;
  name: string;
  description?: string;
  dateCreated: string;
  totalItems: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  url?: string;
  image?: string;
  category?: string;
  price?: string;
  leadTime?: string;
  deliveryDate?: string;
  notes?: string;
  dateAdded: string;
  source?: {
    title: string;
    url: string;
    favicon?: string;
  };
}

export interface Settings {
  defaultProjectId?: string;
  notifyDeliveryReminders: boolean;
  daysBeforeDeliveryReminder: number;
  autoDetectProductInfo: boolean;
}

export interface AppState {
  projects: Project[];
  projectProducts: Record<string, Product[]>;
  settings: Settings;
}