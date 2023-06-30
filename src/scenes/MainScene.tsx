import html2canvas from 'html2canvas'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { XR, Hands, useXR, Interactive } from '@react-three/xr'
import { DoubleSide, LinearFilter, Mesh, PerspectiveCamera } from 'three'

import { FormEvent, ReactNode, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'

import CustomARButton from '../components/CustomARButton'

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
    const cam = camera as PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180 // Convert vertical fov to radians
    const height = 2 * Math.tan(fov / 2) * 5 // Visible height
    const width = height * (viewSize.width / viewSize.height)
    return { width, height }
  }, [camera, viewSize])

  const lastUrl = useRef<string | null>(null)
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
      const originalGetContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (
        contextId: '2d' | 'bitmaprenderer' | 'webgl' | 'webgl2',
        options?: any
      ): any {
        options = options || {}
        options.preserveDrawingBuffer = true
        return originalGetContext.call(this, contextId, options)
      }
    }
  }, [])

  const [image, setImage] = useState(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  )
  const [_textureSize, setTextureSize] = useState({ width, height })

  const node = useMemo(() => {
    const node = document.createElement('div')
    node.innerHTML = renderToString(children as React.ReactElement)
    return node
  }, [children])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalGetContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (
        contextId: '2d' | 'bitmaprenderer' | 'webgl' | 'webgl2',
        options?: any
      ): any {
        options = options || {}
        options.preserveDrawingBuffer = true
        return originalGetContext.call(this, contextId, options)
      }
    }
  }, [])

  useEffect(() => {
    containerRef.current?.appendChild(node)
    html2canvas(node, { backgroundColor: color }).then((canvas) => {
      setTextureSize({ width: canvas.width, height: canvas.height })
      if (containerRef.current?.contains(node)) {
        containerRef.current?.removeChild(node)
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
      if (containerRef.current?.contains(node)) {
        containerRef.current?.removeChild(node)
      }
    }
  }, [node, viewSize, sceneSize, color])

  const texture = useTexture(image)

  const size = useMemo(() => {
    const imageAspectW = texture.image.height / texture.image.width
    const imageAspectH = texture.image.width / texture.image.height

    const cam = camera as PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180 // Convert vertical fov to radians

    let h = 2 * Math.tan(fov / 2) * 5 // Visible height
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
    texture.minFilter = LinearFilter
    if (aspect < imageAspect) {
      texture.matrix.setUvTransform(0, 0, 1, imageAspect / aspect, 0, 0.5, 0.5)
    } else {
      texture.matrix.setUvTransform(0, 0, aspect / imageAspect, 1, 0, 0.5, 0.5)
    }
  }, [texture, size, gl.capabilities])

  return (
    <mesh position={[0, 1.5, -5]}>
      <planeGeometry args={[size.width, size.height]} />
      <meshBasicMaterial map={texture} side={DoubleSide} transparent />
    </mesh>
  )
}

function FingerTipSphere({ handIndex, color }: FingerTipSphereProps) {
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

function Sphere({ createRandomLetter }: SphereProps) {
  const [color, setColor] = useState('blue')
  const sphereRef = useRef<Mesh | null>(null)

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

  return (
    <form>
      <input
        style={{
          padding: '0.5em',
          lineHeight: '1.5em'
        }}
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
        }}
      />
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
              <Html width={4}>
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
