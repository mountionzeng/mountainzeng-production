/*
 * Particle Field — 优化版
 * 更精致的粒子效果，增加深度感
 */

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  targetOpacity: number;
  pulseSpeed: number;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const metrics = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const resize = () => {
      metrics.width = window.innerWidth;
      metrics.height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(metrics.width * dpr);
      canvas.height = Math.floor(metrics.height * dpr);
      canvas.style.width = `${metrics.width}px`;
      canvas.style.height = `${metrics.height}px`;

      // Use CSS pixel coordinates while keeping a sharper HiDPI backing store.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(24, Math.floor(metrics.width / 80));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * metrics.width,
      y: Math.random() * metrics.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.35 + 0.45,
      targetOpacity: Math.random() * 0.35 + 0.55,
      pulseSpeed: Math.random() * 0.018 + 0.004,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, metrics.width, metrics.height);

      particles.forEach((p) => {
        // 移动
        p.x += p.vx;
        p.y += p.vy;
        
        // 边界循环
        if (p.x < 0) p.x = metrics.width;
        if (p.x > metrics.width) p.x = 0;
        if (p.y < 0) p.y = metrics.height;
        if (p.y > metrics.height) p.y = 0;

        // 呼吸效果
        if (Math.abs(p.opacity - p.targetOpacity) < 0.01) {
          p.targetOpacity = Math.random() * 0.35 + 0.5;
        }
        p.opacity += (p.targetOpacity - p.opacity) * p.pulseSpeed;

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // 添加渐变效果
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${p.opacity})`);
        gradient.addColorStop(1, "transparent");
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}
