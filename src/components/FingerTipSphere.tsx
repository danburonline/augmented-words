import { useFrame } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { Mesh } from 'three'
import { useRef } from 'react'

export type FingerTipSphereProps = {
  handIndex: number
  color: string
}

export default function FingerTipSphere({ handIndex, color }: FingerTipSphereProps) {
  const xr = useXR()
  const meshRef = useRef<Mesh | null>(null)

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
