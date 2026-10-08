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
## Three Quick Tests — October 8, 2026

| Test | Input or action | What happened | Result |
|---|---|---|---|
| Typical | Reviewed outfit suggestions from a wardrobe containing four tops and three bottoms. | Three outfit cards displayed uploaded clothing, item names, explanations, and feedback controls. The striped shirt and beige trousers appeared together. AI styling was clearly labelled as simulated. | Pass |
| Challenge | Reviewed the suggested combination of a striped shirt and navy striped trousers. | The combination displayed successfully, but the explanation was generic and did not address the potentially competing patterns. All three suggestions reused the same shirt despite other tops being available. | Partial |
| Invalid or empty | Opened “Add a piece” without selecting a photo. | “Save to wardrobe” was disabled, preventing an empty item from being submitted. | Pass |

## Known Limitations

1. Styling is simulated. Current suggestions do not assess colour or pattern compatibility, and explanations are generic. Future work will test more useful styling recommendations.
2. Suggestions offer limited variety: the tested results reused one shirt across all three outfits. Selection should make better use of available tops.
3. The tested development link requires Replit access. A publicly accessible prototype link still needs to be verified before submission.
