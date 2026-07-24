export type ProductVariation = {
  id: string;
  variationId: string; // future: Shopee variation_id
  name: string; // e.g. "Hitam - M"
  sku: string;
  imageUrl: string;
};

export type SyncStatus = "created" | "not_activated";

export type MasterProduct = {
  id: string;
  productId: string; // future: Shopee product_id
  masterSku: string;
  name: string;
  category: string;
  imageUrl: string;
  modal: number;
  price: number;
  stock: number;
  marketplaceCount: number;
  marketplace: "Shopee" | "Tokopedia" | "TikTok Shop" | "Lazada";
  productStatus: "Live" | "Draft" | "Arsip";
  syncStatus: SyncStatus;
  variations: ProductVariation[];
};

const imageFor = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/96/96`;

const makeVariations = (
  baseSku: string,
  colors: string[],
  sizes: string[],
): ProductVariation[] => {
  const rows: ProductVariation[] = [];
  let n = 1;
  for (const c of colors) {
    for (const s of sizes) {
      const sku = `${baseSku}-${c.slice(0, 3).toUpperCase()}-${s}`;
      rows.push({
        id: `${baseSku}-${n}`,
        variationId: `VAR-${baseSku}-${n}`,
        name: `${c} - ${s}`,
        sku,
        imageUrl: imageFor(sku),
      });
      n += 1;
    }
  }
  return rows;
};

export const masterProducts: MasterProduct[] = [
  {
    id: "1",
    productId: "SHP-9001",
    masterSku: "MSKU-000101",
    name: "Kemeja Linen Premium",
    category: "Fashion Pria",
    imageUrl: imageFor("MSKU-000101"),
    modal: 145000,
    price: 289000,
    stock: 128,
    marketplaceCount: 4,
    marketplace: "Shopee",
    productStatus: "Live",
    syncStatus: "created",
    variations: makeVariations("KLP-001", ["Hitam", "Putih"], ["M", "L", "XL"]),
  },
  {
    id: "2",
    productId: "SHP-9002",
    masterSku: "MSKU-000102",
    name: "Celana Chino Stretch",
    category: "Fashion Pria",
    imageUrl: imageFor("MSKU-000102"),
    modal: 120000,
    price: 245000,
    stock: 54,
    marketplaceCount: 3,
    marketplace: "Tokopedia",
    productStatus: "Live",
    syncStatus: "not_activated",
    variations: makeVariations("CCS-014", ["Khaki", "Navy"], ["30", "32", "34"]),
  },
  {
    id: "3",
    productId: "SHP-9003",
    masterSku: "MSKU-000103",
    name: "Sneakers Kanvas Low Top",
    category: "Sepatu",
    imageUrl: imageFor("MSKU-000103"),
    modal: 210000,
    price: 399000,
    stock: 0,
    marketplaceCount: 4,
    marketplace: "TikTok Shop",
    productStatus: "Live",
    syncStatus: "created",
    variations: makeVariations("SSK-208", ["Putih", "Hitam"], ["40", "41", "42"]),
  },
  {
    id: "4",
    productId: "SHP-9004",
    masterSku: "MSKU-000104",
    name: 'Tas Ransel Laptop 15"',
    category: "Tas",
    imageUrl: imageFor("MSKU-000104"),
    modal: 175000,
    price: 349000,
    stock: 87,
    marketplaceCount: 2,
    marketplace: "Shopee",
    productStatus: "Live",
    syncStatus: "not_activated",
    variations: makeVariations("TRL-077", ["Hitam"], ["STD"]),
  },
  {
    id: "5",
    productId: "SHP-9005",
    masterSku: "MSKU-000105",
    name: "Kaos Oversize Premium",
    category: "Fashion Pria",
    imageUrl: imageFor("MSKU-000105"),
    modal: 32000,
    price: 79000,
    stock: 340,
    marketplaceCount: 5,
    marketplace: "Shopee",
    productStatus: "Live",
    syncStatus: "not_activated",
    variations: makeVariations("KOP-004", ["Hitam", "Putih"], ["M", "L", "XL"]),
  },
  {
    id: "6",
    productId: "SHP-9006",
    masterSku: "MSKU-000106",
    name: "Jaket Bomber Waterproof",
    category: "Fashion Pria",
    imageUrl: imageFor("MSKU-000106"),
    modal: 260000,
    price: 525000,
    stock: 22,
    marketplaceCount: 3,
    marketplace: "Lazada",
    productStatus: "Draft",
    syncStatus: "not_activated",
    variations: makeVariations("JBW-032", ["Navy", "Hitam"], ["L", "XL"]),
  },
  {
    id: "7",
    productId: "SHP-9007",
    masterSku: "MSKU-000107",
    name: "Jam Tangan Analog Kulit",
    category: "Aksesoris",
    imageUrl: imageFor("MSKU-000107"),
    modal: 220000,
    price: 459000,
    stock: 15,
    marketplaceCount: 2,
    marketplace: "TikTok Shop",
    productStatus: "Arsip",
    syncStatus: "created",
    variations: makeVariations("JTA-091", ["Coklat", "Hitam"], ["STD"]),
  },
  {
    id: "8",
    productId: "SHP-9008",
    masterSku: "MSKU-000108",
    name: "Topi Baseball Embroidery",
    category: "Aksesoris",
    imageUrl: imageFor("MSKU-000108"),
    modal: 35000,
    price: 89000,
    stock: 210,
    marketplaceCount: 4,
    marketplace: "Lazada",
    productStatus: "Live",
    syncStatus: "not_activated",
    variations: makeVariations("TBA-045", ["Hitam", "Putih"], ["STD"]),
  },
];

export const productImageBySku = (sku: string) =>
  masterProducts.find((p) => p.masterSku === sku)?.imageUrl ?? imageFor(sku);
