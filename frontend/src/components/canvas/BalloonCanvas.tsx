import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface BalloonCanvasProps {
  colors?: string[];
  count?: number;
}

interface Balloon {
  id: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: string;
  vy: number;
  swaySpeed: number;
  swayOffset: number;
  popped: boolean;
}

export const BalloonCanvas: React.FC<BalloonCanvasProps> = ({
  colors = ['#C8A96E', '#F472B6', '#60A5FA', '#34D399', '#A78BFA', '#FBBF24'],
  count = 12
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const balloonsRef = useRef<Balloon[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize balloons
    if (balloonsRef.current.length === 0) {
      const arr: Balloon[] = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          id: i,
          x: Math.random() * canvas.width,
          y: canvas.height + 50 + Math.random() * 200,
          radiusX: 28 + Math.random() * 10,
          radiusY: 36 + Math.random() * 12,
          color: colors[i % colors.length],
          vy: 0.8 + Math.random() * 0.9,
          swaySpeed: 0.02 + Math.random() * 0.02,
          swayOffset: Math.random() * Math.PI * 2,
          popped: false
        });
      }
      balloonsRef.current = arr;
    }

    let time = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      balloonsRef.current.forEach((b) => {
        if (b.popped) return;

        // Physics update
        b.y -= b.vy;
        const sway = Math.sin(time * b.swaySpeed + b.swayOffset) * 1.5;
        b.x += sway * 0.4;

        // Reset if float off top
        if (b.y < -100) {
          b.y = canvas.height + 60;
          b.x = Math.random() * canvas.width;
        }

        const bx = b.x;
        const by = b.y;

        // Draw String
        ctx.beginPath();
        ctx.moveTo(bx, by + b.radiusY);
        ctx.quadraticCurveTo(
          bx + Math.sin(time * 0.05 + b.id) * 15,
          by + b.radiusY + 40,
          bx + Math.cos(time * 0.03 + b.id) * 10,
          by + b.radiusY + 80
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Draw Balloon Body
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(bx, by, b.radiusX, b.radiusY, 0, 0, Math.PI * 2);

        // Latex shine gradient
        const grad = ctx.createRadialGradient(
          bx - b.radiusX * 0.3,
          by - b.radiusY * 0.3,
          2,
          bx,
          by,
          b.radiusX * 1.2
        );
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.2, b.color);
        grad.addColorStop(0.85, b.color);
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');

        ctx.fillStyle = grad;
        ctx.fill();

        // Knot
        ctx.beginPath();
        ctx.moveTo(bx - 4, by + b.radiusY);
        ctx.lineTo(bx + 4, by + b.radiusY);
        ctx.lineTo(bx + 6, by + b.radiusY + 6);
        ctx.lineTo(bx - 6, by + b.radiusY + 6);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [colors, count]);

  // Click to pop balloon
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    balloonsRef.current.forEach((b) => {
      if (b.popped) return;
      const dx = clickX - b.x;
      const dy = clickY - b.y;
      if ((dx * dx) / (b.radiusX * b.radiusX) + (dy * dy) / (b.radiusY * b.radiusY) <= 1) {
        b.popped = true;
        // Trigger localized mini confetti burst
        confetti({
          particleCount: 25,
          spread: 60,
          origin: {
            x: (rect.left + b.x) / window.innerWidth,
            y: (rect.top + b.y) / window.innerHeight
          },
          colors: [b.color, '#FFFFFF', '#FFD700']
        });
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer z-10"
    />
  );
};
