import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { ImagePlus, Trash2, Star, GripVertical } from "lucide-react";
import { PhotoEditorDialog } from "./photo-editor-dialog";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createMediaId,
  normalizeImages,
  readImageDimensions,
  type ProductImage,
} from "@/lib/product-media";

/** @deprecated Gunakan ProductImage dari @/lib/product-media */
export type ProductPhoto = ProductImage;

const MAX_PHOTOS = 9;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

type Props = {
  photos: ProductImage[];
  onChange: (photos: ProductImage[]) => void;
};

type ThumbProps = {
  photo: ProductImage;
  index: number;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
};

function SortableThumb({ photo, index, onRemove, onOpen }: ThumbProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md border bg-muted",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(photo.id)}
        className="absolute inset-0 h-full w-full cursor-zoom-in"
        aria-label={`Buka foto ${index + 1}`}
      >
        <img
          src={photo.url}
          alt={`Foto ${index + 1}`}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </button>
      {index === 0 && (
        <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <Star className="h-3 w-3" /> Cover
        </span>
      )}
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-1 left-1 inline-flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Geser untuk mengurutkan"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
            aria-label="Hapus foto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus foto ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Foto akan dihapus dari daftar. Urutan akan dirapikan otomatis
              {index === 0 ? " dan Cover akan berpindah ke foto berikutnya." : "."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onRemove(photo.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ProductPhotoGrid({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(files);
      const remaining = MAX_PHOTOS - photos.length;

      if (remaining <= 0) {
        toast.warning(`Maksimal ${MAX_PHOTOS} foto`, {
          description: `Anda sudah mencapai batas ${MAX_PHOTOS} foto. Hapus salah satu untuk menambah foto baru.`,
        });
        return;
      }

      if (incoming.length > remaining) {
        toast.warning(`Melebihi batas ${MAX_PHOTOS} foto`, {
          description: `Hanya ${remaining} foto pertama yang akan ditambahkan.`,
        });
      }

      const valid: ProductImage[] = [];
      for (const file of incoming) {
        if (valid.length >= remaining) break;
        const typeOk = ACCEPTED.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
        if (!typeOk) {
          toast.error("Format tidak didukung", {
            description: `${file.name}: gunakan JPG, JPEG, PNG, atau WEBP.`,
          });
          continue;
        }
        if (file.size > MAX_SIZE) {
          toast.error("Ukuran file terlalu besar", {
            description: `${file.name}: melebihi batas 10MB.`,
          });
          continue;
        }
        const { width, height, url } = await readImageDimensions(file);
        valid.push({
          id: createMediaId("img"),
          file,
          url,
          position: 0, // di-normalisasi di akhir
          isCover: false,
          width,
          height,
          fileSize: file.size,
        });
      }

      if (valid.length) onChange(normalizeImages([...photos, ...valid]));
    },
    [photos, onChange],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const remove = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(normalizeImages(photos.filter((p) => p.id !== id)));
  };

  const openPicker = () => inputRef.current?.click();

  const canAdd = photos.length < MAX_PHOTOS;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = photos.findIndex((p) => p.id === active.id);
    const to = photos.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(normalizeImages(arrayMove(photos, from, to)));
  };

  const activePhoto = activeId ? photos.find((p) => p.id === activeId) : null;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={handleInput}
      />

      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            if (canAdd) setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        className={cn(
          "rounded-md border-2 border-dashed p-3 transition-colors",
          dragOver ? "border-violet-500 bg-violet-50" : "border-muted-foreground/25",
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {photos.map((p, idx) => (
                <SortableThumb key={p.id} photo={p} index={idx} onRemove={remove} onOpen={setEditorId} />
              ))}

              {canAdd && (
                <button
                  type="button"
                  onClick={openPicker}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:border-violet-500 hover:bg-violet-50 hover:text-violet-600"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-medium">Tambah Foto</span>
                  <span className="text-[10px]">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </button>
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
            {activePhoto ? (
              <div className="aspect-square overflow-hidden rounded-md border-2 border-violet-500 bg-muted shadow-2xl ring-4 ring-violet-500/30">
                <img
                  src={activePhoto.url}
                  alt="Dragging"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {photos.length === 0 && (
        <p className="text-xs text-amber-600">
          ⚠ Minimal 1 foto diperlukan.
        </p>
      )}
      <p className="text-xs text-emerald-600">
        ⓘ Format: JPG, JPEG, PNG, WEBP · Maksimal 10MB per gambar · Minimal 1, maksimal {MAX_PHOTOS} foto · Klik thumbnail untuk edit · Seret untuk mengurutkan
      </p>

      <PhotoEditorDialog
        photo={photos.find((p) => p.id === editorId) ?? null}
        open={editorId !== null}
        onOpenChange={(o) => !o && setEditorId(null)}
        onSave={(id, file, url, width, height) => {
          const prev = photos.find((p) => p.id === id);
          if (prev) URL.revokeObjectURL(prev.url);
          onChange(
            normalizeImages(
              photos.map((p) =>
                p.id === id
                  ? { ...p, file, url, width, height, fileSize: file.size }
                  : p,
              ),
            ),
          );
        }}
        onReplace={(id, file, url, width, height) => {
          const prev = photos.find((p) => p.id === id);
          if (prev) URL.revokeObjectURL(prev.url);
          onChange(
            normalizeImages(
              photos.map((p) =>
                p.id === id
                  ? { ...p, file, url, width, height, fileSize: file.size }
                  : p,
              ),
            ),
          );
        }}
        onDelete={(id) => {
          remove(id);
        }}
      />
    </div>
  );
}

