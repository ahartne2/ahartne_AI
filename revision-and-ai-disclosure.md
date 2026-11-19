# Wardrobe revision, evaluation and AI-use disclosure

Prepared for the revised-prototype milestone. Source reviewed on November 18, 2026, from the `test-replit` branch at commit `0de6214c36aeee0c343500263006c3575ad6945e`.

## Product and intended user

Wardrobe helps people who struggle to decide what to wear find combinations using clothes they already own. The central task is to choose a daily vibe, review outfit suggestions, reject unsuitable combinations, accept favourites and save selected looks in Dressed Wardrobe.

Working prototype: https://wardrobe-outfit-prototype.replit.app/

## 1. Priority improvements and response to peer feedback

| Priority | Evidence or reason | Decision and implemented change |
|---|---|---|
| Make the experience immediately accessible | One reviewer could not find a live demo link. Another said that requiring photo uploads made it difficult to see the intended AI experience immediately. | Added the public prototype link to the README and bundled clothing for an immediate first experience. The current startup code adds 21 bundled items to the local wardrobe. A separate sample-closet function supplies 19 illustrated items when the wardrobe is empty. |
| Make suggestions respond to the user's day | The earlier review identified generic explanations and limited variety. I also wanted work, exercise and relaxed outfits to reflect different needs. | Added Office / Work, Gym, Day Off and Comfy choices. Rules use garment names, categories, colour words and pattern words. Work scoring explicitly prioritizes the blue striped shirt, beige trousers and brown loafers when available. |
| Give users control over unsuitable suggestions | The original feedback controls recorded a reaction. I wanted rejection to produce a useful next action and liked outfits to remain easy to find. | Added acceptance, replacement of rejected combinations, prepared alternatives, session-specific rejection tracking and a separate Dressed Wardrobe with duplicate-save protection and removal. |

I retained the focus on clothes already in the wardrobe. Automated image recognition and a live generative styling model remain future work. The prototype labels AI styling as simulated.

The original review also suggested explaining why colours and patterns work together. This is partly addressed by name-based scoring. The current explanations still need more specific reasoning, so I have kept this as an improvement priority.

## 2. Five distinct evaluation cases

### Method and scope

These checks executed the current `buildVibeOutfits` function and the actual acceptance, rejection and save handlers extracted from the GitHub source. Success criteria were specified before execution. Tests used bundled items and controlled temporary item records. They are functional checks of prototype logic. Browser appearance, real click-to-render latency, microphone/video quality and persistence after browser refresh were not verified in this test run.

| Case | Input or action | Expected result / success criterion | Actual result | Result | Implication or next step |
|---|---|---|---|---|---|
| Typical 1 — Work | Provide a blue striped shirt, beige trousers, brown leather loafers, black T-shirt, charcoal sweatpants and canvas trainers. Request Office / Work. | Rank the shirt, beige trousers and loafers first. Exclude athletic bottoms when work trousers and a work shirt are available. | The first outfit contained exactly the shirt, beige trousers and loafers. A second outfit used the same shirt and trousers with canvas trainers. No sweatpants appeared. | Pass for the stated criterion | The intended work combination is prioritized. Footwear suitability and variety still need checking against particular workplaces. |
| Typical 2 — Comfy | Request Comfy using the 21 bundled items. | Return three distinct combinations using existing pieces, relaxed tops and suitable relaxed bottoms. | Three distinct looks were returned. They included a hoodie with sweatpants, a knit with track pants, and a T-shirt with sweatpants. The first look also included a burgundy leather belt with sweatpants. | Pass on the stated criterion; accessory limitation found | The overall vibe is represented, but accessory selection can be inappropriate. Add compatibility rules for belts and waistbands. |
| Challenge — Missing workwear | Supply only a charcoal hoodie, charcoal sweatpants and canvas trainers. Request Office / Work. | Explain the lack of workwear and avoid implying that the outfit meets a verified workplace dress code. | The generator returned the hoodie, sweatpants and trainers with the explanation “A polished, easy pairing with your uploaded shoes.” Source inspection separately found an Office missing-shirt warning in the interface. | Partial | The warning helps, but the outfit explanation can contradict it. Replace the fallback description with an explicit suitability limitation or request more context. |
| Invalid / empty | Call the recommendation function with an empty wardrobe. | Return no invented clothing or outfits. | The function returned an empty array. | Pass for recommendation logic | Retest the visible empty state and upload validation in a fresh browser. Normal startup adds bundled items, so this was an isolated empty-input check. |
| Risk — Rejection and saved-look control | Accept the preferred work outfit, save it twice and reject the remaining trainer alternative. Apply the current exclusion logic. | Exclude the rejected combination, retain the accepted and saved look, and prevent duplicate saves. | The rejected ID was excluded. One accepted look and one saved look remained. Saving twice created one saved entry. No untried alternatives remained in this limited fixture. | Pass for state logic | Check the exhaustion message and persistence after refresh in the browser. Rejections intentionally reset when a new browsing session starts. |

### Interpretation

The checks support Wardrobe's early value as a way to explore owned clothes, select a daily context and retain control over suggestions. The preferred work combination and saved-look protections behave as intended in the tested logic. The Comfy accessory choice and the Office fallback reveal limits in suitability and explanation quality. These results justify further prototype testing, while broader usability, device persistence and performance remain open questions. Because styling is simulated through rules, these checks evaluate the implemented experience and prepared output logic. They do not establish the accuracy of a generative AI stylist.

