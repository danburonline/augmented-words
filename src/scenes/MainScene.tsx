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

type FloatingTextProps = {
  text: string
}

function FloatingText({ text }: FloatingTextProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group | null>(null)

  const wristLeft = useXR(
    (state) =>
      state.controllers.find((controller) => controller.inputSource.handedness === 'left')?.hand
        ?.joints['wrist']
  )

  useFrame(() => {
    if (groupRef.current && wristLeft) {
      groupRef.current.position.x = wristLeft.position.x
      groupRef.current.position.y = wristLeft.position.y + 0.3
      groupRef.current.position.z = wristLeft.position.z

      const adjustedCameraPosition = camera.position.clone().add(new Vector3(0, 0, 0))
      groupRef.current.lookAt(adjustedCameraPosition)
    }
  })

  return (
    <group ref={groupRef}>
      <Text fontSize={0.05} color="white">
        {text}
      </Text>
    </group>
  )
}

function Key({ letter, handleKeyPress, position, size }: KeyProps) {
  const [color, setColor] = useState('blue')
  const [keyPressed, setKeyPressed] = useState(false)
  const keyRef = useRef<Mesh | null>(null)

  const keyWorldPosition = useRef(new Vector3())

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

      const distancesRight = fingerTipsRight
        ? Object.values(fingerTipsRight).map((joint) =>
            keyWorldPosition.current.distanceTo(joint.position)
          )
        : []

      const minDistanceRight = Math.min(...distancesRight)

      if (distancesRight.length > 0 && minDistanceRight < 0.01) {
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
        <Text position={[0, 0, 0.0125]} fontSize={0.015} color="black">
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
      groupRef.current.position.x = wristLeft.position.x + 0.25
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

  function createKeyboard() {
    const rows = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ]

    const specialKeys: {
      letter: string
      function: () => void
      position: [number, number, number]
    }[] = [
      {
        letter: '<-',
        function: () => setFormText((prev) => prev.slice(0, -1)),
        position: [0.15, 0, 0]
      }, // Backspace key
      {
        letter: 'space',
        function: () => setFormText((prev) => prev + ' '),
        position: [0, -0.125, 0]
      } // Space key
    ]

    const keySize = 0.02
    const keySpacing = 0.03
    const keys = []

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        keys.push(
          <Key
            key={`${rows[i][j]}-${i}-${j}`}
            letter={rows[i][j]}
            handleKeyPress={() => handleKeyPress(rows[i][j])}
            position={[(j - rows[i].length / 2) * keySpacing, -i * keySpacing, 0]}
            size={[keySize, keySize, keySize]}
          />
        )
      }
    }

    for (let i = 0; i < specialKeys.length; i++) {
      keys.push(
        <Key
          key={`${specialKeys[i].letter}-${i}`}
          letter={specialKeys[i].letter}
          handleKeyPress={specialKeys[i].function}
          position={specialKeys[i].position}
          size={[keySize, keySize, keySize]}
        />
      )
    }

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
            <FloatingText text={formText} />

            {/* <Html width={4}> */}
            {/* <InputForm givenText={formText} /> */}
            {/* </Html> */}

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
