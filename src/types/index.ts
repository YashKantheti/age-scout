export type Screen = 'dashboard' | 'scanner' | 'part-details' | 'equipment' | 'cart' | 'notes';
export type NoteFilter = 'all' | 'hazard' | 'general' | 'pass-down';
export type NoteType = 'hazard' | 'general' | 'pass-down';

export interface AlternativePart {
  name: string;
  nsn: string;
  compatibility: string;
}

export interface TechnicalOrder {
  number: string;
  title: string;
  type: 'pdf' | 'warning';
}

export interface Part {
  partName: string;
  nsn: string;
  partNumber: string;
  cageCode: string;
  confidence: number;
  description: string;
  stockStatus: string;
  unitPrice: string;
  location: string;
  elmsNotes?: string;
  alternativeParts: AlternativePart[];
  technicalOrders: TechnicalOrder[];
  scannedAt?: string;
}

export interface CartItem {
  id: number;
  name: string;
  nsn: string;
  stockStatus: string;
  icon: string;
  qty: number;
}

export interface Note {
  id: number;
  type: NoteType;
  author: string;
  initials: string;
  unit: string;
  time: string;
  title: string;
  body: string;
  nsn: string;
  likes: number;
  comments: number;
  liked: boolean;
}
