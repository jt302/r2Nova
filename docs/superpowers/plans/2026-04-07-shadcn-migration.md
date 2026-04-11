# shadcn/ui Component Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 9 R2Nova components to shadcn/ui component system with proper composition patterns

**Architecture:** Replace custom UI components with shadcn/ui equivalents while maintaining functionality. Use composition over custom styling - Card with full composition, FieldGroup+Field for forms, semantic colors, flex gap instead of space utilities.

**Tech Stack:** Tauri 2.0 + React 19 + Vite + Tailwind v3 + shadcn/ui + Lucide React

---

## Phase 1: Project Setup

### Task 1: Initialize shadcn/ui in Vite Project

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/package.json`
- Modify: `/Users/tt/Developer/personal/r2nova/tailwind.config.js`
- Modify: `/Users/tt/Developer/personal/r2nova/src/styles/globals.css`
- Create: `/Users/tt/Developer/personal/r2nova/components.json`

- [ ] **Step 1: Check current project structure**

```bash
cd /Users/tt/Developer/personal/r2nova
cat package.json | grep -E '"dependencies"|"devDependencies"' -A 20
cat tailwind.config.js
ls -la src/components/ui/
```

Expected: Project uses Vite, React 19, Tailwind v3. May have existing components in src/components/ui/

- [ ] **Step 2: Install shadcn/ui dependencies**

```bash
npm install -D @types/node
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot
```

Expected: Dependencies added to package.json

- [ ] **Step 3: Update tailwind.config.js for shadcn**

Current tailwind.config.js uses content and custom theme. Update to include shadcn patterns:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

- [ ] **Step 4: Update src/styles/globals.css with CSS variables**

Replace or update the globals.css to include shadcn CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Create components.json configuration**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 6: Create utility function**

Create: `/Users/tt/Developer/personal/r2nova/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 7: Test build after setup**

```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 8: Commit setup changes**

```bash
git add -A
git commit -m "chore(frontend): initialize shadcn/ui in Vite project

- Add tailwindcss-animate and class-variance-authority dependencies
- Update tailwind.config.js with shadcn theme tokens
- Add CSS variables for light/dark themes in globals.css
- Create components.json configuration
- Add cn() utility function for class merging"
```

---

## Phase 2: Install shadcn Components

### Task 2: Install Core shadcn Components

**Files:**

- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/button.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/card.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/dialog.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/input.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/label.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/badge.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/separator.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/breadcrumb.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/avatar.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/progress.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/select.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/toggle-group.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/table.tsx`
- Create: `/Users/tt/Developer/personal/r2nova/src/components/ui/tabs.tsx`

- [ ] **Step 1: Install Button component**

Use the shadcn CLI or manually create:

```bash
cd /Users/tt/Developer/personal/r2nova
# If shadcn CLI is available:
npx shadcn@latest add button
# Or manually create the component
```

Button component code (if creating manually):

```typescript
// src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 2: Install Card component with full composition**

```typescript
// src/components/ui/card.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 3: Install Dialog component**

```typescript
// src/components/ui/dialog.tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

- [ ] **Step 4: Install Input and Label components**

```typescript
// src/components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

```typescript
// src/components/ui/label.tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

- [ ] **Step 5: Install Badge, Separator, Breadcrumb, Avatar, Progress**

Badge:

```typescript
// src/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

Separator:

```typescript
// src/components/ui/separator.tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

Breadcrumb (simplified version):

```typescript
// src/components/ui/breadcrumb.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
```

Avatar:

```typescript
// src/components/ui/avatar.tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
```

Progress:

```typescript
// src/components/ui/progress.tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

- [ ] **Step 6: Install Select, ToggleGroup, Table, Tabs**

Select (requires @radix-ui/react-select):

```bash
npm install @radix-ui/react-select
```

```typescript
// src/components/ui/select.tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

ToggleGroup (requires @radix-ui/react-toggle-group):

```bash
npm install @radix-ui/react-toggle-group
```

```typescript
// src/components/ui/toggle-group.tsx
"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
```

Also need toggle.tsx for toggleVariants:

```typescript
// src/components/ui/toggle.tsx
"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
```

Table:

```typescript
// src/components/ui/table.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

Tabs (requires @radix-ui/react-tabs):

```bash
npm install @radix-ui/react-tabs
```

