import { XR, Hands, useXR, Interactive, XRInteractionEvent } from '@react-three/xr'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import CustomARButton from '../components/CustomARButton'
import { Grid, useTexture } from '@react-three/drei'
import html2canvas from 'html2canvas'

import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import React from 'react'
import { renderToString } from 'react-dom/server'

enum handIndex {
  left = 0,
  right = 1
}

type FingerTipSphereProps = {
  handIndex: number
  color: string
}

function Html({ children, width, height, color = 'transparent' }) {
  const { camera, size: viewSize, gl } = useThree()

  const sceneSize = React.useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180 // convert vertical fov to radians
    const height = 2 * Math.tan(fov / 2) * 5 // visible height
    const width = height * (viewSize.width / viewSize.height)
    return { width, height }
  }, [camera, viewSize])

  const lastUrl = React.useRef(null)

  let container = null

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      container = document.querySelector('#htmlContainer')
      if (!container) {
        const node = document.createElement('div')
        node.setAttribute('id', 'htmlContainer')
        node.style.position = 'fixed'
        node.style.opacity = '0'
        node.style.pointerEvents = 'none'
        document.body.appendChild(node)
        container = node
      }

      HTMLCanvasElement.prototype.getContext = (function (origFn) {
        return function (type, attribs) {
          attribs = attribs || {}
          attribs.preserveDrawingBuffer = true
          return origFn.call(this, type, attribs)
        }
      })(HTMLCanvasElement.prototype.getContext)
    }
  }, [])

  const [image, setImage] = React.useState(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  )
  const [textureSize, setTextureSize] = React.useState({ width, height })

  const node = React.useMemo(() => {
    const node = document.createElement('div')
    node.innerHTML = renderToString(children)
    return node
  }, [children])

  React.useEffect(() => {
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

  React.useEffect(() => {
    container.appendChild(node)
    html2canvas(node, { backgroundColor: color }).then((canvas) => {
      setTextureSize({ width: canvas.width, height: canvas.height })
      if (container.contains(node)) {
        container.removeChild(node)
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
      if (!container) return
      if (container.contains(node)) {
        container.removeChild(node)
      }
    }
  }, [node, viewSize, sceneSize, color])

  const texture = useTexture(image)

  const size = React.useMemo(() => {
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
      h = width * imageAspectW
    }
    if (width === undefined) {
      w = h * imageAspectH
    }
    return {
      width: w,
      height: h
    }
  }, [texture, width, height, camera])

  React.useMemo(() => {
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
  }, [texture, size, textureSize])

  return (
    <mesh>
      <planeBufferGeometry args={[size.width, size.height]} />
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

function InputForm() {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(text)
  }

  useEffect(() => {
    console.log('it appears')
  })

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
            <Html width={5} height={5}>
              <InputForm />
            </Html>

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
