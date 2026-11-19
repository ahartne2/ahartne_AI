# Wardrobe

A mobile-friendly wardrobe prototype for putting together outfits from clothing photos you add yourself.

## Live demo

**Open the app:** https://wardrobe-outfit-prototype.replit.app/

## What it does

- Supports up to 100 wardrobe items, with bundled clothing photos and the ability to upload and edit your own pieces.
- Offers Office / Work, Gym, Day Off, and Comfy vibes.
- Builds three rule-based outfit suggestions from wardrobe items only, considering names, clothing types, colours, and patterns.
- Prioritizes shirts and tailored trousers for work, including the blue striped shirt, beige trousers, and brown loafers combination when those items are available.
- Includes shoes, layers, or accessories only when they are in the wardrobe.
- Lets you accept outfits with “Yes, I’d wear this” or request another with “No, try again.”
- Prepares alternatives in advance and excludes rejected combinations during the current browsing session.
- Saves accepted looks to a separate Dressed Wardrobe, prevents duplicate saves, and supports removing saved looks.
- Offers “Start this vibe over” when suggestions run out, without deleting accepted or saved looks.
- Labels recommendations as simulated prototype suggestions; no paid AI service or clothing recognition is used.

Bundled clothing images are included in `artifacts/wardrobe-outfits/public/wardrobe-items/`. Personal uploads, accepted looks, and saved outfits are kept in IndexedDB in the browser where you use the app; that browser data is not included in this repository or synchronized between devices.

The prototype does not include accounts, shopping, social features, weather, virtual try-on, or automated clothing recognition.

## Run locally

This project is a pnpm workspace. Download or clone the full repository so the shared workspace packages are included.

```sh
pnpm install
PORT=21073 BASE_PATH=/ pnpm --filter @workspace/wardrobe-outfits run dev
```

Open http://localhost:21073/ after starting the development server. In Replit, the configured Wardrobe workflow supplies these settings.

To check the app:

```sh
pnpm --filter @workspace/wardrobe-outfits run typecheck
PORT=21073 BASE_PATH=/ pnpm --filter @workspace/wardrobe-outfits run build
```
The production build is written to `artifacts/wardrobe-outfits/dist/public/`.

## Three Quick Tests — October 8, 2026

These results and limitations document the earlier prototype tested on the date above. The final features are described in “What it does,” and the public demo link is provided at the top of this README.

| Test | Input or action | What happened | Result |
|---|---|---|---|
| Typical | Reviewed outfit suggestions from a wardrobe containing four tops and three bottoms. | Three outfit cards displayed uploaded clothing, item names, explanations, and feedback controls. The striped shirt and beige trousers appeared together. AI styling was clearly labelled as simulated. | Pass |
| Challenge | Reviewed the suggested combination of a striped shirt and navy striped trousers. | The combination displayed successfully, but the explanation was generic and did not address the potentially competing patterns. All three suggestions reused the same shirt despite other tops being available. | Partial |
| Invalid or empty | Opened “Add a piece” without selecting a photo. | “Save to wardrobe” was disabled, preventing an empty item from being submitted. | Pass |

## Limitations recorded in the earlier tests

1. Styling is simulated. Current suggestions do not assess colour or pattern compatibility, and explanations are generic. Future work will test more useful styling recommendations.
2. Suggestions offer limited variety: the tested results reused one shirt across all three outfits. Selection should make better use of available tops.
3. The tested development link requires Replit access. A publicly accessible prototype link still needs to be verified before submission.

GOOGLE DRIVE LIVE DEMO https://drive.google.com/drive/home?dmr=1&ec=wgc-drive-%5Bmodule%5D-goto