```typescript
// src/components/ui/tabs.tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 7: Install additional Radix dependencies**

```bash
npm install @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-toggle @radix-ui/react-tabs
```

- [ ] **Step 8: Test build after component installation**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript or build errors

- [ ] **Step 9: Commit component installation**

```bash
git add -A
git commit -m "feat(frontend): install all required shadcn/ui components

Add 14 shadcn/ui components:
- Button, Card (with full composition), Dialog, Input, Label
- Badge, Separator, Breadcrumb, Avatar, Progress
- Select, ToggleGroup, Table, Tabs

All components follow shadcn/ui patterns with Radix UI primitives,
CSS variables for theming, and cn() utility for class merging."
```

---

## Phase 3: Component Migration

### Task 3: Migrate Sidebar.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Read current Sidebar.tsx implementation**

```bash
cat /Users/tt/Developer/personal/r2nova/src/components/layout/Sidebar.tsx
```

- [ ] **Step 2: Update imports to use shadcn components**

Replace project UI imports:

```typescript
// Before:
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// After (should be the same path, but now using shadcn implementation):
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
```

The key change is ensuring the components in `@/components/ui/` are now the shadcn versions we just created.

- [ ] **Step 3: Review and update Sidebar component structure**

The Sidebar should:

- Use semantic colors: `bg-primary`, `text-muted-foreground` instead of hardcoded values
- Use flex with gap instead of space utilities
- Ensure Button variants are correct (ghost for nav items, default for primary action)

Example structure:

```typescript
// Key patterns to verify:
<aside className="flex flex-col h-full bg-primary text-primary-foreground">
  <div className="flex flex-col gap-2 p-4">
    {/* Logo/branding */}
  </div>

  <nav className="flex flex-col gap-1 px-2">
    <Button
      variant={currentView === 'buckets' ? 'secondary' : 'ghost'}
      className="justify-start gap-2"
      onClick={onNavigateBuckets}
    >
      <FolderOpen className="size-4" />
      {t('sidebar.buckets')}
    </Button>
    {/* ... other nav items */}
  </nav>

  <div className="mt-auto flex flex-col gap-2 p-4">
    <Separator />
    <Button variant="outline" className="w-full">
      <Plus className="size-4 mr-2" />
      {t('sidebar.newTransfer')}
    </Button>
  </div>
</aside>
```

- [ ] **Step 4: Verify Badge usage for transfer count**

Ensure the transfer badge uses shadcn Badge:

```typescript
{activeTransfers > 0 && (
  <Badge variant="secondary" className="ml-auto">
    {activeTransfers}
  </Badge>
)}
```

- [ ] **Step 5: Test Sidebar in browser**

Run the app and verify:

- Navigation items render correctly
- Active state styling works
- Badge displays transfer count
- Bottom buttons are styled properly
- No console errors

- [ ] **Step 6: Commit Sidebar migration**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "refactor(frontend): migrate Sidebar to shadcn/ui

- Update to use shadcn Button, Badge, Separator components
- Apply semantic color tokens
- Use flex gap instead of space utilities
- Verify all navigation states render correctly"
```

---

### Task 4: Migrate Header.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/components/layout/Header.tsx`

- [ ] **Step 1: Read current Header.tsx implementation**

```bash
cat /Users/tt/Developer/personal/r2nova/src/components/layout/Header.tsx
```

