"use client";

import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { useTheme } from "@/components/providers/ThemeProvider";

/*
 * Global navigation hotkeys — g-prefixed sequences.
 *
 * Bind once in the layout; react-hotkeys-hook handles sequence timing.
 * Opts: enableOnFormTags=false so typing in inputs doesn't trigger nav.
 */
export function NavigationShortcuts() {
  const router = useRouter();
  const { theme, setTheme, density, setDensity } = useTheme();
  const opts = { enableOnFormTags: false, enableOnContentEditable: false, preventDefault: true };

  useHotkeys("g>d", () => router.push("/dashboard"), opts);
  useHotkeys("g>u", () => router.push("/users"), opts);
  useHotkeys("g>v", () => router.push("/verification"), opts);
  useHotkeys("g>o", () => router.push("/orders"), opts);
  useHotkeys("g>r", () => router.push("/deliveries"), opts);
  useHotkeys("g>f", () => router.push("/finance"), opts);
  useHotkeys("g>p", () => router.push("/disputes"), opts);
  useHotkeys("g>s", () => router.push("/support"), opts);
  useHotkeys("mod+shift+l", () => setTheme(theme === "dark" ? "light" : "dark"), opts);
  useHotkeys("mod+shift+d", () => setDensity(density === "compact" ? "comfortable" : "compact"), opts);

  return null;
}
