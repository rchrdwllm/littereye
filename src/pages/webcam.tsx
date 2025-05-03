import {
  CameraIcon,
  VideoCameraIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

export default function WebcamPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capturedImageRef = useRef<HTMLImageElement>(null);
  const capturedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoDimensions, setVideoDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [displayDimensions, setDisplayDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  const getCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported by this browser.");
      setHasCameraPermission(false);

      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      setStream(mediaStream);
      setHasCameraPermission(true);
      setIsCameraOn(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Could not access the camera. Please ensure permissions are granted in your browser settings."
      );
      setHasCameraPermission(false);
      setIsCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());

      setStream(null);
      setIsCameraOn(false);
    }
  }, [stream]);

  const handleCapture = async () => {
    setIsLoading(true);

    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (context) {
        try {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);

          const imageDataUrl = canvas.toDataURL("image/jpeg");
          setCapturedImageUrl(imageDataUrl);

          const base64Image = imageDataUrl.split(",")[1];

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
        }
      }
    }

    setIsLoading(false);
  };

  const drawBoundingBoxes = useCallback(() => {
    if (
      !detectionResult ||
      !detectionResult.predictions ||
      !canvasRef.current ||
      !videoRef.current ||
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

    const originalWidth = videoDimensions?.width || 800;
    const originalHeight = videoDimensions?.height || 600;

    const containerAspectRatio =
      displayDimensions.width / displayDimensions.height;
    const videoAspectRatio = originalWidth / originalHeight;

    let renderedWidth,
      renderedHeight,
      offsetX = 0,
      offsetY = 0;

    if (videoAspectRatio > containerAspectRatio) {
      renderedWidth = displayDimensions.width;
      renderedHeight = displayDimensions.width / videoAspectRatio;
      offsetY = (displayDimensions.height - renderedHeight) / 2;
    } else {
      renderedHeight = displayDimensions.height;
      renderedWidth = displayDimensions.height * videoAspectRatio;
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
  }, [detectionResult, displayDimensions, videoDimensions]);

  const drawCapturedBoundingBoxes = useCallback(() => {
    if (
      !detectionResult ||
      !detectionResult.predictions ||
      !capturedCanvasRef.current ||
      !capturedImageRef.current
    ) {
      return;
    }

    const canvas = capturedCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = capturedImageRef.current;
    if (!ctx || !img.complete) return;

    const displayWidth = img.offsetWidth;
    const displayHeight = img.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const originalWidth = videoDimensions?.width || 800;
    const originalHeight = videoDimensions?.height || 600;

    const containerAspectRatio = displayWidth / displayHeight;
    const imageAspectRatio = originalWidth / originalHeight;

    let renderedWidth,
      renderedHeight,
      offsetX = 0,
      offsetY = 0;

    if (imageAspectRatio > containerAspectRatio) {
      renderedWidth = displayWidth;
      renderedHeight = displayWidth / imageAspectRatio;
      offsetY = (displayHeight - renderedHeight) / 2;
    } else {
      renderedHeight = displayHeight;
      renderedWidth = displayHeight * imageAspectRatio;
      offsetX = (displayWidth - renderedWidth) / 2;
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
  }, [detectionResult, videoDimensions]);

  useEffect(() => {
    if (isCameraOn && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
        setError("Could not play the video stream.");
      });
    } else if (!isCameraOn && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isCameraOn, stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
      setDisplayDimensions({
        width: videoRef.current.offsetWidth,
        height: videoRef.current.offsetHeight,
      });
    }
  };

  const handleCapturedImageLoad = () => {
    if (capturedImageRef.current) {
      drawCapturedBoundingBoxes();
    }
  };

  useEffect(() => {
    const updateDisplayDimensions = () => {
      if (videoRef.current) {
        setDisplayDimensions({
          width: videoRef.current.offsetWidth,
          height: videoRef.current.offsetHeight,
        });
      }

      drawCapturedBoundingBoxes();
    };

    window.addEventListener("resize", updateDisplayDimensions);

    return () => {
      window.removeEventListener("resize", updateDisplayDimensions);
    };
  }, [drawCapturedBoundingBoxes]);

  useEffect(() => {
    drawBoundingBoxes();
    drawCapturedBoundingBoxes();
  }, [
    drawBoundingBoxes,
    drawCapturedBoundingBoxes,
    detectionResult,
    displayDimensions,
  ]);

  return (
    <Card className="border border-gray-200 shadow-none">
      <header className="p-8 pb-4">
        <h1 className="text-2xl font-bold mb-2">Camera Detection</h1>
        <p className="text-gray-500">
          Use your device's camera to detect litter in real-time (capture frame)
        </p>
      </header>
      <Divider className="my-4" />
      <div className="p-8 pt-4 flex flex-col gap-4">
        {!isCameraOn ? (
          <Button onClick={getCameraPermission} color="primary">
            <CameraIcon className="size-4" aria-hidden="true" />
            Enable Camera
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button onClick={stopCamera} className="flex-1" color="danger">
              <CameraIcon className="size-4" aria-hidden="true" />
              Disable Camera
            </Button>
            <Button
              onClick={handleCapture}
              isLoading={isLoading}
              color="warning"
              className="flex-1 text-white"
            >
              <TrashIcon className="size-4" aria-hidden="true" />
              Detect Litter
            </Button>
          </div>
        )}
        <div className="flex justify-center">
          <div className="aspect-video flex-1 max-w-[624px] relative">
            {isCameraOn ? (
              <div className="size-full overflow-hidden rounded-xl relative">
                <video
                  ref={videoRef}
                  className={`w-full bg-gray-100 text-gray-500 h-full object-contain rounded-xl ${!isCameraOn ? "hidden" : ""}`}
                  autoPlay
                  muted
                  playsInline
                  onLoadedMetadata={handleVideoMetadata}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
            ) : (
              <div
                onClick={getCameraPermission}
                className="flex cursor-pointer h-full text-gray-500 flex-col items-center justify-center bg-gray-100 rounded-xl shadow-inner"
              >
                <VideoCameraIcon className="w-16 h-16 mb-4" />
                <p>Camera is off</p>
                {hasCameraPermission === null && (
                  <p className="text-sm">(Click 'Enable Camera' to start)</p>
                )}
              </div>
            )}
          </div>
        </div>
        {capturedImageUrl && detectionResult && (
          <div className="mt-4">
            <h3 className="font-medium text-lg mb-2">Captured Frame</h3>
            <div className="relative border border-border rounded-xl overflow-hidden shadow-inner max-h-[60vh] bg-gray-100 bg-muted flex items-center justify-center">
              <img
                ref={capturedImageRef}
                src={capturedImageUrl}
                alt="Captured frame"
                className="object-contain w-full h-auto max-h-[60vh]"
                onLoad={handleCapturedImageLoad}
              />
              <canvas
                ref={capturedCanvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </div>
          </div>
        )}
        {detectionResult &&
          detectionResult.predictions &&
          detectionResult.predictions.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-lg mb-2">Detection Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {detectionResult.predictions.map(
                  (prediction: any, index: number) => (
                    <div
                      key={index}
                      className="p-2 border rounded-lg bg-gray-50 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{prediction.class}</span>
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
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
