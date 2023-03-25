import { XR, Hands, useXR } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Grid, Stage } from '@react-three/drei';
import { Physics, useBox, useSphere } from '@react-three/cannon';
import CustomARButton from './CustomARButton';

import { useRef, useState } from 'react';
import { Mesh } from 'three';

type FingerTipSphereProps = {
  handIndex: number;
  color: string;
};

function FingerTipSphere({ handIndex, color }: FingerTipSphereProps) {
  const xr = useXR();
  const meshRef = useRef<Mesh | null>(null);
  const [ref] = useSphere(() => ({
    args: [0.01],
    type: 'Kinematic',
  }));

  useFrame(() => {
    const joint = xr.controllers[handIndex]?.hand?.joints['index-finger-tip'];
    if (meshRef.current && joint && ref.current) {
      ref.current.position.set(
        joint.position.x,
        joint.position.y,
        joint.position.z
      );
      meshRef.current.position.copy(ref.current.position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.01, 15, 15]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Cube() {
  const [color, setColor] = useState('green');
  const [ref] = useBox(() => ({
    mass: 0,
    position: [0, 1, -0.5],
    args: [0.5, 0.5, 0.5],
    onCollide: () => {
      console.log("it still doesn't run here");
      setColor('red');
    },
  }));

  return (
    <mesh {...ref} position={[0, 1, -0.5]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
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
        {/* <Environment background preset='sunset' blur={0.8} /> */}
        <Physics>
          <XR>
            <Hands />
            <FingerTipSphere handIndex={0} color='red' />
            <FingerTipSphere handIndex={1} color='green' />
            <Cube />
            <Stage
              intensity={0.5}
              environment='city'
              shadows={{ type: 'accumulative', bias: -0.001 }}
              adjustCamera={false}
            >
              <Grid />
            </Stage>
          </XR>
        </Physics>
      </Canvas>
    </>
  );
}
