import { VRButton, XR, Controllers, Hands } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';

export default function Home() {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <Controllers />
          <Hands />
          <mesh>
            <boxGeometry />
            <meshBasicMaterial color='blue' />
          </mesh>
        </XR>
      </Canvas>
    </>
  );
}
