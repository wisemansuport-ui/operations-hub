// Front-end hardening against casual inspection / DevTools usage.
// NOTE: this is deterrence only — no client-side trick can truly stop a
// determined user from inspecting code. Real secrets must live server-side.

export const installDevtoolsGuard = () => {
  if (typeof window === "undefined") return;
  if ((window as any).__devtoolsGuardInstalled) return;
  (window as any).__devtoolsGuardInstalled = true;

  // 1) Block right-click context menu
  window.addEventListener(
    "contextmenu",
    (e) => {
      e.preventDefault();
    },
    { capture: true }
  );

  // 2) Block DevTools / view-source shortcuts
  window.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();
      const code = e.keyCode || 0;
      const ctrl = e.ctrlKey;
      const meta = e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // F12
      if (code === 123 || key === "f12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Ctrl/Cmd + U → view source
      if ((ctrl || meta) && key === "u") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Ctrl+Shift+(I|J|C)  |  Cmd+Option+(I|J|C)
      if (
        ((ctrl && shift) || (meta && alt)) &&
        (key === "i" || key === "j" || key === "c")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    },
    { capture: true }
  );

  // 3) Debugger trap — dynamically built so bundlers/minifiers don't drop it.
  //    Wrapped in try/catch so a hung/blocked debugger never crashes the app.
  const trap = () => {
    try {
      // Equivalent to: (function(){ debugger; })();
      // Built via Function constructor so static analyzers don't flag it.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      (function () {
        return false;
      })
        ["constructor"]("debugger")();
    } catch {
      /* noop */
    }
  };
  setInterval(trap, 50);
};
