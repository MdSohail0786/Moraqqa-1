import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A quiet architectural wireframe: floor slab, columns and a lintel drawn as thin lines.
 * It drifts slowly and leans toward the pointer. No lights, no textures: very cheap to render.
 */
const BOXES = [
  // [w, h, d, x, y, z]
  [7, 0.12, 4.5, 0, -1.9, 0],
  [0.22, 3.8, 0.22, -3.1, 0, 1.6],
  [0.22, 3.8, 0.22, 0, 0, 1.6],
  [0.22, 3.8, 0.22, 3.1, 0, 1.6],
  [0.22, 3.8, 0.22, -3.1, 0, -1.6],
  [0.22, 3.8, 0.22, 3.1, 0, -1.6],
  [6.6, 0.18, 0.4, 0, 1.95, 1.6],
  [6.6, 0.18, 0.4, 0, 1.95, -1.6],
  [0.4, 0.18, 3.6, -3.1, 1.95, 0],
  [0.4, 0.18, 3.6, 3.1, 1.95, 0],
  [2.2, 0.06, 1.5, 1.1, -0.2, -0.4],
];

function Structure() {
  const group = useRef();
  const geometries = useMemo(
    () => BOXES.map(([w, h, d]) => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d))),
    []
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const { pointer } = state;
    group.current.rotation.y += delta * 0.07;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.28 + pointer.y * 0.12, 0.04);
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, pointer.x * 0.35, 0.04);
  });

  return (
    <group ref={group} position={[2.2, -0.2, 0]} rotation={[0.28, -0.6, 0]}>
      {BOXES.map(([, , , x, y, z], i) => (
        <lineSegments key={i} geometry={geometries[i]} position={[x, y, z]}>
          <lineBasicMaterial color="#f4efe7" transparent opacity={i === 0 ? 0.55 : 0.4} />
        </lineSegments>
      ))}
    </group>
  );
}

export default function Hero3D({ active = true }) {
  return (
    <Canvas
      className="hero__canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 11], fov: 32 }}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      eventSource={document.body}
      eventPrefix="client"
    >
      <Structure />
    </Canvas>
  );
}
