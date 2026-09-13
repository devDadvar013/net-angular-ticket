import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { Booking, Flight, Passenger } from "../models/flight.models";

export interface AirportsResponse {
  data: { code: string; city: string; name: string }[];
}

export interface SearchResponse {
  data: {
    outbound: Flight[];
    return: Flight[] | null;
  };
}

export interface BookingResponse {
  data: Booking & { created_at?: string };
}

export interface PostBookingBody {
  flights: { id: string; price: number }[];
  passengers: Passenger[];
}

@Injectable({ providedIn: "root" })
export class FlightApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getAirports(): Observable<AirportsResponse> {
    return this.http.get<AirportsResponse>(`${this.baseUrl}/airports`, {
      headers: { Accept: "application/json" },
    });
  }

  searchFlights(params: {
    from: string;
    to: string;
    date: string;
    cabinClass: string;
  }): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.baseUrl}/flights/search`, {
      params: { ...params },
      headers: { Accept: "application/json" },
    });
  }

  createBooking(body: PostBookingBody): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/bookings`, body, {
      headers: { "Content-Type": "application/json" },
    });
  }

  getBooking(ref: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/bookings/${ref}`, {
      headers: { Accept: "application/json" },
    });
  }
}
