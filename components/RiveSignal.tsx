'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const Rive = dynamic(() => import('@rive-app/react-canvas'), {
  ssr: false,
  loading: () => null,
});

export function RiveSignal() {
  const [active, setActive] = useState(false);

  return (
    <div className="rive-signal" aria-hidden="true" onPointerEnter={() => setActive(true)} onFocus={() => setActive(true)}>
      {active ? (
        <Rive
          src="https://cdn.rive.app/animations/vehicles.riv"
          stateMachines="bumpy"
          className="rive-canvas"
        />
      ) : null}
      <span className="rive-fallback" />
    </div>
  );
}
