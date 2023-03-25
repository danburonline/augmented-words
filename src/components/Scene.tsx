import { XR, Hands, useXR } from '@react-three/xr';
import { Canvas, useFrame } from '@react-three/fiber';
import CustomARButton from './CustomARButton';
import { Environment, Grid, Stage } from '@react-three/drei';
import {
  Physics,
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
} from '@react-three/rapier';

import { Suspense, useRef } from 'react';

type FingerTipSphereProps = {
  handIndex: number;
  color: string;
};

function FingerTipSphere({ handIndex, color }: FingerTipSphereProps) {
  const xr = useXR();
  const meshRef = useRef<THREE.Mesh | null>(null);
  const physicsRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    const joint = xr.controllers[handIndex]?.hand?.joints['index-finger-tip'];
    if (meshRef.current && joint && physicsRef.current) {
      meshRef.current.position.set(
        joint.position.x,
        joint.position.y,
        joint.position.z
      );

      // TODO Apply the position to the physics body
      // physicsRef.current.setTranslation(joint.position.x, true);
    }
  });

  return (
    <RigidBody
      ref={physicsRef}
      args={[0.01, 15, 15]}
      colliders='ball'
      onCollisionEnter={() => console.log('finger collided')}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.01, 15, 15]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

function Sphere() {
  return (
    <RigidBody
      position={[0, 1, -0.5]}
      args={[0.25, 50, 50]}
      colliders='ball'
      onCollisionEnter={() => console.log('collided')}
    >
      <mesh position={[0, 2, -0.5]}>
        <sphereGeometry args={[0.25, 50, 50]} />
        <meshStandardMaterial color='blue' />
      </mesh>
    </RigidBody>
  );
}

export default function Scene() {
  console.log('Scene rendered');

  return (
    <>
      <CustomARButton />
      <Canvas>
        <XR>
          <ambientLight intensity={0.25} />
          <Environment background preset='sunset' blur={0.8} />
          <Suspense fallback={undefined}>
            <Physics colliders='hull'>
              <Sphere />
              <CuboidCollider position={[0, -2.5, 0]} args={[10, 1, 10]} />

              <FingerTipSphere handIndex={0} color='red' />
              <FingerTipSphere handIndex={1} color='green' />

              <Hands />
              <Stage
                intensity={0.5}
                environment='city'
                shadows={{ type: 'accumulative', bias: -0.001 }}
                adjustCamera={false}
              >
                <Grid />
              </Stage>
            </Physics>
          </Suspense>
        </XR>
      </Canvas>
    </>
  );
}
