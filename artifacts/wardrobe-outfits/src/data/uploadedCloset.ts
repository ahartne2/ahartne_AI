export type ClosetCategory = 'top' | 'bottom' | 'footwear' | 'layer' | 'one-piece' | 'accessory';
export type ClosetItem = { id: string; name: string; category: ClosetCategory; photo: string; createdAt: number };
export type StyleVibe = 'Office / Work' | 'Gym' | 'Day Off' | 'Comfy';
export type Outfit = { id: string; title: string; note: string; vibe: StyleVibe; items: ClosetItem[] };

const uploadedPieces: Array<[string, string, ClosetCategory, string]> = [
  ['uploaded-01-charcoal-hoodie', 'Charcoal hoodie', 'top', 'charcoal-hoodie.png'],
  ['uploaded-02-charcoal-sweatpants', 'Charcoal sweatpants', 'bottom', 'charcoal-sweatpants.png'],
  ['uploaded-03-charcoal-t-shirt', 'Charcoal T-shirt', 'top', 'charcoal-t-shirt.png'],
  ['uploaded-04-charcoal-crewneck', 'Charcoal crewneck', 'top', 'charcoal-crewneck.png'],
  ['uploaded-05-yellow-eme-knit', 'Yellow EME Studios knit', 'top', 'yellow-eme-studios-knit.png'],
  ['uploaded-06-cobalt-mock-neck', 'Cobalt mock-neck knit', 'top', 'cobalt-mock-neck-knit.png'],
  ['uploaded-07-navy-striped-collar-top', 'Navy striped blue-collar top', 'top', 'navy-striped-blue-collar-top.png'],
  ['uploaded-08-grey-pony-crewneck', 'Grey pony crewneck', 'top', 'grey-pony-crewneck.png'],
  ['uploaded-09-blue-supreme-hoodie', 'Blue Supreme hoodie', 'top', 'blue-supreme-hoodie.png'],
  ['uploaded-10-black-gold-quarter-zip', 'Black and gold Boston quarter-zip', 'top', 'black-gold-boston-quarter-zip.png'],
  ['uploaded-11-navy-pinstripe-trousers', 'Navy pinstripe trousers', 'bottom', 'navy-pinstripe-trousers.png'],
  ['uploaded-12-navy-cream-track-pants', 'Navy and cream stripe track pants', 'bottom', 'navy-cream-stripe-track-pants.png'],
  ['uploaded-13-red-berry-joggers', 'Red berry joggers', 'bottom', 'red-berry-joggers.png'],
  ['uploaded-14-black-white-track-pants', 'Black and white stripe track pants', 'bottom', 'black-white-stripe-track-pants.png'],
  ['uploaded-15-cream-black-salomon', 'Cream and black Salomon trainers', 'footwear', 'cream-black-salomon-trainers.png'],
  ['uploaded-16-brown-salomon-xt6', 'Brown Salomon XT-6 trainers', 'footwear', 'brown-salomon-xt-6-trainers.png'],
  ['uploaded-17-cream-blue-fringe-knit', 'Cream and blue fringe knit', 'top', 'cream-blue-fringe-knit.png'],
  ['uploaded-18-striped-yellow-long-sleeve', 'Striped yellow logo long-sleeve', 'top', 'striped-yellow-logo-long-sleeve.png'],
  ['uploaded-19-navy-suede-clogs', 'Navy suede Boston clogs', 'footwear', 'navy-suede-boston-clogs.png'],
];

export function createUploadedCloset(baseUrl: string): ClosetItem[] {
  return uploadedPieces.map(([id, name, category, file], index) => ({
    id,
    name,
    category,
    photo: `${baseUrl}wardrobe-items/${file}`,
    createdAt: 1_700_000_000_000 + index,
  }));
}

