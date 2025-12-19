import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import MediaUploadInput from "@/components/MediaUploadInput";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  required?: boolean;
  description?: string;
}

export default function ProductGallery({ 
  images, 
  onChange, 
  maxImages = 5,
  required = false,
  description = "Capture product from all angles - front, back, sides, and detailed shots"
}: ProductGalleryProps) {
  const handleAddImage = (url: string) => {
    if (url && images.length < maxImages) {
      onChange([...images, url]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return; // Already primary
    const newImages = [...images];
    const [primaryImage] = newImages.splice(index, 1);
    newImages.unshift(primaryImage);
    onChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>
            Product Gallery {required && <span className="text-destructive">*</span>}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Upload Area */}
      {images.length === 0 && (
        <Card 
          className={cn(
            "border-2 border-dashed p-8 text-center transition-colors",
            "hover:border-primary/50 hover:bg-accent/5"
          )}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop your images here, or browse
              </p>
              <p className="text-xs text-muted-foreground">
                Upload up to {maxImages} images • jpeg, png are allowed
              </p>
              <p className="text-xs text-primary font-medium mt-2">
                📸 Capture from all angles: front, back, sides, details
              </p>
            </div>
            <MediaUploadInput
              id="gallery-upload-primary"
              label="Upload Image"
              value=""
              onChange={handleAddImage}
              accept="image"
              placeholder="Upload image or enter URL"
            />
          </div>
        </Card>
      )}

      {/* Image Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card 
              key={index}
              className={cn(
                "relative group overflow-hidden aspect-square",
                index === 0 && "ring-2 ring-primary"
              )}
              data-testid={`image-preview-${index}`}
            >
              <img 
                src={image} 
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(index)}
                    data-testid={`button-set-primary-${index}`}
                  >
                    Set Primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveImage(index)}
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </Card>
          ))}

          {/* Add More Button */}
          {canAddMore && (
            <Card 
              className="border-2 border-dashed flex flex-col items-center justify-center aspect-square hover:border-primary/50 hover:bg-accent/5 transition-colors p-4"
              data-testid="card-add-more-image"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground text-center mb-3">
                Add More Images
              </p>
              <MediaUploadInput
                id={`gallery-upload-${images.length}`}
                label={`Image ${images.length + 1}`}
                value=""
                onChange={handleAddImage}
                accept="image"
                placeholder="Upload or enter URL"
              />
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
