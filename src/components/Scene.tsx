import { useState, useRef, forwardRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { XR, Hands, useXR } from '@react-three/xr';
import CustomARButton from './CustomARButton';
import { Environment, Grid, Stage } from '@react-three/drei';

type FingerTipSphereProps = {
  handIndex: number;
  color: string;
  size: number;
  onCollision?: (colliding: boolean) => void;
};

const FingerTipSphere = forwardRef<THREE.Mesh, FingerTipSphereProps>(
  ({ handIndex, color, size, onCollision }, ref) => {
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

      if (typeof ref !== 'function' && ref?.current && meshRef.current) {
        const distance = ref.current.position.distanceTo(
          meshRef.current.position
        );

        const colliding = distance <= size;
        onCollision?.(colliding);
      }
    });

    return (
      <mesh
        ref={(instance) => {
          meshRef.current = instance;
          if (typeof ref === 'function') {
            ref(instance);
          } else if (ref) {
            ref.current = instance;
          }
        }}
      >
        <sphereGeometry args={[size, 15, 15]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
);

FingerTipSphere.displayName = 'FingerTipSphere';

export default function Scene() {
  const [sphere1Color, setSphere1Color] = useState('red');
  const [sphere2Color, setSphere2Color] = useState('green');
  const [sphere1Size, setSphere1Size] = useState(0.01);
  const [sphere2Size, setSphere2Size] = useState(0.01);
  const [colliding, setColliding] = useState(false);

  const sphere1Ref = useRef<THREE.Mesh | null>(null);
  const sphere2Ref = useRef<THREE.Mesh | null>(null);

  const handleCollision = (colliding1: boolean, colliding2: boolean) => {
    setColliding(colliding1 || colliding2);
  };

  useEffect(() => {
    if (colliding) {
      setSphere1Color('blue');
      setSphere2Color('yellow');
      setSphere1Size(0.015);
      setSphere2Size(0.015);
    } else {
      setSphere1Color('red');
      setSphere2Color('green');
      setSphere1Size(0.01);
      setSphere2Size(0.01);
    }
  }, [colliding]);

  return (
    <>
      <CustomARButton />
      <Canvas>
        <ambientLight intensity={0.25} />
        <Environment background preset='sunset' blur={0.8} />
        <XR>
          <Hands />
          <FingerTipSphere
            handIndex={0}
            color={sphere1Color}
            size={sphere1Size}
            ref={sphere1Ref}
            onCollision={(colliding) => handleCollision(colliding, false)}
          />
          <FingerTipSphere
            handIndex={1}
            color={sphere2Color}
            size={sphere2Size}
            ref={sphere2Ref}
            onCollision={(colliding) => handleCollision(false, colliding)}
          />
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
