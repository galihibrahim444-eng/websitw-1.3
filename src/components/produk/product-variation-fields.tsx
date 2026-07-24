import { useRef, useState } from "react";
import { X, Plus, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  createEmptyVariationOption,
  createEmptyVariationValue,
  MAX_VARIATION_GROUPS,
  MAX_VARIATION_VALUE_LENGTH,
  shouldAutoUseImage,
  type ProductVariationOption,
} from "@/lib/product-variations";
import {
  createMediaId,
  normalizeImages,
  readImageDimensions,
  type ProductImage,
  type ProductMedia,
} from "@/lib/product-media";
import { VariationNameDialog } from "./variation-name-dialog";

const MAX_IMAGE_SIZE_MB = 10;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  variations: ProductVariationOption[];
  onChange: (next: ProductVariationOption[]) => void;
  media: ProductMedia;
  onMediaChange: (next: ProductMedia) => void;
};

export function ProductVariationFields({
  variations,
  onChange,
  media,
  onMediaChange,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Satu ref per value untuk memicu file picker tanpa menyimpan URL terpisah.
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateGroup = (
    index: number,
    updater: (g: ProductVariationOption) => ProductVariationOption,
  ) => {
    onChange(variations.map((g, i) => (i === index ? updater(g) : g)));
  };

  const handleConfirmName = (name: string) => {
    if (variations.length >= MAX_VARIATION_GROUPS) return;
    onChange([...variations, createEmptyVariationOption(name)]);
  };

  const removeGroup = (index: number) => {
    const removed = variations[index];
    // Bersihkan gambar variasi dari ProductMedia agar tidak menggantung.
    const usedIds = new Set(
      removed?.values.map((v) => v.imageMediaId).filter(Boolean) as string[],
    );
    if (usedIds.size) {
      onMediaChange({
        ...media,
        images: normalizeImages(
          media.images.filter((img) => !usedIds.has(img.id)),
        ),
      });
    }
    onChange(variations.filter((_, i) => i !== index));
  };

  const addValue = (groupIndex: number) => {
    updateGroup(groupIndex, (g) => ({
      ...g,
      values: [...g.values, createEmptyVariationValue()],
    }));
  };

  const updateValue = (groupIndex: number, valueId: string, label: string) => {
    updateGroup(groupIndex, (g) => ({
      ...g,
      values: g.values.map((v) =>
        v.id === valueId
          ? { ...v, label: label.slice(0, MAX_VARIATION_VALUE_LENGTH) }
          : v,
      ),
    }));
  };

  const removeValue = (groupIndex: number, valueId: string) => {
    const group = variations[groupIndex];
    if (!group || group.values.length <= 1) return;
    const target = group.values.find((v) => v.id === valueId);
    if (target?.imageMediaId) {
      onMediaChange({
        ...media,
        images: normalizeImages(
          media.images.filter((img) => img.id !== target.imageMediaId),
        ),
      });
    }
    updateGroup(groupIndex, (g) => ({
      ...g,
      values: g.values.filter((v) => v.id !== valueId),
    }));
  };

  const handleFilePick = async (
    groupIndex: number,
    valueId: string,
    file: File | undefined,
  ) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Format tidak didukung", {
        description: "Gunakan JPG, PNG, atau WEBP.",
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.warning("Ukuran gambar melebihi batas", {
        description: `Maksimal ${MAX_IMAGE_SIZE_MB} MB per gambar.`,
      });
      return;
    }

    const { width, height, url } = await readImageDimensions(file);
    const group = variations[groupIndex];
    const value = group?.values.find((v) => v.id === valueId);
    const prevMediaId = value?.imageMediaId;

    const newImage: ProductImage = {
      id: createMediaId("variant"),
      url,
      position: media.images.length,
      isCover: false,
      width,
      height,
      fileSize: file.size,
      file,
    };

    const nextImages = normalizeImages([
      ...media.images.filter((img) => img.id !== prevMediaId),
      newImage,
    ]);
    onMediaChange({ ...media, images: nextImages });
    updateGroup(groupIndex, (g) => ({
      ...g,
      values: g.values.map((v) =>
        v.id === valueId ? { ...v, imageMediaId: newImage.id } : v,
      ),
    }));
  };

  const clearImage = (groupIndex: number, valueId: string) => {
    const value = variations[groupIndex]?.values.find((v) => v.id === valueId);
    if (!value?.imageMediaId) return;
    onMediaChange({
      ...media,
      images: normalizeImages(
        media.images.filter((img) => img.id !== value.imageMediaId),
      ),
    });
    updateGroup(groupIndex, (g) => ({
      ...g,
      values: g.values.map((v) =>
        v.id === valueId ? { ...v, imageMediaId: undefined } : v,
      ),
    }));
  };

  const findImage = (mediaId?: string) =>
    mediaId ? media.images.find((img) => img.id === mediaId) : undefined;

  const canAddMore = variations.length < MAX_VARIATION_GROUPS;

  return (
    <div className="space-y-4">
      {variations.map((group, gi) => {
        const showImages =
          gi === 0 && (group.useImage === true || shouldAutoUseImage(group.name));
        const autoUseImage = shouldAutoUseImage(group.name);

        return (
          <div
            key={group.id}
            className="rounded-md border bg-muted/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Variasi {gi + 1} · {group.name}
              </span>
              <div className="flex items-center gap-3">
                {gi === 0 && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={showImages}
                      disabled={autoUseImage}
                      onCheckedChange={(checked) =>
                        updateGroup(gi, (g) => ({ ...g, useImage: checked }))
                      }
                    />
                    Gunakan gambar
                  </label>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeGroup(gi)}
                >
                  <X className="h-4 w-4" />
                  Hapus
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start sm:gap-4">
              <Label className="pt-2 text-sm text-muted-foreground">Opsi</Label>
              <div
                className={
                  showImages
                    ? "flex flex-col gap-2"
                    : "flex flex-wrap gap-2"
                }
              >
                {group.values.map((val) => {
                  const img = findImage(val.imageMediaId);
                  return (
                    <div
                      key={val.id}
                      className={
                        showImages
                          ? "flex items-center gap-3"
                          : "relative"
                      }
                    >
                      <div className="relative">
                        <Input
                          value={val.label}
                          placeholder="Tambah opsi"
                          onChange={(e) =>
                            updateValue(gi, val.id, e.target.value)
                          }
                          className="w-40 pr-8"
                        />
                        {group.values.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeValue(gi, val.id)}
                            className="absolute inset-y-0 right-1 flex items-center rounded p-1 text-muted-foreground hover:text-destructive"
                            aria-label="Hapus opsi"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {showImages && (
                        <>
                          <input
                            ref={(el) => {
                              fileInputs.current[val.id] = el;
                            }}
                            type="file"
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleFilePick(gi, val.id, file);
                              e.target.value = "";
                            }}
                          />
                          {img ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-background">
                              <img
                                src={img.url}
                                alt={val.label || "Variasi"}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => clearImage(gi, val.id)}
                                className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white hover:bg-black/80"
                                aria-label="Hapus gambar variasi"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                fileInputs.current[val.id]?.click()
                              }
                              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-border bg-background text-muted-foreground hover:border-violet-400 hover:text-violet-600"
                            >
                              <ImagePlus className="h-4 w-4" />
                              <span className="text-[10px]">Upload</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addValue(gi)}
                  className="h-10 w-fit"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Opsi
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          className="border-dashed text-violet-600 hover:text-violet-700"
        >
          <Plus className="h-4 w-4" />
          {variations.length === 0 ? "Tambah Variasi" : "Tambah Variasi Lain"}
        </Button>
      )}

      <VariationNameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmName}
      />
    </div>
  );
}
