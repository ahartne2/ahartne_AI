import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Archive,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CloudUpload,
  Edit3,
  Footprints,
  Heart,
  Layers3,
  Loader2,
  Menu,
  MessageCircle,
  Plus,
  RefreshCcw,
  Save,
  Shirt,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';

type Category = 'top' | 'bottom' | 'footwear' | 'layer' | 'one-piece' | 'accessory';
type WardrobeItem = { id: string; name: string; category: Category; photo: string; createdAt: number };
type Feedback = { verdict: 'would' | 'wouldnt' | ''; reason: string };
type AppState = { items: WardrobeItem[]; saved: string[]; feedback: Record<string, Feedback> };
type Draft = { id?: string; name: string; category: Category; photo: string };

const DB_NAME = 'wardrobe-local-v1';
const STORE = 'app';
const MAX_ITEMS = 8;
const categories: { value: Category; label: string; short: string }[] = [
  { value: 'top', label: 'Top', short: 'tops' },
  { value: 'bottom', label: 'Bottom', short: 'bottoms' },
  { value: 'footwear', label: 'Footwear', short: 'shoes' },
  { value: 'layer', label: 'Layer', short: 'layers' },
  { value: 'one-piece', label: 'One-piece', short: 'one-piece' },
  { value: 'accessory', label: 'Accessory', short: 'accessories' },
];
const emptyState: AppState = { items: [], saved: [], feedback: {} };
const queryClient = new QueryClient();

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadState(): Promise<AppState> {
  if (!('indexedDB' in window)) return emptyState;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get('state');
    request.onsuccess = () => resolve(request.result || emptyState);
    request.onerror = () => reject(request.error);
  });
}

