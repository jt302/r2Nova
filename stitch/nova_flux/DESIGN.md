# Design System Specification

## 1. Overview & Creative North Star: "The Kinetic Vault"
This design system moves away from the static, boxy nature of traditional cloud storage utilities. Our Creative North Star is **The Kinetic Vault**. It treats data management not as a series of cold tables, but as a fluid, high-performance environment where assets feel light and accessible. 

By leveraging **Tonal Layering** and **Asymmetric Breathing Room**, we eliminate the "grid-prison" feel of standard enterprise software. We replace rigid 1px borders with depth-based containment, creating a sophisticated desktop experience that feels like a premium editorial tool rather than a basic file browser.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in the "Cloudflare Orange" but reimagined through a sophisticated lens of deep slates and luminous accents.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Boundaries are created exclusively through background color shifts or tonal transitions.
- **Sectioning:** Use `surface_container_low` for the main canvas and `surface_container_high` for interactive sidebars. 
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

### Surface Hierarchy & Nesting
Treat the UI as physical layers. An object’s importance is dictated by its "elevation" through color:
*   **Base Layer:** `surface` (#0b1326) – The deep foundation.
*   **Primary Navigation:** `surface_container` (#171f33) – Anchoring the workflow.
*   **Active Workspace:** `surface_container_low` (#131b2e) – The canvas for file tables.
*   **Floating Modals/Popovers:** `surface_bright` (#31394d) – To draw immediate focus.

### The "Glass & Gradient" Rule
To add soul to the "Efficient" requirement, use **Glassmorphism** for transient elements (tooltips, hovering progress bars). Use a `surface_container` color with a 70% alpha and a `20px` backdrop-blur. 
*   **Signature Texture:** Main CTAs should use a linear gradient from `primary_container` (#f38020) to `primary` (#ffb787) at a 135° angle to create a sense of luminous energy.

---

## 3. Typography: The Editorial Information Hierarchy
We utilize a dual-font strategy to balance character and utility. **Manrope** provides a modern, geometric authority for headers, while **Inter** ensures maximum legibility for high-density file data and multi-language support (English/Chinese).

*   **Display & Headlines (Manrope):** Use `display-md` for empty state "Hero" moments. Keep headlines tight and high-contrast (using `on_surface`).
*   **The Data Engine (Inter):** Use `body-sm` for file tables to maximize information density without sacrificing readability.
*   **Tonal Logic:** Use `on_surface_variant` (#ddc1b1) for secondary metadata (file sizes, dates) to create a clear visual hierarchy against the primary file names in `on_surface`.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are a last resort. We communicate hierarchy through "stacking" surface tiers.

*   **Layering Principle:** To lift a card, place a `surface_container_highest` element on a `surface_container_low` background. 
*   **Ambient Shadows:** For floating transfers or "On Top" windows, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(6, 14, 32, 0.4)`. The shadow must be tinted with the `surface_container_lowest` color to feel integrated into the dark mode environment.
*   **Rounding Scale:** 
    *   **Buttons/Inputs:** `md` (0.375rem) for a precise, professional feel.
    *   **Cards/Sections:** `lg` (0.5rem) to soften the high-density layout.
    *   **Modals:** `xl` (0.75rem) to signal a distinct context shift.

---

## 5. Components: Precision High-Density Tools

### High-Density File Tables
*   **Forbid Dividers:** Do not use horizontal lines between rows. Use a 4px vertical gap between row containers.
*   **Hover State:** On hover, change the row background to `surface_container_highest` with a `sm` corner radius. This provides a "soft highlight" effect.
*   **Progress Indicators:** Use a thin (2px) track in `secondary_container` with a glowing `tertiary` (#89ceff) fill to indicate upload status.

### Buttons & Inputs
*   **Primary Button:** Gradient-filled (`primary_container` to `primary`). No border.
*   **Secondary/Ghost:** `surface_container_highest` background. Text in `primary`.
*   **Forms:** Input fields use `surface_container_lowest` with a `Ghost Border` (15% `outline`). On focus, the border opacity increases to 100% using the `primary` color.

### Navigation Sidebar
*   **Asymmetric Layout:** The sidebar should be slightly darker than the main stage (`surface_container_low`). 
*   **Active State:** Use a "Pill" indicator in `primary` that sits vertically to the left of the active nav item, paired with a subtle `surface_variant` background highlight.

### Modern Transfer HUD (Heads-Up Display)
*   A floating, glassmorphic panel at the bottom-right.
*   **Visual:** `surface_bright` with 60% opacity and `blur(12px)`.
*   **Action:** Minimize to a simple `tertiary` pulse icon when idle.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a separator. If two sections feel cluttered, increase the padding rather than adding a line.
*   **DO** utilize the `tertiary` color (#89ceff) for "success" or "transfer complete" states—it provides a cool, professional contrast to the warm orange.
*   **DO** ensure that Chinese characters maintain a `line-height` of at least 1.5 to prevent visual "clumping" in high-density tables.

### Don't
*   **DON'T** use pure black (#000000). Always use the `surface` tokens to maintain the deep blue slate aesthetic.
*   **DON'T** use 100% opaque borders for cards. It breaks the "Kinetic Vault" fluidity.
*   **DON'T** use the `primary` orange for destructive actions. Reserve it for progress and primary intent; use `error` (#ffb4ab) for deletions.