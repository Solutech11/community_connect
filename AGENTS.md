# Community Connect Agent Guide

This project is an Expo React Native app for a community events experience. Keep the codebase organized, screen-focused, and consistent with the current Stitch-inspired visual direction.

## Expo Version

- The app is currently aligned to Expo SDK 54 by project decision.
- Before changing Expo, React Native, navigation, animation, or native package setup, check the exact Expo docs for the target SDK version.
- Use Yarn for dependency changes.

## Project Structure

Keep all app screen work inside `Screens/` using this structure:

```text
Screens/
  components/
    ui/                 Reusable visual components only
  data/                 Static data used by screens
  hooks/                Reusable hooks and behavior helpers
  layouts/              Screen layout wrappers and shared page shells
  navigation/           Root stack, tab navigators, and future nested navigators
  pages/                Actual route screens
    auth/
    dashboard/
    onboarding/
    personalization/
    tabs/
  styles/               Theme tokens, shared style primitives
  types/                Navigation, flow, and shared TypeScript types
```

## File Placement Rules

- Put route screens in `Screens/pages/<feature>/`.
- Put reusable buttons, inputs, chips, icon wrappers, and field components in `Screens/components/ui/`.
- Put navigation objects only in `Screens/navigation/`.
- Put shared screen wrappers in `Screens/layouts/`.
- Put design tokens in `Screens/styles/theme.ts`.
- Put reusable behavior helpers in `Screens/hooks/`.
- Put static option lists and mock screen data in `Screens/data/`.
- Put TypeScript route and flow types in `Screens/types/`.
- Do not place many screens in one file. One route screen per file.

## Navigation

- `Screens/navigation/root-stack.tsx` owns the auth/onboarding/setup/main stack.
- `Screens/navigation/main-tabs.tsx` owns the bottom tab navigator.
- Keep placeholder tab pages in `Screens/pages/tabs/` until they are designed.
- Keep route names typed in `Screens/types/navigation.ts`.

## Design System

- Primary brand green: use the existing `colors.lime`.
- Backgrounds should stay soft off-white/light green, matching the current app.
- Use `@expo/vector-icons`/Ionicons for interface icons.
- Keep forms composed and compact; avoid oversized auth controls.
- Use rounded pills for main CTAs and chips, but keep cards restrained and readable.
- Prefer reusable components over repeating field/button/chip code inside screens.

## Typography

Use **Manrope** as the app font direction.

Why Manrope:
- It feels modern, friendly, and community-oriented.
- It has strong readability for event cards, forms, and dashboards.
- It supports clean bold headings without feeling too corporate.

Recommended usage:

- Headings: `Manrope_800ExtraBold` or `Manrope_700Bold`
- Buttons and tabs: `Manrope_700Bold`
- Body text and inputs: `Manrope_500Medium` or `Manrope_400Regular`

When adding font support, use Expo-compatible font loading with `expo-font` and the Manrope package from `@expo-google-fonts/manrope`.

## Coding Standards

- Use TypeScript for new files.
- Keep imports relative and clear after moving files.
- Run `tsc --noEmit` after structural or navigation changes.
- Use `rg` for searching.
- Avoid unrelated refactors while implementing a screen.
- Keep app code ASCII unless existing content or product copy clearly requires otherwise.

## Screen Implementation Notes

- Onboarding should remain a carousel-like experience within one screen, not separate stack pages.
- Setup/account pages use the fixed header/progress layout and only the body should animate.
- Dashboard Home lives in `Screens/pages/dashboard/home.tsx`.
- Community, Chat, and Profile can remain pending placeholders until their designs are ready.
