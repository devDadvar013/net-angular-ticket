import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AIRPORTS } from "../../../core/data/airports";
import { FlightStateService } from "../../../core/services/flight-state.service";
import { formatPassengers, formatShortDate } from "../../../core/utils/format";

@Component({
  selector: "app-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-40 no-print">
      <div class="navbar bg-primary text-primary-content shadow-md">
        <div class="navbar-start">
          <a routerLink="/" class="flex items-center gap-2 px-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-primary-content"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M21.5 15.5c.3-1.2-.4-2.4-1.6-2.7l-5.2-1.3L9.8 4.5c-.5-.7-1.4-1-2.2-.8l.9 2.5-1.2 1.3-1.8-.5c-.4-.1-.9 0-1.2.3l.5 1.2 1 1.8 4.2 4.2-4.6 1.5-2-1.2c-.5-.3-1.1-.2-1.5.2l.6 1.1 1.3 2.3c.3.6.9.9 1.5.9h.3l3.4-.7 2.6 2.6c.6.6 1.5.8 2.3.5l-1-1.7 1.1-1.4 2 .4c.6.1 1.2-.2 1.5-.7l.4-.9-.6-1.2z"
              />
            </svg>
            <span class="text-xl font-extrabold tracking-tight">پرواز ۷۲۴</span>
          </a>
        </div>

        <div class="navbar-center hidden md:flex">
          <ul class="menu menu-horizontal px-1 gap-1">
            <li><a routerLink="/" class="rounded-btn">خانه</a></li>
            @if (query(); as q) {
              <li><a routerLink="/results" class="rounded-btn">بلیط‌ها</a></li>
            }
            <li>
              <a routerLink="/tracking" class="rounded-btn">پیگیری رزرو</a>
            </li>
          </ul>
        </div>

        <div class="navbar-end">
          <a
            routerLink="/"
            class="btn btn-outline btn-sm border-primary-content/40 text-primary-content hover:bg-primary-content hover:text-primary"
          >
            جستجوی پرواز
          </a>
        </div>
      </div>

      @if (query(); as q) {
        <div class="bg-primary text-primary-content/90 text-sm">
          <div
            class="container mx-auto px-4 py-1.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap"
          >
            <span class="opacity-80">جستجوی فعال:</span>
            <span class="font-bold">{{ summary() }}</span>
            <span class="opacity-60">•</span>
            <span>{{ formatShortDate(q.date) }}</span>
            @if (q.roundTrip && q.returnDate) {
              <span class="opacity-60">تا</span>
              <span>{{ formatShortDate(q.returnDate) }}</span>
            }
            <span class="opacity-60">•</span>
            <span>{{ formatPassengers(q.passengers) }}</span>
            <span class="opacity-60">•</span>
            <span>{{ q.cabinClass }}</span>
          </div>
        </div>
      }
    </header>
  `,
})
export class HeaderComponent {
  private readonly state = inject(FlightStateService);

  readonly query = this.state.query;
  readonly summary = computed(() => {
    const q = this.query();
    if (!q) return null;
    const from = AIRPORTS.find((a) => a.code === q.from);
    const to = AIRPORTS.find((a) => a.code === q.to);
    return `${from?.city ?? q.from} ← ${to?.city ?? q.to}`;
  });

  readonly formatShortDate = formatShortDate;
  readonly formatPassengers = formatPassengers;
}
