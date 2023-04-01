import { Environment, Grid, Stage, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

export function ButtonPressTestScene() {
  return (
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.25} />
      <Environment background preset='sunset' blur={0.8} />
      <Stage
        intensity={0.5}
        environment='city'
        shadows={{ type: 'accumulative', bias: -0.001 }}
        adjustCamera={false}
      >
        <Grid />
      </Stage>
    </Canvas>
  );
}
