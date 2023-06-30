import { XR, Hands, useXR, Interactive } from '@react-three/xr'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import CustomARButton from '../components/CustomARButton'
import { useTexture } from '@react-three/drei'
import html2canvas from 'html2canvas'

import { FormEvent, ReactNode, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import React from 'react'
import { renderToString } from 'react-dom/server'

enum HAND_INDEX {
  left = 0,
  right = 1
}

type FingerTipSphereProps = {
  handIndex: number
  color: string
}

type SphereProps = {
  createRandomLetter: () => void
}

type HtmlProps = {
  children: ReactNode
  width?: number
  height?: number
  color?: string
}

function Html({ children, width, height, color = 'transparent' }: HtmlProps) {
  const { camera, size: viewSize, gl } = useThree()

  const sceneSize = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180 // Convert vertical fov to radians
    const height = 2 * Math.tan(fov / 2) * 5 // Visible height
    const width = height * (viewSize.width / viewSize.height)
    return { width, height }
  }, [camera, viewSize])

  const lastUrl = useRef(null)
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let container = document.querySelector('#htmlContainer') as HTMLElement

      if (!container) {
        container = document.createElement('div')
        container.setAttribute('id', 'htmlContainer')
        container.style.position = 'fixed'
        container.style.opacity = '0'
        container.style.pointerEvents = 'none'
        document.body.appendChild(container)
      }

      containerRef.current = container

      // Modify the prototype of HTMLCanvasElement
      HTMLCanvasElement.prototype.getContext = (function (originalFn) {
        return function (type: string, attribs?: any) {
          attribs = attribs || {}
          attribs.preserveDrawingBuffer = true
          return originalFn.call(this, type, attribs)
        }
      })(HTMLCanvasElement.prototype.getContext)
    }
  }, [])

  const [image, setImage] = useState(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  )
  const [_textureSize, setTextureSize] = useState({ width, height })

  const node = useMemo(() => {
    const node = document.createElement('div')
    node.innerHTML = renderToString(children)
    return node
  }, [children])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      HTMLCanvasElement.prototype.getContext = (function (origFn) {
        return function (type, attribs) {
          attribs = attribs || {}
          attribs.preserveDrawingBuffer = true
          return origFn.call(this, type, attribs)
        }
      })(HTMLCanvasElement.prototype.getContext)
    }
  }, [])

  useEffect(() => {
    containerRef.current.appendChild(node)
    html2canvas(node, { backgroundColor: color }).then((canvas) => {
      setTextureSize({ width: canvas.width, height: canvas.height })
      if (containerRef.current.contains(node)) {
        containerRef.current.removeChild(node)
      }
      canvas.toBlob((blob) => {
        if (blob === null) return
        if (lastUrl.current !== null) {
          URL.revokeObjectURL(lastUrl.current)
        }
        const url = URL.createObjectURL(blob)
        lastUrl.current = url
        setImage(url)
      })
    })
    return () => {
      if (!containerRef.current) return
      if (containerRef.current.contains(node)) {
        containerRef.current.removeChild(node)
      }
    }
  }, [node, viewSize, sceneSize, color])

  const texture = useTexture(image)

  const size = useMemo(() => {
    const imageAspectW = texture.image.height / texture.image.width
    const imageAspectH = texture.image.width / texture.image.height

    const cam = camera as THREE.PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180 // convert vertical fov to radians

    let h = 2 * Math.tan(fov / 2) * 5 // visible height
    let w = h * imageAspectH

    if (width !== undefined) {
      w = width
    }
    if (height !== undefined) {
      h = height
    }

    if (height === undefined) {
      h = width ? width * imageAspectW : w * imageAspectW
    }
    if (width === undefined) {
      w = h * imageAspectH
    }
    return {
      width: w,
      height: h
    }
  }, [texture, width, height, camera])

  useMemo(() => {
    texture.matrixAutoUpdate = false
    const aspect = size.width / size.height
    const imageAspect = texture.image.width / texture.image.height
    texture.anisotropy = gl.capabilities.getMaxAnisotropy()
    texture.minFilter = THREE.LinearFilter
    if (aspect < imageAspect) {
      texture.matrix.setUvTransform(0, 0, 1, imageAspect / aspect, 0, 0.5, 0.5)
    } else {
      texture.matrix.setUvTransform(0, 0, aspect / imageAspect, 1, 0, 0.5, 0.5)
    }
  }, [texture, size, gl.capabilities])

  return (
    <mesh>
      <planeGeometry args={[size.width, size.height]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent />
    </mesh>
  )
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

function Sphere({ createRandomLetter }: SphereProps) {
  const [color, setColor] = useState('blue')
  const sphereRef = useRef<THREE.Mesh | null>(null)

  const fingerTipLeft = useXR(
    (state) => state.controllers[HAND_INDEX.left]?.hand?.joints['index-finger-tip']
  )
  const fingerTipRight = useXR(
    (state) => state.controllers[HAND_INDEX.right]?.hand?.joints['index-finger-tip']
  )

  let randomLetterWasCreated = false

  function createRandomLetterOnce() {
    if (!randomLetterWasCreated) {
      createRandomLetter()
      randomLetterWasCreated = true
    }
  }

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
        createRandomLetterOnce()
      } else {
        setColor('blue')
        randomLetterWasCreated = false
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

function InputForm(props: { givenText?: string }) {
  const [text, setText] = useState(props.givenText || '')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('This is the form text: ', text)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
        }}
      />
      <input type="submit" value="Submit" />
    </form>
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
    console.log(randomLetter)
    setFormText(randomLetter)
  }

  return (
    <>
      <div style={{ position: 'fixed', zIndex: '10' }}>
        <CustomARButton />
      </div>
      <Canvas>
        <XR>
          <ambientLight intensity={0.25} />
          <Suspense fallback={undefined}>
            <Sphere createRandomLetter={createRandomLetterHandler} />
            <Interactive>
              <Html width={2} height={1}>
                <InputForm givenText={formText} />
              </Html>
            </Interactive>

            <FingerTipSphere handIndex={HAND_INDEX.left} color="red" />
            <FingerTipSphere handIndex={HAND_INDEX.right} color="green" />

            <Hands />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}
