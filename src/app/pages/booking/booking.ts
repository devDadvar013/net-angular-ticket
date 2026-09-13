import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Passenger } from "../../core/models/flight.models";
import { FlightStateService } from "../../core/services/flight-state.service";
import { AIRPORTS } from "../../core/data/airports";
import {
  formatPassengers,
  formatPrice,
  formatTime,
} from "../../core/utils/format";
import { Flight } from "../../core/models/flight.models";

type PassengerField = keyof Passenger;

@Component({
  selector: "app-booking",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="breadcrumbs text-sm mb-4">
        <ul>
          <li><a routerLink="/">خانه</a></li>
          <li><a routerLink="/results">نتایج</a></li>
          <li class="text-base-content/70">تکمیل اطلاعات</li>
        </ul>
      </div>

      <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">
        تکمیل اطلاعات مسافران
      </h1>
      <p class="text-sm opacity-70 mb-6">
        لطفاً مشخصات دقیق {{ q().passengers }} مسافر را وارد کنید. کد ملی برای
        صدور بلیط الزامی است.
      </p>

      <form
        (submit)="submit($event)"
        class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start"
      >
        <!-- Passenger forms -->
        <div class="flex flex-col gap-5">
          @for (p of passengers(); track $index; let i = $index) {
            <fieldset
              class="card bg-base-100 border border-base-300 shadow-sm"
            >
              <legend class="px-3 ml-4 text-sm font-bold text-primary">
                مسافر {{ i + 1 }} از {{ passengers().length }}
              </legend>
              <div class="card-body gap-4 pt-2">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- First Name -->
                  <label class="form-control w-full">
                    <div class="label py-0 pb-1">
                      <span class="label-text">نام</span>
                    </div>
                    <input
                      type="text"
                      placeholder="مثلاً علی"
                      class="input input-bordered w-full"
                      [value]="p.firstName"
                      (input)="updatePassenger(i, 'firstName', $any($event.target).value)"
                      (blur)="markTouched(i, 0)"
                    />
                    @if (touched()[i]?.[0] && fieldError(p, 'firstName'); as err) {
                      <div class="label py-0 pt-1">
                        <span class="label-text-alt text-error">{{ err }}</span>
                      </div>
                    }
                  </label>

                  <!-- Last Name -->
                  <label class="form-control w-full">
                    <div class="label py-0 pb-1">                      <span class="label-text">نام خانوادگی</span>
                    </div>
                    <input
                      type="text"
                      placeholder="مثلاً احمدی"
                      class="input input-bordered w-full"
                      [value]="p.lastName"
                      (input)="updatePassenger(i, 'lastName', $any($event.target).value)"
                      (blur)="markTouched(i, 1)"
                    />
                    @if (touched()[i]?.[1] && fieldError(p, 'lastName'); as err) {
                      <div class="label py-0 pt-1">
                        <span class="label-text-alt text-error">{{ err }}</span>
                      </div>
                    }
                  </label>

                  <!-- National ID -->
                  <label class="form-control w-full">
                    <div class="label py-0 pb-1">
                      <span class="label-text">کد ملی</span>
                    </div>
                    <input
                      type="text"
                      inputmode="numeric"
                      maxlength="10"
                      placeholder="۱۰ رقم"
                      class="input input-bordered w-full"
                      [value]="p.nationalId"
                      (input)="updatePassenger(i, 'nationalId', $any($event.target).value)"
                      (blur)="markTouched(i, 2)"
                    />
                    @if (touched()[i]?.[2] && fieldError(p, 'nationalId'); as err) {
                      <div class="label py-0 pt-1">
                        <span class="label-text-alt text-error">{{ err }}</span>
                      </div>
                    }
                  </label>

                  <!-- Phone -->
                  <label class="form-control w-full">
                    <div class="label py-0 pb-1">
                      <span class="label-text">شماره موبایل</span>
                    </div>
                    <input
                      type="tel"
                      inputmode="numeric"
                      maxlength="11"
                      placeholder="0912xxxxxxx"
                      class="input input-bordered w-full"
                      [value]="p.phone"
                      (input)="updatePassenger(i, 'phone', $any($event.target).value)"
                      (blur)="markTouched(i, 3)"
                    />
                    @if (touched()[i]?.[3] && fieldError(p, 'phone'); as err) {
                      <div class="label py-0 pt-1">
                        <span class="label-text-alt text-error">{{ err }}</span>
                      </div>
                    }
                  </label>
                </div>
              </div>
            </fieldset>
          }
        </div>

        <!-- Summary sidebar -->
        <aside
          class="card bg-base-100 border border-base-300 shadow-sm lg:sticky lg:top-24"
        >
          <div class="card-body gap-4">
            <h2 class="card-title text-base">خلاصه سفر</h2>

            <div class="flex flex-col gap-3">
              @for (flight of flights(); track flight.id; let i = $index) {
                <div class="rounded-box bg-base-200 p-3">
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="badge badge-primary badge-sm">
                      {{ flights().length > 1 ? (i === 0 ? 'رفت' : 'برگشت') : 'بلیت' }}
                    </span>
                    <span class="opacity-60" dir="ltr">
                      {{ flight.flightNumber }}
                    </span>
                  </div>
                  <div
                    class="flex items-center justify-between text-sm font-bold mt-2"
                  >
                    <span dir="ltr">{{ formatTime(flight.departure) }}</span>
                    <span class="text-xs opacity-60">{{ legLabel(flight) }}</span>
                    <span dir="ltr">{{ formatTime(flight.arrival) }}</span>
                  </div>
                  <div class="text-xs opacity-60 mt-1">
                    {{ flight.airline }} · {{ flight.cabinClass }}
                  </div>
                </div>
              }
            </div>

            <div class="ticket-dash"></div>

            <div class="flex justify-between text-sm">
              <span>قیمت هر نفر</span>
              <span>{{ formatPrice(unitPrice()) }} تومان</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>تعداد مسافر</span>
              <span>{{ formatPassengers(q().passengers) }}</span>
            </div>

            <div class="ticket-dash"></div>

            <div class="flex justify-between items-center">
              <span class="font-bold">مبلغ قابل پرداخت</span>
              <span class="text-xl font-extrabold text-primary">
                {{ formatPrice(total()) }} تومان
              </span>
            </div>

            @if (submitError()) {
              <div class="alert alert-error text-sm py-2">
                <span>ثبت رزرو با خطا مواجه شد. لطفاً دوباره تلاش کنید.</span>
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-lg w-full"
              [disabled]="submitting()"
            >
              {{ submitting() ? "در حال ثبت رزرو…" : "پرداخت و صدور بلیط" }}
            </button>
            <p class="text-[11px] opacity-60 text-center leading-5">
              این یک نمونه‌ی نمایشی است؛ هیچ مبلغی واقعاً از حساب شما کسر
              نمی‌شود.
            </p>
          </div>
        </aside>
      </form>
    </div>
  `,
})
export class BookingPage {
  private readonly router = inject(Router);
  private readonly state = inject(FlightStateService);

  readonly query = this.state.query;
  readonly flights = this.state.selectedFlights;

  readonly submitting = signal(false);
  readonly submitError = signal(false);
  readonly passengers = signal<Passenger[]>([]);
  readonly touched = signal<boolean[][]>([]);

  readonly q = computed(
    () =>
      this.query() ?? {
        from: "THR",
        to: "MHD",
        date: "",
        passengers: 1,
        cabinClass: "اکونومی" as const,
        roundTrip: false,
      }
  );

  readonly unitPrice = computed(() =>
    this.flights().reduce((sum, f) => sum + f.price, 0)
  );
  readonly total = computed(() => this.unitPrice() * this.passengers().length);

  constructor() {
    // Seed passenger rows from the query
    const count = this.q().passengers;
    this.passengers.set(
      Array.from({ length: count }, () => ({
        firstName: "",
        lastName: "",
        nationalId: "",
        phone: "",
      }))
    );
    this.touched.set(
      Array.from({ length: count }, () => [false, false, false, false])
    );

    // Redirect home if nothing is selected
    effect(() => {
      if (this.flights().length === 0) {
        this.router.navigate(["/"]);
      }
    });
  }

  legLabel(flight: Flight): string {
    const from =
      AIRPORTS.find((a) => a.code === flight.from.code)?.city ??
      flight.from.city;
    const to =
      AIRPORTS.find((a) => a.code === flight.to.code)?.city ?? flight.to.city;
    return `${from} ← ${to}`;
  }

  updatePassenger(i: number, field: PassengerField, value: string): void {
    this.passengers.update((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p))
    );
  }

  markTouched(i: number, field: number): void {
    this.touched.update((prev) =>
      prev.map((row, idx) =>
        idx === i ? row.map((v, fi) => (fi === field ? true : v)) : row
      )
    );
  }

  fieldError(p: Passenger, field: PassengerField): string | null {
    switch (field) {
      case "firstName":
        return p.firstName.length < 2 ? "نام الزامی است (حداقل ۲ حرف)" : null;
      case "lastName":
        return p.lastName.length < 2
          ? "نام خانوادگی الزامی است (حداقل ۲ حرف)"
          : null;
      case "nationalId":
        return !/^\d{10}$/.test(p.nationalId)
          ? "کد ملی باید ۱۰ رقم باشد"
          : null;
      case "phone":
        return !/^09\d{9}$/.test(p.phone)
          ? "شماره موبایل معتبر نیست (09xxxxxxxxx)"
          : null;
    }
  }

  isFormValid(): boolean {
    return this.passengers().every(
      (p) =>
        p.firstName.length >= 2 &&
        p.lastName.length >= 2 &&
        /^\d{10}$/.test(p.nationalId) &&
        /^09\d{9}$/.test(p.phone)
    );
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.isFormValid() || this.submitting()) {
      this.touched.set(
        Array.from({ length: this.passengers().length }, () => [
          true,
          true,
          true,
          true,
        ])
      );
      return;
    }
    this.submitting.set(true);
    this.submitError.set(false);
    try {
      await this.state.confirm(this.flights(), this.passengers());
      this.router.navigate(["/confirmation"]);
    } catch {
      this.submitting.set(false);
      this.submitError.set(true);
    }
  }

  readonly formatPrice = formatPrice;
  readonly formatPassengers = formatPassengers;
  readonly formatTime = formatTime;
}
