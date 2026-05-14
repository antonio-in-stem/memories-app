'use client';

import Rive from '@rive-app/react-canvas';
import { useState } from 'react';

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
