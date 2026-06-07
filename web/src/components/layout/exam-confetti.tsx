"use client";

import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

const CONFETTI_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ffffff",
  "#fde047",
  "#a3e635",
];

function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

export function ExamConfetti() {
  const { width, height } = useViewportSize();
  const [run, setRun] = useState(true);

  if (width === 0 || height === 0) return null;

  return (
    <ReactConfetti
      width={width}
      height={height}
      recycle={false}
      run={run}
      numberOfPieces={380}
      gravity={0.04}
      friction={0.99}
      wind={0.002}
      initialVelocityX={{ min: -4, max: 4 }}
      initialVelocityY={{ min: 3, max: 9 }}
      tweenDuration={8000}
      colors={CONFETTI_COLORS}
      opacity={0.9}
      onConfettiComplete={() => setRun(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
