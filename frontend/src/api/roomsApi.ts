import { http } from "./http";

export type RoomStatus = "available" | "booked" | "maintenance";
/** Статусы, которые можно выставить вручную ("booked" вычисляется автоматически по броням) */
export type RoomManualStatus = "available" | "maintenance";

export interface RoomDto {
  id: string;
  code: string;
  name: string;
  capacity: number;
  equipment: string[];
  status: RoomStatus;
}

export interface RoomsResponseDto {
  items: RoomDto[];
  page: number;
  total: number;
}

export interface RoomInput {
  code: string;
  name: string;
  capacity: number;
  equipment: string[];
  status: RoomManualStatus;
}

export async function fetchRooms(page = 1): Promise<RoomsResponseDto> {
  const { data } = await http.get<RoomsResponseDto>("/rooms", { params: { page } });
  return data;
}

export async function createRoom(input: RoomInput): Promise<RoomDto> {
  const { data } = await http.post<RoomDto>("/rooms", input);
  return data;
}

export async function updateRoom(id: string, input: Partial<RoomInput>): Promise<RoomDto> {
  const { data } = await http.put<RoomDto>(`/rooms/${encodeURIComponent(id)}`, input);
  return data;
}

/** force=true — удалить аудиторию вместе с её бронями */
export async function deleteRoom(id: string, force = false): Promise<void> {
  await http.delete(`/rooms/${encodeURIComponent(id)}`, { params: force ? { force: "true" } : undefined });
}
