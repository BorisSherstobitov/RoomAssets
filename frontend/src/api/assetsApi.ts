import { http } from "./http";

export type AssetStatus = "available" | "in_use" | "maintenance";
/** Статусы, которые можно выставить вручную ("in_use" вычисляется автоматически по броням) */
export type AssetManualStatus = "available" | "maintenance";

export interface AssetDto {
  id: string;
  name: string;
  inventoryCode: string;
  status: AssetStatus;
}

export interface AssetsResponseDto {
  items: AssetDto[];
  page: number;
  total: number;
}

export interface AssetInput {
  inventoryCode: string;
  name: string;
  status: AssetManualStatus;
}

/** Запись оборудования в файле импорта (id необязателен, статус приводится backend-ом) */
export interface AssetImportItem {
  id?: string;
  inventoryCode: string;
  name: string;
  status?: string;
}

export async function fetchAssets(page = 1): Promise<AssetsResponseDto> {
  const { data } = await http.get<AssetsResponseDto>("/assets", { params: { page } });
  return data;
}

export async function createAsset(input: AssetInput): Promise<AssetDto> {
  const { data } = await http.post<AssetDto>("/assets", input);
  return data;
}

export async function updateAsset(id: string, input: Partial<AssetInput>): Promise<AssetDto> {
  const { data } = await http.put<AssetDto>(`/assets/${encodeURIComponent(id)}`, input);
  return data;
}

/** force=true — удалить оборудование вместе с его бронями */
export async function deleteAsset(id: string, force = false): Promise<void> {
  await http.delete(`/assets/${encodeURIComponent(id)}`, { params: force ? { force: "true" } : undefined });
}

/** Полная замена таблицы инвентаря данными из файла. Отсутствующее в файле оборудование удаляется вместе с бронями */
export async function importAssets(assets: AssetImportItem[]): Promise<{ imported: number; removed: number }> {
  const { data } = await http.post<{ imported: number; removed: number }>("/assets/import", { assets });
  return data;
}