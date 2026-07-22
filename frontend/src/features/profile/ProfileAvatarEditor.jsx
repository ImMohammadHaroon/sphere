import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Plus } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { getCroppedImage } from "@/lib/cropImage";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ProfileAvatarEditor({
  user,
  onUpload,
  onRemove,
  isUploading = false,
  isRemoving = false,
  onError,
}) {
  const fileInputRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      onError?.("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      onError?.("Image must be 2MB or smaller");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropOpen(true);
    };
    reader.onerror = () => {
      onError?.("Failed to read image");
    };
    reader.readAsDataURL(file);
  }

  function handleCropDialogChange(open) {
    setCropOpen(open);
    if (!open) {
      setImageSrc(null);
      setCroppedAreaPixels(null);
    }
  }

  async function handleSaveCrop() {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
      if (blob.size > MAX_AVATAR_SIZE) {
        onError?.("Cropped image must be 2MB or smaller");
        return;
      }

      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      await onUpload(file);
      handleCropDialogChange(false);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to save photo");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <div className="relative inline-block">
          <UserAvatar user={user} size="xl" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSaving}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-raised bg-primary text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Upload profile photo"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {user?.hasAvatar ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving || isUploading || isSaving}
            className="text-sm text-text-secondary transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove photo
          </button>
        ) : null}

        <p className="text-xs text-text-muted">
          JPEG, PNG, WebP, or GIF. Maximum size 2MB.
        </p>
      </div>

      <Dialog open={cropOpen} onOpenChange={handleCropDialogChange}>
        <DialogContent onClose={() => handleCropDialogChange(false)}>
          <DialogHeader>
            <DialogTitle>Edit profile photo</DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-surface sm:h-72">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
              />
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            <label htmlFor="avatar-zoom" className="text-sm text-text-secondary">
              Zoom
            </label>
            <input
              id="avatar-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCropDialogChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveCrop}
              isLoading={isSaving || isUploading}
              disabled={!croppedAreaPixels}
            >
              Save photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
