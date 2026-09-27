import { create } from "zustand";
import {
  fetchBookings, createBooking, updateBooking, deleteBooking, importBookings,
  type BookingDto, type BookingFilters, type CreateBookingInput,
} from "@/api/bookingsApi";

interface BookingsState {
  items: BookingDto[];
  loading: boolean;
  error: string | null;
  load: (filters?: BookingFilters) => Promise<void>;
  add: (input: CreateBookingInput) => Promise<void>;
  edit: (id: string, input: Partial<CreateBookingInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  importAll: (items: BookingDto[]) => Promise<void>; // для импорта JSON — сохраняет на backend
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  load: async (filters) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchBookings(filters);
      set({ items: res.items, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  add: async (input) => {
    const created = await createBooking(input);
    set({ items: [...get().items, created] });
  },

  edit: async (id, input) => {
    const updated = await updateBooking(id, input);
    set({ items: get().items.map((b) => (b.id === id ? updated : b)) });
  },

  remove: async (id) => {
    await deleteBooking(id);
    set({ items: get().items.filter((b) => b.id !== id) });
  },

  importAll: async (items) => {
    await importBookings(items);
    await get().load();
  },
}));
