import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AIRPORTS } from "../../core/data/airports";
import { Flight, SearchQuery } from "../../core/models/flight.models";
import { FlightApiService } from "../../core/services/flight-api.service";
import { FlightStateService } from "../../core/services/flight-state.service";
import {
  Filters,
  SortKey,
  TIME_BUCKETS,
  applyFilters,
} from "../../core/utils/flight-filters";
import { FlightCardComponent } from "../../shared/components/flight-card/flight-card";
import {
  formatPrice,
  formatShortDate,
  formatTime,
} from "../../core/utils/format";

type Step = "outbound" | "return";

@Component({
  selector: "app-results",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FlightCardComponent],
  template: `
    <div class="container mx-auto px-4 py-6">
      <!-- Page heading -->
      <div class="mb-6">
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">خانه</a></li>
            <li class="text-base-content/70">نتایج جستجو</li>
          </ul>
        </div>
        <h1
          class="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 flex-wrap"
        >
          @if (step() === 'outbound') {
            <span class="badge badge-primary badge-lg">بلیت رفت</span>
          } @else {
            <span class="badge badge-secondary badge-lg">بلیت برگشت</span>
          }
          <span>{{ fromCity() }} ← {{ toCity() }}</span>
        </h1>
        <p class="text-sm opacity-70 mt-1">
          {{ shortDate() }} · {{ q().passengers }} مسافر ·
          {{ q().cabinClass }}
        </p>
      </div>

      <!-- Round-trip banner -->
      @if (step() === 'return' && selectedOutbound(); as outbound) {
        <div
          class="alert alert-info shadow-lg mb-6 flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <div class="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M21.5 15.5c.3-1.2-.4-2.4-1.6-2.7l-5.2-1.3L9.8 4.5c-.5-.7-1.4-1-2.2-.8l.9 2.5-1.2 1.3-1.8-.5c-.4-.1-.9 0-1.2.3l.5 1.2 1 1.8 4.2 4.2-4.6 1.5-2-1.2c-.5-.3-1.1-.2-1.5.2l.6 1.1 1.3 2.3c.3.6.9.9 1.5.9h.3l3.4-.7 2.6 2.6c.6.6 1.5.8 2.3.5l-1-1.7 1.1-1.4 2 .4c.6.1 1.2-.2 1.5-.7l.4-.9-.6-1.2z"
              />
            </svg>
            <div>
              <div class="font-bold">بلیت رفت انتخاب شد</div>
              <div class="text-sm opacity-80">
                {{ outbound.airline }} {{ outbound.flightNumber }} ·
                {{ fromCity() }} ← {{ toCity() }} ·
                <span dir="ltr">{{ formatTime(outbound.departure) }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-ghost" (click)="changeOutbound()">
              تغییر بلیت رفت
            </button>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <!-- Filters sidebar -->
        <aside
          class="card bg-base-100 border border-base-300 shadow-sm lg:sticky lg:top-24"
        >
          <div class="card-body gap-5">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-base">فیلترها</h2>
              <button class="btn btn-ghost btn-xs" (click)="resetFilters()">
                حذف فیلترها
              </button>
            </div>

            <!-- Price -->
            @if (priceCap() > 0) {
              <div>
                <div class="label py-0 pb-1">
                  <span class="label-text font-bold text-sm">حداکثر قیمت</span>
                </div>
                <input
                  type="range"
                  class="range range-primary range-xs w-full"
                  min="0"
                  [max]="priceCap()"
                  step="100000"
                  [value]="filters().maxPrice"
                  (input)="setMaxPrice($any($event.target).value)"
                />
                <div class="flex justify-between text-xs opacity-70 mt-1">
                  <span>۰</span>
                  <span class="font-bold text-primary">
                    {{ formatPrice(filters().maxPrice) }} تومان
                  </span>
                </div>
              </div>
            }

            <!-- Airlines -->
            @if (airlines().length > 0) {
              <div>
                <div class="label py-0 pb-2">
                  <span class="label-text font-bold text-sm">ایرلاین</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  @for (name of airlines(); track name) {
                    <label
                      class="label cursor-pointer justify-start gap-2 py-0.5"
                    >
                      <input
                        type="checkbox"
                        class="checkbox checkbox-primary checkbox-xs"
                        [checked]="filters().airlines.includes(name)"
                        (change)="toggleAirline(name)"
                      />
                      <span class="label-text text-sm">{{ name }}</span>
                    </label>
                  }
                </div>
              </div>
            }

            <!-- Stops -->
            <div>
              <div class="label py-0 pb-2">
                <span class="label-text font-bold text-sm">توقف</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="label cursor-pointer justify-start gap-2 py-0.5">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary checkbox-xs"
                    [checked]="filters().stops.includes('0')"
                    (change)="toggleStops('0')"
                  />
                  <span class="label-text text-sm">بدون توقف</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2 py-0.5">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary checkbox-xs"
                    [checked]="filters().stops.includes('1')"
                    (change)="toggleStops('1')"
                  />
                  <span class="label-text text-sm">یک توقف</span>
                </label>
              </div>
            </div>

            <!-- Time of day -->
            <div>
              <div class="label py-0 pb-2">
                <span class="label-text font-bold text-sm">زمان پرواز</span>
              </div>
              <div class="flex flex-wrap gap-2">
                @for (b of timeBuckets; track b.key) {
                  <button
                    type="button"
                    class="btn btn-xs"
                    [class.btn-primary]="filters().timeOfDay.includes(b.key)"
                    (click)="toggleTime(b.key)"
                  >
                    {{ b.label }}
                  </button>
                }
              </div>
            </div>
          </div>
        </aside>

        <!-- Results -->
        <main>
          <!-- Sort + count -->
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="text-sm opacity-80">
              @if (loading()) {
                در حال جستجو…
              } @else {
                {{ filtered().length }} پرواز یافت شد
              }
            </div>
            <div class="join">
              @for (s of sortOptions; track s.key) {
                <button
                  class="btn btn-sm join-item"
                  [class.btn-active]="sort() === s.key"
                  (click)="sort.set(s.key)"
                >
                  {{ s.label }}
                </button>
              }
            </div>
          </div>

          <!-- Skeletons -->
          @if (loading()) {
            <div class="flex flex-col gap-4">
              @for (i of [1, 2, 3]; track i) {
                <div
                  class="card bg-base-100 border border-base-300 shadow-sm p-5 animate-pulse"
                >
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-full bg-base-300"></div>
                    <div class="flex-1">
                      <div class="h-4 w-32 bg-base-300 rounded mb-1.5"></div>
                      <div class="h-3 w-20 bg-base-300 rounded"></div>
                    </div>
                    <div class="h-4 w-24 bg-base-300 rounded"></div>
                  </div>
                  <div class="flex justify-between items-center">
                    <div class="h-8 w-16 bg-base-300 rounded"></div>
                    <div class="h-4 w-40 bg-base-300 rounded"></div>
                    <div class="h-8 w-16 bg-base-300 rounded"></div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Flight list -->
          @if (!loading()) {
            <div class="flex flex-col gap-4">
              @if (filtered().length > 0) {
                @for (flight of filtered(); track flight.id) {
                  <app-flight-card
                    [flight]="flight"
                    [actionLabel]="
                      step() === 'return' ? 'انتخاب برگشت' : 'انتخاب رفت'
                    "
                    (select)="onSelect($event)"
                  />
                }
              } @else {
                <div class="card bg-base-100 border border-base-300 shadow-sm">
                  <div class="card-body items-center text-center py-12">
                    <div class="text-6xl mb-3">🛫</div>
                    <h3 class="card-title">پروازی با این شرایط پیدا نشد</h3>
                    <p class="text-sm opacity-70 max-w-md">
                      فیلترها را تغییر دهید یا تاریخ دیگری را امتحان کنید.
                    </p>
                    <button
                      class="btn btn-primary btn-sm mt-3"
                      (click)="resetFilters()"
                    >
                      حذف فیلترها
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </main>
      </div>
    </div>
  `,
})
export class ResultsPage {
  private readonly router = inject(Router);
  private readonly api = inject(FlightApiService);
  private readonly state = inject(FlightStateService);

