type SampleCategory = 'top' | 'bottom' | 'footwear' | 'layer' | 'one-piece' | 'accessory';
type SamplePiece = { id: string; name: string; category: SampleCategory; photo: string; createdAt: number };

const pieces: Array<Omit<SamplePiece, 'photo' | 'createdAt'> & { color: string }> = [
  { id: 'sample-top-blue-shirt', name: 'Blue cotton shirt', category: 'top', color: '#7E9EAD' },
  { id: 'sample-top-rust-knit', name: 'Rust knit tee', category: 'top', color: '#B96649' },
  { id: 'sample-top-olive-blouse', name: 'Olive blouse', category: 'top', color: '#829078' },
  { id: 'sample-top-stripe', name: 'Navy stripe top', category: 'top', color: '#53677B' },
  { id: 'sample-top-lilac', name: 'Lilac sweatshirt', category: 'top', color: '#A89DB9' },
  { id: 'sample-bottom-jeans', name: 'Straight blue jeans', category: 'bottom', color: '#526E87' },
  { id: 'sample-bottom-chinos', name: 'Sand chinos', category: 'bottom', color: '#B99D72' },
  { id: 'sample-bottom-charcoal', name: 'Charcoal trousers', category: 'bottom', color: '#565B60' },
  { id: 'sample-bottom-skirt', name: 'Denim midi skirt', category: 'bottom', color: '#66839A' },
  { id: 'sample-bottom-cream', name: 'Cream wide-leg trousers', category: 'bottom', color: '#C9BFAE' },
  { id: 'sample-dress-terracotta', name: 'Terracotta day dress', category: 'one-piece', color: '#B66D55' },
  { id: 'sample-dress-forest', name: 'Forest green dress', category: 'one-piece', color: '#617762' },
  { id: 'sample-shoes-trainers', name: 'Canvas trainers', category: 'footwear', color: '#E7E1D5' },
  { id: 'sample-shoes-loafers', name: 'Brown loafers', category: 'footwear', color: '#8A644B' },
  { id: 'sample-shoes-flats', name: 'Navy flats', category: 'footwear', color: '#48596E' },
  { id: 'sample-layer-denim', name: 'Denim jacket', category: 'layer', color: '#71879A' },
  { id: 'sample-layer-cardigan', name: 'Moss cardigan', category: 'layer', color: '#89907A' },
  { id: 'sample-accessory-tote', name: 'Canvas tote', category: 'accessory', color: '#B79B72' },
  { id: 'sample-accessory-scarf', name: 'Printed scarf', category: 'accessory', color: '#B9755D' },
];

function samplePhoto(category: SampleCategory, color: string) {
  const art: Record<SampleCategory, string> = {
    top: '<path d="M84 54 116 38l17 25 17-25 34 16 33 38-22 34-23-18v116H96V108l-24 18-22-34z"/>',
    bottom: '<path d="M70 42h100l-9 78 22 120h-50l-15-91-15 91H53l25-120z"/>',
    'one-piece': '<path d="m91 48 28-12 13 22 13-22 30 12 14 58-25 12 31 122H57l31-122-25-12z"/>',
    footwear: '<path d="m42 157 47-8 27-40 30 46 41 18q20 9 20 28H42z"/>',
    layer: '<path d="m82 54 34-16 17 25 17-25 34 16 31 39-23 34-20-17v117H94V110l-20 17-23-34z"/>',
    accessory: '<path d="M76 91h88l12 135H64z"/><path fill="none" stroke="#51483d" stroke-width="7" d="M91 94V75q0-30 29-30t29 30v19"/>',
  };
  const details = category === 'top' || category === 'layer'
    ? `<path fill="none" stroke="#F8F5EE" stroke-width="5" d="M133 65v160"/>`
    : category === 'bottom'
      ? `<path fill="none" stroke="#F8F5EE" stroke-width="4" d="M120 50v70"/>`
      : category === 'one-piece'
        ? `<path fill="none" stroke="#F8F5EE" stroke-width="4" d="M132 61v39"/>`
        : category === 'accessory' ? '' : `<path fill="none" stroke="#F8F5EE" stroke-width="4" d="M48 187h158"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="280" viewBox="0 0 240 280"><rect width="240" height="280" fill="#fbf9f4"/><g fill="${color}" stroke="#554f48" stroke-width="4" stroke-linejoin="round">${art[category]}</g>${details}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createSampleCloset(): SamplePiece[] {
  return pieces.map(({ color, ...piece }, index) => ({
    ...piece,
    photo: samplePhoto(piece.category, color),
    createdAt: Date.now() + index,
  }));
}
