import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Log } from '../log';
import { LS } from '../persistence/storage-keys.const';
import { ThemeStorageService } from './theme-storage.service';
import { validateThemeCss } from './validate-theme-css.util';
import { ThemeCssWarning } from './theme-contract.const';

/**
 * A theme entry surfaced in the picker.
 *
 * The only built-in left is `default`, which ships no stylesheet — the
 * bundled skins were removed with the redesign. The `<link>` load path is
 * kept because the shape still allows a built-in with a `url`.
 * User themes load from IDB-stored CSS bytes via a `<style>` tag.
 *
 * `kind` discriminates the load path and lines up with `CustomThemeRef.kind`,
 * so the picker can build a ref directly without re-deriving it from a flag.
 */
export interface CustomTheme {
  id: string;
  name: string;
  kind: 'builtin' | 'user';
  /** Empty for the default theme; an asset URL for built-ins; absent for user themes. */
  url?: string;
  requiredMode?: 'dark' | 'light' | 'system';
  /**
   * Non-blocking warnings carried over from the validator (user themes only).
   * Built-ins ship with a complete contract and never set this. The picker
   * may surface warnings the first time a theme is installed.
   */
  warnings?: ThemeCssWarning[];
}

/** Reference to a theme stored as `kind:id` in `LS.CUSTOM_THEME`. */
export type CustomThemeRef =
  | { kind: 'builtin'; id: string }
  | { kind: 'user'; id: string };

const STYLESHEET_ID = 'custom-theme-stylesheet';

const DEFAULT_REF: CustomThemeRef = { kind: 'builtin', id: 'default' };

const parseRef = (raw: string | null): CustomThemeRef => {
  if (!raw) return DEFAULT_REF;
  const idx = raw.indexOf(':');
  if (idx <= 0) return DEFAULT_REF;
  const kind = raw.slice(0, idx);
  const id = raw.slice(idx + 1);
  if (!id) return DEFAULT_REF;
  if (kind === 'builtin') return { kind: 'builtin', id };
  if (kind === 'user') return { kind: 'user', id };
  return DEFAULT_REF;
};

const serializeRef = (ref: CustomThemeRef): string => `${ref.kind}:${ref.id}`;

/**
 * Pick the cold-start theme. Honors any stored selection, otherwise the
 * default.
 *
 * The Apple Silicon / Liquid Glass first-run branch went away with the
 * bundled skins — the stylesheet it pointed at no longer ships. The second
 * parameter is kept so the signature stays stable for callers and tests.
 *
 * Deliberately does *not* write to LS on first run — leaving LS untouched
 * lets `migrateLegacyCustomTheme` still detect the "no choice yet" state
 * and import a synced device's preference.
 */
export const pickInitialActiveRef = (
  stored: string | null,
  _isAppleSilicon: boolean = false,
): CustomThemeRef => {
  if (stored) return parseRef(stored);
  return DEFAULT_REF;
};

/**
 * The app ships light and dark and nothing else.
 *
 * The bundled skins (Zen, Arc, Dracula, Nord, Velvet, Liquid Glass, …) were
 * written against the pre-redesign variable names. The redesigned components
 * consume the design system's tokens directly, so those skins could only ever
 * restyle half the app — a theme that reaches the sidebar but not the task
 * rows looks broken rather than themed. They are removed rather than left
 * half-working.
 *
 * User-uploaded themes are untouched: they are the user's own data and still
 * load through `_themeStorage` below.
 */
export const BUILT_IN_THEMES: CustomTheme[] = [
  { id: 'default', name: 'Default', kind: 'builtin', url: '', requiredMode: 'system' },
];

@Injectable({ providedIn: 'root' })
export class CustomThemeService {
  private _document = inject<Document>(DOCUMENT);
  private _themeStorage = inject(ThemeStorageService);

  private _activeRef = signal<CustomThemeRef>(
    pickInitialActiveRef(localStorage.getItem(LS.CUSTOM_THEME)),
  );

  /** The currently selected theme reference. */
  readonly activeRef: Signal<CustomThemeRef> = this._activeRef.asReadonly();

