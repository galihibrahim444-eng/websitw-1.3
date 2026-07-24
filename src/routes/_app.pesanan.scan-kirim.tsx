import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Barcode, Clock, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pesananStore } from "@/lib/pesanan-store";
import { playDuplicate, playFailed, playSuccess, unlockScanAudio } from "@/lib/scan-audio";

const DUPLICATE_STATUSES = new Set([
  "Menunggu Pickup",
  "Dikirim",
  "Selesai",
  "Diproses Marketplace",
]);

export const Route = createFileRoute("/_app/pesanan/scan-kirim")({
  head: () => ({ meta: [{ title: "Scan & Kirim — MAQIL.ERP" }] }),
  component: ScanKirimPage,
});

function ScanKirimPage() {
  type ScanStatus = "Berhasil" | "Tidak Ditemukan" | "Duplikat";

  type ScanItem = {
    resi: string;
    productName?: string;
    marketplace?: string;
    kurir?: string;
    status: ScanStatus;
    scannedAt: string;
    message?: string;
  };

  const [scanInput, setScanInput] = React.useState("");
  const [scanHistory, setScanHistory] = React.useState<ScanItem[]>([]);
  const [successfulScans, setSuccessfulScans] = React.useState(0);
  const [failedScans, setFailedScans] = React.useState(0);
  const [duplicateScans, setDuplicateScans] = React.useState(0);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "Berhasil" | "Tidak Ditemukan" | "Duplikat">("all");

  const nowTime = () => new Date().toLocaleString();

  const processScan = (input: string) => {
    const resi = input.trim();
    if (!resi) return;

    const time = nowTime();
    const all = pesananStore.getAll();
    const order = all.find((p) => p.resi === resi);

    if (order && order.status === "Menunggu Dicetak") {
      pesananStore.updateStatus([order.id], "Menunggu Pickup");

      playSuccess();

      setScanHistory((s) => [
        {
          resi,
          productName: order.productName,
          marketplace: order.marketplace,
          kurir: order.kurir,
          status: "Berhasil",
          scannedAt: time,
        },
        ...s,
      ]);
      setSuccessfulScans((n) => n + 1);
    } else if (order && DUPLICATE_STATUSES.has(order.status)) {
      playDuplicate();

      setScanHistory((s) => [
        {
          resi,
          productName: order.productName,
          marketplace: order.marketplace,
          kurir: order.kurir,
          status: "Duplikat",
          scannedAt: time,
          message: `Pesanan sudah berstatus ${order.status}.`,
        },
        ...s,
      ]);
      setDuplicateScans((n) => n + 1);
    } else {
      playFailed();

      setScanHistory((s) => [{ resi, status: "Tidak Ditemukan", scannedAt: time }, ...s]);
      setFailedScans((n) => n + 1);
    }

    setScanInput("");
  };

  React.useEffect(() => {
    const handler = () => unlockScanAudio();
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("touchstart", handler, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  return (
    <div className="space-y-6" onPointerDown={unlockScanAudio}>

      <PageHeader
        title="Scan & Kirim"
        description="Halaman sementara untuk fitur Scan & Kirim. Masih dalam tahap UI tanpa logika pengiriman."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Barcode className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Scanner</h2>
                  <p className="text-sm text-muted-foreground">
                    Pilih jasa kirim dan scan nomor resi untuk memulai.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-medium">Jasa Kirim</p>
                  <Select defaultValue="Semua">
                    <SelectTrigger className="mt-2 h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semua">Semua</SelectItem>
                      <SelectItem value="JNE">JNE</SelectItem>
                      <SelectItem value="J&T">J&T</SelectItem>
                      <SelectItem value="SiCepat">SiCepat</SelectItem>
                      <SelectItem value="AnterAja">AnterAja</SelectItem>
                      <SelectItem value="Ninja Xpress">Ninja Xpress</SelectItem>
                      <SelectItem value="SPX Express">SPX Express</SelectItem>
                      <SelectItem value="ID Express">ID Express</SelectItem>
                      <SelectItem value="Lion Parcel">Lion Parcel</SelectItem>
                      <SelectItem value="Pos Indonesia">Pos Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium">Input Scanner</p>
                  <Input
                    autoFocus
                    placeholder="Scan Nomor Resi"
                    className="mt-2 h-11"
                    aria-label="Input untuk scan nomor resi"
                    value={scanInput}
                    onChange={(e) => setScanInput((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        processScan(scanInput);
                      }
                    }}
                  />
                </div>

                <Button
                  className="h-11 w-full"
                  onClick={() => processScan(scanInput)}
                  disabled={scanInput.trim() === ""}
                >
                  Konfirmasi & Kirim
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Sudah Diproses</p>
                  <p className="mt-1 text-3xl font-semibold">0</p>
                </div>
                <Badge className="bg-primary/10 text-primary">Placeholder</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Riwayat Scan</h2>
                <p className="text-sm text-muted-foreground">
                  Semua hasil scan resi yang sudah diproses.
                </p>
              </div>
              <Badge className="bg-muted/20 text-muted-foreground">0 total</Badge>
            </div>

            <div className="mt-4">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ${activeFilter === "all" ? "bg-background text-foreground shadow" : ""}`}
                  onClick={() => setActiveFilter("all")}
                >
                  Semua ({scanHistory.length})
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ${activeFilter === "Berhasil" ? "bg-background text-foreground shadow" : ""}`}
                  onClick={() => setActiveFilter("Berhasil")}
                >
                  Berhasil ({successfulScans})
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ${activeFilter === "Tidak Ditemukan" ? "bg-background text-foreground shadow" : ""}`}
                  onClick={() => setActiveFilter("Tidak Ditemukan")}
                >
                  Tidak Ditemukan ({failedScans})
                </button>
                <button
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ${activeFilter === "Duplikat" ? "bg-background text-foreground shadow" : ""}`}
                  onClick={() => setActiveFilter("Duplikat")}
                >
                  Duplikat ({duplicateScans})
                </button>
              </div>

              <div className="mt-4">
                <HistoryTable
                  scanHistory={scanHistory.filter((i) => (activeFilter === "all" ? true : i.status === activeFilter))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HistoryTable({
  scanHistory,
}: {
  scanHistory: Array<{
    resi: string;
    productName?: string;
    marketplace?: string;
    kurir?: string;
    status: string;
    scannedAt: string;
  }>;
}) {
  if (scanHistory.length === 0) {
    return (
      <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-muted/50 px-6 py-10 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center rounded-full bg-muted p-4 text-muted-foreground">
          <PackageCheck className="h-6 w-6" />
        </div>
        <p className="mt-4 font-semibold">Belum ada riwayat scan.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Silakan scan nomor resi untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-muted/50">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor Resi</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Marketplace</TableHead>
              <TableHead>Kurir</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jam Scan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scanHistory.map((item, idx) => (
              <TableRow key={`${item.resi}_${idx}`}> 
                <TableCell className="font-medium">{item.resi}</TableCell>
                <TableCell>{item.productName ?? "-"}</TableCell>
                <TableCell>{item.marketplace ?? "-"}</TableCell>
                <TableCell className="text-sm">{item.kurir ?? "-"}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      item.status === "Berhasil"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "Tidak Ditemukan"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.scannedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
