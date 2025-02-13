import React, { useState, useRef, useEffect } from 'react';

interface Detection {
  class: string;
  confidence: number;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface APIResponse {
  boxes: Detection[];
}

const VideoVLMComponent = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const latestDetectionsRef = useRef<Detection[]>([]);
  const sendingRef = useRef(false);
  const isRunningRef = useRef(false);
  const [avgLatency, setAvgLatency] = useState<number>(0);
  const latencyTimesRef = useRef<number[]>([]);
  const MAX_LATENCY_SAMPLES = 5;  // Keep last 5 samples

  useEffect(() => {
    // Setup webcam
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            console.log('Video dimensions:', {
              width: videoRef.current?.videoWidth,
              height: videoRef.current?.videoHeight
            });
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    setupWebcam();

    // Cleanup
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureAndProcess = async () => {
    if (!videoRef.current || !captureCanvasRef.current || !displayCanvasRef.current) {
      if (isRunningRef.current) {
        requestAnimationFrame(captureAndProcess);
      }
      return;
    }

    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    const captureCtx = captureCanvas.getContext('2d');
    const displayCtx = displayCanvas.getContext('2d');

    if (!captureCtx || !displayCtx) {
      console.error('Could not get canvas contexts');
      if (isRunningRef.current) {
        requestAnimationFrame(captureAndProcess);
      }
      return;
    }

    // Set canvas dimensions to match video
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    displayCanvas.width = video.videoWidth;
    displayCanvas.height = video.videoHeight;

    // Draw current video frame to capture canvas
    captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    // Draw current video frame to display canvas
    displayCtx.drawImage(video, 0, 0, displayCanvas.width, displayCanvas.height);

    // Overlay latest detections
    latestDetectionsRef.current.forEach(det => {
      displayCtx.strokeStyle = '#00ff00';
      displayCtx.lineWidth = 2;
      displayCtx.strokeRect(det.xmin, det.ymin, det.xmax - det.xmin, det.ymax - det.ymin);

      displayCtx.fillStyle = '#00ff00';
      displayCtx.font = '16px Arial';
      displayCtx.fillText(
        `${det.class} (${det.confidence.toFixed(2)})`,
        det.xmin,
        det.ymin - 5
      );
    });

    // If not currently sending, capture frame and send to API
    if (!sendingRef.current) {
      sendingRef.current = true;

      captureCanvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Could not get blob from capture canvas');
          sendingRef.current = false;
          return;
        }

        try {
          const apiStartTime = performance.now();

          const formData = new FormData();
          formData.append('file', blob, 'webcam.jpg');

          const response = await fetch('https://predict.dch.xyz/predict/', {
            method: 'POST',
            body: formData,
          });

          const result: APIResponse = await response.json();

          // Calculate latency for this call
          const latency = performance.now() - apiStartTime;

          // Update rolling average
          latencyTimesRef.current.push(latency);
          if (latencyTimesRef.current.length > MAX_LATENCY_SAMPLES) {
            latencyTimesRef.current.shift();
          }

          // Calculate and set average
          const avgLatency = latencyTimesRef.current.reduce((a, b) => a + b, 0) / latencyTimesRef.current.length;
          setAvgLatency(Math.round(avgLatency));

          latestDetectionsRef.current = result.boxes;
          setDetections(result.boxes);
          console.log('Got detections:', result.boxes);
        } catch (e) {
          console.error("API request failed:", e);
        } finally {
          sendingRef.current = false;
        }
      }, 'image/jpeg');
    }

    // Schedule next frame
    if (isRunningRef.current) {
      requestAnimationFrame(captureAndProcess);
    }
  };

  const toggleProcessing = () => {
    setIsRunning(prev => {
      const newValue = !prev;
      isRunningRef.current = newValue;
      console.log('Toggle processing:', newValue);
      if (newValue) {
        console.log('Starting processing loop');
        requestAnimationFrame(captureAndProcess);
      }
      return newValue;
    });
  };

  return (
    <div>
      <h1>YOLO Webcam Detection</h1>
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={toggleProcessing}
          className={`
            ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
            text-white
            px-5 py-2.5
            rounded-md
            font-semibold
            transition-colors
            cursor-pointer
            flex items-center gap-2
          `}
        >
          {isRunning ? '⏹' : '▶️'}
          <span>{isRunning ? 'Stop' : 'Start'} Processing</span>
        </button>
        <div className="flex gap-4 text-sm font-mono">
          <span>Average API Latency: {avgLatency}ms</span>
        </div>
      </div>
      <div className="flex gap-5">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '640px', display: 'none' }}
        />
        <canvas
          ref={captureCanvasRef}
          style={{ display: 'none' }}  // Hide capture canvas
        />
        <canvas
          ref={displayCanvasRef}
          style={{ maxWidth: '100%', border: '1px solid #ccc' }}
        />
      </div>
      <h2>Detections:</h2>
      <pre>{JSON.stringify(detections, null, 2)}</pre>
    </div>
  );
};

export default VideoVLMComponent;