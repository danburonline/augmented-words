import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { XR, Hands, useXR, Interactive } from '@react-three/xr'
import { Mesh, Vector3 } from 'three'
import { Suspense, useRef, useState } from 'react'
import Html from '../components/Html'
import { Text } from '@react-three/drei'

import CustomARButton from '../components/CustomARButton'
import InputForm from '../components/InputForm'

type KeyProps = {
  letter: string
  handleKeyPress: () => void
  position?: [number, number, number]
  size: [number, number, number]
}

function Key({ letter, handleKeyPress, position, size }: KeyProps) {
  const [color, setColor] = useState('blue')
  const [keyPressed, setKeyPressed] = useState(false)
  const keyRef = useRef<Mesh | null>(null)

  const keyWorldPosition = useRef(new Vector3())

  const fingerTipsLeft = useXR(
    (state) =>
      state.controllers.find((controller) => controller.inputSource.handedness === 'left')?.hand
        .joints
  )

  const fingerTipsRight = useXR(
    (state) =>
      state.controllers.find((controller) => controller.inputSource.handedness === 'right')?.hand
        .joints
  )

  function handleKeyPressOnce() {
    if (!keyPressed) {
      handleKeyPress()
      setKeyPressed(true)
    }
  }

  useFrame(() => {
    if (keyRef.current && position) {
      keyRef.current.position.x = position[0]
      keyRef.current.position.y = position[1]
      keyRef.current.position.z = position[2]
    }

    if (keyRef.current) {
      keyRef.current.getWorldPosition(keyWorldPosition.current)

      const distancesLeft = fingerTipsLeft
        ? Object.values(fingerTipsLeft).map((joint) =>
            keyWorldPosition.current.distanceTo(joint.position)
          )
        : []
      const distancesRight = fingerTipsRight
        ? Object.values(fingerTipsRight).map((joint) =>
            keyWorldPosition.current.distanceTo(joint.position)
          )
        : []

      const minDistanceLeft = Math.min(...distancesLeft)
      const minDistanceRight = Math.min(...distancesRight)

      if (
        (distancesLeft.length > 0 && minDistanceLeft < 0.01) ||
        (distancesRight.length > 0 && minDistanceRight < 0.01)
      ) {
        setColor('orange')
        handleKeyPressOnce()
      } else {
        setColor('blue')
        setKeyPressed(false)
      }
    }
  })

  return (
    <Interactive>
      <mesh ref={keyRef} name="key">
        <boxGeometry args={[...size]} />
        <meshStandardMaterial color={color} />
        <Text
          position={[0, -0.02, 0]}
          fontSize={0.025}
          color="black"
          rotation={[Math.PI / 2, 0, 0]}
        >
          {letter}
        </Text>
      </mesh>
    </Interactive>
  )
}

function KeyboardGroup({ children }: { children: React.ReactNode }) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group | null>(null)

  const wristLeft = useXR(
    (state) =>
      state.controllers.find((controller) => controller.inputSource.handedness === 'left')?.hand
        ?.joints['wrist']
  )

  useFrame(() => {
    if (groupRef.current && wristLeft) {
      groupRef.current.position.x = wristLeft.position.x + 0.1
      groupRef.current.position.y = wristLeft.position.y + 0.01
      groupRef.current.position.z = wristLeft.position.z

      const adjustedCameraPosition = camera.position.clone().add(new Vector3(0, Math.PI, 0))
      groupRef.current.lookAt(adjustedCameraPosition)
    }
  })

  return <group ref={groupRef}>{children}</group>
}

export default function MainScene() {
  const [formText, setFormText] = useState('Lorem')

  function handleKeyPress(letter: string) {
    setFormText((prev) => prev + letter)
  }

  function shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const shuffledAlphabet = shuffleArray(alphabet)

  function createKeyboard() {
    const keySize = 0.02
    const keySpacing = 0.03
    const keys = [
      // Create 10 keys in the first two rows.
      ...Array.from({ length: 20 }, (_, i) => (
        <Key
          key={i}
          letter={shuffledAlphabet[i]}
          handleKeyPress={() => handleKeyPress(shuffledAlphabet[i])}
          position={[(i % 10) * keySpacing, keySize, Math.floor(i / 10) * keySpacing]}
          size={[keySize, keySize, keySize]}
        />
      ))
      // Continue this pattern for other keys...
    ]
    return keys
  }

  return (
    <>
      <div style={{ position: 'fixed', right: 0, padding: '20px', zIndex: '10' }}>
        <CustomARButton />
      </div>
      <Canvas gl={{ preserveDrawingBuffer: true }}>
        <XR>
          <ambientLight intensity={0.25} />
          <Suspense fallback={undefined}>
            <KeyboardGroup>{createKeyboard()}</KeyboardGroup>

            <Html width={4}>
              <InputForm givenText={formText} />
            </Html>

            {/* ? Use for debugging */}
            {/* <FingerTipSphere handIndex={HAND_INDEX.left} color="red" /> */}
            {/* <FingerTipSphere handIndex={HAND_INDEX.right} color="green" /> */}

            <Hands />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}
