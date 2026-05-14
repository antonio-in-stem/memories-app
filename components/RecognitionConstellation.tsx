'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getRolePalette } from '@/lib/roles';
import type { Memory, Profile } from '@/lib/data';

type NodeData = {
  position: THREE.Vector3;
  color: THREE.Color;
  scale: number;
};

function ConstellationNodes({ profiles, memories }: { profiles: Profile[]; memories: Memory[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const invalidate = useThree((state) => state.invalidate);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const nodes = useMemo<NodeData[]>(() => {
    const radius = 2.4;
    return profiles.map((profile, index) => {
      const angle = (index / profiles.length) * Math.PI * 2;
      const wave = Math.sin(index * 1.7) * 0.42;
      const palette = getRolePalette(profile.role);

      return {
        position: new THREE.Vector3(Math.cos(angle) * radius, wave, Math.sin(angle) * radius),
        color: new THREE.Color(palette.b),
        scale: 0.105 + Math.min(profile.memoryCount, 3) * 0.028,
      };
    });
  }, [profiles]);
  const lineGeometry = useMemo(() => {
    const vertices: number[] = [];
    const colors: number[] = [];

    memories.slice(0, 42).forEach((memory) => {
      const authorIndex = profiles.findIndex((profile) => profile.username === memory.author.username);
      const recipientIndex = profiles.findIndex((profile) => profile.username === memory.recipient.username);
      const author = nodes[authorIndex];
      const recipient = nodes[recipientIndex];

      if (!author || !recipient) {
        return;
      }

      vertices.push(...author.position.toArray(), ...recipient.position.toArray());
      colors.push(author.color.r, author.color.g, author.color.b, recipient.color.r, recipient.color.g, recipient.color.b);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, [memories, nodes, profiles]);

  useEffect(() => {
    const interval = window.setInterval(() => invalidate(), 80);
    return () => window.clearInterval(interval);
  }, [invalidate]);

  useFrame(({ clock, pointer }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.13 + pointer.x * 0.16;
      groupRef.current.rotation.x = -0.16 + pointer.y * 0.08;
    }

    if (!meshRef.current) {
      return;
    }

    nodes.forEach((node, index) => {
      const pulse = 1 + Math.sin(clock.elapsedTime * 1.8 + index) * 0.08;
      dummy.position.copy(node.position);
      dummy.scale.setScalar(node.scale * pulse);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
      meshRef.current?.setColorAt(index, node.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.32} />
      </lineSegments>
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial roughness={0.32} metalness={0.2} emissive="#18122f" emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

export function RecognitionConstellation({ profiles, memories }: { profiles: Profile[]; memories: Memory[] }) {
  return (
    <div className="recognition-constellation" aria-hidden="true">
      <Canvas
        dpr={[1, 1.25]}
        frameloop="demand"
        camera={{ position: [0, 1.2, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.6} />
        <pointLight position={[2.8, 3, 3]} intensity={3.2} color="#9a54ff" />
        <pointLight position={[-3, -2, 3]} intensity={2.2} color="#15c8df" />
        <ConstellationNodes profiles={profiles} memories={memories} />
      </Canvas>
    </div>
  );
}
