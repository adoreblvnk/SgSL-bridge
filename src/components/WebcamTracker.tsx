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

export default function WebcamTracker({ onSuccess, targetSign }: WebcamTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [matchHint, setMatchHint] = useState<string>("Align hand with camera");
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1);
  const holdCounterRef = useRef<number>(0);
  const motionHistoryRef = useRef<Array<{ x: number; y: number }>>([]);
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
    motionHistoryRef.current = [];
    holdCounterRef.current = 0;
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
                const landmarksList = results.landmarks;

                // Track motion history of primary hand wrist
                const primaryHand = landmarksList[0];
                const wrist = primaryHand[0];
                motionHistoryRef.current.push({ x: wrist.x, y: wrist.y });
                if (motionHistoryRef.current.length > 25) {
                  motionHistoryRef.current.shift();
                }

                // Evaluate tolerant sign match
                const evaluation = evaluateSignMatch(
                  targetSign,
                  landmarksList,
                  motionHistoryRef.current
                );
                setMatchScore(evaluation.score);

                if (evaluation.matched) {
                  // Fast, reliable charge: ~30 frames (1 second) to complete
                  holdCounterRef.current = Math.min(100, holdCounterRef.current + 3.2);
                } else if (evaluation.score >= 65) {
                  // Warm grace zone: good form, momentary turnaround -> gentle forward progress
                  holdCounterRef.current = Math.min(100, holdCounterRef.current + 0.6);
                } else if (evaluation.score >= 40) {
                  // Minor deviation -> very soft decay (never erases progress abruptly)
                  holdCounterRef.current = Math.max(0, holdCounterRef.current - 0.6);
                } else {
                  // Completely wrong sign or hand dropped -> steady decay
                  holdCounterRef.current = Math.max(0, holdCounterRef.current - 2.5);
                }
                setHoldProgress(holdCounterRef.current);

                if (holdCounterRef.current >= 40 && holdCounterRef.current < 100) {
                  setMatchHint(`Almost there! Keep holding (${Math.round(holdCounterRef.current)}%)`);
                } else {
                  setMatchHint(evaluation.hint);
                }
                if (holdCounterRef.current >= 100 && !verified) {
                  setVerified(true);
                  if (onSuccess) {
                    setTimeout(onSuccess, 600);
                  }
                }

                for (const landmarks of landmarksList) {
                  ctx.strokeStyle = evaluation.matched ? "#58cc02" : "#38bdf8";
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
                  ctx.strokeStyle = evaluation.matched ? "#46a302" : "#0284c7";
                  ctx.lineWidth = 2;
                  for (const point of landmarks) {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                  }
                }
              } else {
                motionHistoryRef.current = [];
                setHandDetected(false);
                setMatchScore(0);
                setMatchHint("Raise hand into camera view");
                holdCounterRef.current = Math.max(0, holdCounterRef.current - 8);
                setHoldProgress(holdCounterRef.current);
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
    setHoldProgress(100);
    setMatchScore(98);
    setMatchHint("Sign Verified!");
    if (onSuccess) {
      setTimeout(onSuccess, 600);
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden p-3 relative flex flex-col items-center border border-slate-800">
      <div className="w-full flex items-center justify-between pb-2 px-1 text-xs text-slate-300 border-b border-slate-800/80 mb-2">
        <span className="font-semibold text-[11px] text-slate-400">
          Camera Mirror {cameraActive && (handDetected ? `• ${matchScore}% Match` : "• Standby")}
        </span>
        {cameraActive && (
          <span className="text-[10px] uppercase font-bold text-emerald-400">
            Target: {targetSign.toUpperCase()}
          </span>
        )}
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
          <div className="absolute inset-0 bg-green-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-1 animate-bounce" />
            <p className="text-sm font-extrabold uppercase tracking-wider text-green-300">
              Sign Verified: {targetSign.toUpperCase()}!
            </p>
            <span className="text-[11px] text-green-200/80">Correct Handshape & Position</span>
          </div>
        )}

        {cameraActive && !verified && handDetected && (
          <div className="absolute top-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-700/60 flex items-center justify-between text-[11px] text-white z-10">
            <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{matchHint}</span>
            <span className={`font-bold ${matchScore >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
              {matchScore}%
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="w-full mt-2 p-1.5 bg-amber-950/40 border border-amber-800/60 rounded text-amber-200 text-[11px]">
          {errorMsg}
        </div>
      )}

      {/* Hold verification progress bar */}
      {cameraActive && !verified && (
        <div className="w-full mt-2 bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-150 ease-out"
            style={{ width: `${holdProgress}%` }}
          />
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
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold"
            >
              Manual Verify
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

function evaluateSignMatch(
  targetSign: string,
  hands: Array<Array<{ x: number; y: number; z: number }>>,
  history: Array<{ x: number; y: number }>
): { matched: boolean; score: number; hint: string } {
  if (!hands || hands.length === 0) {
    return { matched: false, score: 0, hint: "Raise hand into camera view" };
  }

  const primaryHand = hands[0];
  const wrist = primaryHand[0];

  // Relaxed finger extension ratio (1.08 allows natural curvature and slight tilts)
  const indexExt =
    Math.hypot(primaryHand[8].x - wrist.x, primaryHand[8].y - wrist.y) >
    Math.hypot(primaryHand[6].x - wrist.x, primaryHand[6].y - wrist.y) * 1.08;
  const middleExt =
    Math.hypot(primaryHand[12].x - wrist.x, primaryHand[12].y - wrist.y) >
    Math.hypot(primaryHand[10].x - wrist.x, primaryHand[10].y - wrist.y) * 1.08;
  const ringExt =
    Math.hypot(primaryHand[16].x - wrist.x, primaryHand[16].y - wrist.y) >
    Math.hypot(primaryHand[14].x - wrist.x, primaryHand[14].y - wrist.y) * 1.08;
  const pinkyExt =
    Math.hypot(primaryHand[20].x - wrist.x, primaryHand[20].y - wrist.y) >
    Math.hypot(primaryHand[18].x - wrist.x, primaryHand[18].y - wrist.y) * 1.08;
  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // Trajectory analysis over the rolling history buffer
  let spanX = 0;
  let spanY = 0;
  let totalPath = 0;

  if (history.length >= 6) {
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    for (let i = 0; i < history.length; i++) {
      const p = history[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (i > 0) {
        totalPath += Math.hypot(p.x - history[i - 1].x, p.y - history[i - 1].y);
      }
    }
    spanX = maxX - minX;
    spanY = maxY - minY;
  }

  const isErratic = spanX > 0.45 || spanY > 0.5;
  if (isErratic) {
    return { matched: false, score: 30, hint: "Movement too wide — keep sign controlled" };
  }

  // Scenario 1: COFFEE (Grinder motion)
  if (targetSign === "coffee") {
    // Tolerant fist check: up to 1 extended finger (thumb or loose finger allowed)
    const isFist = extendedCount <= 1;
    if (!isFist) {
      return { matched: false, score: 30, hint: "Curl fingers into a fist shape" };
    }

    const isGoodHeight = wrist.y >= 0.22 && wrist.y <= 0.92;
    if (!isGoodHeight) {
      return { matched: false, score: 45, hint: "Hold hands at chest/waist level" };
    }

    if (hands.length >= 2) {
      const secondWrist = hands[1][0];
      const handDist = Math.hypot(wrist.x - secondWrist.x, wrist.y - secondWrist.y);
      if (handDist > 0.45) {
        return { matched: false, score: 40, hint: "Bring both hands closer together" };
      }
    }

    const hasMotion = totalPath >= 0.025 || (spanX >= 0.015 && spanY >= 0.015);
    if (hasMotion) {
      return { matched: true, score: 94, hint: "Grinding motion verified • Hold steady" };
    }

    // Good handshape, just needs continuous movement
    return { matched: false, score: 70, hint: "Rotate fist in a circular grinding motion" };
  }

  // Scenario 2: EAT (Spoon motion)
  if (targetSign === "eat") {
    const isSpoonShape = extendedCount <= 2;
    if (!isSpoonShape) {
      return { matched: false, score: 30, hint: "Curl fingers like holding a spoon" };
    }

    const isNearMouth = wrist.y < 0.65 && wrist.x >= 0.15 && wrist.x <= 0.85;
    if (!isNearMouth) {
      return { matched: false, score: 45, hint: "Raise hand closer to mouth height" };
    }

    const hasMotion = totalPath >= 0.025 || spanY >= 0.018;
    if (hasMotion) {
      return { matched: true, score: 95, hint: "Eating motion verified • Hold steady" };
    }

    return { matched: false, score: 70, hint: "Move hand gently towards mouth" };
  }

  // Scenario 3: PLEASE (Chest rub)
  if (targetSign === "please") {
    // 3 or more extended fingers is a flat palm (allows relaxed thumb or pinky)
    const isFlatPalm = extendedCount >= 3;
    if (!isFlatPalm) {
      return { matched: false, score: 30, hint: "Open flat palm facing chest" };
    }

    const isOnChest = wrist.x >= 0.18 && wrist.x <= 0.82 && wrist.y >= 0.28 && wrist.y <= 0.88;
    if (!isOnChest) {
      return { matched: false, score: 45, hint: "Place flat palm on centre of chest" };
    }

    const hasMotion = totalPath >= 0.025 || (spanX >= 0.015 && spanY >= 0.015);
    if (hasMotion) {
      return { matched: true, score: 96, hint: "Chest rub verified • Hold steady" };
    }

    return { matched: false, score: 70, hint: "Rub palm gently in a circle on chest" };
  }

  return { matched: false, score: 15, hint: "Perform the sign shown above" };
}
