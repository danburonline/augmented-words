import { XR, Hands, RayGrab, Controllers, ARButton } from '@react-three/xr';
import { Environment } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import CustomARButton from './CustomARButton';

export default function Home() {
  return (
    <>
      <CustomARButton />
      <Canvas>
        <XR>
          <Hands />
          <RayGrab>
            <mesh>
              <boxGeometry args={[0.1, 0.1, 0.1]} position={[10, 1, 1]} />
              <meshBasicMaterial color='red' />
            </mesh>
          </RayGrab>
        </XR>
      </Canvas>
    </>
  );
}
