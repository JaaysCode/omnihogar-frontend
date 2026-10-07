import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TuiButton, TuiDropdown } from '@taiga-ui/core';
import { AccessibilityPreferencesService, FontSize } from '../../../core/services/accessibility-preferences.service';

/**
 * Botón con menú de accesibilidad: interruptor de modo oscuro y selector de tamaño de texto.
 * Se monta en cabeceras y barras de navegación; sus preferencias son globales (ver el servicio).
 */
@Component({
  selector: 'app-accessibility-menu',
  imports: [TuiButton, TuiDropdown],
  templateUrl: './accessibility-menu.html',
  styleUrl: './accessibility-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityMenu {
  protected readonly prefs = inject(AccessibilityPreferencesService);
  protected readonly menuOpen = signal(false);

  protected readonly fontSizeOptions: readonly { value: FontSize; label: string }[] = [
    { value: 'small', label: $localize`:@@a11y.fontSize.small:Pequeño` },
    { value: 'default', label: $localize`:@@a11y.fontSize.default:Normal` },
    { value: 'large', label: $localize`:@@a11y.fontSize.large:Grande` },
  ];
}
