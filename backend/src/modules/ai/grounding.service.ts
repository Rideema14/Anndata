import prisma from '../../config/prisma';
import logger from '../../common/utils/logger';

/**
 * Cheap, deterministic "which parts of our own data does this question
 * touch" detection — plain keyword matching in Hindi/English/Hinglish, not
 * another AI call. A voice assistant reply that has to wait on a second
 * model call just to decide whether to look something up would defeat the
 * point of keeping this fast; a regex is effectively instant.
 *
 * More than one category can match the same message (e.g. "seed aur
 * tractor dono ka price batao" should look up both seeds and machinery), so
 * every category is checked independently rather than picking just one.
 */
type GroundingKind = 'machinery' | 'land' | 'seed' | 'product' | 'mandi';

const KIND_KEYWORDS: Record<GroundingKind, RegExp> = {
  machinery:
    /tractor|harvester|rotavator|rotovator|thresher|cultivator|plough|plow|tiller|sprayer\b|machinery|implement|equipment|ट्रैक्टर|हार्वेस्टर|मशीनरी|यंत्र|किराय/i,
  land: /\bland\b|farmland|plot|acre|bigha|\bkhet\b|zameen|zamin|जमीन|ज़मीन|खेत|प्लॉट|बीघा|एकड़/i,
  seed: /\bseed\b|seeds|beej|बीज|variety|germination|sowing|बुवाई|किस्म/i,
  // General marketplace: fertilizer, pesticide, tools, and any other input
  // sold on the site that isn't a seed/mandi-crop/machinery/land listing.
  product:
    /fertilizer|fertiliser|pesticide|insecticide|herbicide|\bspray\b|urea|\bdap\b|\bnpk\b|खाद|उर्वरक|कीटनाशक|दवाई|स्प्रे|\bproduct\b|\bstore\b|\bshop\b|kharido|khareed|\bbuy\b|purchase|उपलब्ध|खरीद|खरीदना|मिलेगा|kahan milega|store\b/i,
  mandi: /mandi|\bbhav\b|bhaav|kimat|keemat|\bdaam\b|\brate\b|\bprice\b|मंडी|भाव|कीमत|दाम|रेट|मूल्य|उपज/i,
};

function detectKinds(message: string): GroundingKind[] {
  return (Object.keys(KIND_KEYWORDS) as GroundingKind[]).filter((kind) => KIND_KEYWORDS[kind].test(message));
}

// Small stoplist so word-overlap search on Product/Seed isn't drowned out by
// filler words common in both Hindi and English questions.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'what', 'how', 'can', 'please', 'give', 'tell', 'show', 'find',
  'search', 'want', 'need', 'price', 'rate', 'buy', 'order', 'available', 'have', 'kaise', 'kaha', 'kahan',
  'mujhe', 'chahiye', 'chahye', 'batao', 'bataye', 'dijiye', 'kitna', 'kitne', 'wala', 'wali', 'hai', 'hain', 'hoga',
]);

/** Meaningful words from the message, for a `contains` word-overlap search against product/seed names — capped so the OR clause stays small. */
function extractSearchTerms(message: string): string[] {
  const words = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 6);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Live mandi (crop market) prices — matches the message against real crop/mandi names in our DB, not free text. */
