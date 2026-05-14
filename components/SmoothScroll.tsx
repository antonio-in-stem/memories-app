'use client';

import { gsap } from 'gsap';
import Lenis from 'lenis';
import { useEffect, useRef } from 'react';
import { useMemoryStore } from '@/store/memory-store';

export function SmoothScroll() {
  const modalOpen = useMemoryStore((state) => state.modalOpen);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.86,
      touchMultiplier: 1.12,
    });
    lenisRef.current = lenis;

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (modalOpen) {
      lenisRef.current?.stop();
      document.documentElement.classList.add('modal-scroll-lock');
    } else {
      lenisRef.current?.start();
      document.documentElement.classList.remove('modal-scroll-lock');
    }

    return () => {
      document.documentElement.classList.remove('modal-scroll-lock');
    };
  }, [modalOpen]);

  return null;
}