async function saveState(state: AppState) {
  if (!('indexedDB' in window)) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(state, 'state');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('That photo could not be read.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('That photo could not be opened.'));
      image.onload = () => {
        const scale = Math.min(1, 900 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Your browser could not prepare that photo.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const boardPhotoCache = new Map<string, Promise<string>>();

function trimBlankMargins(source: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(source);
    image.onload = () => {
      try {
        const scale = Math.min(1, 220 / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const analysis = document.createElement('canvas');
        analysis.width = width;
        analysis.height = height;
        const context = analysis.getContext('2d', { willReadFrequently: true });
        if (!context) return resolve(source);
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        const patch = Math.max(2, Math.round(Math.min(width, height) * 0.025));
        const sampleCorner = (left: number, top: number) => {
          let red = 0;
          let green = 0;
          let blue = 0;
          let count = 0;
          for (let y = top; y < Math.min(height, top + patch); y += 1) {
            for (let x = left; x < Math.min(width, left + patch); x += 1) {
              const offset = (y * width + x) * 4;
              red += pixels[offset];
              green += pixels[offset + 1];
              blue += pixels[offset + 2];
              count += 1;
            }
          }
          return [red / count, green / count, blue / count];
        };
        const corners = [
          sampleCorner(0, 0),
          sampleCorner(width - patch, 0),
          sampleCorner(0, height - patch),
          sampleCorner(width - patch, height - patch),
        ];
        const background = [0, 1, 2].map((channel) =>
          corners.reduce((sum, color) => sum + color[channel], 0) / corners.length,
        );
        const spread = [0, 1, 2].map((channel) =>
          Math.max(...corners.map((color) => color[channel])) - Math.min(...corners.map((color) => color[channel])),
        );
        if (Math.max(...spread) > 34) return resolve(source);

        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;
        let foregroundPixels = 0;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * 4;
            const alpha = pixels[offset + 3];
            const difference = Math.max(
              Math.abs(pixels[offset] - background[0]),
              Math.abs(pixels[offset + 1] - background[1]),
              Math.abs(pixels[offset + 2] - background[2]),
            );
            if (alpha > 12 && difference > 28) {
              foregroundPixels += 1;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        const boxWidth = maxX - minX + 1;
        const boxHeight = maxY - minY + 1;
        const boxArea = boxWidth * boxHeight;
        if (
          foregroundPixels < width * height * 0.035 ||
          boxWidth < width * 0.18 ||
          boxHeight < height * 0.22 ||
          boxArea < width * height * 0.1
        ) return resolve(source);

        const padX = Math.max(Math.round(width * 0.01), Math.round(boxWidth * 0.065));
        const padY = Math.max(Math.round(height * 0.01), Math.round(boxHeight * 0.065));
        const scaleX = image.naturalWidth / width;
        const scaleY = image.naturalHeight / height;
        const left = Math.max(0, Math.floor((minX - padX) * scaleX));
        const top = Math.max(0, Math.floor((minY - padY) * scaleY));
        const right = Math.min(image.naturalWidth, Math.ceil((maxX + 1 + padX) * scaleX));
        const bottom = Math.min(image.naturalHeight, Math.ceil((maxY + 1 + padY) * scaleY));
        const cropWidth = right - left;
        const cropHeight = bottom - top;
        if (cropWidth >= image.naturalWidth * 0.96 && cropHeight >= image.naturalHeight * 0.96) return resolve(source);

        const cropped = document.createElement('canvas');
        cropped.width = cropWidth;
        cropped.height = cropHeight;
        const cropContext = cropped.getContext('2d');
        if (!cropContext) return resolve(source);
        cropContext.drawImage(image, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        resolve(cropped.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(source);
      }
    };
    image.src = source;
  });
}

function getBoardPhoto(source: string): Promise<string> {
  let cached = boardPhotoCache.get(source);
  if (!cached) {
    if (boardPhotoCache.size >= 24) boardPhotoCache.clear();
    cached = trimBlankMargins(source);
    boardPhotoCache.set(source, cached);
  }
  return cached;
}

function BoardPhoto({ item, lookId }: { item: WardrobeItem; lookId: string }) {
  const [displayPhoto, setDisplayPhoto] = useState(item.photo);
  useEffect(() => {
    let current = true;
    setDisplayPhoto(item.photo);
    getBoardPhoto(item.photo).then((photo) => {
      if (current) setDisplayPhoto(photo);
    });
    return () => { current = false; };
  }, [item.photo]);
  return <img data-testid={`img-outfit-item-${lookId}-${item.id}`} src={displayPhoto} alt={item.name} />;
}

function categoryLabel(category: Category) {
  return categories.find((item) => item.value === category)?.label || category;
}

function IconForCategory({ category }: { category: Category }) {
  if (category === 'footwear') return <Footprints size={16} strokeWidth={1.8} />;
  if (category === 'layer') return <Layers3 size={16} strokeWidth={1.8} />;
  return <Shirt size={16} strokeWidth={1.8} />;
}

function buildOutfits(items: WardrobeItem[]) {
  const tops = items.filter((item) => item.category === 'top');
  const bottoms = items.filter((item) => item.category === 'bottom');
  const footwear = items.filter((item) => item.category === 'footwear');
  const onePieces = items.filter((item) => item.category === 'one-piece');
  const finishingPieces = items.filter((item) => item.category === 'layer' || item.category === 'accessory');
  const bases: WardrobeItem[][] = [];
  tops.forEach((top) => {
    bottoms.forEach((bottom) => bases.push([top, bottom]));
  });
  onePieces.forEach((item) => bases.push([item]));
  if (!bases.length) return [];

  const shoeOptions: Array<WardrobeItem | undefined> = footwear.length ? footwear : [undefined];
  const finishingOptions: Array<WardrobeItem | undefined> = finishingPieces.length ? finishingPieces : [undefined];
  const candidates: WardrobeItem[][] = [];
  bases.forEach((base) => {
    shoeOptions.forEach((shoe) => {
      finishingOptions.forEach((finishingPiece) => {
        candidates.push([
          ...base,
          ...(shoe ? [shoe] : []),
          ...(finishingPiece ? [finishingPiece] : []),
        ]);
      });
    });
  });

  const picked: WardrobeItem[][] = [];
  const signatures = new Set<string>();
  candidates.forEach((candidate) => {
    if (picked.length >= 3) return;
    const signature = candidate.map((item) => item.id).sort().join('|');
    if (!signatures.has(signature)) {
      signatures.add(signature);
      picked.push(candidate);
    }
  });
  const titles = ['Easy day out', 'A little remix', 'The laid-back one'];
  return picked.map((itemsInLook, index) => {
    const hasOnePiece = itemsInLook.some((item) => item.category === 'one-piece');
    const finishers = [
      ...(itemsInLook.some((item) => item.category === 'footwear') ? ['your saved shoes'] : []),
      ...(itemsInLook.some((item) => item.category === 'layer') ? ['your uploaded outerwear'] : []),
      ...(itemsInLook.some((item) => item.category === 'accessory') ? ['your uploaded accessory'] : []),
    ];
    const finishText = finishers.length ? `, finished with ${finishers.join(' and ')}` : ', kept simple with the pieces you saved';
    const note = `${hasOnePiece ? 'An easy one-piece base' : 'A relaxed top-and-bottom pairing'}${finishText}.`;
    return {
      id: `look-${itemsInLook.map((item) => item.id).sort().join('--')}`,
      title: titles[index],
      note,
      items: itemsInLook,
    };
  });
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={WardrobeHome} />
              <Route path="/__board-layout-check" component={BoardLayoutCheck} />
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function WardrobeHome() {
  const [state, setState] = useState<AppState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [activeView, setActiveView] = useState<'outfits' | 'wardrobe'>('outfits');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const outfits = useMemo(() => buildOutfits(state.items), [state.items]);
  const savedCount = state.saved.length;

  useEffect(() => {
    loadState().then((value) => {
      setState(value);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveState(state).catch(() => setToast('Could not save locally. Try again.'));
  }, [state, loaded]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateFeedback = (lookId: string, feedback: Feedback) => {
    setState((current) => ({ ...current, feedback: { ...current.feedback, [lookId]: feedback } }));
    setToast('Your note is tucked away.');
  };
  const toggleSaved = (lookId: string) => {
    setState((current) => ({
      ...current,
      saved: current.saved.includes(lookId) ? current.saved.filter((id) => id !== lookId) : [...current.saved, lookId],
    }));
    setToast(state.saved.includes(lookId) ? 'Removed from saved looks.' : 'Saved for later.');
  };
  const removeItem = (id: string) => {
    if (!window.confirm('Remove this piece from your wardrobe?')) return;
    setState((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
    setToast('Piece removed.');
  };

  if (!loaded) return <LoadingState />;

  return (
    <div className="paper-grain min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-sidebar px-7 py-8 text-sidebar-foreground md:flex">
        <button type="button" data-testid="button-brand" onClick={() => { setActiveView('outfits'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="focus-ring flex items-center gap-3 text-left">
          <span className="grid size-10 place-items-center rounded-[14px] bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><Shirt size={21} /></span>
          <span><span className="block font-serif text-[22px] leading-none">Wardrobe</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/60">your daily edit</span></span>
        </button>
        <div className="mt-16">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/45">Your space</p>
          <nav className="space-y-1" aria-label="Main navigation">
            <NavButton active={activeView === 'outfits'} onClick={() => setActiveView('outfits')} icon={<Sparkles size={17} />} label="Today’s edit" testId="nav-outfits" />
            <NavButton active={activeView === 'wardrobe'} onClick={() => setActiveView('wardrobe')} icon={<Archive size={17} />} label="My wardrobe" testId="nav-wardrobe" />
          </nav>
        </div>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/55">closet progress</span>
            <span className="font-mono text-xs text-sidebar-primary">{state.items.length}/{MAX_ITEMS}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sidebar-foreground/10"><div className="h-full rounded-full bg-sidebar-primary transition-all duration-500" style={{ width: `${(state.items.length / MAX_ITEMS) * 100}%` }} /></div>
          <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/65">A small, considered closet is plenty.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/92 px-5 py-4 backdrop-blur-md md:hidden">
        <button type="button" data-testid="button-mobile-brand" onClick={() => setActiveView('outfits')} className="focus-ring flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Shirt size={18} /></span><span className="font-serif text-xl">Wardrobe</span>
        </button>
        <button type="button" data-testid="button-mobile-menu" aria-label="Open menu" onClick={() => setMobileMenu((open) => !open)} className="focus-ring rounded-xl p-2 text-muted-foreground"><Menu size={21} /></button>
      </header>
      {mobileMenu && <div className="fixed right-4 top-[70px] z-30 rounded-2xl border border-border bg-card p-2 shadow-lg md:hidden"><NavButton active={activeView === 'outfits'} onClick={() => { setActiveView('outfits'); setMobileMenu(false); }} icon={<Sparkles size={16} />} label="Today’s edit" testId="mobile-nav-outfits" /><NavButton active={activeView === 'wardrobe'} onClick={() => { setActiveView('wardrobe'); setMobileMenu(false); }} icon={<Archive size={16} />} label="My wardrobe" testId="mobile-nav-wardrobe" /></div>}

      <main className="min-h-[100dvh] md:ml-[248px]">
        <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-8 sm:px-8 md:px-12 md:pt-12">
          <div className="mb-10 flex items-end justify-between gap-5">
            <div className="wardrobe-rise">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground"><span className="size-1.5 rounded-full bg-accent" /> {activeView === 'outfits' ? 'A little direction' : 'Pieces you already love'}</p>
              <h1 data-testid="text-page-title" className="max-w-2xl font-serif text-[clamp(2.7rem,6vw,5rem)] leading-[.96] tracking-[-.045em]">{activeView === 'outfits' ? <>Get dressed,<br /><em className="text-primary/75">your way.</em></> : <>The good<br /><em className="text-primary/75">stuff.</em></>}</h1>
            </div>
            <div className="hidden text-right sm:block wardrobe-rise delay-1"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">saved looks</p><p data-testid="text-saved-count" className="mt-1 font-serif text-3xl">{String(savedCount).padStart(2, '0')}</p></div>
          </div>

          {activeView === 'outfits' ? (
            <OutfitView items={state.items} outfits={outfits} saved={state.saved} feedback={state.feedback} onToggleSaved={toggleSaved} onFeedback={updateFeedback} onAdd={() => { setEditingId(null); setModal('add'); }} onReview={() => setActiveView('wardrobe')} />
          ) : (
            <WardrobeView items={state.items} onAdd={() => { setEditingId(null); setModal('add'); }} onEdit={(id) => { setEditingId(id); setModal('edit'); }} onRemove={removeItem} onBack={() => setActiveView('outfits')} />
          )}
        </div>
      </main>
      {modal && <ItemModal mode={modal} existing={editingId ? state.items.find((item) => item.id === editingId) : undefined} remaining={MAX_ITEMS - state.items.length + (editingId ? 1 : 0)} onClose={() => setModal(null)} onSave={(drafts) => {
        setState((current) => {
          const next = drafts.map((draft) => ({ id: draft.id || uid('piece'), name: draft.name.trim(), category: draft.category, photo: draft.photo, createdAt: Date.now() }));
          const withoutEdit = editingId ? current.items.filter((item) => item.id !== editingId) : current.items;
          return { ...current, items: [...withoutEdit, ...next] };
        });
        setModal(null); setToast(editingId ? 'Piece updated.' : `${drafts.length} ${drafts.length === 1 ? 'piece' : 'pieces'} added.`);
      }} />}
      {toast && <div role="status" data-testid="status-toast" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm text-primary-foreground shadow-xl wardrobe-pop"><CheckCircle2 size={16} />{toast}</div>}
    </div>
  );
}

function NavButton({ active, onClick, icon, label, testId }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; testId: string }) {
  return <button type="button" data-testid={testId} onClick={onClick} className={`focus-ring flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/58 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}><span className={active ? 'text-sidebar-primary' : ''}>{icon}</span>{label}{active && <ArrowRight size={14} className="ml-auto opacity-50" />}</button>;
}

function LoadingState() {
  return <div className="min-h-[100dvh] bg-background p-6 md:pl-[280px] md:pt-16"><div className="mx-auto max-w-4xl animate-pulse space-y-6"><div className="h-4 w-28 rounded-full bg-muted" /><div className="h-28 w-2/3 rounded-3xl bg-muted" /><div className="grid gap-4 md:grid-cols-3"><div className="h-60 rounded-3xl bg-muted" /><div className="h-60 rounded-3xl bg-muted" /><div className="h-60 rounded-3xl bg-muted" /></div></div></div>;
}

type Look = ReturnType<typeof buildOutfits>[number];
function OutfitView({ items, outfits, saved, feedback, onToggleSaved, onFeedback, onAdd, onReview }: { items: WardrobeItem[]; outfits: Look[]; saved: string[]; feedback: Record<string, Feedback>; onToggleSaved: (id: string) => void; onFeedback: (id: string, feedback: Feedback) => void; onAdd: () => void; onReview: () => void }) {
  const counts = categories.map((category) => ({ ...category, count: items.filter((item) => item.category === category.value).length })).filter((category) => category.count);
  return <div className="space-y-10">
    <section className="wardrobe-rise rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_50px_-35px_hsl(214_27%_18%/.45)] sm:p-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-accent-foreground/70">your closet, not a catalog</p><h2 className="max-w-lg font-serif text-3xl leading-tight sm:text-4xl">Hand-prepared ideas for an ordinary good day.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Every look below is made only from your saved pieces. No shopping, no guessing — just a little help seeing what is already there.</p></div>
        <button type="button" data-testid="button-review-wardrobe" onClick={onReview} className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition hover:bg-muted">Review wardrobe <ArrowRight size={16} /></button>
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-border/70 pt-5">{counts.length ? counts.map((item) => <span key={item.value} data-testid={`badge-category-${item.value}`} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground"><IconForCategory category={item.value} />{item.count} {item.short}</span>) : <span className="text-xs text-muted-foreground">Your closet is waiting for its first piece.</span>}<span className="ml-auto font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground">{items.length}/{MAX_ITEMS} pieces</span></div>
    </section>

    {outfits.length < 3 ? <NeedMoreState items={items} onAdd={onAdd} limited={outfits.length > 0} /> : <section aria-label="Curated outfit ideas">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">the edit</p><h2 className="mt-1 font-serif text-3xl">Three ways to go.</h2><p data-testid="text-prototype-label" className="mt-2 inline-flex rounded-full bg-accent/40 px-3 py-1.5 text-xs font-semibold text-foreground">Prototype suggestions — AI styling is simulated.</p></div><span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><CircleHelp size={15} /> Built from your closet</span></div>
      <div className="grid gap-5 lg:grid-cols-3">{outfits.map((outfit, index) => <OutfitCard key={outfit.id} look={outfit} index={index} isSaved={saved.includes(outfit.id)} feedback={feedback[outfit.id] || { verdict: '', reason: '' }} onToggleSaved={() => onToggleSaved(outfit.id)} onFeedback={(value) => onFeedback(outfit.id, value)} />)}</div>
    </section>}

    {saved.length > 0 && <section data-testid="section-saved-summary" className="rounded-[24px] border border-border bg-primary px-6 py-5 text-primary-foreground sm:flex sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-primary-foreground/10"><Heart size={18} fill="currentColor" /></span><div><p className="font-semibold">{saved.length} {saved.length === 1 ? 'look' : 'looks'} saved for later</p><p className="text-xs text-primary-foreground/65">Your little shortlist, kept on this device.</p></div></div><button type="button" data-testid="button-view-saved" onClick={() => document.getElementById('saved-anchor')?.scrollIntoView({ behavior: 'smooth' })} className="focus-ring mt-4 inline-flex items-center gap-2 text-sm font-semibold underline decoration-primary-foreground/35 underline-offset-4 sm:mt-0">See them in the edit <ArrowRight size={15} /></button></section>}
    <div id="saved-anchor" className="h-px" />
  </div>;
}

function NeedMoreState({ items, onAdd, limited = false }: { items: WardrobeItem[]; onAdd: () => void; limited?: boolean }) {
  const hasTop = items.some((item) => item.category === 'top');
  const hasBottom = items.some((item) => item.category === 'bottom');
  const hasOnePiece = items.some((item) => item.category === 'one-piece');
  const missing: string[] = [];
  if (!hasTop && !hasOnePiece) missing.push('a top');
  if (!hasBottom && !hasOnePiece) missing.push('a bottom');
  const hasBase = hasOnePiece || (hasTop && hasBottom);
  const title = limited ? 'Almost enough for a proper edit.' : hasBase ? 'A little more variety will help.' : 'Let’s start with the essentials.';
  const description = limited
    ? 'Three distinct looks need more variety in your top, bottom, one-piece, footwear, or layer/accessory categories. Add another piece to make a new combination. Only uploaded pieces are ever shown.'
    : hasBase
      ? 'Your closet has a complete base, but not enough different combinations yet. Add another piece in a top, bottom, one-piece, footwear, or layer/accessory category. We’ll only use items you add.'
      : `Add ${missing.length ? missing.join(' and ') : 'a top and bottom, or a one-piece'} to create a complete base. Footwear, outerwear, and accessories are optional; they appear only if you add them.`;
  return <section data-testid="state-needs-more" className="overflow-hidden rounded-[28px] border border-dashed border-border bg-secondary/45 p-7 sm:p-10"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><span className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Sparkles size={20} /></span><h2 className="font-serif text-3xl">{title}</h2><p data-testid="text-missing-category" className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p><button type="button" data-testid="button-add-first-piece" onClick={onAdd} className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"><Plus size={17} /> Add a piece</button></div><div className="relative mx-auto flex size-44 items-center justify-center rounded-full border border-border bg-card md:mr-10"><div className="absolute inset-5 rounded-full border border-dashed border-border" /><Shirt size={45} strokeWidth={1.2} className="text-primary/70" /></div></div></section>;
}

function OutfitCard({ look, index, isSaved, feedback, onToggleSaved, onFeedback }: { look: Look; index: number; isSaved: boolean; feedback: Feedback; onToggleSaved: () => void; onFeedback: (feedback: Feedback) => void }) {
  const [reason, setReason] = useState(feedback.reason);
  const [reasonError, setReasonError] = useState('');
  useEffect(() => setReason(feedback.reason), [feedback.reason]);
  const submitReason = (event: FormEvent) => {
    event.preventDefault();
    if (!feedback.verdict) {
      setReasonError('Choose “Would wear” or “Wouldn’t wear” first.');
      return;
    }
    if (!reason.trim()) {
      setReasonError('Add a short reason for your choice.');
      return;
    }
    setReasonError('');
    onFeedback({ ...feedback, reason: reason.trim() });
  };
  const onePiece = look.items.find((item) => item.category === 'one-piece');
  const top = look.items.find((item) => item.category === 'top');
  const bottom = look.items.find((item) => item.category === 'bottom');
  const finishingItems = look.items.filter((item) => item.category === 'footwear' || item.category === 'layer' || item.category === 'accessory');
  const renderItem = (item: WardrobeItem, position: string) => (
    <figure key={item.id} data-testid={`figure-outfit-item-${look.id}-${item.id}`} className={`outfit-board-piece outfit-board-piece-${position}`}>
      <BoardPhoto item={item} lookId={look.id} />
    </figure>
  );
  return <article data-testid={`card-outfit-${look.id}`} className="group overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_12px_35px_-28px_hsl(214_27%_18%/.7)] transition hover:-translate-y-1 hover:shadow-[0_22px_45px_-28px_hsl(214_27%_18%/.55)] wardrobe-rise" style={{ animationDelay: `${index * 90}ms` }}>
    <div data-testid={`collage-outfit-${look.id}`} className={`outfit-board ${onePiece ? 'outfit-board-one-piece' : ''} ${finishingItems.length ? 'outfit-board-with-extras' : ''}`}>
      {onePiece ? renderItem(onePiece, 'one-piece') : <>{top && renderItem(top, 'top')}{bottom && renderItem(bottom, 'bottom')}</>}
      {finishingItems.length > 0 && <aside className="outfit-board-extras" aria-label="Optional pieces in this outfit">{finishingItems.map((item) => renderItem(item, item.category))}</aside>}
    </div>
    <div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">look 0{index + 1}</p><h3 data-testid={`text-outfit-title-${look.id}`} className="mt-1 font-serif text-2xl">{look.title}</h3><p data-testid={`text-outfit-explanation-${look.id}`} className="mt-1 text-xs leading-relaxed text-muted-foreground">{look.note}</p></div><button type="button" data-testid={`button-save-outfit-${look.id}`} aria-label={isSaved ? `Unsave ${look.title}` : `Save ${look.title}`} onClick={onToggleSaved} className={`focus-ring grid size-10 shrink-0 place-items-center rounded-full border transition ${isSaved ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-accent hover:text-foreground'}`}><Heart size={17} fill={isSaved ? 'currentColor' : 'none'} /></button></div>
      <div className="mt-5 space-y-2 border-t border-border/70 pt-4">{look.items.map((item) => <div key={item.id} className="flex items-center justify-between text-xs"><span className="font-medium">{item.name}</span><span className="text-muted-foreground">{categoryLabel(item.category)}</span></div>)}</div>
      <div className="mt-5 rounded-2xl bg-muted/70 p-3.5"><div className="mb-3 flex items-center gap-2 text-xs font-semibold"><MessageCircle size={15} className="text-primary/70" /> Your take</div><div className="grid grid-cols-2 gap-2"><button type="button" data-testid={`button-would-wear-${look.id}`} onClick={() => { setReasonError(''); onFeedback({ ...feedback, verdict: 'would' }); }} className={`focus-ring min-h-10 rounded-xl border text-xs font-semibold transition ${feedback.verdict === 'would' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-secondary'}`}><Check size={14} className="mr-1 inline" /> Would wear</button><button type="button" data-testid={`button-wouldnt-wear-${look.id}`} onClick={() => { setReasonError(''); onFeedback({ ...feedback, verdict: 'wouldnt' }); }} className={`focus-ring min-h-10 rounded-xl border text-xs font-semibold transition ${feedback.verdict === 'wouldnt' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-secondary'}`}><X size={14} className="mr-1 inline" /> Wouldn’t wear</button></div><form onSubmit={submitReason} className="mt-2 flex gap-2"><label htmlFor={`reason-${look.id}`} className="sr-only">Short reason for your choice</label><input id={`reason-${look.id}`} data-testid={`input-reason-${look.id}`} value={reason} onChange={(event) => { setReason(event.target.value); setReasonError(''); }} maxLength={120} placeholder="Add a short reason" aria-invalid={Boolean(reasonError)} className="focus-ring min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-xs outline-none placeholder:text-muted-foreground/70" /><button type="submit" data-testid={`button-save-feedback-${look.id}`} className="focus-ring grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary transition hover:bg-secondary" aria-label="Save your response"><Save size={15} /></button></form>{reasonError && <p role="alert" data-testid={`status-feedback-error-${look.id}`} className="mt-2 text-xs text-destructive">{reasonError}</p>}</div>
    </div>
  </article>;
}

function BoardLayoutCheck() {
  const svgPhoto = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
  const items: WardrobeItem[] = [
    {
      id: 'check-shirt',
      name: 'Soft blue shirt',
      category: 'top',
      createdAt: 0,
      photo: svgPhoto('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400" viewBox="0 0 320 400"><rect width="320" height="400" fill="white"/><path fill="#83A8B5" d="M112 82 145 65l15 25 15-25 34 17 38 34-24 54-31-16v165H128V154l-32 16-24-54z"/><path fill="#F3F5F4" d="m145 65 15 25 15-25-15 8z"/><path stroke="#648895" stroke-width="4" d="M160 95v215"/></svg>'),
    },
    {
      id: 'check-trousers',
      name: 'Relaxed navy trousers',
      category: 'bottom',
      createdAt: 0,
      photo: svgPhoto('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400" viewBox="0 0 320 400"><rect width="320" height="400" fill="white"/><path fill="#35485C" d="M91 54h138l-10 105 27 188-76 5-10-147-11 147-76-5 28-188z"/><path fill="none" stroke="#536578" stroke-width="4" d="M160 61v143"/></svg>'),
    },
    {
      id: 'check-shoes',
      name: 'White trainers',
      category: 'footwear',
      createdAt: 0,
      photo: svgPhoto('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180"><rect width="360" height="180" fill="white"/><path fill="#E9E4D9" stroke="#A89F91" stroke-width="5" d="M37 90 95 82l34-43 35 58 61 25q25 10 27 29H37zM195 94l47-7 32-36 32 45 33 19q16 8 16 24H195z"/><path fill="none" stroke="#A89F91" stroke-width="4" d="M52 140h185m-30 0h148"/></svg>'),
    },
  ];
  const look: Look = {
    id: 'layout-check',
    title: 'Easy day out',
    note: 'A relaxed top-and-bottom pairing, finished with your saved shoes.',
    items,
  };

  return <main className="min-h-screen bg-background px-4 py-5 sm:px-8">
    <div className="mx-auto max-w-[360px]">
      <p className="mb-3 font-mono text-xs uppercase tracking-[.15em] text-muted-foreground">temporary board layout check</p>
      <OutfitCard look={look} index={0} isSaved={false} feedback={{ verdict: '', reason: '' }} onToggleSaved={() => {}} onFeedback={() => {}} />
    </div>
  </main>;
}

function WardrobeView({ items, onAdd, onEdit, onRemove, onBack }: { items: WardrobeItem[]; onAdd: () => void; onEdit: (id: string) => void; onRemove: (id: string) => void; onBack: () => void }) {
  return <div className="space-y-7 wardrobe-rise"><div className="flex flex-col justify-between gap-5 rounded-[28px] border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">your pieces stay yours</p><h2 className="font-serif text-3xl">A closet with a point of view.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Add a photo, give it a name, choose a category. Everything is saved privately in this browser.</p></div><div className="flex flex-col gap-2 sm:flex-row"><button type="button" data-testid="button-suggestions-from-wardrobe" onClick={onBack} className="focus-ring inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-secondary"><Sparkles size={16} /> Outfit suggestions</button><button type="button" data-testid="button-add-piece" onClick={onAdd} disabled={items.length >= MAX_ITEMS} className="focus-ring inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"><Plus size={17} /> {items.length >= MAX_ITEMS ? 'Wardrobe complete' : 'Add a piece'}</button></div></div>
    {items.length === 0 ? <div data-testid="state-empty-wardrobe" className="rounded-[28px] border border-dashed border-border p-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><Camera size={24} /></div><h3 className="mt-5 font-serif text-2xl">The first hanger is yours.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">One photo at a time, build the little wardrobe you actually reach for.</p><button type="button" data-testid="button-add-empty-piece" onClick={onAdd} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-4 text-sm font-semibold text-primary"><Plus size={16} /> Add your first piece</button></div> : <div data-testid="grid-wardrobe" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{items.map((item) => <div key={item.id} data-testid={`card-wardrobe-item-${item.id}`} className="group overflow-hidden rounded-[20px] border border-border bg-card"><div className="photo-checker relative aspect-[.82] overflow-hidden"><img src={item.photo} alt={item.name} className="size-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100"><button type="button" data-testid={`button-edit-item-${item.id}`} onClick={() => onEdit(item.id)} className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-full bg-card/95 px-3 text-[11px] font-semibold shadow-sm"><Edit3 size={13} /> Edit</button><button type="button" data-testid={`button-remove-item-${item.id}`} onClick={() => onRemove(item.id)} className="focus-ring grid size-9 place-items-center rounded-full bg-card/95 text-destructive shadow-sm" aria-label={`Remove ${item.name}`}><Trash2 size={14} /></button></div></div><div className="p-3"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><IconForCategory category={item.category} />{categoryLabel(item.category)}</p></div></div>)}</div>}
    <div className="flex items-center justify-between border-t border-border/70 pt-5"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">{items.length} of {MAX_ITEMS} pieces saved locally</p><button type="button" data-testid="button-back-to-edit" onClick={onBack} className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-primary">See outfit suggestions <ArrowRight size={15} /></button></div>
  </div>;
}

function ItemModal({ mode, existing, remaining, onClose, onSave }: { mode: 'add' | 'edit'; existing?: WardrobeItem; remaining: number; onClose: () => void; onSave: (drafts: Draft[]) => void }) {
  const [drafts, setDrafts] = useState<Draft[]>(existing ? [{ id: existing.id, name: existing.name, category: existing.category, photo: existing.photo }] : []);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(''); setProcessing(true);
    try {
      const chosen = Array.from(files).slice(0, mode === 'edit' ? 1 : remaining);
      const prepared = await Promise.all(chosen.map(async (file) => ({ name: '', category: 'top' as Category, photo: await compressPhoto(file) })));
      setDrafts((current) => mode === 'edit' ? [{ ...current[0], ...prepared[0] }] : prepared);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That photo could not be added.');
    } finally { setProcessing(false); }
  };
  const updateDraft = (index: number, patch: Partial<Draft>) => setDrafts((current) => current.map((draft, draftIndex) => draftIndex === index ? { ...draft, ...patch } : draft));
  const valid = drafts.length > 0 && drafts.every((draft) => draft.name.trim() && draft.photo);
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div role="dialog" aria-modal="true" aria-labelledby="item-modal-title" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-card p-5 shadow-2xl sm:max-w-2xl sm:rounded-[28px] sm:p-7"><div className="mb-6 flex items-start justify-between"><div><p className="mb-1 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">{mode === 'edit' ? 'make a change' : 'add to the edit'}</p><h2 id="item-modal-title" className="font-serif text-3xl">{mode === 'edit' ? 'Edit this piece' : 'Bring in your pieces'}</h2><p className="mt-1 text-sm text-muted-foreground">{mode === 'edit' ? 'Keep the label honest and useful.' : `Up to ${remaining} ${remaining === 1 ? 'piece' : 'pieces'} at a time.`}</p></div><button type="button" data-testid="button-close-item-modal" onClick={onClose} className="focus-ring grid size-10 place-items-center rounded-full bg-muted text-muted-foreground"><X size={18} /></button></div>
    {!drafts.length ? <button type="button" data-testid="button-choose-photos" onClick={() => inputRef.current?.click()} className="focus-ring flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-secondary/50 px-5 text-center transition hover:bg-secondary"><span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><CloudUpload size={23} /></span><span className="mt-4 text-sm font-semibold">Choose photos from your device</span><span className="mt-1 text-xs text-muted-foreground">Camera and photo library supported · JPG, PNG or HEIC</span><span className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold"><Upload size={14} /> Browse photos</span></button> : <div className="space-y-4">{drafts.map((draft, index) => <div key={draft.id || index} data-testid={`form-piece-${index}`} className="grid gap-4 rounded-2xl border border-border bg-secondary/35 p-3 sm:grid-cols-[112px_1fr]"><div className="relative aspect-square overflow-hidden rounded-xl bg-muted">{draft.photo && <img src={draft.photo} alt="" className="size-full object-cover" />}{processing && <div className="absolute inset-0 grid place-items-center bg-card/70"><Loader2 size={20} className="animate-spin text-primary" /></div>}<button type="button" data-testid={`button-replace-photo-${index}`} onClick={() => { inputRef.current?.click(); }} className="focus-ring absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1.5 text-[10px] font-semibold shadow-sm"><RefreshCcw size={12} /> Replace</button></div><div className="space-y-3"><div><label htmlFor={`piece-name-${index}`} className="mb-1.5 block text-xs font-semibold">What do you call it?</label><input id={`piece-name-${index}`} data-testid={`input-piece-name-${index}`} value={draft.name} onChange={(event) => updateDraft(index, { name: event.target.value })} maxLength={40} placeholder="e.g. Navy knit" className="focus-ring min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none" /></div><div><label htmlFor={`piece-category-${index}`} className="mb-1.5 block text-xs font-semibold">Category</label><select id={`piece-category-${index}`} data-testid={`select-piece-category-${index}`} value={draft.category} onChange={(event) => updateDraft(index, { category: event.target.value as Category })} className="focus-ring min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none">{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></div></div></div>)}</div>}
    <input ref={inputRef} type="file" accept="image/*" multiple={mode === 'add'} onChange={(event) => handleFiles(event.target.files)} className="sr-only" data-testid="input-photo-upload" />
    {drafts.length > 0 && <button type="button" data-testid="button-add-more-photos" onClick={() => inputRef.current?.click()} disabled={mode === 'edit' || drafts.length >= remaining} className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"><Plus size={14} /> Add more photos</button>}
    {error && <p role="alert" data-testid="status-upload-error" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
    <div className="mt-7 flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end"><button type="button" data-testid="button-cancel-item" onClick={onClose} className="focus-ring min-h-11 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button><button type="button" data-testid="button-save-item" disabled={!valid || processing} onClick={() => onSave(drafts)} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{mode === 'edit' ? 'Save changes' : 'Save to wardrobe'}</button></div>
  </div></div>;
}

export default App;