async function groundMandi(message: string): Promise<string> {
  const lower = message.toLowerCase();

  const [crops, mandis] = await Promise.all([
    prisma.crop.findMany({ select: { id: true, name: true } }),
    prisma.mandi.findMany({ where: { isActive: true }, select: { id: true, name: true, state: true, district: true } }),
  ]);

  const matchedCrop = crops.find((c) => lower.includes(c.name.toLowerCase()));
  // Longest name first, so e.g. a mandi named "Indore" doesn't shadow a more
  // specific district/state match elsewhere in a longer mandi name.
  const matchedMandi = [...mandis]
    .sort((a, b) => b.name.length - a.name.length)
    .find((m) => lower.includes(m.name.toLowerCase()) || lower.includes(m.district.toLowerCase()) || lower.includes(m.state.toLowerCase()));

  const prices = await prisma.mandiPrice.findMany({
    where: { ...(matchedCrop && { cropId: matchedCrop.id }), ...(matchedMandi && { mandiId: matchedMandi.id }) },
    include: { crop: { select: { name: true, unit: true } }, mandi: { select: { name: true, state: true, district: true } } },
    orderBy: { priceDate: 'desc' },
    take: 5,
  });

  if (prices.length === 0) {
    return (
      'MANDI PRICE DATA: no matching records were found in our own database for this query' +
      (matchedCrop ? ` (crop: ${matchedCrop.name})` : '') +
      (matchedMandi ? ` (mandi: ${matchedMandi.name})` : '') +
      '.'
    );
  }

  const lines = prices.map(
    (p) =>
      `- ${p.crop.name} at ${p.mandi.name} mandi (${p.mandi.district}, ${p.mandi.state}): modal price ₹${p.modalPrice}/${p.crop.unit}, ` +
      `range ₹${p.minPrice}–₹${p.maxPrice}, dated ${formatDate(p.priceDate)}`
  );
  return `MANDI PRICE DATA (from our own database, ${prices.length} most recent matching record(s)):\n${lines.join('\n')}`;
}

