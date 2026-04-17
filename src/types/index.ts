export type Screen = 'dashboard' | 'scanner' | 'part-details' | 'equipment' | 'cart' | 'notes' | 'chat';
export type NoteFilter = 'all' | 'hazard' | 'general' | 'pass-down';
export type OperationMode = 'military' | 'civilian';
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
  verified: boolean;
}

export interface EquipmentOption {
  name: string;
  role: string;
}

export interface IpbReference {
  toNumber: string;
  figure: string;
  item: string;
  title: string;
}

export interface Part {
  partName: string;
  nsn: string;
  modelNumber: string;
  cageCode: string;
  confidence: number;
  description: string;
  stockStatus: string;
  unitPrice: string;
  location: string;
  elmsNotes?: string;
  ipbReference?: IpbReference;
  confirmedFromImage: string[];
  dataWarnings?: string[];
  alternativeParts: AlternativePart[];
  technicalOrders: TechnicalOrder[];
  possibleEquipment?: EquipmentOption[];
  parentAssembly?: string;
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

export interface ResourceLink {
  label: string;
  url: string;
  type: 'manual' | 'purchase' | 'reference';
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  links?: ResourceLink[];
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
