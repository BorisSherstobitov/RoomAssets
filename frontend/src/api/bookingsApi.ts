import { http } from "./http";

export type ResourceType = "room" | "asset";

export interface BookingDto {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  title: string;
  start: string; // ISO-8601 / RFC 3339, UTC
  end: string;   // ISO-8601 / RFC 3339, UTC
  notes?: string;
}

export interface BookingsResponseDto {
  items: BookingDto[];
  page: number;
  total: number;
}

export interface BookingFilters {
  q?: string;           // поиск по названию/примечанию
  date?: string;         // YYYY-MM-DD (сутки по UTC; для локальных суток используйте from/to)
  from?: string;         // ISO: брони, пересекающие период [from, to)
  to?: string;           // ISO, не включительно
  resourceType?: ResourceType;
  resourceId?: string;
  page?: number;
}

export async function fetchBookings(filters: BookingFilters = {}): Promise<BookingsResponseDto> {
  const { data } = await http.get<BookingsResponseDto>("/bookings", { params: filters });
  return data;
}

export type CreateBookingInput = Omit<BookingDto, "id">;

export async function createBooking(input: CreateBookingInput): Promise<BookingDto> {
  const { data } = await http.post<BookingDto>("/bookings", input);
  return data;
}

export async function updateBooking(id: string, input: Partial<CreateBookingInput>): Promise<BookingDto> {
  const { data } = await http.put<BookingDto>(`/bookings/${id}`, input);
  return data;
}

export async function deleteBooking(id: string): Promise<void> {
  await http.delete(`/bookings/${id}`);
}

export async function importBookings(bookings: BookingDto[]): Promise<{ imported: number }> {
  const { data } = await http.post<{ imported: number }>("/bookings/import", { bookings });
  return data;
}
