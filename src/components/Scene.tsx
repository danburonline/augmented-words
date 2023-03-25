import { XR, Hands, useXR } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import CustomARButton from './CustomARButton';
import { Environment, Grid, Stage } from '@react-three/drei';

import { useRef } from 'react';

type FingerTipSphereProps = {
  handIndex: number;
  color: string;
};

function FingerTipSphere({ handIndex, color }: FingerTipSphereProps) {
  const xr = useXR();
  const meshRef = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    const joint = xr.controllers[handIndex]?.hand?.joints['index-finger-tip'];
    if (meshRef.current && joint) {
      meshRef.current.position.set(
        joint.position.x,
        joint.position.y,
        joint.position.z
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.01, 15, 15]} />
      <meshStandardMaterial color={color} />
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
          <FingerTipSphere handIndex={0} color='red' />
          <FingerTipSphere handIndex={1} color='green' />
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
