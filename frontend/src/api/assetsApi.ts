import { http } from "./http";

export type AssetStatus = "available" | "in_use" | "maintenance";

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

export async function fetchAssets(page = 1): Promise<AssetsResponseDto> {
  const { data } = await http.get<AssetsResponseDto>("/assets", { params: { page } });
  return data;
}
