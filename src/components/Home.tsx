import { XR, Hands } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';
import CustomARButton from './CustomARButton';
import { Environment, Grid, Stage } from '@react-three/drei';

export default function Home() {
  return (
    <>
      <CustomARButton />
      <Canvas>
        <ambientLight intensity={0.25} />
        <Environment background preset='sunset' blur={0.8} />
        <XR>
          <Stage
            intensity={0.5}
            environment='city'
            shadows={{ type: 'accumulative', bias: -0.001 }}
            adjustCamera={false}
          >
            <Hands />
            <Grid />
          </Stage>
        </XR>
      </Canvas>
    </>
  );
}
