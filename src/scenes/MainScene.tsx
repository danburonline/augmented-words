import { XR, Hands, useXR } from '@react-three/xr'
import { Canvas, useFrame } from '@react-three/fiber'
import CustomARButton from '../components/CustomARButton'
import { Grid } from '@react-three/drei'

import { Suspense, useRef } from 'react'

enum handIndex {
  left = 0,
  right = 1
}

type FingerTipSphereProps = {
  handIndex: number
  color: string
}

function FingerTipSphere({ handIndex, color }: FingerTipSphereProps) {
  const xr = useXR()
  const meshRef = useRef<THREE.Mesh | null>(null)

  useFrame(() => {
    const joint = xr.controllers[handIndex]?.hand?.joints['index-finger-tip']
    if (meshRef.current && joint) {
      meshRef.current.position.set(joint.position.x, joint.position.y, joint.position.z)
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.01, 15, 15]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Sphere() {
  return (
    <mesh position={[0, 2, -0.5]}>
      <sphereGeometry args={[0.25, 50, 50]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}

export default function MainScene() {
  return (
    <>
      <div style={{ position: 'fixed', zIndex: '10' }}>
        <CustomARButton />
      </div>
      <Canvas>
        <XR>
          <ambientLight intensity={0.25} />
          <Suspense fallback={undefined}>
            <Sphere />

            <FingerTipSphere handIndex={handIndex.left} color="red" />
            <FingerTipSphere handIndex={handIndex.right} color="green" />

            <Hands />
            <Grid />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}
