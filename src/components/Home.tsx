import { XR, Hands, useXR } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';
import CustomARButton from './CustomARButton';
import { Environment, Grid, Stage } from '@react-three/drei';

function FingerTipSphere() {
  const xr = useXR();

  return (
    <mesh
      position={xr.controllers[1]?.hand.joints['index-finger-tip']?.position}
    >
      <sphereGeometry args={[0.01, 0.01, 0.01]} />
      <meshStandardMaterial color='red' />
    </mesh>
  );
}

export default function Home() {
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
