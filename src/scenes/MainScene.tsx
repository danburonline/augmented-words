import { XR, Hands, useXR, Interactive, XRInteractionEvent } from '@react-three/xr'
import { Canvas, useFrame } from '@react-three/fiber'
import CustomARButton from '../components/CustomARButton'
import { Grid } from '@react-three/drei'

import { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'

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
    <mesh ref={meshRef} name="fingerTipSphere">
      <sphereGeometry args={[0.01, 15, 15]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Sphere() {
  const [color, setColor] = useState('blue')
  const sphereRef = useRef<THREE.Mesh | null>(null)

  const fingerTipLeft = useXR(
    (state) => state.controllers[handIndex.left]?.hand?.joints['index-finger-tip']
  )
  const fingerTipRight = useXR(
    (state) => state.controllers[handIndex.right]?.hand?.joints['index-finger-tip']
  )

  useFrame(() => {
    if (sphereRef.current) {
      const leftDistance = fingerTipLeft
        ? sphereRef.current.position.distanceTo(fingerTipLeft.position)
        : null
      const rightDistance = fingerTipRight
        ? sphereRef.current.position.distanceTo(fingerTipRight.position)
        : null

      if (
        (leftDistance !== null && leftDistance < 0.25) ||
        (rightDistance !== null && rightDistance < 0.25)
      ) {
        setColor('orange')
      } else {
        setColor('blue')
      }
    }
  })

  return (
    <Interactive>
      <mesh ref={sphereRef} position={[0, 2, -0.5]} name="exampleSphere">
        <sphereGeometry args={[0.25, 50, 50]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </Interactive>
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
