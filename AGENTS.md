## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

# Frontend Development Guidelines

## 1. Frontend Project Overview

This project is the frontend layer for an advanced e-commerce and print-on-demand platform for a custom clothing brand. The interface must be highly interactive, fast, and SEO-optimized, integrating custom design uploads, gamification, and real-time features.

## 2. Tech Stack & Environment

- **Framework:** Astro (for overall routing, SSG, and SSR)
- **UI Library:** React (for highly interactive components)
- **Language:** Strict TypeScript
- **Styling:** Tailwind CSS v4 (Strictly v4, do not use older versions or deprecated patterns)
- **Package Manager:** pnpm
- **State Management:** Zustand or React Context API (keep it lightweight)

## 3. Architecture & Design Patterns: Astro Islands

- **Static & SSR Pages:** Use Astro to generate pages that require excellent SEO and fast initial load times, such as the Home page, Product Catalog, and Quiz entry pages.
- **Selective Hydration:** Hydrate React components strictly where user interaction is required using directives like `client:load`, `client:visible`, or `client:idle`.

## 4. Core Interactive Features (React Micro-frontends)

- **Customization Engine (Print-on-Demand):** A fluid client-side React interface where users can upload custom designs, preview them on garments, and handle multiple product configurations.
  - _Crucial rule:_ The UI must handle client-side rendering to preview the store's logo automatically injected onto the user's custom design.
- **Gamification & Quizzes:** Interactive quiz components to unlock promotional codes and limited-edition design drops.
- **Creative AI Agent UI:** A chat/assistant interface for the AI design tool.
- **Shopping Cart & Payments:** Dynamic cart state and UI integration for secure payment gateways (Stripe/MercadoPago).
- **Real-Time Support:** A support chat widget utilizing WebSockets (e.g., Socket.io-client) to communicate with the backend.

## 5. Initial Task & Instructions for Claude

_Act as a Lead Frontend Developer._

Your immediate task is to set up the frontend architecture. Do not write feature implementations yet. Provide the following:

1.  **Project Initialization:** The exact CLI commands to bootstrap the Astro project using `pnpm`, add the React integration, and properly install and configure **Tailwind CSS v4**.
2.  **Folder Structure:** Propose an optimal folder structure under `src/` (e.g., separating Astro pages, React components, layouts, hooks, and stores).
3.  **Island Example:** Provide a skeleton code example demonstrating how to pass state or props from an Astro page to a hydrated React component (e.g., the Shopping Cart or Design Customizer).

Wait for my confirmation after delivering this setup plan before proceeding to code the actual UI components.
