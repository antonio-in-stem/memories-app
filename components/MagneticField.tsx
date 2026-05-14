'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function MagneticField() {
  const x = useMotionValue(-120);
  const y = useMotionValue(-120);
  const springX = useSpring(x, { stiffness: 180, damping: 28, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 180, damping: 28, mass: 0.45 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    let frame = 0;
    let nextX = -120;
    let nextY = -120;

    const onPointerMove = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;

      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        x.set(nextX - 160);
        y.set(nextY - 160);
        frame = 0;
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [x, y]);

  return (
    <motion.div
      className="magnetic-field"
      aria-hidden="true"
      style={{
        x: springX,
        y: springY,
      }}
    />
  );
}
