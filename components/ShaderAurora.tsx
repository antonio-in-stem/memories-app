'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uPointer;
  varying vec2 vUv;

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = rotate2d(0.48) * p * 2.05;
      amplitude *= 0.52;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    vec2 pointer = uPointer * 0.5 + 0.5;
    float pointerGlow = 1.0 - smoothstep(0.0, 0.7, distance(uv, pointer));
    float ribbons = fbm(center * 3.2 + vec2(uTime * 0.035, -uTime * 0.028));
    float veil = smoothstep(0.18, 0.95, ribbons + pointerGlow * 0.28);

    vec3 gold = vec3(0.96, 0.72, 0.18);
    vec3 violet = vec3(0.57, 0.24, 0.98);
    vec3 cyan = vec3(0.04, 0.78, 0.86);
    vec3 rose = vec3(1.0, 0.32, 0.55);
    vec3 color = mix(gold, violet, uv.x);
    color = mix(color, cyan, uv.y * 0.72);
    color = mix(color, rose, pointerGlow * 0.28);

    float alpha = veil * 0.34 + pointerGlow * 0.16;
    alpha *= 1.0 - smoothstep(0.58, 0.95, length(center));
    gl_FragColor = vec4(color, alpha);
  }
`;

function AuroraPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const invalidate = useThree((state) => state.invalidate);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    [],
  );

  useFrame(({ clock, pointer }) => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uPointer.value.lerp(pointer, 0.06);
  });

  useEffect(() => {
    const interval = window.setInterval(() => invalidate(), 90);
    return () => window.clearInterval(interval);
  }, [invalidate]);

  return (
    <mesh>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function ShaderAurora() {
  return (
    <div className="shader-aurora" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
        dpr={[1, 1]}
        frameloop="demand"
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <AuroraPlane />
      </Canvas>
    </div>
  );
}
