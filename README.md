# Wardrobe

A mobile-friendly wardrobe prototype for putting together casual outfits from clothing photos you add yourself.

## What it does

- Stores up to eight wardrobe photos in this browser.
- Builds three prepared outfit suggestions from uploaded items only.
- Includes shoes, layers, or accessories only when they are in the wardrobe.
- Lets you save looks and record “Would wear” or “Wouldn’t wear” feedback with a short reason.
- Labels recommendations as simulated prototype suggestions; no paid AI service or clothing recognition is used.

Wardrobe photos, saved looks, and feedback are kept locally in the browser. They are not part of this source download.

## Run locally

This project is a pnpm workspace. Download or clone the full repository so the shared workspace packages are included.

```sh
pnpm install
pnpm --filter @workspace/wardrobe-outfits run dev
```

To check the app:

```sh
pnpm --filter @workspace/wardrobe-outfits run typecheck
pnpm --filter @workspace/wardrobe-outfits run build
```
