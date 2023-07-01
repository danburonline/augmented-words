import { Canvas, useFrame } from '@react-three/fiber'
import { XR, Hands, useXR, Interactive } from '@react-three/xr'
import { Mesh } from 'three'
import { Suspense, useRef, useState } from 'react'

import CustomARButton from '../components/CustomARButton'
import Html from '../components/Html'
import InputForm from '../components/InputForm'

enum HAND_INDEX {
  left = 0,
  right = 1
}

type KeyProps = {
  createRandomLetter: () => void
}

function Key({ createRandomLetter }: KeyProps) {
  const [color, setColor] = useState('blue')
  const [randomLetterWasCreated, setRandomLetterCreated] = useState(false)
  const sphereRef = useRef<Mesh | null>(null)

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

  const wristLeft = useXR(
    (state) =>
      // Only select the left hand for the keyboard anchor
      state.controllers.find((controller) => controller.inputSource.handedness === 'left')?.hand
        ?.joints['wrist']
  )

  function createRandomLetterOnce() {
    if (!randomLetterWasCreated) {
      createRandomLetter()
      setRandomLetterCreated(true)
    }
  }

  useFrame(() => {
    if (sphereRef.current && wristLeft) {
      sphereRef.current.position.x = wristLeft.position.x - 0.075
      sphereRef.current.position.y = wristLeft.position.y + 0.03
      sphereRef.current.position.z = wristLeft.position.z
    }

    if (sphereRef.current) {
      const leftDistance = fingerTipLeft
        ? sphereRef.current.position.distanceTo(fingerTipLeft.position)
        : null
      const rightDistance = fingerTipRight
        ? sphereRef.current.position.distanceTo(fingerTipRight.position)
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
      <mesh ref={sphereRef} name="exampleSphere">
        <sphereGeometry args={[0.01, 50, 50]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </Interactive>
  )
}

export default function MainScene() {
  const [formText, setFormText] = useState('HELLO')

  function createRandomLetter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)]
    return randomLetter
  }

  function createRandomLetterHandler() {
    let randomLetter = createRandomLetter()
    setFormText((prev) => prev + randomLetter)
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
            <Key createRandomLetter={createRandomLetterHandler} />

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
