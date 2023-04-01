import { Environment, OrbitControls, Sky, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';

function Cube() {
  return (
    <mesh>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color='red' />
    </mesh>
  );
}

export function ButtonPressTestScene() {
  return (
    <Canvas camera={{ position: [1, 1, 0] }}>
      <Perf position='top-right' />
      <Stats />
      <OrbitControls />
      <Cube />
      <ambientLight intensity={0.125} />
      <Environment background preset='sunset' blur={0.8} />
      <Sky sunPosition={[0, 10, 0]} turbidity={10} />
      <fog args={['#000', 0, 500]} />
    </Canvas>
  );
}
