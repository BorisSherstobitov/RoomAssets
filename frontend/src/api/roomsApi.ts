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

/** Запись аудитории в файле импорта (id необязателен, статус приводится backend-ом) */
export interface RoomImportItem {
  id?: string;
  code: string;
  name: string;
  capacity: number;
  equipment?: string[];
  status?: string;
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

/** Полная замена таблицы аудиторий данными из файла. Отсутствующие в файле аудитории удаляются вместе с бронями */
export async function importRooms(rooms: RoomImportItem[]): Promise<{ imported: number; removed: number }> {
  const { data } = await http.post<{ imported: number; removed: number }>("/rooms/import", { rooms });
  return data;
}