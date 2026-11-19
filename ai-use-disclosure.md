# Draft AI-Use Disclosure

**Project:** Wardrobe Outfit Prototype  
**Author:** Aoife Hartnett  
**Repository branch:** test-replit

## Tools and contributions

I used ChatGPT and Replit Agent to help plan the interface, develop and revise code, diagnose preview and routing problems, prepare documentation, and check parts of the recommendation logic. ChatGPT's image-generation/editing feature helped isolate clothing and accessory references from screenshots. Some obscured image areas were reconstructed.

## Representative prompts and revisions

| Prompt excerpt or close paraphrase | Contribution | My subsequent direction |
|---|---|---|
| “Add themes for the day such as Office / Work, Gym, Day Off and Comfy, then generate outfit selections.” | Helped develop the vibe selector and context-dependent outfit rules. | I specified the four vibes and retained the focus on clothes in the user's own wardrobe. |
| “Include loafers, the blue striped shirt and beige trousers in Work.” | Led to explicit workwear recognition and prioritization of that combination. | I selected the desired garments. The functional work test confirmed that this pairing ranks first. |
| “Regenerate outfits faster when I say no, and keep the ones I like in Dressed Wardrobe.” | Helped develop prepared alternatives, rejection tracking and saved-look controls. | I required rejected combinations to be excluded during the session and accepted looks to remain available. |

## Human judgment and corrections

I chose the product scope, clothing references, daily vibes and preferred work combination. I corrected an initial image-preparation result that included only seven of the 19 requested pieces, asking for the rest to be completed. I also asked for the main product flow to support rejection, faster replacement and saving favourites. These decisions shaped the prototype through my own review and feedback.

## Verification and unresolved work

Earlier Replit output reported successful build and typechecking. For this documentation update, five functional cases were executed against the current recommendation and state-update code, revealing an Office fallback limitation and an accessory-suitability issue. An unauthenticated request to the public app returned HTTP 200 with the page title Wardrobe. That access check does not confirm every interactive feature. Full browser persistence, mobile interaction, actual response-time measurements and final video access still need checking. Generated clothing cutouts also need review for fidelity to the source references.

## AI inside the product

The intended AI task is to suggest useful outfits from a user's owned clothes and selected daily vibe, with understandable explanations and feedback controls. Intended inputs include garment information, wardrobe images, the selected vibe and user feedback. Intended outputs are outfit combinations and styling explanations. In the current implementation, images are displayed while deterministic rules infer style, colours and patterns from item names and categories. The app does not use a live generative styling model or automated image recognition. Rejection excludes particular combinations within the session. It does not train a personalized model. The benefit currently demonstrated is structured outfit exploration with user control. A future AI integration would need evaluation using its actual outputs.
