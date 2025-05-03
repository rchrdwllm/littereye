import {
  CameraIcon,
  VideoCameraIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { useCallback, useEffect, useRef, useState } from "react";

export default function WebcamPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDimensions, setVideoDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const getCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported by this browser.");
      setHasCameraPermission(false);

      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      }); // Prefer back camera
      setStream(mediaStream);
      setHasCameraPermission(true);
      setIsCameraOn(true); // Turn camera on after permission granted
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Could not access the camera. Please ensure permissions are granted in your browser settings."
      );
      setHasCameraPermission(false);
      setIsCameraOn(false);
    }
  }, []);

  // Stop camera stream
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

          const res = await fetch(
            "https://littereye-backend.onrender.com/api/detect",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image: imageDataUrl,
              }),
            }
          );
          const data = await res.json();

          setDetectionResult(data);
        } catch (err) {
          console.error("Detection failed:", err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : "An unknown error occurred during detection.";
          setError(errorMessage);
          setProgress(0);
        }
      }
    }

    setIsLoading(false);
  };

  // Set up video stream when permission is granted and camera is on
  useEffect(() => {
    if (isCameraOn && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
        setError("Could not play the video stream.");
      });
    } else if (!isCameraOn && videoRef.current) {
      videoRef.current.srcObject = null; // Ensure video stops if camera is turned off
    }
  }, [isCameraOn, stream]);

  // Cleanup camera on component unmount
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
    }
  };

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
          <div className="aspect-video flex-1 max-w-[624px]">
            {isCameraOn ? (
              <div className="size-full overflow-hidden rounded-xl">
                <video
                  ref={videoRef}
                  className={`w-full bg-gray-100 text-gray-500 h-full object-contain rounded-xl ${!isCameraOn ? "hidden" : ""}`}
                  autoPlay
                  muted
                  playsInline
                  onLoadedMetadata={handleVideoMetadata}
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
        {detectionResult && (
          <div className="relative border border-border rounded-xl overflow-hidden shadow-inner max-h-[60vh] bg-gray-100 bg-muted flex items-center justify-center">
            <img
              src={`data:image/jpeg;base64,${detectionResult.image}`}
              alt={"Uploaded image preview"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain w-full h-auto max-h-[60vh] aspect-video"
              data-ai-hint="uploaded environment street park"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