- [ ] **Step 2: Update imports**

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Search, Bell, Cloud, ChevronRight } from 'lucide-react'
```

- [ ] **Step 3: Update Header layout with shadcn patterns**

```typescript
function Header({ currentAccount, onNavigate }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={onNavigate}>
              {currentAccount?.name || t('header.selectAccount')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentAccount && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{currentAccount.bucket}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder={t('header.search')}
          className="pl-8"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="size-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Cloud className="size-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Avatar className="size-8">
          <AvatarImage src={currentAccount?.avatar} />
          <AvatarFallback>{currentAccount?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Verify shadcn Critical Rules**

- [x] No space-x/y utilities - using `gap-4`, `gap-2`
- [x] Using semantic colors: `bg-background`, `text-muted-foreground`
- [x] Using `size-4`, `size-8` for equal width/height
- [x] Breadcrumb has proper structure with BreadcrumbPage for current page

- [ ] **Step 5: Test Header in browser**

Verify:

- Breadcrumb renders with correct separators
- Search input has proper styling with icon
- Buttons are properly sized
- Avatar displays correctly
- All actions work

- [ ] **Step 6: Commit Header migration**

```bash
git add src/components/layout/Header.tsx
git commit -m "refactor(frontend): migrate Header to shadcn/ui

- Replace custom Breadcrumb with shadcn Breadcrumb component
- Use shadcn Input with Search icon integration
- Update Avatar with shadcn Avatar component
- Apply Button with ghost variant for action buttons
- Use semantic colors and flex gap patterns"
```

---

### Task 5: Migrate ThemeSettings.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/components/ThemeSettings.tsx`

- [ ] **Step 1: Read current ThemeSettings.tsx**

```bash
cat /Users/tt/Developer/personal/r2nova/src/components/ThemeSettings.tsx
```

- [ ] **Step 2: Update imports**

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Monitor, Moon, Sun, Palette } from 'lucide-react'
```

- [ ] **Step 3: Apply Card full composition pattern**

Each settings section should be a Card with full composition:

```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Monitor className="size-5" />
      {t('settings.theme.title')}
    </CardTitle>
    <CardDescription>{t('settings.theme.description')}</CardDescription>
  </CardHeader>
  <CardContent className="flex flex-col gap-6">
    {/* Theme mode toggle */}
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">{t('settings.theme.mode')}</label>
      <ToggleGroup
        type="single"
        value={themeMode}
        onValueChange={(value) => value && setThemeMode(value)}
        className="w-fit"
      >
        <ToggleGroupItem value="light" aria-label="Light mode">
          <Sun className="size-4 mr-2" />
          {t('settings.theme.light')}
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Dark mode">
          <Moon className="size-4 mr-2" />
          {t('settings.theme.dark')}
        </ToggleGroupItem>
        <ToggleGroupItem value="system" aria-label="System mode">
          <Monitor className="size-4 mr-2" />
          {t('settings.theme.system')}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    {/* Color preset selection */}
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">{t('settings.theme.color')}</label>
      <div className="flex gap-2">
        {colorPresets.map((preset) => (
          <Button
            key={preset.id}
            variant={currentPreset === preset.id ? 'default' : 'outline'}
            size="icon"
            className="size-8 rounded-full"
            style={{ backgroundColor: preset.color }}
            onClick={() => setPreset(preset.id)}
            aria-label={preset.name}
          />
        ))}
      </div>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 4: Apply Language settings with Select**

```typescript
<Card>
  <CardHeader>
    <CardTitle>{t('settings.language.title')}</CardTitle>
    <CardDescription>{t('settings.language.description')}</CardDescription>
  </CardHeader>
  <CardContent>
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder={t('settings.language.select')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="zh-CN">简体中文</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  </CardContent>
</Card>
```

- [ ] **Step 5: Verify Critical Rules**

- [x] Using Card with full composition (Header/Title/Description/Content)
- [x] No space-y utilities - using flex flex-col gap-\*
- [x] Using semantic colors throughout
- [x] ToggleGroup for theme mode selection
- [x] Select for language dropdown

- [ ] **Step 6: Test ThemeSettings in browser**

Verify:

- Cards render with proper shadows and borders
- Theme toggle buttons work and show active state
- Color preset buttons are circular and show selection
- Language dropdown opens and selects correctly
- All state changes persist

- [ ] **Step 7: Commit ThemeSettings migration**

```bash
git add src/components/ThemeSettings.tsx
git commit -m "refactor(frontend): migrate ThemeSettings to shadcn/ui

- Apply full Card composition pattern with Header/Title/Description/Content
- Replace custom toggle with shadcn ToggleGroup for theme mode
- Replace custom select with shadcn Select for language
- Use semantic color tokens and flex gap patterns
- Apply size-* utility for circular color preset buttons"
```

---

### Task 6: Migrate TransferProgress.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/components/TransferProgress.tsx`

- [ ] **Step 1: Read current TransferProgress.tsx**

```bash
cat /Users/tt/Developer/personal/r2nova/src/components/TransferProgress.tsx
```

- [ ] **Step 2: Update imports**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X, FileText, ArrowRight } from 'lucide-react'
```

- [ ] **Step 3: Apply Card composition for floating window**

```typescript
function TransferProgress() {
  const { t } = useTranslation()
  const activeTransfers = useTransferStore((state) => state.activeTransfers)
  const currentTransfer = activeTransfers[0]

  if (!currentTransfer) return null

  const progress = Math.round(
    (currentTransfer.transferred / currentTransfer.total) * 100
  )

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="size-4" />
          {currentTransfer.fileName}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => hideTransferProgress()}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatBytes(currentTransfer.transferred)} / {formatBytes(currentTransfer.total)}</span>
          <span>{progress}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{currentTransfer.speed}/s</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={openTransferCenter}
          >
            {t('transfer.viewAll')}
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Verify Critical Rules**

