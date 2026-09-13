import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  computed,
} from "@angular/core";

export interface DropdownOption {
  label: string;
  value: string | number;
}

@Component({
  selector: "app-dropdown",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" [class.opacity-60]="disabled()">
      <button
        type="button"
        class="select select-bordered w-full flex items-center justify-between gap-2 px-3"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
        (document:click)="onDocumentClick($event)"
        style="background-image: none"
      >
        <span
          class="truncate text-right"
          [class.opacity-70]="!selected()"
        >
          {{ selected()?.label ?? placeholder() }}
        </span>
      </button>

      @if (open()) {
        <div
          class="absolute z-30 mt-1 w-full rounded-box border border-base-300 bg-base-100 shadow-lg overflow-auto max-h-60"
        >
          <ul class="menu menu-sm w-full p-1 gap-0.5">
            @for (opt of options(); track opt.value) {
              <li>
                <button
                  type="button"
                  class="w-full justify-between text-right transition-colors hover:bg-primary hover:text-primary-content"
                  [class.menu-active]="opt.value === value()"
                  (click)="pick(opt)"
                >
                  <span>{{ opt.label }}</span>
                  @if (opt.value === value()) {
                    <svg
                      class="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  }
                </button>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class DropdownComponent {
  readonly options = input.required<DropdownOption[]>();
  readonly value = input<string | number | null>(null);
  readonly placeholder = input("انتخاب کنید");
  readonly disabled = input(false);

  readonly valueChange = output<string | number>();

  readonly open = signal(false);

  readonly selected = computed(() =>
    this.options().find((o) => o.value === this.value())
  );

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  toggle(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
  }

  pick(opt: DropdownOption): void {
    this.valueChange.emit(opt.value);
    this.open.set(false);
  }

  /** Close when clicking anywhere outside this dropdown */
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
