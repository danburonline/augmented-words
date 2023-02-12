import { XR, Hands, useXR } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import CustomARButton from './CustomARButton';
import { Environment, Grid, Stage } from '@react-three/drei';
import { useRef } from 'react';

function FingerTipSphere() {
  const xr = useXR();
  const meshRef = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    if (meshRef.current && xr.controllers[1]?.hand.joints['index-finger-tip']) {
      meshRef.current.position.set(
        xr.controllers[1].hand.joints['index-finger-tip'].position.x,
        xr.controllers[1].hand.joints['index-finger-tip'].position.y,
        xr.controllers[1].hand.joints['index-finger-tip'].position.z
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.01, 0.01, 0.01]} />
      <meshStandardMaterial color='red' />
    </mesh>
  );
}

export default function Scene() {
  return (
    <>
      <CustomARButton />
      <Canvas>
        <ambientLight intensity={0.25} />
        <Environment background preset='sunset' blur={0.8} />
        <XR>
          <Hands />
          <FingerTipSphere />
          <Stage
            intensity={0.5}
            environment='city'
            shadows={{ type: 'accumulative', bias: -0.001 }}
            adjustCamera={false}
          >
            <Grid />
          </Stage>
        </XR>
      </Canvas>
    </>
  );
}
