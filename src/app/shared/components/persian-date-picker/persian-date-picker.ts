import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import * as jalaali from "jalaali-js";

export interface JalaliDay {
  jy: number;
  jm: number; // 1-based
  jd: number;
  gy: number;
  gm: number; // 1-based
  gd: number;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const JMONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const JWEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function toJalali(d: Date): { jy: number; jm: number; jd: number } {
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function startOfJMonth(jy: number, jm: number): Date {
  const g = jalaali.toGregorian(jy, jm, 1);
  return new Date(g.gy, g.gm - 1, g.gd);
}

/** Convert ASCII digits to Persian digits */
function faDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

@Component({
  selector: "app-persian-date-picker",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" (document:click)="onDocumentClick($event)">
      <button
        type="button"
        class="select select-bordered w-full flex items-center justify-between gap-2 px-3"
        (click)="toggle()"
        [attr.aria-expanded]="open()"
      >
        <span class="truncate text-right" [class.opacity-70]="!value()">
          @if (value(); as v) {
            {{ displayDate() }}
          } @else {
            {{ placeholder() }}
          }
        </span>
        <svg
          class="h-4 w-4 shrink-0 opacity-60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      @if (open()) {
        <div
          class="absolute z-30 mt-1 right-0 rounded-box border border-base-300 bg-base-100 shadow-xl p-3 w-72"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-2">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              (click)="prevMonth()"
              aria-label="ماه قبل"
            >
              ›
            </button>
            <div class="font-bold text-sm">{{ jMonthLabel() }}</div>
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              (click)="nextMonth()"
              aria-label="ماه بعد"
            >
              ‹
            </button>
          </div>

          <!-- Weekdays (Saturday-first) -->
          <div
            class="grid grid-cols-7 gap-1 mb-1 text-center text-xs opacity-60"
          >
            @for (w of weekdays; track w) {
              <span>{{ w }}</span>
            }
          </div>

          <!-- Days grid -->
          <div class="grid grid-cols-7 gap-1">
            @for (cell of gridCells(); track $index) {
              @if (cell) {
                <button
                  type="button"
                  class="btn btn-xs font-normal"
                  [class.btn-primary]="cell.isSelected"
                  [class.btn-ghost]="!cell.isSelected"
                  [disabled]="cell.isDisabled"
                  (click)="pick(cell)"
                >
                  {{ faNum(cell.jd) }}
                </button>
              } @else {
                <span></span>
              }
            }
          </div>

          <!-- Footer -->
          <div
            class="mt-3 pt-2 border-t border-base-300 flex items-center justify-between"
          >
            <button
              type="button"
              class="btn btn-ghost btn-xs text-error"
              (click)="clear()"
            >
              پاک کردن
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              (click)="goToday()"
            >
              امروز
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class PersianDatePickerComponent {
  readonly value = model<Date | null>(null);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly placeholder = input("۱۴۰۴/۰۵/۰۱");
  readonly valueChange = output<Date | null>();

  readonly open = signal(false);
  /** Visible month in the popover (jalali year/month); null = follow value */
  private readonly viewJ = signal<{ jy: number; jm: number } | null>(null);

  readonly weekdays = JWEEKDAYS;

  private readonly host = inject(ElementRef<HTMLElement>);

  readonly displayDate = computed(() => {
    const v = this.value();
    if (!v) return "";
    const j = toJalali(v);
    return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
  });

  readonly jMonthLabel = computed(() => {
    const v = this.viewJ() ?? this.initialView();
    return `${JMONTHS[v.jm - 1]} ${faDigits(v.jy)}`;
  });

  /** Flattened 7-column grid; null cells render as empty placeholders */
  readonly gridCells = computed<(JalaliDay | null)[]>(() => {
    const { jy, jm } = this.viewJ() ?? this.initialView();
    const first = startOfJMonth(jy, jm);
    // Saturday-first grid: JS getDay() Sunday=0…Saturday=6 → offset=(day+1)%7
    const offset = (first.getDay() + 1) % 7;
    const monthLength = jalaali.jalaaliMonthLength(jy, jm);
    const cells: (JalaliDay | null)[] = new Array(offset).fill(null);
    const today = new Date();
    const selected = this.value();
    const min = this.minDate();
    const max = this.maxDate();
    for (let jd = 1; jd <= monthLength; jd++) {
      const g = jalaali.toGregorian(jy, jm, jd);
      const date = new Date(g.gy, g.gm - 1, g.gd);
      cells.push({
        jy,
        jm,
        jd,
        gy: g.gy,
        gm: g.gm,
        gd: g.gd,
        isToday: date.toDateString() === today.toDateString(),
        isSelected:
          !!selected && date.toDateString() === selected.toDateString(),
        isDisabled:
          (!!min && date < stripTime(min)) || (!!max && date > stripTime(max)),
      });
    }
    return cells;
  });

  faNum(n: number): string {
    return faDigits(n);
  }

  toggle(): void {
    this.open.update((v) => !v);
    if (this.open()) this.viewJ.set(null); // re-sync view with current value
  }

  prevMonth(): void {
    const { jy, jm } = this.viewJ() ?? this.initialView();
    this.viewJ.set(jm === 1 ? { jy: jy - 1, jm: 12 } : { jy, jm: jm - 1 });
  }

  nextMonth(): void {
    const { jy, jm } = this.viewJ() ?? this.initialView();
    this.viewJ.set(jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 });
  }

  pick(day: JalaliDay): void {
    const date = new Date(day.gy, day.gm - 1, day.gd);
    this.value.set(date);
    this.valueChange.emit(date);
    this.open.set(false);
  }

  clear(): void {
    this.value.set(null);
    this.valueChange.emit(null);
    this.open.set(false);
  }

  goToday(): void {
    const t = new Date();
    this.value.set(t);
    this.valueChange.emit(t);
    this.open.set(false);
  }

  /** Close when clicking anywhere outside this picker */
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  private initialView(): { jy: number; jm: number } {
    const base = this.value() ?? new Date();
    const j = toJalali(base);
    return { jy: j.jy, jm: j.jm };
  }
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
