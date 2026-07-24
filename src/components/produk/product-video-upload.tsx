import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Trash2,
  Video as VideoIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
  Play,
  Repeat,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  createMediaId,
  type ProductVideoMedia,
  type ProductVideoStatus,
} from "@/lib/product-media";

/** @deprecated Gunakan ProductVideoStatus dari @/lib/product-media */
export type VideoUploadStatus = ProductVideoStatus;

/** @deprecated Gunakan ProductVideoMedia dari @/lib/product-media */
export type ProductVideo = ProductVideoMedia;

const ACCEPTED_MIME = ["video/mp4", "video/quicktime"]; // MP4, MOV
const ACCEPTED_EXT = [".mp4", ".mov"];
const MAX_SIZE = 30 * 1024 * 1024; // 30MB
const MIN_DURATION = 10;
const MAX_DURATION = 60;

function formatDuration(seconds: number) {
  if (!isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function extractMeta(file: File): Promise<{ duration: number; thumbnail: string | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      // seek to 1s (or middle) to grab thumbnail
      const seekTo = Math.min(1, Math.max(0, duration / 2));
      const onSeeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL("image/jpeg", 0.7);
          cleanup();
          resolve({ duration, thumbnail: thumb });
        } catch {
          cleanup();
          resolve({ duration, thumbnail: null });
        }
      };
      video.onseeked = onSeeked;
      try {
        video.currentTime = seekTo;
      } catch {
        onSeeked();
      }
    };
    video.onerror = () => {
      cleanup();
      resolve({ duration: 0, thumbnail: null });
    };
  });
}

export function ProductVideoUpload({
  video,
  onChange,
}: {
  video: ProductVideo | null;
  onChange: (v: ProductVideo | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (progressTimer.current) window.clearInterval(progressTimer.current);
    };
  }, []);

  const openPicker = () => inputRef.current?.click();

  const validate = (file: File): string | null => {
    const name = file.name.toLowerCase();
    const okExt = ACCEPTED_EXT.some((e) => name.endsWith(e));
    const okMime = ACCEPTED_MIME.includes(file.type);
    if (!okExt && !okMime) return "Format tidak didukung. Gunakan MP4 atau MOV.";
    if (file.size > MAX_SIZE) return `Ukuran melebihi 30MB (${formatSize(file.size)}).`;
    return null;
  };

  const startUpload = async (file: File) => {
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }

    const { duration, thumbnail } = await extractMeta(file);
    if (!duration || duration < MIN_DURATION || duration > MAX_DURATION) {
      toast.error(
        `Durasi video harus 10-60 detik (video ini ${formatDuration(duration)}).`,
      );
      return;
    }

    const id = createMediaId("vid");
    const url = URL.createObjectURL(file);
    // Replace: revoke URL video lama agar tidak bocor memori.
    if (video?.url) URL.revokeObjectURL(video.url);
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    const initial: ProductVideoMedia = {
      id,
      file,
      url,
      thumbnail,
      duration,
      fileSize: file.size,
      progress: 0,
      status: "uploading",
    };
    onChange(initial);

    // Simulasi progress upload — akan diganti dengan upload nyata ke marketplace.
    let progress = 0;
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = window.setInterval(() => {
      progress = Math.min(100, progress + Math.random() * 12 + 6);
      const next: ProductVideo = {
        ...initial,
        progress: Math.round(progress),
        status: progress >= 100 ? "success" : "uploading",
      };
      onChange(next);
      if (progress >= 100 && progressTimer.current) {
        window.clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
    }, 250) as unknown as number;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    startUpload(files[0]);
  };

  const remove = () => {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    if (video?.url) URL.revokeObjectURL(video.url);
    onChange(null);
    setConfirmDelete(false);
    setPreviewOpen(false);
  };

  const downloadVideo = () => {
    if (!video) return;
    const a = document.createElement("a");
    a.href = video.url;
    a.download = video.file?.name ?? `video-${video.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {!video ? (
        <>
          <Button
            type="button"
            onClick={openPicker}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            Tambah Video
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={openPicker}
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-dashed hover:bg-muted/40"
              aria-label="Tambah video"
            >
              <VideoIcon className="h-8 w-8 text-muted-foreground" />
            </button>
            <ol className="space-y-1 text-xs text-muted-foreground">
              <li>1. Ukuran: Maksimal 30MB</li>
              <li>2. Durasi: 10-60 detik</li>
              <li>3. Format: MP4, MOV</li>
              <li>4. Maksimal: 1 video</li>
            </ol>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-3 rounded-md border p-3 max-w-xl">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted"
            aria-label="Preview video"
          >
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt="Thumbnail video"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <VideoIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {formatDuration(video.duration)}
            </span>
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{video.file?.name ?? "Video"}</div>
                <div className="text-xs text-muted-foreground">
                  {formatSize(video.fileSize)} · {formatDuration(video.duration)}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                    aria-label="Menu video"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                    <Play className="h-4 w-4" /> Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openPicker}>
                    <Repeat className="h-4 w-4" /> Replace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadVideo}>
                    <Download className="h-4 w-4" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <Progress value={video.progress} className="h-1.5" />
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  video.status === "success" && "text-emerald-600",
                  video.status === "error" && "text-destructive",
                  video.status === "uploading" && "text-muted-foreground",
                )}
              >
                {video.status === "uploading" && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Mengunggah… {video.progress}%
                  </>
                )}
                {video.status === "success" && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Berhasil diunggah
                  </>
                )}
                {video.status === "error" && (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" />
                    {video.errorMessage ?? "Gagal mengunggah"}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus video?</AlertDialogTitle>
            <AlertDialogDescription>
              Video akan dihapus dari produk ini. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">
              {video?.file?.name ?? "Preview video"}
            </DialogTitle>
          </DialogHeader>
          {video && (
            <video
              src={video.url}
              controls
              autoPlay
              className="w-full rounded-md bg-black"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
