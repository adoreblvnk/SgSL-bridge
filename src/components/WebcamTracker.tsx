"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, CheckCircle2, RefreshCw, RotateCcw } from "lucide-react";

interface WebcamTrackerProps {
  onSuccess?: () => void;
  targetSign: string;
  mode?: "sgsl" | "asl";
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

export default function WebcamTracker({
  onSuccess,
  targetSign,
  mode = "sgsl",
}: WebcamTrackerProps) {
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
  const motionHistoryRef = useRef<Array<{ wx: number; wy: number; tx: number; ty: number }>>([]);

  // Keep mutable refs in sync on EVERY render so renderLoop never closes over stale props
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const targetSignRef = useRef(targetSign);
  targetSignRef.current = targetSign;

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

                // Track multi-point motion: wrist (0) + index fingertip (8) for rotation sensitivity
                const primaryHand = landmarksList[0];
                const wrist = primaryHand[0];
                const indexTip = primaryHand[8];
                motionHistoryRef.current.push({
                  wx: wrist.x,
                  wy: wrist.y,
                  tx: indexTip.x,
                  ty: indexTip.y,
                });
                if (motionHistoryRef.current.length > 25) {
                  motionHistoryRef.current.shift();
                }
                // Evaluate tolerant sign match using current refs (never stale)
                const currentMode = modeRef.current;
                const currentSign = targetSignRef.current;
                const evaluation = evaluateSignMatch(
                  currentSign,
                  landmarksList,
                  motionHistoryRef.current,
                  currentMode
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

                const isAsl = currentMode === "asl";
                for (const landmarks of landmarksList) {
                  ctx.strokeStyle = evaluation.matched
                    ? (isAsl ? "#38bdf8" : "#58cc02")
                    : (isAsl ? "#60a5fa" : "#86efac");
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
                  ctx.strokeStyle = evaluation.matched
                    ? (isAsl ? "#0284c7" : "#46a302")
                    : (isAsl ? "#2563eb" : "#16a34a");
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

  const handleReset = useCallback(() => {
    setVerified(false);
    setHoldProgress(0);
    setMatchScore(0);
    setMatchHint("Align hand with camera");
    holdCounterRef.current = 0;
    motionHistoryRef.current = [];
  }, []);

  useEffect(() => {
    handleReset();
  }, [targetSign, mode, handleReset]);

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
    <div
      className={`w-full bg-slate-900 rounded-xl overflow-hidden p-3 relative flex flex-col items-center border-2 transition-all duration-300 ${
        mode === "asl"
          ? "border-sky-500/70 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          : "border-emerald-500/70 shadow-[0_0_15px_rgba(88,204,2,0.2)]"
      }`}
    >
      {/* Camera Header */}
      <div className="w-full flex items-center justify-between pb-2 px-1 text-xs border-b border-slate-800/80 mb-2">
        <span className="font-semibold text-[11px] text-slate-300">
          Camera Mirror {cameraActive && (handDetected ? `• ${matchScore}% Match` : "• Ready")}
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
              className={`mt-1 px-4 py-2 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                mode === "asl"
                  ? "bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20"
                  : "bg-[#58cc02] hover:bg-[#46a302] shadow-md shadow-emerald-600/20"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Starting Camera...
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
          <div className="absolute inset-0 bg-green-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-fade-in p-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400 mb-1 animate-bounce" />
            <p className="text-sm font-extrabold uppercase tracking-wider text-green-300">
              Sign Verified: {mode === "asl" ? "ASL" : "SgSL"} {targetSign.toUpperCase()}!
            </p>
            <span className="text-[11px] text-green-200/80 mb-3">
              {mode === "asl" ? "ASL Movement Verified" : "SgSL Heritage Movement Verified"}
            </span>
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-white/30 shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Practice Again
            </button>
          </div>
        )}

        {cameraActive && !verified && handDetected && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-700/60 flex items-center justify-between text-[11px] text-white z-10">
            <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{matchHint}</span>
            <span className={`font-bold ${matchScore >= 75 ? (mode === "asl" ? "text-sky-400" : "text-emerald-400") : "text-amber-400"}`}>
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
            className={`h-full transition-all duration-150 ease-out ${
              mode === "asl" ? "bg-sky-500" : "bg-emerald-500"
            }`}
            style={{ width: `${holdProgress}%` }}
          />
        </div>
      )}

      <div className="w-full mt-2 flex items-center justify-between gap-2">
        {cameraActive ? (
          <>
            <button
              onClick={stopCamera}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <CameraOff className="w-3 h-3" /> Stop
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
                title="Reset sign practice progress"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
              {!verified && (
                <button
                  onClick={handleSimulateSign}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold cursor-pointer"
                >
                  Manual Verify
                </button>
              )}
            </div>
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
  history: Array<{ wx: number; wy: number; tx: number; ty: number }>,
  mode: "sgsl" | "asl" = "sgsl"
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

  // Multi-point trajectory analysis: tracks both wrist and fingertip rotation
  let wristSpanX = 0;
  let wristSpanY = 0;
  let wristPath = 0;
  let tipSpanX = 0;
  let tipSpanY = 0;
  let tipPath = 0;

  if (history.length >= 6) {
    let minWx = 1;
    let maxWx = 0;
    let minWy = 1;
    let maxWy = 0;
    let minTx = 1;
    let maxTx = 0;
    let minTy = 1;
    let maxTy = 0;
    for (let i = 0; i < history.length; i++) {
      const p = history[i];
      if (p.wx < minWx) minWx = p.wx;
      if (p.wx > maxWx) maxWx = p.wx;
      if (p.wy < minWy) minWy = p.wy;
      if (p.wy > maxWy) maxWy = p.wy;

      if (p.tx < minTx) minTx = p.tx;
      if (p.tx > maxTx) maxTx = p.tx;
      if (p.ty < minTy) minTy = p.ty;
      if (p.ty > maxTy) maxTy = p.ty;

      if (i > 0) {
        wristPath += Math.hypot(p.wx - history[i - 1].wx, p.wy - history[i - 1].wy);
        tipPath += Math.hypot(p.tx - history[i - 1].tx, p.ty - history[i - 1].ty);
      }
    }
    wristSpanX = maxWx - minWx;
    wristSpanY = maxWy - minWy;
    tipSpanX = maxTx - minTx;
    tipSpanY = maxTy - minTy;
  }

  const motionAmount = Math.max(wristPath, tipPath);
  const spanX = Math.max(wristSpanX, tipSpanX);
  const spanY = Math.max(wristSpanY, tipSpanY);

  const isErratic = spanX > 0.45 || spanY > 0.5;
  if (isErratic) {
    return { matched: false, score: 30, hint: "Movement too wide — keep sign controlled" };
  }

  // Scenario 1: COFFEE
  if (targetSign === "coffee") {
    const handScale =
      Math.hypot(primaryHand[9].x - wrist.x, primaryHand[9].y - wrist.y) || 0.15;
    const thumbIndexDist = Math.hypot(
      primaryHand[8].x - primaryHand[4].x,
      primaryHand[8].y - primaryHand[4].y
    );
    const thumbIndexRatio = thumbIndexDist / handScale;

    if (mode === "asl") {
      // ASL: C-hand shape drinking from a cup
      const isTightFist = thumbIndexRatio < 0.32 && extendedCount <= 1;
      if (isTightFist) {
        return {
          matched: false,
          score: 25,
          hint: "Fist is SgSL • Open fingers into a C-cup shape!",
        };
      }

      const isCupShape = thumbIndexRatio >= 0.30 && thumbIndexRatio <= 1.6 && extendedCount <= 3;
      if (!isCupShape) {
        return { matched: false, score: 30, hint: "Form a C-hand shape (holding a cup)" };
      }

      const isNearChin = wrist.y <= 0.88 || primaryHand[8].y <= 0.78;
      if (!isNearChin) {
        return { matched: false, score: 45, hint: "Lift C-hand cup towards chin/mouth" };
      }

      const hasTilt = motionAmount >= 0.010 || spanY >= 0.008;
      return {
        matched: true,
        score: hasTilt ? 96 : 92,
        hint: "C-hand cup detected • Hold steady to verify",
      };
    } else {
      // SgSL: Two-handed kopi grinder motion (fists stacked)
      if (thumbIndexRatio >= 0.45 && extendedCount > 1) {
        return {
          matched: false,
          score: 25,
          hint: "C-hand is ASL • Curl fingers into closed fists for SgSL grinder!",
        };
      }

      const isFist = thumbIndexRatio < 0.45 && extendedCount <= 1;
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

      const hasMotion = motionAmount >= 0.015 || (spanX >= 0.012 && spanY >= 0.012);
      if (hasMotion) {
        return { matched: true, score: 94, hint: "SgSL Grinder motion verified • Hold steady" };
      }
      return { matched: false, score: 70, hint: "Rotate fists in traditional kopi grinder motion" };
    }
  }

  // Scenario 2: EAT
  if (targetSign === "eat") {
    if (mode === "asl") {
      // ASL: Flat-O fingers-to-mouth tap (EATo)
      const isFlatO = extendedCount <= 2;
      const isNearLips = wrist.y < 0.65 && wrist.x >= 0.15 && wrist.x <= 0.85;
      if (!isNearLips) {
        return { matched: false, score: 45, hint: "Bring hand towards lips/mouth" };
      }
      const hasTapping = motionAmount >= 0.015 || spanY >= 0.012;
      if (isFlatO && hasTapping) {
        return { matched: true, score: 95, hint: "ASL Flat-O tap verified • Hold steady" };
      }
      return { matched: false, score: 70, hint: "Tap fingers onto lips (ASL EATo)" };
    } else {
      // SgSL: A-hand spoon wrist rotation (EATa) - rotation detected via tipPath!
      const isSpoonShape = extendedCount <= 2;
      if (!isSpoonShape) {
        return { matched: false, score: 30, hint: "Curl fingers like holding a spoon" };
      }
      const isNearMouth = wrist.y < 0.70 && wrist.x >= 0.12 && wrist.x <= 0.88;
      if (!isNearMouth) {
        return { matched: false, score: 45, hint: "Raise hand closer to mouth height" };
      }
      // Inward wrist rotation moves the index tip even when wrist is anchored
      const hasSpoonRotation = tipPath >= 0.015 || motionAmount >= 0.018 || spanY >= 0.012;
      if (hasSpoonRotation) {
        return { matched: true, score: 95, hint: "SgSL Spoon motion verified • Hold steady" };
      }
      return { matched: false, score: 70, hint: "Rotate wrist near mouth like a spoon (SgSL EATa)" };
    }
  }

  // Scenario 3: PLEASE (Shared chest rub)
  if (targetSign === "please") {
    const isFlatPalm = extendedCount >= 3;
    if (!isFlatPalm) {
      return { matched: false, score: 30, hint: "Open flat palm facing chest" };
    }
    const isOnChest = wrist.x >= 0.18 && wrist.x <= 0.82 && wrist.y >= 0.28 && wrist.y <= 0.88;
    if (!isOnChest) {
      return { matched: false, score: 45, hint: "Place flat palm on centre of chest" };
    }
    const hasMotion = motionAmount >= 0.018 || (spanX >= 0.014 && spanY >= 0.014);
    if (hasMotion) {
      return {
        matched: true,
        score: 96,
        hint: mode === "asl" ? "ASL Chest circle verified • Hold steady" : "SgSL Polite chest rub verified • Hold steady",
      };
    }
    return {
      matched: false,
      score: 70,
      hint: mode === "asl" ? "Rub palm in a circle on chest (ASL)" : "Rub palm in a circle on chest (SgSL)",
    };
  }

  return { matched: false, score: 15, hint: "Perform the sign shown above" };
}
