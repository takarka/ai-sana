import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CraftInputType = 'text' | 'email' | 'password' | 'search';

let nextId = 0;

// Единственный текстовый инпут дизайн-системы (план 09 §4.1, F0.5) — форма
// логина и все формы школ/классов/пользователей используют один и тот же
// контракт вместо разметки на голом <input> в каждом экране.
@Component({
  selector: 'craft-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.html',
  styleUrl: './input.scss',
  host: {
    class: 'craft-input-host',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CraftInput),
      multi: true,
    },
  ],
})
export class CraftInput implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly type = input<CraftInputType>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  // Путь для декоративной иконки слева (viewBox 0 0 24 24, как в button/status-badge).
  readonly iconPath = input<string | null>(null);
  readonly error = input<string | null>(null);

  protected readonly id = `craft-input-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly revealPassword = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected get resolvedType(): string {
    if (this.type() !== 'password') return this.type();
    return this.revealPassword() ? 'text' : 'password';
  }

  protected toggleReveal(): void {
    this.revealPassword.update((current) => !current);
  }

  protected handleInput(raw: string): void {
    this.value.set(raw);
    this.onChange(raw);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
