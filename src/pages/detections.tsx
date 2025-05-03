import { useEffect, useState, useRef } from "react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";

interface Detection {
  id: string;
  timestamp: number;
  imageUrl: string;
  predictions: {
    x: number;
    y: number;
    width: number;
    height: number;
    class: string;
    confidence: number;
  }[];
  source: "upload" | "webcam";
}

export default function DetectionsPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const storedDetections = localStorage.getItem("litterEye_detections");
    if (storedDetections) {
      setDetections(JSON.parse(storedDetections));
    }
  }, []);

  const clearAllDetections = () => {
    localStorage.removeItem("litterEye_detections");
    setDetections([]);
    setSelectedDetection(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    if (selectedDetection && canvasRef.current && imageRef.current && imageRef.current.complete) {
      drawBoundingBoxes();
    }
  }, [selectedDetection]);

  const drawBoundingBoxes = () => {
    if (!selectedDetection || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const displayWidth = img.width;
    const displayHeight = img.height;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = displayWidth / img.naturalWidth;
    const scaleY = displayHeight / img.naturalHeight;

    selectedDetection.predictions.forEach((prediction) => {
      const x = prediction.x * scaleX;
      const y = prediction.y * scaleY;
      const width = prediction.width * scaleX;
      const height = prediction.height * scaleY;

      const confidence = prediction.confidence;
      const alpha = Math.max(0.2, Math.min(0.8, confidence));

      ctx.strokeStyle = `rgba(255, 99, 71, ${alpha + 0.2})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - width / 2, y - height / 2, width, height);

      ctx.fillStyle = `rgba(255, 99, 71, ${alpha})`;
      ctx.fillRect(x - width / 2, y - height / 2 - 20, width, 20);

      ctx.fillStyle = "white";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      const label = `${prediction.class} (${Math.round(confidence * 100)}%)`;
      ctx.fillText(label, x, y - height / 2 - 6);
    });
  };

  const handleImageLoad = () => {
    if (selectedDetection) {
      drawBoundingBoxes();
    }
  };

  return (
    <Card className="border border-gray-200 shadow-none">
      <header className="p-8 pb-4">
        <h1 className="text-2xl font-bold mb-2">Detection History</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-500">{detections.length} detection{detections.length !== 1 ? 's' : ''} found</p>
          {detections.length > 0 && (
            <Button color="danger" size="sm" onClick={clearAllDetections}>
              <TrashIcon className="size-4" />
              Clear All
            </Button>
          )}
        </div>
      </header>
      <Divider className="my-4" />
      
      <div className="p-8 pt-4">
        {detections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No detections yet. Upload an image or use the webcam to detect litter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detections.map((detection) => (
              <div
                key={detection.id}
                className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedDetection?.id === detection.id ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedDetection(detection)}
              >
                <div className="aspect-video relative bg-gray-100 overflow-hidden">
                  <img
                    src={detection.imageUrl}
                    alt={`Detection from ${detection.source}`}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500">{formatDate(detection.timestamp)}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detection.predictions.map((pred, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-gray-100 px-2 py-1 rounded-md"
                          >
                            {pred.class}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="bg-gray-100 text-xs px-2 py-1 rounded capitalize">{detection.source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedDetection && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-xl font-bold mb-4">Detection Details</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 relative border border-gray-200 rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={selectedDetection.imageUrl}
                  alt="Selected detection"
                  className="w-full h-auto"
                  onLoad={handleImageLoad}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Source:</span>
                      <span className="font-medium capitalize">{selectedDetection.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{formatDate(selectedDetection.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Objects:</span>
                      <span className="font-medium">{selectedDetection.predictions.length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Detections</h3>
                  <div className="space-y-2">
                    {selectedDetection.predictions.map((pred, idx) => (
                      <div key={idx} className="p-2 border rounded-lg bg-gray-50">
                        <div className="flex justify-between">
                          <span className="font-medium">{pred.class}</span>
                          <span>{Math.round(pred.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
