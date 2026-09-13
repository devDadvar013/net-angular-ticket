import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Booking } from "../../core/models/flight.models";
import { FlightStateService } from "../../core/services/flight-state.service";
import { TicketViewComponent } from "../../shared/components/ticket-view/ticket-view";

@Component({
  selector: "app-tracking",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TicketViewComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Lookup form -->
      <div class="card bg-base-100 border border-base-300 shadow-lg max-w-xl mx-auto">
        <div class="card-body">
          <div class="flex items-center gap-3 mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-primary"
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
            <div>
              <h1 class="text-xl font-extrabold">پیگیری رزرو</h1>
              <p class="text-xs opacity-70">
                با وارد کردن کد رزرو، بلیط‌های خود را مشاهده کنید.
              </p>
            </div>
          </div>

          <form (submit)="lookup($event)" class="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="مثلاً 47ZJWE"
              dir="ltr"
              class="input input-bordered flex-1 font-mono uppercase tracking-widest"
              [value]="ref()"
              (input)="ref.set($any($event.target).value)"
            />
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!isValid() || loading()"
            >
              @if (loading()) {
                <span class="loading loading-spinner loading-sm"></span>
              } @else {
                <span>جستجو</span>
              }
            </button>
          </form>

          <p class="text-xs opacity-60 mt-2 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            کد رزرو شما حداقل ۶ کاراکتر است (مثل
            <span dir="ltr" class="font-mono">47ZJWE</span>)
          </p>

          @if (ref().trim().length > 0 && ref().trim().length < 6) {
            <p class="text-error text-xs mt-1">
              کد رزرو باید حداقل ۶ کاراکتر باشد.
            </p>
          }

          <!-- Error -->
          @if (error(); as err) {
            <div class="alert alert-error mt-4">
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
              <span>{{ err }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Ticket -->
      @if (booking(); as b) {
        <div class="mt-8">
          <div class="text-center mb-6">
            <h2 class="text-xl font-extrabold">بلیط‌های رزرو شده</h2>
            <p class="text-sm opacity-70 mt-1">
              کد رزرو:
              <span class="font-mono font-bold text-primary" dir="ltr">
                {{ b.ref }}
              </span>
            </p>
          </div>
          <app-ticket-view [booking]="b" />
        </div>
      }
    </div>
  `,
})
export class TrackingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(FlightStateService);

  readonly ref = signal("");
  readonly booking = signal<Booking | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searched = signal(false);

  readonly isValid = computed(() => this.ref().trim().length >= 6);

  constructor() {
    // Support direct links like /tracking?ref=47ZJWE — auto-lookup
    effect(() => {
      const refParam = this.route.snapshot.queryParamMap.get("ref");
      if (refParam) {
        this.ref.set(refParam);
        this.doLookup(refParam.trim().toUpperCase());
      }
    });
  }

  async lookup(event: Event): Promise<void> {
    event.preventDefault();
    const trimmed = this.ref().trim().toUpperCase();
    if (!trimmed || trimmed.length < 6 || this.loading()) return;
    await this.doLookup(trimmed);
  }

  private async doLookup(code: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.booking.set(null);
    this.searched.set(true);
    try {
      const b = await this.state.getBooking(code);
      this.booking.set(b);
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      this.error.set(
        status === 404
          ? "رزرو با این کد پیدا نشد. کد را دوباره بررسی کنید."
          : "خطا در ارتباط با سرور. کمی بعد دوباره تلاش کنید."
      );
    } finally {
      this.loading.set(false);
    }
  }
}
