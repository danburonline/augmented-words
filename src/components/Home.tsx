import { XR, Hands, RayGrab } from '@react-three/xr';
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
              <meshBasicMaterial color='blue' />
            </mesh>
          </RayGrab>
        </XR>
      </Canvas>
    </>
  );
}
