import React, { useEffect, useRef } from 'react';

interface FlameCanvasProps {
  isExtinguished?: boolean;
  color?: string;
  width?: number;
  height?: number;
}

export const FlameCanvas: React.FC<FlameCanvasProps> = ({
  isExtinguished = false,
  color = '#FFA500',
  width = 40,
  height = 70
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smokeParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number }>>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = Math.random() * 100;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.08;

      const centerX = width / 2;
      const baseY = height - 10;

      if (!isExtinguished) {
        // Draw Flame
        const flicker = Math.sin(time * 3) * 2 + Math.cos(time * 5) * 1.5;
        const tipHeight = 35 + Math.sin(time * 4) * 4;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(centerX, baseY - 20, 2, centerX, baseY - 20, 25);
        glowGrad.addColorStop(0, 'rgba(255, 180, 50, 0.4)');
        glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, baseY - 20, 25, 0, Math.PI * 2);
        ctx.fill();

        // Outer flame
        ctx.beginPath();
        ctx.moveTo(centerX - 8, baseY);
        ctx.quadraticCurveTo(centerX - 12 + flicker, baseY - 18, centerX + flicker * 0.5, baseY - tipHeight);
        ctx.quadraticCurveTo(centerX + 12 + flicker, baseY - 18, centerX + 8, baseY);
        ctx.closePath();

        const flameGrad = ctx.createLinearGradient(centerX, baseY, centerX, baseY - tipHeight);
        flameGrad.addColorStop(0, 'rgba(255, 69, 0, 0.9)');
        flameGrad.addColorStop(0.4, 'rgba(255, 165, 0, 0.95)');
        flameGrad.addColorStop(0.85, 'rgba(255, 235, 120, 0.95)');
        flameGrad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');

        ctx.fillStyle = flameGrad;
        ctx.fill();

        // Inner blue-white core
        ctx.beginPath();
        ctx.moveTo(centerX - 4, baseY);
        ctx.quadraticCurveTo(centerX - 5, baseY - 10, centerX, baseY - 18);
        ctx.quadraticCurveTo(centerX + 5, baseY - 10, centerX + 4, baseY);
        ctx.closePath();

        const coreGrad = ctx.createLinearGradient(centerX, baseY, centerX, baseY - 18);
        coreGrad.addColorStop(0, 'rgba(0, 150, 255, 0.8)');
        coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        ctx.fillStyle = coreGrad;
        ctx.fill();
      } else {
        // Smoke particles when extinguished
        if (Math.random() < 0.35 && smokeParticlesRef.current.length < 25) {
          smokeParticlesRef.current.push({
            x: centerX + (Math.random() - 0.5) * 4,
            y: baseY,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -1.2 - Math.random() * 0.8,
            radius: 2 + Math.random() * 2,
            alpha: 0.7
          });
        }

        // Render smoke
        for (let i = smokeParticlesRef.current.length - 1; i >= 0; i--) {
          const p = smokeParticlesRef.current[i];
          p.x += p.vx + Math.sin(time + p.y * 0.05) * 0.4;
          p.y += p.vy;
          p.radius += 0.15;
          p.alpha -= 0.015;

          if (p.alpha <= 0 || p.y < 0) {
            smokeParticlesRef.current.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 180, 195, ${p.alpha})`;
          ctx.fill();
        }
      }

      // Wick
      ctx.fillStyle = '#2A2A35';
      ctx.fillRect(centerX - 1.5, baseY - 2, 3, 10);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isExtinguished, color, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="pointer-events-none" />;
};
