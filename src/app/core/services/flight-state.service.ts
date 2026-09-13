import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AIRPORTS } from "../data/airports";
import {
  Airport,
  Booking,
  Flight,
  Passenger,
  SearchQuery,
} from "../models/flight.models";
import { FlightApiService } from "./flight-api.service";

/**
 * Signal-based replacement for the three zustand stores:
 * - useFlightStore  → airports + fetchAirports()
 * - useSearchStore  → query + setQuery()
 * - useBookingStore → selectedFlights / booking / confirm / getBooking
 */
@Injectable({ providedIn: "root" })
export class FlightStateService {
  private readonly api = inject(FlightApiService);

  // ── Flight store ────────────────────────────────────────────
  readonly airports = signal<Airport[]>([...AIRPORTS]);

  async fetchAirports(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getAirports());
      const merged = [...AIRPORTS];
      for (const a of res.data) {
        if (!merged.some((m) => m.code === a.code)) merged.push(a);
      }
      this.airports.set(merged);
    } catch {
      // keep bundled list on failure
    }
  }

  // ── Search store ────────────────────────────────────────────
  readonly query = signal<SearchQuery | null>(null);

  setQuery(q: SearchQuery): void {
    this.query.set({ ...q });
  }

  // ── Booking store ───────────────────────────────────────────
  readonly selectedFlights = signal<Flight[]>([]);
  readonly booking = signal<Booking | null>(null);
  readonly selectedOutbound = computed(
    () => this.selectedFlights()[0] ?? null
  );

  selectFlight(flight: Flight): void {
    const current = this.selectedFlights();
    if (current.some((f) => f.id === flight.id)) return;
    this.selectedFlights.set([...current, flight]);
  }

  resetSelection(): void {
    this.selectedFlights.set([]);
  }

  async confirm(
    flights: Flight[],
    passengers: Passenger[]
  ): Promise<Booking> {
    const body = {
      flights: flights.map((f) => ({ id: f.id, price: f.price })),
      passengers: passengers.map((p) => ({ ...p })),
    };
    const res = await firstValueFrom(this.api.createBooking(body));
    const booking: Booking = {
      ref: res.data.ref,
      flights,
      passengers,
      total: res.data.total,
      createdAt: res.data.createdAt ?? new Date().toISOString(),
    };
    this.booking.set(booking);
    this.selectedFlights.set([]);
    return booking;
  }

  async getBooking(ref: string): Promise<Booking> {
    const res = await firstValueFrom(this.api.getBooking(ref));
    const b = res.data;
    return {
      ...b,
      createdAt: b.createdAt ?? b.created_at ?? new Date().toISOString(),
    };
  }
}
