import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CabinClass, SearchQuery } from "../../../core/models/flight.models";
import { FlightStateService } from "../../../core/services/flight-state.service";
import {
  DropdownComponent,
  DropdownOption,
} from "../dropdown/dropdown";
import {
  PersianDatePickerComponent,
} from "../persian-date-picker/persian-date-picker";

function dateToIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function isoToDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

@Component({
  selector: "app-search-form",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DropdownComponent, PersianDatePickerComponent],
  template: `
    <form
      (submit)="submit($event)"
      class="card bg-base-100 text-base-content shadow-xl border border-base-300"
    >
      <div class="card-body gap-4 p-5 sm:p-6">
        <!-- Trip type + cabin -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="join">
            <button
              type="button"
              class="btn btn-sm join-item"
              [class.btn-active]="tripType() === 'roundtrip'"
              (click)="tripType.set('roundtrip')"
            >
              رفت و برگشت
            </button>
            <button
              type="button"
              class="btn btn-sm join-item"
              [class.btn-active]="tripType() === 'oneway'"
              (click)="tripType.set('oneway')"
            >
              یک‌طرفه
            </button>
          </div>
          <label class="label cursor-pointer gap-2 text-sm">
            <span>کابین:</span>
            <div class="w-32">
              <app-dropdown
                [options]="cabinOptions"
                [value]="cabinClass()"
                (valueChange)="cabinClass.set($any($event))"
              />
            </div>
          </label>
        </div>

        <!-- Route -->
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <label class="form-control w-full">
            <div class="label py-0 pb-1">
              <span class="label-text text-sm">مبدا</span>
            </div>
            <app-dropdown
              [options]="airportOptions()"
              [value]="from()"
              (valueChange)="from.set($any($event))"
              placeholder="مبدا را انتخاب کنید"
            />
          </label>

          <button
            type="button"
            class="btn btn-circle btn-outline btn-primary self-center"
            (click)="swapCities()"
            title="جابه‌جایی مبدا و مقصد"
            aria-label="جابه‌جایی مبدا و مقصد"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="m16 21 4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
          </button>

          <label class="form-control w-full">
            <div class="label py-0 pb-1">
              <span class="label-text text-sm">مقصد</span>
            </div>
            <app-dropdown
              [options]="airportOptions()"
              [value]="to()"
              (valueChange)="to.set($any($event))"
              placeholder="مقصد را انتخاب کنید"
            />
          </label>
        </div>

        <!-- Dates + passengers -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="form-control w-full">
            <div class="label py-0 pb-1">
              <span class="label-text text-sm">تاریخ رفت</span>
            </div>
            <app-persian-date-picker
              [value]="departureDate()"
              (valueChange)="departureDate.set($event)"
              [minDate]="today"
              placeholder="تاریخ رفت"
            />
          </div>

          @if (tripType() === 'roundtrip') {
            <div class="form-control w-full">
              <div class="label py-0 pb-1">
                <span class="label-text text-sm">تاریخ برگشت</span>
              </div>
              <app-persian-date-picker
                [value]="returnDateValue()"
                (valueChange)="returnDateValue.set($event)"
                [minDate]="today"
                placeholder="تاریخ برگشت"
              />
            </div>
          }

          <div
            class="form-control w-full"
            [class.sm:col-span-2]="tripType() !== 'roundtrip'"
          >
            <div class="label py-0 pb-1">
              <span class="label-text text-sm">تعداد مسافر</span>
            </div>
            <app-dropdown
              [options]="passengerOptions"
              [value]="passengers()"
              (valueChange)="passengers.set($any($event))"
              placeholder="تعداد مسافر"
            />
          </div>
        </div>

        <!-- Validation feedback -->
        @if (showError()) {
          <div role="alert" class="alert alert-error text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <span>
              @if (sameCities()) {
                مبدا و مقصد نمی‌توانند یکسان باشند.
              }
              @if (returnDateMissing()) {
                برای سفر رفت و برگشت، تاریخ برگشت را انتخاب کنید.
              }
              @if (!sameCities() && !returnDateMissing()) {
                لطفاً همه‌ی فیلدهای لازم را کامل کنید.
              }
            </span>
          </div>
        }

        <!-- Submit -->
        <button type="submit" class="btn btn-primary btn-lg w-full text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          جستجوی پرواز
        </button>
      </div>
    </form>
  `,
})
export class SearchFormComponent {
  /** Optional prefill of destination code (from home quick-destination cards) */
  readonly prefillTo = input<string | null>(null);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(FlightStateService);