/** Land listings — filtered to the person's mentioned city/state/place if we can match one, else the newest listings. */
async function groundLand(message: string): Promise<string> {
  const lower = message.toLowerCase();

  const listings = await prisma.land.findMany({
    where: { isActive: true },
    select: { title: true, location: true, city: true, state: true, price: true, areaAcres: true, dealType: true, slug: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const filtered = listings.filter((l) => [l.city, l.state, l.location].some((v) => v && lower.includes(v.toLowerCase())));
  const list = (filtered.length ? filtered : listings).slice(0, 5);

  if (list.length === 0) {
    return 'LAND LISTING DATA: there are currently no active land listings in our database.';
  }

  const lines = list.map(
    (l) =>
      `- "${l.title}" — ${l.location}${l.city ? `, ${l.city}` : ''}${l.state ? `, ${l.state}` : ''}; ${l.dealType.toLowerCase()}, ` +
      `₹${l.price} for ${l.areaAcres} acres (see /land/${l.slug} on the site)`
  );
  return `LAND LISTING DATA (from our own database, ${filtered.length ? 'matching' : 'most recently listed'} ${list.length} result(s)):\n${lines.join('\n')}`;
}

/** Machinery-for-rent listings — filtered to a mentioned machine/brand/category if we can match one, else the newest listings. */
async function groundMachinery(message: string): Promise<string> {
  const lower = message.toLowerCase();

  const machines = await prisma.machinery.findMany({
    where: { isActive: true },
    select: { name: true, brand: true, model: true, pricePerDay: true, slug: true, category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  const filtered = machines.filter((m) => [m.name, m.brand, m.category.name].some((v) => v && lower.includes(v.toLowerCase())));
  const list = (filtered.length ? filtered : machines).slice(0, 5);

  if (list.length === 0) {
    return 'MACHINERY RENTAL DATA: there is currently no active machinery listed for rent in our database.';
  }

  const lines = list.map(
    (m) =>
      `- ${m.name}${m.brand ? ` (${m.brand}${m.model ? ' ' + m.model : ''})` : ''} — ${m.category.name}, ` +
      `₹${m.pricePerDay}/day (see /machinery/${m.slug} on the site)`
  );
  return `MACHINERY RENTAL DATA (from our own database, ${filtered.length ? 'matching' : 'most recently listed'} ${list.length} result(s)):\n${lines.join('\n')}`;
}

/** Seed listings — word-overlap search against name/brand/variety, else the newest listings. */
async function groundSeeds(message: string): Promise<string> {
  const terms = extractSearchTerms(message);

  const where = terms.length
    ? { isActive: true, OR: terms.flatMap((t) => [{ name: { contains: t, mode: 'insensitive' as const } }, { brand: { contains: t, mode: 'insensitive' as const } }, { variety: { contains: t, mode: 'insensitive' as const } }]) }
    : { isActive: true };

  const matches = await prisma.seed.findMany({
    where,
    select: { name: true, brand: true, variety: true, sowingSeason: true, price: true, discountPrice: true, unit: true, stock: true, slug: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (matches.length === 0) {
    return 'SEED LISTING DATA: no matching seed listings were found in our database for this query.';
  }

  const lines = matches.map((s) => {
    const price = s.discountPrice ? `₹${s.discountPrice} (was ₹${s.price})` : `₹${s.price}`;
    return (
      `- ${s.name}${s.brand ? ` (${s.brand})` : ''}${s.variety ? `, variety ${s.variety}` : ''} — ${price}/${s.unit}, ` +
      `${s.stock > 0 ? `${s.stock} in stock` : 'out of stock'}${s.sowingSeason ? `, ${s.sowingSeason} season` : ''} (see /seeds/${s.slug} on the site)`
    );
  });
  return `SEED LISTING DATA (from our own database, ${matches.length} matching result(s)):\n${lines.join('\n')}`;
}

/** General marketplace products (fertilizer, pesticide, tools, and everything else sold that isn't a seed) — word-overlap search, else the newest listings. */
async function groundProducts(message: string): Promise<string> {
  const terms = extractSearchTerms(message);

  const where = terms.length
    ? { isActive: true, OR: terms.flatMap((t) => [{ name: { contains: t, mode: 'insensitive' as const } }, { brand: { contains: t, mode: 'insensitive' as const } }, { description: { contains: t, mode: 'insensitive' as const } }]) }
    : { isActive: true };

  const matches = await prisma.product.findMany({
    where,
    select: { name: true, brand: true, price: true, discountPrice: true, unit: true, stock: true, slug: true, category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (matches.length === 0) {
    return 'MARKETPLACE PRODUCT DATA: no matching products were found in our database for this query.';
  }

  const lines = matches.map((p) => {
    const price = p.discountPrice ? `₹${p.discountPrice} (was ₹${p.price})` : `₹${p.price}`;
    return (
      `- ${p.name}${p.brand ? ` (${p.brand})` : ''} — ${p.category.name}, ${price}/${p.unit}, ` +
      `${p.stock > 0 ? `${p.stock} in stock` : 'out of stock'} (see /marketplace/${p.slug} on the site)`
    );
  });
  return `MARKETPLACE PRODUCT DATA (from our own database, ${matches.length} matching result(s)):\n${lines.join('\n')}`;
}

const GROUNDERS: Record<GroundingKind, (message: string) => Promise<string>> = {
  machinery: groundMachinery,
  land: groundLand,
  seed: groundSeeds,
  product: groundProducts,
  mandi: groundMandi,
};

/**
 * Looks up real data for anything the message touches on — mandi prices,
 * land, machinery, seeds, or general marketplace products — and returns it
 * as a text block to inject into the AI conversation, or null if none of
 * those topics apply. More than one category can be included at once. A
 * lookup failure (e.g. a transient DB hiccup) must never break the chat
 * reply itself — swallow it and let the assistant answer without grounding
 * for that one turn rather than failing the whole request.
 */
export async function buildGroundingContext(message: string): Promise<string | null> {
  const kinds = detectKinds(message);
  if (kinds.length === 0) return null;

  const results = await Promise.all(
    kinds.map(async (kind) => {
      try {
        return await GROUNDERS[kind](message);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn(`AI grounding lookup (${kind}) failed — answering without it: ${msg}`);
        return null;
      }
    })
  );

  const blocks = results.filter((r): r is string => r !== null);
  return blocks.length ? blocks.join('\n\n') : null;
}