  readonly timeBuckets = TIME_BUCKETS;
  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: "cheapest", label: "ارزان‌ترین" },
    { key: "fastest", label: "سریع‌ترین" },
    { key: "earliest", label: "زودترین" },
  ];

  readonly query = this.state.query;
  readonly selectedOutbound = this.state.selectedOutbound;

  readonly step = signal<Step>("outbound");
  readonly loading = signal(true);
  readonly flights = signal<Flight[]>([]);
  readonly filters = signal<Filters>({
    airlines: [],
    stops: [],
    maxPrice: Number.MAX_SAFE_INTEGER,
    timeOfDay: [],
  });
  readonly sort = signal<SortKey>("cheapest");

  /** Fallback query when the user lands here directly without a search */
  readonly q = computed<SearchQuery>(
    () =>
      this.query() ?? {
        from: "THR",
        to: "MHD",
        date: "",
        passengers: 1,
        cabinClass: "اکونومی",
        roundTrip: false,
      }
  );

  readonly fromCity = computed(
    () => AIRPORTS.find((a) => a.code === this.q().from)?.city ?? this.q().from
  );
  readonly toCity = computed(
    () => AIRPORTS.find((a) => a.code === this.q().to)?.city ?? this.q().to
  );
  readonly shortDate = computed(() =>
    formatShortDate(this.step() === "outbound" ? this.q().date : this.q().returnDate ?? "")
  );

  readonly airlines = computed(() =>
    [...new Set(this.flights().map((f) => f.airline))].sort((a, b) =>
      a.localeCompare(b, "fa")
    )
  );

  readonly priceCap = computed(() =>
    Math.max(0, ...this.flights().map((f) => f.price))
  );

  readonly filtered = computed(() =>
    applyFilters(this.flights(), this.filters(), this.sort())
  );

  private fetchToken = 0;

  constructor() {
    // Redirect home when there is no active query
    effect(() => {
      if (!this.query()) {
        this.router.navigate(["/"]);
      }
    });

    // Fetch flights for the current step/query
    effect(() => {
      const query = this.query();
      if (!query) return;
      const step = this.step();
      const legQuery =
        step === "outbound"
          ? { from: query.from, to: query.to, date: query.date }
          : {
              from: query.to,
              to: query.from,
              date: query.returnDate ?? "",
            };

      const token = ++this.fetchToken;
      this.loading.set(true);
      firstValueFrom(
        this.api.searchFlights({ ...legQuery, cabinClass: query.cabinClass })
      )
        .then((res) => {
          if (token === this.fetchToken) this.flights.set(res.data.outbound);
        })
        .catch(() => {
          if (token === this.fetchToken) this.flights.set([]);
        })
        .finally(() => {
          if (token === this.fetchToken) this.loading.set(false);
        });
    });

    // Keep maxPrice in sync with actual data
    effect(() => {
      const cap = this.priceCap();
      if (cap > 0) {
        this.filters.update((f) =>
          f.maxPrice === 0 || f.maxPrice > cap ? { ...f, maxPrice: cap } : f
        );
      }
    });
  }

  setMaxPrice(v: string | number): void {
    this.filters.update((f) => ({ ...f, maxPrice: Number(v) }));
  }

  toggleIn(list: string[], item: string): string[] {
    return list.includes(item)
      ? list.filter((x) => x !== item)
      : [...list, item];
  }

  toggleAirline(name: string): void {
    this.filters.update((f) => ({ ...f, airlines: this.toggleIn(f.airlines, name) }));
  }

  toggleStops(stops: string): void {
    this.filters.update((f) => ({ ...f, stops: this.toggleIn(f.stops, stops) }));
  }

  toggleTime(key: string): void {
    this.filters.update((f) => ({
      ...f,
      timeOfDay: this.toggleIn(f.timeOfDay, key),
    }));
  }

  resetFilters(): void {
    this.filters.set({
      airlines: [],
      stops: [],
      maxPrice: Number.MAX_SAFE_INTEGER,
      timeOfDay: [],
    });
  }

  onSelect(flight: Flight): void {
    this.state.selectFlight(flight);
    if (this.step() === "outbound" && this.q().roundTrip && this.q().returnDate) {
      this.step.set("return");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      this.router.navigate(["/booking", flight.id]);
    }
  }

  changeOutbound(): void {
    this.state.resetSelection();
    this.step.set("outbound");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  readonly formatPrice = formatPrice;
  readonly formatTime = formatTime;
}