const colors = ['charcoal', 'black', 'navy', 'blue', 'cobalt', 'cream', 'yellow', 'red', 'berry', 'brown', 'grey', 'white'];
function itemColors(item: ClosetItem) {
  return colors.filter((color) => item.name.toLowerCase().includes(color));
}
function has(item: ClosetItem, pattern: RegExp) {
  return pattern.test(item.name.toLowerCase());
}
function vibeScore(items: ClosetItem[], vibe: StyleVibe) {
  const names = items.map((item) => item.name.toLowerCase()).join(' ');
  let score = 0;
  if (vibe === 'Office / Work') {
    if (/trouser|pinstripe/.test(names)) score += 7;
    if (/collar|quarter-zip|mock-neck|knit/.test(names)) score += 4;
    if (/hoodie|sweatpants|joggers|track pants/.test(names)) score -= 8;
  } else if (vibe === 'Gym') {
    if (/joggers|sweatpants|track pants/.test(names)) score += 7;
    if (/t-shirt|hoodie|trainers/.test(names)) score += 4;
    if (/pinstripe|trouser|clogs|knit/.test(names)) score -= 7;
  } else if (vibe === 'Comfy') {
    if (/hoodie|sweatpants|joggers|crewneck|knit/.test(names)) score += 6;
    if (/trainers|clogs/.test(names)) score += 2;
    if (/pinstripe/.test(names)) score -= 2;
  } else {
    if (/trouser|pinstripe|collar|quarter-zip|mock-neck/.test(names)) score += 4;
    if (/hoodie|sweatpants|joggers/.test(names)) score -= 2;
  }

  const top = items.find((item) => item.category === 'top');
  const bottom = items.find((item) => item.category === 'bottom');
  if (top && bottom) {
    const topColors = itemColors(top);
    const bottomColors = itemColors(bottom);
    const shared = topColors.some((color) => bottomColors.includes(color));
    const neutralPair = [...topColors, ...bottomColors].some((color) => ['black', 'charcoal', 'navy', 'cream', 'white', 'grey'].includes(color));
    score += shared ? 2 : neutralPair ? 1 : -1;
    const patterns = Number(has(top, /stripe|striped|pattern/)) + Number(has(bottom, /stripe|striped|pattern|pinstripe/));
    if (patterns > 1) score -= 3;
  }
  return score;
}

export function buildVibeOutfits(items: ClosetItem[], vibe: StyleVibe, excludedIds: string[] = [], limit = 3) {
  const tops = items.filter((item) => item.category === 'top');
  const bottoms = items.filter((item) => item.category === 'bottom');
  const shoes = items.filter((item) => item.category === 'footwear');
  const finishers = items.filter((item) => item.category === 'layer' || item.category === 'accessory');
  const bases: ClosetItem[][] = [];
  tops.forEach((top) => bottoms.forEach((bottom) => bases.push([top, bottom])));
  items.filter((item) => item.category === 'one-piece').forEach((piece) => bases.push([piece]));
  if (!bases.length) return [];

  const candidates: Outfit[] = [];
  bases.forEach((base) => {
    const shoeOptions: Array<ClosetItem | undefined> = shoes.length ? shoes : [undefined];
    const finishOptions: Array<ClosetItem | undefined> = finishers.length ? [undefined, ...finishers] : [undefined];
    shoeOptions.forEach((shoe) => finishOptions.forEach((finisher) => {
      const outfitItems = [...base, ...(shoe ? [shoe] : []), ...(finisher ? [finisher] : [])];
      const sortedIds = outfitItems.map((item) => item.id).sort();
      const signature = sortedIds.join('|');
      const title = vibe === 'Office / Work' ? 'Ready for the day' : vibe === 'Gym' ? 'Move-ready' : vibe === 'Comfy' ? 'Comfort first' : 'Easy day out';
      const shoeText = shoe ? 'with your uploaded shoes' : '';
      const extraText = finisher ? 'and a saved finishing piece' : '';
      const note = `${vibe === 'Office / Work' ? 'A polished, easy pairing' : vibe === 'Gym' ? 'A practical combination for movement' : vibe === 'Comfy' ? 'A soft, relaxed combination' : 'A relaxed everyday pairing'}${shoeText ? ` ${shoeText}` : ''}${extraText ? ` ${extraText}` : ''}.`;
      const id = `${vibe.toLowerCase().replace(/[^a-z]+/g, '-')}-${signature}`;
      if (!excludedIds.includes(id)) candidates.push({ id, title, note, vibe, items: outfitItems });
    }));
  });

  const selected: Outfit[] = [];
  const pool = candidates
    .map((outfit) => ({ outfit, score: vibeScore(outfit.items, vibe) }))
    .sort((a, b) => b.score - a.score || a.outfit.id.localeCompare(b.outfit.id));
  while (selected.length < limit && pool.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    pool.forEach(({ outfit, score }, index) => {
      const used = new Set(selected.flatMap((look) => look.items.map((item) => item.id)));
      const newPieces = outfit.items.filter((item) => !used.has(item.id)).length;
      const adjusted = score + newPieces * 0.6;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIndex = index;
      }
    });
    selected.push(pool.splice(bestIndex, 1)[0].outfit);
  }
  return selected;
}
