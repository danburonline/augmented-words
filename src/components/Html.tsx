import html2canvas from 'html2canvas'

import { useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { DoubleSide, LinearFilter, PerspectiveCamera } from 'three'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'

export type HtmlProps = {
  children: ReactNode
  width?: number
  height?: number
  color?: string
}

export default function Html({ children, width, height, color = 'transparent' }: HtmlProps) {
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
