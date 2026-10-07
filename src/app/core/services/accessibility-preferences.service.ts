import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { WA_LOCAL_STORAGE } from '@ng-web-apis/common';
import { TUI_DARK_MODE } from '@taiga-ui/core';

export type FontSize = 'small' | 'default' | 'large';

const FONT_SIZE_STORAGE_KEY = 'omnihogar.a11y.fontSize';

// Tamaño de la raíz `html`. Todo el UI (Taiga incluido) usa rem, así que escalar la raíz escala
// la interfaz completa sin tocar componentes.
const ROOT_FONT_SIZE: Record<FontSize, string> = {
  small: '14px',
  default: '16px',
  large: '18px',
};

/**
 * Preferencias de accesibilidad del usuario.
 *
 * - Tema: delega en `TUI_DARK_MODE` de Taiga, que ya persiste la elección en localStorage y sigue
 *   al sistema operativo mientras el usuario no haya elegido.
 * - Tamaño de texto: persiste en localStorage y escala `document.documentElement`.
 *
 * `WA_LOCAL_STORAGE` es null durante SSR, por eso cada acceso está protegido.
 */
@Injectable({ providedIn: 'root' })
export class AccessibilityPreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(WA_LOCAL_STORAGE);
  private readonly darkMode = inject(TUI_DARK_MODE);

  readonly isDarkMode = computed(() => this.darkMode());

  readonly fontSize = signal<FontSize>(this.readFontSize());

  constructor() {
    effect(() => {
      this.document.documentElement.style.fontSize = ROOT_FONT_SIZE[this.fontSize()];
    });
  }

  setDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
  }

  setFontSize(size: FontSize): void {
    this.fontSize.set(size);
    this.storage?.setItem(FONT_SIZE_STORAGE_KEY, size);
  }

  private readFontSize(): FontSize {
    const saved = this.storage?.getItem(FONT_SIZE_STORAGE_KEY);
    return saved === 'small' || saved === 'large' ? saved : 'default';
  }
}
