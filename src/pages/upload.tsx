import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { CameraIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const file = event.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setImageDimensions(null);
        if (imageRef.current) {
          imageRef.current.src = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (file) {
        setError("Please select a valid image file (e.g., JPG, PNG, GIF).");
      }
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDetectClick = useCallback(async () => {
    if (!selectedFile || !previewUrl) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(30); // Initial progress

    try {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(60);

      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch(
        "https://littereye-backend.onrender.com/api/detect",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      setDetectionResult(data);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(100);
    } catch (err) {
      console.error("Detection failed:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during detection.";
      setError(errorMessage);
      setProgress(0);
    } finally {
      setIsLoading(false);
      // Optionally reset progress after a short delay
      setTimeout(() => setProgress(0), 1000);
    }
  }, [selectedFile, previewUrl]);

  const handleImageLoad = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = event.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  // Effect to calculate rendered dimensions after image load and on resize
  useEffect(() => {
    const calculateRenderedDimensions = () => {
      if (
        imageRef.current &&
        imageRef.current.complete &&
        imageRef.current.naturalWidth > 0
      ) {
        setImageDimensions({
          width: imageRef.current.offsetWidth, // Use rendered width
          height: imageRef.current.offsetHeight, // Use rendered height
        });
      }
    };

    // Calculate on initial load/mount if image is already there
    calculateRenderedDimensions();

    const currentImageRef = imageRef.current;
    // Add load listener if ref exists
    currentImageRef?.addEventListener("load", calculateRenderedDimensions);

    window.addEventListener("resize", calculateRenderedDimensions);

    return () => {
      window.removeEventListener("resize", calculateRenderedDimensions);
      currentImageRef?.removeEventListener("load", calculateRenderedDimensions);
    };
  }, [previewUrl]); // Rerun when previewUrl changes

  return (
    <Card className="border border-gray-200 shadow-none">
      <header className="p-8 pb-4">
        <h1 className="text-2xl font-bold mb-2">Upload Image for Detection</h1>
        <p className="text-gray-500">Select an image from your device</p>
      </header>
      <Divider className="my-4" />
      <div className="p-8 pt-4 flex flex-col gap-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload image file"
          />
          <div className="flex gap-4 justify-stretch">
            <Button
              onClick={triggerFileInput}
              color="primary"
              className="w-full"
            >
              <CameraIcon className="size-4" aria-hidden="true" />
              Upload Image
            </Button>
            {previewUrl && (
              <Button
                onClick={handleDetectClick}
                color="warning"
                className="text-white w-full"
                isLoading={isLoading}
              >
                {isLoading ? (
                  "Detecting litter..."
                ) : (
                  <>
                    <TrashIcon className="size-4" />
                    Detect Litter
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        {previewUrl && (
          <div className="space-y-4">
            <div className="relative border border-border rounded-xl overflow-hidden shadow-inner max-h-[60vh] bg-gray-100 bg-muted flex items-center justify-center">
              <img
                ref={imageRef}
                src={
                  !detectionResult
                    ? previewUrl
                    : `data:image/jpeg;base64,${detectionResult.image}`
                }
                alt={"Uploaded image preview"}
                width={imageDimensions?.width || 800}
                height={imageDimensions?.height || 600}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain w-full h-auto max-h-[60vh]"
                onLoad={handleImageLoad}
                data-ai-hint="uploaded environment street park"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
