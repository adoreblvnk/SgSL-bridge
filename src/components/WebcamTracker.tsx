"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, CheckCircle2, RefreshCw } from "lucide-react";

interface WebcamTrackerProps {
  onSuccess?: () => void;
  targetSign: string;
}

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export default function WebcamTracker({ onSuccess }: WebcamTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);

  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1);

  const startCamera = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: "user" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      try {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });
        landmarkerRef.current = landmarker;
      } catch (mpErr) {
        console.warn("MediaPipe fallback:", mpErr);
      }

      setCameraActive(true);
      setLoading(false);
    } catch {
      setErrorMsg("Camera unavailable or permission denied.");
      setLoading(false);
      setCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close();
      } catch {
        // ignore
      }
      landmarkerRef.current = null;
    }
    setCameraActive(false);
    setHandDetected(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraActive) return;

    let isMounted = true;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth || 480;
          canvas.height = video.videoHeight || 360;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);

          if (landmarkerRef.current && video.currentTime !== lastTimeRef.current) {
            lastTimeRef.current = video.currentTime;
            try {
              const results = landmarkerRef.current.detectForVideo(video, performance.now());
              if (results && results.landmarks && results.landmarks.length > 0) {
                setHandDetected(true);
                for (const landmarks of results.landmarks) {
                  ctx.strokeStyle = "#58cc02";
                  ctx.lineWidth = 3;
                  for (const [start, end] of CONNECTIONS) {
                    const p1 = landmarks[start];
                    const p2 = landmarks[end];
                    ctx.beginPath();
                    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                    ctx.stroke();
                  }

                  ctx.fillStyle = "#ffffff";
                  ctx.strokeStyle = "#46a302";
                  ctx.lineWidth = 2;
                  for (const point of landmarks) {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                  }
                }
              } else {
                setHandDetected(false);
              }
            } catch {
              // ignore
            }
          }
          ctx.restore();
        }
      }

      if (isMounted && cameraActive) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraActive]);

  const handleSimulateSign = () => {
    setHandDetected(true);
    setVerified(true);
    if (onSuccess) {
      setTimeout(onSuccess, 600);
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden p-3 relative flex flex-col items-center border border-slate-800">
      <div className="w-full flex items-center justify-between pb-2 px-1 text-xs text-slate-300 border-b border-slate-800/80 mb-2">
        <span className="font-semibold text-[11px] text-slate-400">
          Camera Mirror {cameraActive && (handDetected ? "• Hand Tracked" : "• Standby")}
        </span>
      </div>

      <div className="relative w-full aspect-[4/3] max-h-52 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${cameraActive ? "block" : "hidden"}`}
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${cameraActive ? "block" : "hidden"}`}
        />

        {!cameraActive && (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <Camera className="w-8 h-8 mb-2 text-slate-600" />
            <button
              onClick={startCamera}
              disabled={loading}
              className="mt-2 px-3 py-1.5 bg-[#58cc02] hover:bg-[#46a302] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <Camera className="w-3 h-3" /> Turn On Camera
                </>
              )}
            </button>
          </div>
        )}

        {cameraActive && verified && (
          <div className="absolute inset-0 bg-green-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-fade-in">
            <CheckCircle2 className="w-10 h-10 text-green-400 mb-1" />
            <p className="text-xs font-bold">Sign Recorded</p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="w-full mt-2 p-1.5 bg-amber-950/40 border border-amber-800/60 rounded text-amber-200 text-[11px]">
          {errorMsg}
        </div>
      )}

      <div className="w-full mt-2 flex items-center justify-between gap-2">
        {cameraActive ? (
          <>
            <button
              onClick={stopCamera}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1"
            >
              <CameraOff className="w-3 h-3" /> Stop
            </button>
            <button
              onClick={handleSimulateSign}
              className="px-3 py-1 bg-[#58cc02] hover:bg-[#46a302] text-white rounded text-xs font-bold uppercase tracking-wider"
            >
              Confirm Practice
            </button>
          </>
        ) : (
          <button
            onClick={handleSimulateSign}
            className="w-full py-1 text-slate-400 hover:text-slate-200 text-xs font-medium"
          >
            Skip Camera Practice
          </button>
        )}
      </div>
    </div>
  );
}