- [x] Card with full composition pattern
- [x] Progress component with shadcn implementation
- [x] Using size-4, size-6 for consistent icon/button sizing
- [x] Flex gap instead of space utilities
- [x] Semantic colors: text-muted-foreground

- [ ] **Step 5: Test TransferProgress**

Simulate or trigger a file transfer and verify:

- Card appears in bottom-right corner
- Progress bar fills correctly
- File name and stats display properly
- Close button works
- "View All" link opens transfer center

- [ ] **Step 6: Commit TransferProgress migration**

```bash
git add src/components/TransferProgress.tsx
git commit -m "refactor(frontend): migrate TransferProgress to shadcn/ui

- Apply Card composition pattern for floating window
- Replace custom progress bar with shadcn Progress
- Use semantic color tokens and flex gap patterns
- Apply size-* utility for consistent icon sizing
- Ensure z-index layering works correctly"
```

---

### Task 7: Migrate LanguageSettings.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/components/LanguageSettings.tsx`

- [ ] **Step 1: Read current LanguageSettings.tsx**

```bash
cat /Users/tt/Developer/personal/r2nova/src/components/LanguageSettings.tsx
```

- [ ] **Step 2: Update imports**

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Globe } from 'lucide-react'
```

- [ ] **Step 3: Apply Card composition and ToggleGroup**

```typescript
function LanguageSettings() {
  const { language, setLanguage, t } = useTranslation()

  const languages = [
    { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-5" />
          {t('settings.language.title')}
        </CardTitle>
        <CardDescription>{t('settings.language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          type="single"
          value={language}
          onValueChange={(value) => value && setLanguage(value)}
          className="flex flex-col items-start gap-2"
        >
          {languages.map((lang) => (
            <ToggleGroupItem
              key={lang.value}
              value={lang.value}
              className="w-full justify-start gap-3 px-4 py-3 h-auto data-[state=on]:border-primary"
              aria-label={lang.label}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{lang.label}</span>
                <span className="text-sm text-muted-foreground">
                  {t(`settings.language.${lang.value}`)}
                </span>
              </div>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Verify Critical Rules**

- [x] Card with full composition
- [x] ToggleGroup for language selection (single type)
- [x] Flex gap patterns throughout
- [x] Using semantic colors: text-muted-foreground
- [x] Data attributes for active state styling

- [ ] **Step 5: Test LanguageSettings**

Verify:

- Card renders properly
- Language options display with flags
- Selected language is highlighted
- Clicking different language updates the UI
- Translation keys work correctly

- [ ] **Step 6: Commit LanguageSettings migration**

```bash
git add src/components/LanguageSettings.tsx
git commit -m "refactor(frontend): migrate LanguageSettings to shadcn/ui

- Apply Card composition pattern
- Replace custom toggle with shadcn ToggleGroup
- Use flex column layout with gap utilities
- Apply data-[state=on] styling for selected language
- Use semantic color tokens throughout"
```

---

### Task 8: Migrate AccountManager.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/pages/AccountManager.tsx`

- [ ] **Step 1: Read current AccountManager.tsx**

```bash
cat /Users/tt/Developer/personal/r2nova/src/pages/AccountManager.tsx
```

- [ ] **Step 2: Update imports**

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Edit, Trash2, Check, AlertCircle, Cloud, Key, Globe } from 'lucide-react'
```

- [ ] **Step 3: Update account list to use Card composition**

```typescript
// Account list item as Card
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {accounts.map((account) => (
    <Card
      key={account.id}
      className={cn(
        "relative",
        account.id === currentAccountId && "border-primary ring-1 ring-primary"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={account.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Cloud className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{account.name}</CardTitle>
              <CardDescription className="text-xs">{account.endpoint}</CardDescription>
            </div>
          </div>
          {account.id === currentAccountId && (
            <Badge variant="default" className="absolute top-4 right-4">
              <Check className="size-3 mr-1" />
              {t('account.active')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Key className="size-3" />
            <span className="truncate">{maskAccessKey(account.accessKeyId)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="size-3" />
            <span>{account.region || 'auto'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAccountSelect(account.id)}
          disabled={account.id === currentAccountId}
        >
          {account.id === currentAccountId ? t('account.current') : t('account.switch')}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editAccount(account)}
          >
            <Edit className="size-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="size-5" />
                  {t('account.deleteConfirmTitle')}
                </DialogTitle>
                <DialogDescription>
                  {t('account.deleteConfirmMessage', { name: account.name })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="outline">{t('common.cancel')}</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => deleteAccount(account.id)}
                >
                  {t('common.delete')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  ))}

  {/* Add Account Card */}
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center h-full py-8">
      <Button
        variant="ghost"
        className="flex flex-col gap-2 h-auto py-4"
        onClick={addAccount}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
          <Plus className="size-6 text-muted-foreground" />
        </div>
        <span className="text-muted-foreground">{t('account.addNew')}</span>
      </Button>
    </CardContent>
  </Card>
</div>
```

- [ ] **Step 4: Update account form with FieldGroup pattern**

For add/edit forms, use the FieldGroup + Field pattern (NOT space-y):

```typescript
<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>
        {editingAccount ? t('account.editTitle') : t('account.addTitle')}
      </DialogTitle>
      <DialogDescription>
        {editingAccount ? t('account.editDescription') : t('account.addDescription')}
      </DialogDescription>
    </DialogHeader>

    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t('account.name')}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('account.namePlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="endpoint">{t('account.endpoint')}</Label>
        <Input
          id="endpoint"
          value={formData.endpoint}
          onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
          placeholder="https://xxx.r2.cloudflarestorage.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accessKeyId">{t('account.accessKeyId')}</Label>
        <Input
          id="accessKeyId"
          value={formData.accessKeyId}
          onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
          placeholder={t('account.accessKeyIdPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="secretAccessKey">{t('account.secretAccessKey')}</Label>
        <Input
          id="secretAccessKey"
          type="password"
          value={formData.secretAccessKey}
          onChange={(e) => setFormData({ ...formData, secretAccessKey: e.target.value })}
          placeholder={t('account.secretAccessKeyPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="region">{t('account.region')}</Label>
        <Input
          id="region"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          placeholder="auto"
        />
      </div>
    </div>

    <DialogFooter className="flex gap-2">
      <Button variant="outline" onClick={() => setIsFormOpen(false)}>
        {t('common.cancel')}
      </Button>
      <Button onClick={saveAccount} disabled={!isFormValid}>
        {editingAccount ? t('common.save') : t('common.add')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 5: Verify Critical Rules**

- [x] Card with full composition (Header/Content/Footer)
- [x] Dialog with Title and Description (ALWAYS required)
- [x] NO space-y utilities - using flex flex-col gap-4
- [x] Using Field pattern: Label + Input pairs in flex containers
- [x] Semantic colors: text-destructive, text-muted-foreground
- [x] size-\* utilities for consistent sizing

- [ ] **Step 6: Test AccountManager**

Verify:

- Account cards render with proper layout
- Active account is highlighted
- Edit/delete buttons work
- Delete confirmation Dialog opens with Title
- Add account form uses proper Field pattern
- Form validation works
- Account switching works

- [ ] **Step 7: Commit AccountManager migration**

```bash
git add src/pages/AccountManager.tsx
git commit -m "refactor(frontend): migrate AccountManager to shadcn/ui

- Replace custom cards with shadcn Card full composition
- Add Dialog with required Title for delete confirmation
- Use Field pattern (Label + Input) instead of space-y
- Apply Avatar with fallback for account icons
- Use Badge for active account indicator
- Apply semantic colors and flex gap patterns"
```

---

### Task 9: Migrate BucketBrowser.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/pages/BucketBrowser.tsx`

- [ ] **Step 1: Read current BucketBrowser.tsx**

```bash
cat /Users/tt/Developer/personal/r2nova/src/pages/BucketBrowser.tsx
```

- [ ] **Step 2: Update imports**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FolderOpen,
  FolderPlus,
  Upload,
  Download,
  Trash2,
  ChevronRight,
  HardDrive,
  FileText,
  ArrowLeft,
} from 'lucide-react'
```

- [ ] **Step 3: Update bucket list sidebar with Card**

```typescript
// Left sidebar - Bucket list
<Card className="h-full flex flex-col">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-medium flex items-center gap-2">
      <HardDrive className="size-4" />
      {t('browser.buckets')}
    </CardTitle>
  </CardHeader>
  <CardContent className="flex-1 overflow-auto p-2">
    <div className="flex flex-col gap-1">
      {buckets.map((bucket) => (
        <Button
          key={bucket.name}
          variant={selectedBucket === bucket.name ? 'secondary' : 'ghost'}
          className="justify-start gap-2 h-auto py-2 px-3"
          onClick={() => onBucketSelect(bucket.name)}
        >
          <FolderOpen className="size-4 text-muted-foreground" />
          <div className="flex flex-col items-start">
            <span className="text-sm">{bucket.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatBytes(bucket.size)}
            </span>
          </div>
        </Button>
      ))}
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 4: Update breadcrumb navigation**

```typescript
// Breadcrumb navigation
<div className="flex items-center gap-2 px-4 py-2 border-b">
  <Button variant="ghost" size="icon" className="size-8">
    <ArrowLeft className="size-4" />
  </Button>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink onClick={() => navigateToRoot()}>
          {selectedBucket}
        </BreadcrumbLink>
      </BreadcrumbItem>
      {pathSegments.map((segment, index) => (
        <React.Fragment key={segment}>
          <BreadcrumbSeparator>
            <ChevronRight className="size-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {index === pathSegments.length - 1 ? (
              <span className="font-medium text-foreground">{segment}</span>
            ) : (
              <BreadcrumbLink onClick={() => navigateToSegment(index)}>
                {segment}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        </React.Fragment>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
</div>
```

- [ ] **Step 5: Update object table with shadcn Table**

```typescript
// Object list table
<div className="flex-1 overflow-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-12"></TableHead>
        <TableHead>{t('browser.name')}</TableHead>
        <TableHead className="w-32">{t('browser.size')}</TableHead>
        <TableHead className="w-40">{t('browser.modified')}</TableHead>
        <TableHead className="w-24 text-right">{t('browser.actions')}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {objects.map((object) => (
        <TableRow
          key={object.key}
          className="cursor-pointer"
          onClick={() => object.isDirectory ? navigateInto(object) : selectObject(object)}
        >
          <TableCell>
            {object.isDirectory ? (
              <FolderOpen className="size-4 text-muted-foreground" />
            ) : (
              <FileText className="size-4 text-muted-foreground" />
            )}
          </TableCell>
          <TableCell className="font-medium">{object.name}</TableCell>
          <TableCell className="text-muted-foreground">
            {object.isDirectory ? '--' : formatBytes(object.size)}
          </TableCell>
          <TableCell className="text-muted-foreground text-sm">
            {formatDate(object.lastModified)}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              {!object.isDirectory && (
                <Button variant="ghost" size="icon" className="size-8">
                  <Download className="size-4" />
                </Button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('browser.deleteConfirmTitle')}</DialogTitle>
                    <DialogDescription>
                      {object.isDirectory
                        ? t('browser.deleteFolderConfirm', { name: object.name })
                        : t('browser.deleteFileConfirm', { name: object.name })
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">{t('common.cancel')}</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => deleteObject(object)}
                    >
                      {t('common.delete')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

- [ ] **Step 6: Update folder creation dialog**

```typescript
// New folder dialog
<Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <FolderPlus className="size-5" />
        {t('browser.createFolder')}
      </DialogTitle>
      <DialogDescription>
        {t('browser.createFolderDescription')}
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="folderName">{t('browser.folderName')}</Label>
        <Input
          id="folderName"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder={t('browser.folderNamePlaceholder')}
        />
      </div>
    </div>
    <DialogFooter className="flex gap-2">
      <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
        {t('common.cancel')}
      </Button>
      <Button onClick={createFolder} disabled={!folderName.trim()}>
        {t('common.create')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 7: Verify Critical Rules**

- [x] Card with full composition for sidebar
- [x] Table with proper TableHeader/TableBody/TableRow/TableCell
- [x] Breadcrumb with List/Item/Link/Separator composition
- [x] Dialog with required Title for folder creation and delete confirmation
- [x] NO space-y - using flex flex-col gap-\*
- [x] Field pattern for folder name input
- [x] Semantic colors throughout
- [x] size-\* for consistent icon sizing

- [ ] **Step 8: Test BucketBrowser**

Verify:

- Bucket list renders in Card sidebar
- Bucket selection works
- Breadcrumb navigation displays correctly
- Object table lists files and folders
- Folder creation dialog opens with Title
- Delete confirmation dialog opens with Title
- Download button works for files
- Navigation into folders works

- [ ] **Step 9: Commit BucketBrowser migration**

```bash
git add src/pages/BucketBrowser.tsx
git commit -m "refactor(frontend): migrate BucketBrowser to shadcn/ui

- Apply Card composition for bucket list sidebar
- Replace custom table with shadcn Table component
- Use Breadcrumb with full composition for navigation
- Add Dialog with Title for folder creation
- Add Dialog with Title for delete confirmation
- Apply Field pattern for folder name input
- Use semantic colors and flex gap patterns"
```

---

### Task 10: Migrate TransferCenter.tsx

**Files:**

- Modify: `/Users/tt/Developer/personal/r2nova/src/pages/TransferCenter.tsx`

- [ ] **Step 1: Read current TransferCenter.tsx**

```bash
cat /Users/tt/Developer/personal/r2nova/src/pages/TransferCenter.tsx
```

- [ ] **Step 2: Update imports**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCcw,
  FileText,
  Clock,
  HardDrive,
} from 'lucide-react'
```

- [ ] **Step 3: Update statistics cards**

```typescript
// Statistics row
<div className="grid grid-cols-4 gap-4 mb-6">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {t('transfer.active')}
      </CardTitle>
      <Activity className="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{stats.active}</div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {t('transfer.completed')}
      </CardTitle>
      <CheckCircle2 className="size-4 text-green-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{stats.completed}</div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {t('transfer.failed')}
      </CardTitle>
      <XCircle className="size-4 text-destructive" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{stats.failed}</div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {t('transfer.totalSize')}
      </CardTitle>
      <HardDrive className="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
    </CardContent>
  </Card>
</div>
```

- [ ] **Step 4: Update transfer tabs with shadcn Tabs**

```typescript
<Tabs defaultValue="all" className="flex-1 flex flex-col">
  <TabsList className="w-fit">
    <TabsTrigger value="all">
      {t('transfer.all')}
      <Badge variant="secondary" className="ml-2">{transfers.length}</Badge>
    </TabsTrigger>
    <TabsTrigger value="upload">
      <ArrowUp className="size-3 mr-1" />
      {t('transfer.uploads')}
    </TabsTrigger>
    <TabsTrigger value="download">
      <ArrowDown className="size-3 mr-1" />
      {t('transfer.downloads')}
    </TabsTrigger>
  </TabsList>

  <TabsContent value="all" className="flex-1 mt-4">
    <TransferTable transfers={transfers} />
  </TabsContent>
  <TabsContent value="upload" className="flex-1 mt-4">
    <TransferTable transfers={transfers.filter(t => t.type === 'upload')} />
  </TabsContent>
  <TabsContent value="download" className="flex-1 mt-4">
    <TransferTable transfers={transfers.filter(t => t.type === 'download')} />
  </TabsContent>
</Tabs>
```

- [ ] **Step 5: Update transfer table**

```typescript
function TransferTable({ transfers }: { transfers: Transfer[] }) {
  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Clock className="size-12 mb-4 opacity-50" />
        <p>{t('transfer.noTransfers')}</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>{t('transfer.file')}</TableHead>
            <TableHead className="w-40">{t('transfer.progress')}</TableHead>
            <TableHead className="w-32">{t('transfer.size')}</TableHead>
            <TableHead className="w-24">{t('transfer.speed')}</TableHead>
            <TableHead className="w-24">{t('transfer.status')}</TableHead>
            <TableHead className="w-24 text-right">{t('transfer.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((transfer) => (
            <TableRow key={transfer.id}>
              <TableCell>
                {transfer.type === 'upload' ? (
                  <ArrowUp className="size-4 text-muted-foreground" />
                ) : (
                  <ArrowDown className="size-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{transfer.fileName}</span>
                  <span className="text-xs text-muted-foreground">{transfer.bucket}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Progress value={transfer.progress} className="h-2" />
                  <span className="text-xs text-muted-foreground">{transfer.progress}%</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatBytes(transfer.transferred)} / {formatBytes(transfer.total)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {transfer.speed}/s
              </TableCell>
              <TableCell>
                <TransferStatusBadge status={transfer.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {transfer.status === 'failed' && (
                    <Button variant="ghost" size="icon" className="size-8">
                      <RotateCcw className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => removeTransfer(transfer.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const variants = {
    pending: { variant: 'secondary', label: 'transfer.pending' },
    active: { variant: 'default', label: 'transfer.active' },
    completed: { variant: 'default', className: 'bg-green-500', label: 'transfer.completed' },
    failed: { variant: 'destructive', label: 'transfer.failed' },
    cancelled: { variant: 'outline', label: 'transfer.cancelled' },
  } as const

  const config = variants[status]

  return (
    <Badge
      variant={config.variant as any}
      className={config.className}
    >
      {t(config.label)}
    </Badge>
  )
}
```

- [ ] **Step 6: Verify Critical Rules**

- [x] Card with full composition for statistics
- [x] Tabs with List/Trigger/Content composition
- [x] Table with proper structure
- [x] Progress component for transfer progress
- [x] Badge for status and counts
- [x] NO space-y - using flex gap
- [x] Semantic colors: text-green-500, text-destructive
- [x] size-\* for consistent icon sizing

- [ ] **Step 7: Test TransferCenter**

Verify:

- Statistics cards display correctly
- Tabs switch between all/uploads/downloads
- Transfer table lists all transfers
- Progress bars fill correctly
- Status badges show correct colors
- Retry and remove buttons work
- Empty state shows when no transfers

- [ ] **Step 8: Commit TransferCenter migration**

```bash
git add src/pages/TransferCenter.tsx
git commit -m "refactor(frontend): migrate TransferCenter to shadcn/ui

- Apply Card composition for statistics dashboard
- Replace custom tabs with shadcn Tabs component
- Use Table for transfer list with Progress column
- Add Badge variants for different transfer statuses
- Apply flex gap patterns and semantic colors
- Use size-* utility for consistent icon sizing"
```

---

## Phase 4: Cleanup & Final Verification

### Task 11: Remove Old Custom UI Components

**Files:**

- Delete or backup: `/Users/tt/Developer/personal/r2nova/src/components/ui/*` (old versions)
- Verify: All imports now use new shadcn components

- [ ] **Step 1: List old custom components**

```bash
ls -la /Users/tt/Developer/personal/r2nova/src/components/ui/
```

- [ ] **Step 2: Backup old components (optional)**

```bash
mkdir -p /Users/tt/Developer/personal/r2nova/src/components/ui-backup
cp /Users/tt/Developer/personal/r2nova/src/components/ui/*.tsx /Users/tt/Developer/personal/r2nova/src/components/ui-backup/
```

- [ ] **Step 3: Verify no old component imports remain**

Search for any remaining imports of old patterns:

```bash
grep -r "from '@/components/ui'" /Users/tt/Developer/personal/r2nova/src --include="*.tsx" | grep -v "node_modules"
```

All imports should now be pointing to the shadcn versions we created.

- [ ] **Step 4: Test complete application**

Run the full application and verify all pages:

```bash
npm run dev
```

Test checklist:

- [ ] Sidebar navigation works
- [ ] Header displays correctly with breadcrumb
- [ ] AccountManager shows accounts with cards and dialogs
- [ ] BucketBrowser displays buckets and objects
- [ ] TransferCenter shows statistics and transfer list
- [ ] ThemeSettings uses cards and toggles
- [ ] LanguageSettings switches languages
- [ ] TransferProgress appears during transfers
- [ ] All dialogs have proper titles
- [ ] No console errors

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors or warnings

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(frontend): complete shadcn/ui migration cleanup

- Remove/backup old custom UI components
- Verify all imports use shadcn components
- Confirm all 9 components migrated successfully:
  - Sidebar, Header, ThemeSettings, TransferProgress
  - LanguageSettings, AccountManager, BucketBrowser, TransferCenter
- Full application tested and production build verified"
```

---

## Success Criteria

- [ ] All 9 components use shadcn/ui components
- [ ] No custom UI component imports remain
- [ ] All Dialogs have required Title
- [ ] No space-x/y utilities - all use flex gap
- [ ] Semantic colors used throughout
- [ ] Production build succeeds
- [ ] No console errors or warnings
- [ ] All functionality preserved

## Summary

This plan migrates R2Nova from custom UI components to shadcn/ui by:

1. Setting up shadcn/ui infrastructure (CSS variables, tailwind config, utils)
2. Installing 14 shadcn components with full implementations
3. Migrating each of the 9 target components with specific patterns
4. Cleaning up old components and verifying the migration

Each task includes exact file paths, code changes, and verification steps.