  readonly today = new Date();
  private readonly tomorrow = addDays(this.today, 1);
  private readonly dayAfter = addDays(this.today, 2);

  readonly tripType = signal<"roundtrip" | "oneway">("roundtrip");
  readonly from = signal<string>("THR");
  readonly to = signal<string>("MHD");
  readonly departureDate = signal<Date | null>(this.tomorrow);
  readonly returnDateValue = signal<Date | null>(this.dayAfter);
  readonly passengers = signal<number>(1);
  readonly cabinClass = signal<CabinClass>("اکونومی");
  readonly submitted = signal(false);

  readonly airportOptions = computed<DropdownOption[]>(() =>
    this.state.airports().map((a) => ({
      label: `${a.city} — ${a.name}`,
      value: a.code,
    }))
  );

  readonly passengerOptions: DropdownOption[] = Array.from(
    { length: 9 },
    (_, i) => ({ label: `${i + 1} نفر`, value: i + 1 })
  );

  readonly cabinOptions: DropdownOption[] = [
    { label: "اکونومی", value: "اکونومی" },
    { label: "بیزینس", value: "بیزینس" },
  ];

  readonly sameCities = computed(() => this.from() === this.to());
  readonly returnDateMissing = computed(
    () => this.tripType() === "roundtrip" && !this.returnDateValue()
  );
  readonly isValid = computed(
    () =>
      !!this.from() &&
      !!this.to() &&
      !!this.departureDate() &&
      this.passengers() >= 1 &&
      this.passengers() <= 9 &&
      !this.sameCities() &&
      !this.returnDateMissing()
  );
  readonly showError = computed(() => this.submitted() && !this.isValid());

  constructor() {
    // Seed from previous search if the user navigated back
    const prev = this.state.query();
    if (prev) {
      this.tripType.set(prev.roundTrip ? "roundtrip" : "oneway");
      this.from.set(prev.from);
      this.to.set(prev.to);
      const dep = isoToDate(prev.date);
      if (dep) this.departureDate.set(dep);
      const ret = isoToDate(prev.returnDate);
      if (ret) this.returnDateValue.set(ret);
      this.passengers.set(prev.passengers);
      this.cabinClass.set(prev.cabinClass);
    }

    // Prefill destination from query params (quick destination cards)
    effect(() => {
      const pre = this.prefillTo();
      if (pre) {
        this.to.set(pre);
      }
    });

    // Fetch airport list from API (falls back to bundled list)
    this.state.fetchAirports();
  }

  swapCities(): void {
    const f = this.from();
    this.from.set(this.to());
    this.to.set(f);
    this.submitted.set(false);
  }

  submit(event: Event): void {
    event.preventDefault();
    if (!this.isValid()) {
      this.submitted.set(true);
      return;
    }
    this.submitted.set(false);
    const query: SearchQuery = {
      from: this.from(),
      to: this.to(),
      date: this.departureDate() ? dateToIso(this.departureDate()!) : "",
      returnDate:
        this.tripType() === "roundtrip" && this.returnDateValue()
          ? dateToIso(this.returnDateValue()!)
          : undefined,
      passengers: Number(this.passengers()),
      cabinClass: this.cabinClass(),
      roundTrip: this.tripType() === "roundtrip",
    };
    this.state.setQuery(query);
    this.router.navigate(["/results"]);
  }
}
