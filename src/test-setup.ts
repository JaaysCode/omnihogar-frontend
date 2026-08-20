// jsdom does not implement matchMedia. TUI_DARK_MODE (Taiga UI) reads it to
// detect prefers-color-scheme, so unit tests need a minimal stub.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: (): void => undefined,
      removeListener: (): void => undefined,
      addEventListener: (): void => undefined,
      removeEventListener: (): void => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