## 3. Before-and-after comparison

| Same task | Earlier implementation | Revised implementation | Evidence and interpretation |
|---|---|---|---|
| Open a fresh wardrobe and request everyday outfit ideas without uploading photos | Running the original outfit function on an empty wardrobe returned zero suggestions. The earlier interface required clothing uploads before outfit suggestions appeared. | The current startup code adds 21 bundled clothing items. Running the current everyday recommendation function on those items returned three suggestions. | The original function was taken from the original uploaded project ZIP. The revised function was taken from the current branch. Both were executed in this comparison. Source inspection confirmed the new startup seeding. This addresses the peer-feedback barrier to trying the experience immediately. The full signed-out browser flow still needs its own final walkthrough. |

## 4. Remaining limitations and next priorities

Current limitations include garment-name-dependent colour and style inference, generic explanations, occasional unsuitable accessories, and incomplete knowledge of a user's dress code, garment fit or personal preferences. Personal uploads and saved outfits are stored in the current browser. Cross-device synchronization is unavailable, and clearing browser storage can remove personal data. Some reference-image details were reconstructed with AI and may differ from the originals.

My next three priorities are to improve workwear fallback wording and collect clearer clothing metadata, improve accessory compatibility and pattern explanations, and complete browser tests for refresh persistence, rapid rejection, repeated use and mobile usability.

## 5. Concrete risk response

An unsuitable suggestion could lead a user to over-rely on Wardrobe when dressing for a workplace or another situation with expectations the app does not understand. I added a way to reject a suggestion and request a different combination, keep accepted outfits visible, and separately save or remove looks in Dressed Wardrobe. These controls support user agency and reduce pressure to follow the first result. The risk test confirmed rejection exclusions, preservation of accepted and saved looks, and duplicate-save prevention in the current state logic. The challenge case also showed a remaining risk: a fallback outfit can still be described as polished despite missing workwear. The next response should make that limitation explicit at the recommendation itself and improve the suitability rules. The current safeguard is functional, but it cannot guarantee that an outfit meets a real dress code.

## 6. Draft AI-use disclosure

### Tools and contributions

I used ChatGPT and Replit Agent to help plan the interface, develop and revise code, diagnose preview and routing problems, prepare documentation, and check parts of the recommendation logic. ChatGPT's image-generation/editing feature helped isolate clothing and accessory references from screenshots. Some obscured image areas were reconstructed. This disclosure identifies the tools used without assuming an exact underlying model version.

### Representative prompts and revisions

| Prompt excerpt or close paraphrase | Contribution | My subsequent direction |
|---|---|---|
| “Add themes for the day such as Office / Work, Gym, Day Off and Comfy, then generate outfit selections.” | Helped develop the vibe selector and context-dependent outfit rules. | I specified the four vibes and retained the focus on clothes in the user's own wardrobe. |
| “Include loafers, the blue striped shirt and beige trousers in Work.” | Led to explicit workwear recognition and prioritization of that combination. | I selected the desired garments. The functional work test confirmed that this pairing ranks first. |
| “Regenerate outfits faster when I say no, and keep the ones I like in Dressed Wardrobe.” | Helped develop prepared alternatives, rejection tracking and saved-look controls. | I required rejected combinations to be excluded during the session and accepted looks to remain available. |

### Human judgment and corrections

I chose the product scope, clothing references, daily vibes and preferred work combination. I corrected an initial image-preparation result that included only seven of the 19 requested pieces, asking for the rest to be completed. I also asked for the main product flow to support rejection, faster replacement and saving favourites. These decisions shaped the prototype through my own review and feedback.

### Verification and unresolved work

Earlier Replit output reported successful build and typechecking. For this documentation update, five functional cases were executed against the current recommendation and state-update code, including two cases with partial results. An unauthenticated request to the public app returned HTTP 200 with the page title Wardrobe. That access check does not confirm every interactive feature. Full browser persistence, mobile interaction, actual response-time measurements and final video access still need checking. Generated clothing cutouts also need review for fidelity to the source references.

### AI inside the product

The intended AI task is to suggest useful outfits from a user's owned clothes and selected daily vibe, with understandable explanations and feedback controls. Intended inputs include garment information, wardrobe images, the selected vibe and user feedback. Intended outputs are outfit combinations and styling explanations. In the current implementation, images are displayed while deterministic rules infer style, colours and patterns from item names and categories. The app does not use a live generative styling model or automated image recognition. Rejection excludes particular combinations within the session. It does not train a personalized model. The benefit currently demonstrated is structured outfit exploration with user control. A future AI integration would need evaluation using its actual outputs.

## README integration

If this file is named `revision-and-ai-disclosure.md` in the repository root, add the following links to the README while keeping the existing product description, running instructions and historical test evidence.

```markdown
## Revision and evaluation

[Priority improvements, peer feedback, five functional tests, before-and-after comparison, limitations and risk response](revision-and-ai-disclosure.md)

## AI-use disclosure

[Tools, representative prompts, human decisions, verification and AI implementation status](revision-and-ai-disclosure.md#6-draft-ai-use-disclosure)
```

The current README's Google Drive URL opens the Drive homepage. Replace it with the video's actual file-sharing link under a `Demo Video` heading. Give both instructors Viewer access before submitting. The video-sharing link was not supplied for this documentation update.
