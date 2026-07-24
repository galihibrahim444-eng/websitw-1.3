import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  RotateCcw,
  RotateCw,
  Crop,
  Trash2,
  Save,
  Upload,
  ZoomIn,
} from "lucide-react";
import type { ProductImage } from "@/lib/product-media";

const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const OUTPUT_SIZE = 1024;

type Props = {
  photo: ProductImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, file: File, url: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onReplace: (id: string, file: File, url: string, width: number, height: number) => void;
};

export function PhotoEditorDialog({
  photo,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onReplace,
}: Props) {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRotation(0);
      setZoom(1);
    }
  }, [open, photo?.id]);

  if (!photo) return null;

  const rotateLeft = () => setRotation((r) => r - 90);
  const rotateRight = () => setRotation((r) => r + 90);
  const cropSquare = () => {
    setZoom(1);
    setRotation((r) => Math.round(r / 90) * 90);
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
    onReplace(photo.id, file, url, dims.width, dims.height);
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img || !img.complete) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    // "cover" base scale to fill the square, then user zoom on top
    const baseScale = Math.max(OUTPUT_SIZE / w, OUTPUT_SIZE / h);
    const scale = baseScale * zoom;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -w / 2, -h / 2);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (!blob) return;
    const baseName = photo.file?.name?.replace(/\.[^.]+$/, "") ?? photo.id;
    const file = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    onSave(photo.id, file, url, OUTPUT_SIZE, OUTPUT_SIZE);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Foto</DialogTitle>
        </DialogHeader>

        <input
          ref={replaceInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleReplace}
        />

        {/* Preview area — square, overflow hidden so rotate/zoom crop naturally */}
        <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-md border bg-neutral-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              ref={imgRef}
              key={photo.url}
              src={photo.url}
              alt="Preview"
              crossOrigin="anonymous"
              className="max-h-none max-w-none select-none transition-transform duration-200"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                // Fit "cover" via object-fit trick using height/width auto + object-cover on container is hard;
                // simpler: use inline max dimensions and let container clip. We use height=100% width=100% object-cover.
                height: "100%",
                width: "100%",
                objectFit: "cover",
              }}
              draggable={false}
            />
          </div>
          {/* 1:1 crop guides */}
          <div className="pointer-events-none absolute inset-0 border border-white/20" />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-1">
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={0.5}
            max={3}
            step={0.05}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
            className="flex-1"
          />
          <span className="w-12 text-right text-xs text-muted-foreground">
            {zoom.toFixed(2)}x
          </span>
        </div>

        {/* Tool buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={rotateLeft}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Rotate Left
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={rotateRight}>
            <RotateCw className="mr-1.5 h-4 w-4" /> Rotate Right
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={cropSquare}>
            <Crop className="mr-1.5 h-4 w-4" /> Crop 1:1
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => replaceInputRef.current?.click()}
          >
            <Upload className="mr-1.5 h-4 w-4" /> Replace
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus foto ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  Foto akan dihapus dari daftar. Cover akan berpindah otomatis bila diperlukan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete(photo.id);
                    onOpenChange(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">
            <Save className="mr-1.5 h-4 w-4" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
