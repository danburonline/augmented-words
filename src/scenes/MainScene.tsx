import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { XR, Hands, useXR, Interactive } from '@react-three/xr'
import { Mesh, Vector3 } from 'three'
import { Suspense, useRef, useState } from 'react'

import CustomARButton from '../components/CustomARButton'
import Html from '../components/Html'
import InputForm from '../components/InputForm'

type KeyProps = {
  createRandomLetter: () => void
  position?: [number, number, number]
  size: [number, number, number]
}

function Key({ createRandomLetter, position, size }: KeyProps) {
  const [color, setColor] = useState('blue')
  const [randomLetterWasCreated, setRandomLetterCreated] = useState(false)
  const keyRef = useRef<Mesh | null>(null)

  const keyWorldPosition = useRef(new Vector3())

  const fingerTipLeft = useXR(
    (state) =>
      state.controllers.find((controller) => controller.inputSource.handedness === 'left')?.hand
        .joints['index-finger-tip']
  )

  const fingerTipRight = useXR(
    (state) =>
      state.controllers.find((controller) => controller.inputSource.handedness === 'right')?.hand
        .joints['index-finger-tip']
  )

  function createRandomLetterOnce() {
    if (!randomLetterWasCreated) {
      createRandomLetter()
      setRandomLetterCreated(true)
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

      const leftDistance = fingerTipLeft
        ? keyWorldPosition.current.distanceTo(fingerTipLeft.position)
        : null
      const rightDistance = fingerTipRight
        ? keyWorldPosition.current.distanceTo(fingerTipRight.position)
        : null

      if (
        (leftDistance !== null && leftDistance < 0.01) ||
        (rightDistance !== null && rightDistance < 0.01)
      ) {
        setColor('orange')
        createRandomLetterOnce()
      } else {
        setColor('blue')
        setRandomLetterCreated(false)
      }
    }
  })

  return (
    <Interactive>
      <mesh ref={keyRef} name="key">
        <boxGeometry args={[...size]} />
        <meshStandardMaterial color={color} />
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

  function createRandomLetter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)]
    return randomLetter
  }

  function createRandomLetterHandler() {
    let randomLetter = createRandomLetter()
    setFormText((prev) => prev + randomLetter)
  }

  function createKeyboard() {
    const keySize = 0.02
    const keySpacing = 0.03
    const keys = [
      // Create 10 keys in the first two rows.
      ...Array.from({ length: 20 }, (_, i) => (
        <Key
          key={i}
          createRandomLetter={createRandomLetterHandler}
          position={[(i % 10) * keySpacing, keySize, Math.floor(i / 10) * keySpacing]}
          size={[keySize, keySize, keySize]}
        />
      )),
      // Create 2x width key at the start of third row.
      <Key
        key={20}
        createRandomLetter={createRandomLetterHandler}
        position={[0, keySize, 2 * keySpacing]}
        size={[2 * keySize, keySize, keySize]}
      />,
      // Create 8 keys after wide key in the third row.
      ...Array.from({ length: 8 }, (_, i) => (
        <Key
          key={i + 21}
          createRandomLetter={createRandomLetterHandler}
          position={[(i + 2) * keySpacing, keySize, 2 * keySpacing]}
          size={[keySize, keySize, keySize]}
        />
      )),
      // Add the last key to the third row (the 3x height key).
      <Key
        key={29}
        createRandomLetter={createRandomLetterHandler}
        position={[10 * keySpacing, keySize, keySpacing]}
        size={[keySize, keySize, 3 * keySpacing]}
      />,
      // Create 9x width key at the start of the fourth row.
      <Key
        key={30}
        createRandomLetter={createRandomLetterHandler}
        position={[6 * keySize, keySize, 3 * keySpacing]}
        size={[13 * keySize, keySize, keySize]}
      />,
      // Create 2 keys after large key in the fourth row.
      ...Array.from({ length: 2 }, (_, i) => (
        <Key
          key={i + 31}
          createRandomLetter={createRandomLetterHandler}
          position={[(i + 9) * keySpacing, keySize, 3 * keySpacing]}
          size={[keySize, keySize, keySize]}
        />
      ))
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