  /** All themes available in the picker — built-ins first, then user uploads. */
  readonly themes: Signal<CustomTheme[]> = computed(() => [
    ...BUILT_IN_THEMES,
    ...this._themeStorage.themes().map(
      (t): CustomTheme => ({
        id: t.id,
        name: t.name,
        kind: 'user',
        requiredMode: 'system',
        warnings: t.warnings,
      }),
    ),
  ]);

  /**
   * Apply the currently-selected theme. Called from startup to honor a
   * cold-start `LS.CUSTOM_THEME` value, and from `setActiveTheme` after
   * a user picks a theme.
   */
  async applyActiveTheme(): Promise<void> {
    await this.loadTheme(this._activeRef());
  }

  /**
   * Persist the selection to localStorage and load it. Sole writer of
   * `LS.CUSTOM_THEME` — every caller goes through here so the signal,
   * localStorage, and the live stylesheet stay in lockstep.
   */
  async setActiveTheme(ref: CustomThemeRef): Promise<void> {
    this._activeRef.set(ref);
    localStorage.setItem(LS.CUSTOM_THEME, serializeRef(ref));
    await this.loadTheme(ref);
  }

  /**
   * Bridge for users syncing from a pre-`LS.CUSTOM_THEME` device, where the
   * picker value lived in `globalConfig.misc.customTheme`. If LS already has
   * a value the user already chose on this device — leave it alone. Only
   * migrates known built-in IDs; user themes never lived in legacy config.
   */
  async migrateLegacyCustomTheme(legacyId: string | undefined): Promise<void> {
    if (localStorage.getItem(LS.CUSTOM_THEME)) return;
    if (!legacyId || legacyId === 'default') return;
    if (!BUILT_IN_THEMES.some((t) => t.id === legacyId)) return;
    await this.setActiveTheme({ kind: 'builtin', id: legacyId });
  }

  /**
   * Uninstall a user theme. Deletes from IDB; if it was the active theme,
   * resets the picker to the default. Returns whether a fallback occurred
   * so callers can surface a "reverted to default" toast.
   *
   * IDB delete runs first — if it fails, LS is untouched and the user can
   * retry without a corrupted active-theme reference.
   */
  async removeUserTheme(id: string): Promise<boolean> {
    const active = this._activeRef();
    const wasActive = active.kind === 'user' && active.id === id;
    await this._themeStorage.removeTheme(id);
    if (wasActive) {
      await this.setActiveTheme(DEFAULT_REF);
    }
    return wasActive;
  }

  /** Inject the appropriate stylesheet element for the given ref. */
  async loadTheme(ref: CustomThemeRef): Promise<void> {
    this._unloadCurrentTheme();

    if (ref.kind === 'builtin') {
      const theme = BUILT_IN_THEMES.find((t) => t.id === ref.id);
      if (!theme) {
        Log.err({ themeId: ref.id, kind: ref.kind, reason: 'unknown built-in theme' });
        return;
      }
      if (theme.id === 'default' || !theme.url) {
        return;
      }
      const link = this._document.createElement('link');
      link.rel = 'stylesheet';
      link.href = theme.url;
      link.id = STYLESHEET_ID;
      this._document.head.appendChild(link);
      return;
    }

    // User theme — read CSS from IDB and inject a <style> element.
    const stored = await this._themeStorage.getTheme(ref.id);
    if (!stored) {
      Log.err({ themeId: ref.id, kind: ref.kind, reason: 'theme not found in storage' });
      // Active theme reset on missing data so the picker doesn't get stuck.
      await this.setActiveTheme(DEFAULT_REF);
      return;
    }
    // Re-validate cached CSS — a previous client may have stored bytes the
    // current validator now rejects (e.g. an `image-set` payload from before
    // the v2 validator landed). Treat a failed re-validation like a missing
    // theme: log structured, fall back to default, do not inject.
    const validation = validateThemeCss(stored.css);
    if (!validation.isValid) {
      Log.err({ themeId: ref.id, reason: 'cached-css-failed-validation' });
      await this.setActiveTheme(DEFAULT_REF);
      return;
    }
    const style = this._document.createElement('style');
    style.id = STYLESHEET_ID;
    style.textContent = stored.css;
    this._document.head.appendChild(style);
  }

  private _unloadCurrentTheme(): void {
    const existing = this._document.getElementById(STYLESHEET_ID);
    if (existing) {
      existing.remove();
    }
  }
}
