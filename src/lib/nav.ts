import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Store,
  RefreshCw,
  BarChart3,
  Users,
  Settings,
  Clock,
  Printer,
  PackageCheck,
  Truck,
  PackagePlus,
  PackageMinus,
  ListChecks,
  ClipboardCheck,
  Layers,
  FileEdit,
  Archive,
  CheckCircle2,
  XCircle,
  History,
  Link2,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type NavChild = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  children?: NavChild[];
};

export const navItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Produk",
    url: "/produk",
    icon: Package,
    children: [
      { title: "Live", url: "/produk", icon: Layers },
      { title: "Draft Produk", url: "/produk/draft", icon: FileEdit },
      { title: "Arsip Produk", url: "/produk/arsip", icon: Archive },
    ],
  },
  {
    title: "Pesanan",
    url: "/pesanan",
    icon: ShoppingCart,
    children: [
      { title: "Menunggu Diproses", url: "/pesanan/menunggu-diproses", icon: Clock },
      { title: "Menunggu Dicetak", url: "/pesanan/menunggu-dicetak", icon: Printer },
      { title: "Menunggu Pickup", url: "/pesanan/menunggu-pickup", icon: PackageCheck },
      { title: "Dikirim", url: "/pesanan/dikirim", icon: Truck },
      { title: "Selesai", url: "/pesanan/selesai", icon: CheckCircle2 },
      { title: "Dibatalkan", url: "/pesanan/dibatalkan", icon: XCircle },
    ],
  },
  {
    title: "Marketplace Mapping",
    url: "/marketplace-mapping/shopee",
    icon: Link2,
  },
  {
    title: "Gudang",
    url: "/gudang",
    icon: Warehouse,
    children: [
      { title: "Stok Produk", url: "/gudang/rincian-stok", icon: ListChecks },
      { title: "Penambahan Stok", url: "/gudang/penambahan-stok", icon: PackagePlus },
      { title: "Pengurangan Stok", url: "/gudang/pengurangan-stok", icon: PackageMinus },
      { title: "Stock Opname", url: "/gudang/stock-opname", icon: ClipboardCheck },
      { title: "Riwayat Stok", url: "/gudang/riwayat-stok", icon: History },
    ],
  },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Sinkronisasi", url: "/sinkronisasi", icon: RefreshCw },
  {
    title: "Laporan",
    url: "/laporan",
    icon: BarChart3,
    children: [
      { title: "Analisa Bisnis", url: "/laporan/analisa-bisnis", icon: BarChart3 },
      { title: "Analisa Keuntungan", url: "/laporan/analisa-keuntungan", icon: BarChart3 },
    ],
  },
  { title: "Pengguna", url: "/pengguna", icon: Users },
  { title: "Pengaturan", url: "/pengaturan", icon: Settings },
];
