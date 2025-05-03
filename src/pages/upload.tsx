import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { CameraIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [displayDimensions, setDisplayDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setDetectionResult(null);

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

    try {
      const base64Image = previewUrl.split(",")[1];

      await axios({
        method: "POST",
        url: "https://serverless.roboflow.com/littereye-wzbbi/6",
        params: {
          api_key: "iNwxa2ptZnsfSzKmXNYc",
        },
        data: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
        .then(function (response) {
          console.log(response.data);
          setDetectionResult(response.data);
          
          // Save detection to localStorage
          if (response.data.predictions && response.data.predictions.length > 0) {
            const existingDetections = JSON.parse(localStorage.getItem("litterEye_detections") || "[]");
            const newDetection = {
              id: `upload_${Date.now()}`, 
              timestamp: Date.now(),
              imageUrl: previewUrl,
              predictions: response.data.predictions,
              source: "upload"
            };
            
            localStorage.setItem(
              "litterEye_detections", 
              JSON.stringify([newDetection, ...existingDetections])
            );
          }
        })
        .catch(function (error) {
          console.log(error.message);
          setError(error.message);
        });
    } catch (err) {
      console.error("Detection failed:", err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during detection.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
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

  const drawBoundingBoxes = useCallback(() => {
    if (
      !detectionResult ||
      !detectionResult.predictions ||
      !canvasRef.current ||
      !imageRef.current ||
      !displayDimensions
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = displayDimensions.width;
    canvas.height = displayDimensions.height;

    const originalWidth = imageDimensions?.width || 800;
    const originalHeight = imageDimensions?.height || 600;

    const containerAspectRatio =
      displayDimensions.width / displayDimensions.height;
    const imageAspectRatio = originalWidth / originalHeight;

    let renderedWidth,
      renderedHeight,
      offsetX = 0,
      offsetY = 0;

    if (imageAspectRatio > containerAspectRatio) {
      renderedWidth = displayDimensions.width;
      renderedHeight = displayDimensions.width / imageAspectRatio;
      offsetY = (displayDimensions.height - renderedHeight) / 2;
    } else {
      renderedHeight = displayDimensions.height;
      renderedWidth = displayDimensions.height * imageAspectRatio;
      offsetX = (displayDimensions.width - renderedWidth) / 2;
    }

    const scaleX = renderedWidth / originalWidth;
    const scaleY = renderedHeight / originalHeight;

    detectionResult.predictions.forEach((prediction: any) => {
      const x = prediction.x * scaleX + offsetX;
      const y = prediction.y * scaleY + offsetY;
      const width = prediction.width * scaleX;
      const height = prediction.height * scaleY;

      const confidence = prediction.confidence;
      const alpha = Math.max(0.2, Math.min(0.8, confidence));

      ctx.strokeStyle = `rgba(255, 99, 71, ${alpha + 0.2})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - width / 2, y - height / 2, width, height);

      ctx.fillStyle = `rgba(255, 99, 71, ${alpha})`;
      ctx.fillRect(x - width / 2, y - height / 2 - 24, width, 24);

      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      const label = `${prediction.class} (${Math.round(confidence * 100)}%)`;
      ctx.fillText(label, x, y - height / 2 - 7);
    });
  }, [detectionResult, displayDimensions, imageDimensions]);

  useEffect(() => {
    const calculateRenderedDimensions = () => {
      if (
        imageRef.current &&
        imageRef.current.complete &&
        imageRef.current.naturalWidth > 0
      ) {
        setImageDimensions({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
        });
        setDisplayDimensions({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        });
      }
    };

    calculateRenderedDimensions();

    const currentImageRef = imageRef.current;

    currentImageRef?.addEventListener("load", calculateRenderedDimensions);

    window.addEventListener("resize", calculateRenderedDimensions);

    return () => {
      window.removeEventListener("resize", calculateRenderedDimensions);
      currentImageRef?.removeEventListener("load", calculateRenderedDimensions);
    };
  }, [previewUrl]);

  useEffect(() => {
    drawBoundingBoxes();
  }, [drawBoundingBoxes, detectionResult, displayDimensions]);

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
            <div
              ref={containerRef}
              className="relative border border-border rounded-xl overflow-hidden shadow-inner max-h-[60vh] bg-gray-100 bg-muted flex items-center justify-center"
            >
              <img
                ref={imageRef}
                src={previewUrl}
                alt={"Uploaded image preview"}
                width={imageDimensions?.width || 800}
                height={imageDimensions?.height || 600}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain w-full h-auto max-h-[60vh]"
                onLoad={handleImageLoad}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </div>

            {detectionResult &&
              detectionResult.predictions &&
              detectionResult.predictions.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-lg mb-2">
                    Detection Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {detectionResult.predictions.map(
                      (prediction: any, index: number) => (
                        <div
                          key={index}
                          className="p-2 border rounded-lg bg-gray-50 flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">
                              {prediction.class}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({Math.round(prediction.confidence * 100)}%)
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
