// Модель данных — по Task_1.pdf, раздел "Модель данных"

export type RoomStatus = "available" | "booked" | "maintenance";

export interface Room {
  id: string;
  code: string;
  name: string;
  capacity: number;
  equipment: string[]; // "features[]" из Task_1.pdf
  status: RoomStatus;
}

export type AssetStatus = "available" | "in_use" | "maintenance";

export interface Asset {
  id: string;
  name: string;
  inventoryCode: string; // "inventoryCode/serial" из Task_1.pdf
  status: AssetStatus;
}

export type ResourceType = "room" | "asset";

export interface Booking {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  title: string;
  start: string; // ISO-8601 / RFC 3339, UTC
  end: string;   // ISO-8601 / RFC 3339, UTC
  notes?: string;
}
