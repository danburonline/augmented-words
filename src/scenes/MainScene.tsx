import { Canvas, useFrame } from '@react-three/fiber'
import { XR, Hands, useXR, Interactive } from '@react-three/xr'
import { Mesh } from 'three'
import { Suspense, useRef, useState } from 'react'

import CustomARButton from '../components/CustomARButton'
import Html from '../components/Html'
import InputForm from '../components/InputForm'

type KeyProps = {
  createRandomLetter: () => void
  position?: [number, number, number]
}

function Key({ createRandomLetter, position }: KeyProps) {
  const [color, setColor] = useState('blue')
  const [randomLetterWasCreated, setRandomLetterCreated] = useState(false)
  const keyRef = useRef<Mesh | null>(null)

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
    if (keyRef.current && wristLeft && position) {
      keyRef.current.position.x = wristLeft.position.x - 0.075 + position[0]
      keyRef.current.position.y = wristLeft.position.y + 0.03 + position[1]
      keyRef.current.position.z = wristLeft.position.z + position[2]
    }

    if (keyRef.current) {
      const leftDistance = fingerTipLeft
        ? keyRef.current.position.distanceTo(fingerTipLeft.position)
        : null
      const rightDistance = fingerTipRight
        ? keyRef.current.position.distanceTo(fingerTipRight.position)
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
        <boxGeometry args={[0.02, 0.02, 0.02]} />
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

  function createGridKeys() {
    let keys = []
    const gridSize = 3
    const keySpacing = 0.05 // change this to increase/decrease the spacing between keys

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        let x = i * keySpacing - ((gridSize - 1) * keySpacing) / 2
        let z = j * keySpacing - ((gridSize - 1) * keySpacing) / 2
        keys.push(
          <Key
            key={`${i}-${j}`} // unique key for each child in a list
            createRandomLetter={createRandomLetterHandler}
            position={[x, 0, z]}
          />
        )
      }
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
            {createGridKeys()}

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
