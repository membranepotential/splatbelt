// @ts-nocheck
/**
 * https://github.com/mkkellogg/GaussianSplats3D
 */
import * as THREE from 'three'
import {
  Ray,
  Plane,
  MathUtils,
  EventDispatcher,
  Vector3,
  MOUSE,
  TOUCH,
  Quaternion,
  Spherical,
  Vector2,
} from 'three'

const tempVector3A = new THREE.Vector3()
const tempVector3B = new THREE.Vector3()
const tempVector4A = new THREE.Vector4()
const tempVector4B = new THREE.Vector4()
const tempQuaternion4A = new THREE.Quaternion()
const tempQuaternion4B = new THREE.Quaternion()

class SplatBuffer {
  // Row format:
  //     Center position (XYZ) - Float32 * 3
  //     Scale (XYZ)  - Float32 * 3
  //     Color (RGBA) - Uint8 * 4
  //     Rotation (IJKW) - Float32 * 4

  static PositionComponentCount = 3
  static ScaleComponentCount = 3
  static RotationComponentCount = 4
  static ColorComponentCount = 4

  static RowSizeBytes = 44
  static RowSizeFloats = 11
  static PositionSizeFloats = 3
  static PositionSizeBytes = 12
  static CovarianceSizeFloats = 6
  static CovarianceSizeBytes = 24
  static ColorSizeFloats = 4
  static ColorSizeBytes = 16

  static ScaleRowOffsetFloats = 3
  static ScaleRowOffsetBytes = 12
  static ColorRowOffsetBytes = 24
  static RotationRowOffsetFloats = 7
  static RotationRowOffsetBytes = 28

  constructor(bufferDataOrVertexCount) {
    if (typeof bufferDataOrVertexCount === 'number') {
      this.bufferData = new ArrayBuffer(
        SplatBuffer.RowSizeBytes * bufferDataOrVertexCount
      )
      this.floatArray = new Float32Array(this.bufferData)
      this.uint8Array = new Uint8Array(this.bufferData)
      this.precomputedCovarianceBufferData = null
      this.precomputedColorBufferData = null
    } else {
      this.bufferData = bufferDataOrVertexCount
      this.floatArray = new Float32Array(this.bufferData)
      this.uint8Array = new Uint8Array(this.bufferData)
      this.precomputedCovarianceBufferData = null
      this.precomputedColorBufferData = null
    }
  }

  optimize(minAlpha) {
    let vertexCount = this.getVertexCount()
    const oldVertexCount = vertexCount
    const oldByteCount = vertexCount * SplatBuffer.RowSizeBytes

    let index = 0
    while (index < vertexCount) {
      const colorBase =
        SplatBuffer.RowSizeBytes * index + SplatBuffer.ColorRowOffsetBytes
      const baseAlpha = this.uint8Array[colorBase + 3]
      if (baseAlpha <= minAlpha) {
        this.swapVertices(index, vertexCount - 1)
        vertexCount--
      } else {
        index++
      }
    }

    const newByteCount = vertexCount * SplatBuffer.RowSizeBytes

    console.log('Splat buffer optimization')
    console.log('-------------------------------')
    console.log('Old vertex count: ' + oldVertexCount)
    console.log('Old byte count: ' + oldByteCount)
    console.log('New vertex count: ' + vertexCount)
    console.log('New byte count: ' + newByteCount)
    console.log(
      'Splat count reduction: ' +
        (((oldByteCount - newByteCount) / oldByteCount) * 100).toFixed(3) +
        '%'
    )
    console.log('==============================')
    console.log('')

    const newFloatArray = this.floatArray.slice(
      0,
      vertexCount * SplatBuffer.RowSizeFloats
    )
    this.bufferData = newFloatArray.buffer
    this.floatArray = new Float32Array(this.bufferData)
    this.uint8Array = new Uint8Array(this.bufferData)
  }

  buildPreComputedBuffers() {
    const vertexCount = this.getVertexCount()

    this.precomputedCovarianceBufferData = new ArrayBuffer(
      SplatBuffer.CovarianceSizeBytes * vertexCount
    )
    const covarianceArray = new Float32Array(
      this.precomputedCovarianceBufferData
    )

    this.precomputedColorBufferData = new ArrayBuffer(
      SplatBuffer.ColorSizeBytes * vertexCount
    )
    const colorArray = new Float32Array(this.precomputedColorBufferData)

    const scale = new THREE.Vector3()
    const rotation = new THREE.Quaternion()
    const rotationMatrix = new THREE.Matrix3()
    const scaleMatrix = new THREE.Matrix3()
    const covarianceMatrix = new THREE.Matrix3()
    const tempMatrix4 = new THREE.Matrix4()
    for (let i = 0; i < vertexCount; i++) {
      const colorBase =
        SplatBuffer.RowSizeBytes * i + SplatBuffer.ColorRowOffsetBytes
      colorArray[SplatBuffer.ColorSizeFloats * i] =
        this.uint8Array[colorBase] / 255
      colorArray[SplatBuffer.ColorSizeFloats * i + 1] =
        this.uint8Array[colorBase + 1] / 255
      colorArray[SplatBuffer.ColorSizeFloats * i + 2] =
        this.uint8Array[colorBase + 2] / 255
      colorArray[SplatBuffer.ColorSizeFloats * i + 3] =
        this.uint8Array[colorBase + 3] / 255

      const scaleBase =
        SplatBuffer.RowSizeFloats * i + SplatBuffer.ScaleRowOffsetFloats
      scale.set(
        this.floatArray[scaleBase],
        this.floatArray[scaleBase + 1],
        this.floatArray[scaleBase + 2]
      )
      tempMatrix4.makeScale(scale.x, scale.y, scale.z)
      scaleMatrix.setFromMatrix4(tempMatrix4)

      const rotationBase =
        SplatBuffer.RowSizeFloats * i + SplatBuffer.RotationRowOffsetFloats
      rotation.set(
        this.floatArray[rotationBase + 1],
        this.floatArray[rotationBase + 2],
        this.floatArray[rotationBase + 3],
        this.floatArray[rotationBase]
      )
      tempMatrix4.makeRotationFromQuaternion(rotation)
      rotationMatrix.setFromMatrix4(tempMatrix4)

      covarianceMatrix.copy(rotationMatrix).multiply(scaleMatrix)
      const M = covarianceMatrix.elements
      covarianceArray[SplatBuffer.CovarianceSizeFloats * i] =
        M[0] * M[0] + M[3] * M[3] + M[6] * M[6]
      covarianceArray[SplatBuffer.CovarianceSizeFloats * i + 1] =
        M[0] * M[1] + M[3] * M[4] + M[6] * M[7]
      covarianceArray[SplatBuffer.CovarianceSizeFloats * i + 2] =
        M[0] * M[2] + M[3] * M[5] + M[6] * M[8]
      covarianceArray[SplatBuffer.CovarianceSizeFloats * i + 3] =
        M[1] * M[1] + M[4] * M[4] + M[7] * M[7]
      covarianceArray[SplatBuffer.CovarianceSizeFloats * i + 4] =
        M[1] * M[2] + M[4] * M[5] + M[7] * M[8]
      covarianceArray[SplatBuffer.CovarianceSizeFloats * i + 5] =
        M[2] * M[2] + M[5] * M[5] + M[8] * M[8]
    }
  }

  getBufferData() {
    return this.bufferData
  }

  getPosition(index, outPosition = new THREE.Vector3()) {
    const positionBase = SplatBuffer.RowSizeFloats * index
    outPosition.set(
      this.floatArray[positionBase],
      this.floatArray[positionBase + 1],
      this.floatArray[positionBase + 2]
    )
    return outPosition
  }

  setPosition(index, position) {
    const positionBase = SplatBuffer.RowSizeFloats * index
    this.floatArray[positionBase] = position.x
    this.floatArray[positionBase + 1] = position.y
    this.floatArray[positionBase + 2] = position.z
  }

  getScale(index, outScale = new THREE.Vector3()) {
    const scaleBase =
      SplatBuffer.RowSizeFloats * index + SplatBuffer.ScaleRowOffsetFloats
    outScale.set(
      this.floatArray[scaleBase],
      this.floatArray[scaleBase + 1],
      this.floatArray[scaleBase + 2]
    )
    return outScale
  }

  setScale(index, scale) {
    const scaleBase =
      SplatBuffer.RowSizeFloats * index + SplatBuffer.ScaleRowOffsetFloats
    this.floatArray[scaleBase] = scale.x
    this.floatArray[scaleBase + 1] = scale.y
    this.floatArray[scaleBase + 2] = scale.z
  }

  getRotation(index, outRotation = new THREE.Quaternion()) {
    const rotationBase =
      SplatBuffer.RowSizeFloats * index + SplatBuffer.RotationRowOffsetFloats
    outRotation.set(
      this.floatArray[rotationBase + 1],
      this.floatArray[rotationBase + 2],
      this.floatArray[rotationBase + 3],
      this.floatArray[rotationBase]
    )
    return outRotation
  }

  setRotation(index, rotation) {
    const rotationBase =
      SplatBuffer.RowSizeFloats * index + SplatBuffer.RotationRowOffsetFloats
    this.floatArray[rotationBase] = rotation.w
    this.floatArray[rotationBase + 1] = rotation.x
    this.floatArray[rotationBase + 2] = rotation.y
    this.floatArray[rotationBase + 3] = rotation.z
  }

  getColor(index, outColor = new THREE.Vector4()) {
    const colorBase =
      SplatBuffer.RowSizeBytes * index + SplatBuffer.ColorRowOffsetBytes
    outColor.set(
      this.uint8Array[colorBase],
      this.uint8Array[colorBase + 1],
      this.uint8Array[colorBase + 2],
      this.uint8Array[colorBase + 3]
    )
    return outColor
  }

  setColor(index, color) {
    const colorBase =
      SplatBuffer.RowSizeBytes * index + SplatBuffer.ColorRowOffsetBytes
    this.uint8Array[colorBase] = color.x
    this.uint8Array[colorBase + 1] = color.y
    this.uint8Array[colorBase + 2] = color.z
    this.uint8Array[colorBase + 3] = color.w
  }

  getPrecomputedCovarianceBufferData() {
    return this.precomputedCovarianceBufferData
  }

  getPrecomputedColorBufferData() {
    return this.precomputedColorBufferData
  }

  getVertexCount() {
    return this.bufferData.byteLength / SplatBuffer.RowSizeBytes
  }

  fillPositionArray(outPositionArray) {
    const vertexCount = this.getVertexCount()
    for (let i = 0; i < vertexCount; i++) {
      const outPositionBase = i * SplatBuffer.PositionComponentCount
      const srcPositionBase = SplatBuffer.RowSizeFloats * i
      outPositionArray[outPositionBase] = this.floatArray[srcPositionBase]
      outPositionArray[outPositionBase + 1] =
        this.floatArray[srcPositionBase + 1]
      outPositionArray[outPositionBase + 2] =
        this.floatArray[srcPositionBase + 2]
    }
  }

  fillScaleArray(outScaleArray) {
    const vertexCount = this.getVertexCount()
    for (let i = 0; i < vertexCount; i++) {
      const outScaleBase = i * SplatBuffer.ScaleComponentCount
      const srcScaleBase =
        SplatBuffer.RowSizeFloats * i + SplatBuffer.ScaleRowOffsetFloats
      outScaleArray[outScaleBase] = this.floatArray[srcScaleBase]
      outScaleArray[outScaleBase + 1] = this.floatArray[srcScaleBase + 1]
      outScaleArray[outScaleBase + 2] = this.floatArray[srcScaleBase + 2]
    }
  }

  fillRotationArray(outRotationArray) {
    const vertexCount = this.getVertexCount()
    for (let i = 0; i < vertexCount; i++) {
      const outRotationBase = i * SplatBuffer.RotationComponentCount
      const srcRotationBase =
        SplatBuffer.RowSizeFloats * i + SplatBuffer.RotationRowOffsetFloats
      outRotationArray[outRotationBase] = this.floatArray[srcRotationBase]
      outRotationArray[outRotationBase + 1] =
        this.floatArray[srcRotationBase + 1]
      outRotationArray[outRotationBase + 2] =
        this.floatArray[srcRotationBase + 2]
      outRotationArray[outRotationBase + 3] =
        this.floatArray[srcRotationBase + 3]
    }
  }

  fillColorArray(outColorArray) {
    const vertexCount = this.getVertexCount()
    for (let i = 0; i < vertexCount; i++) {
      const outColorBase = i * SplatBuffer.ColorComponentCount
      const srcColorBase =
        SplatBuffer.RowSizeBytes * i + SplatBuffer.ColorRowOffsetBytes
      outColorArray[outColorBase] = this.uint8Array[srcColorBase]
      outColorArray[outColorBase + 1] = this.uint8Array[srcColorBase + 1]
      outColorArray[outColorBase + 2] = this.uint8Array[srcColorBase + 2]
      outColorArray[outColorBase + 3] = this.uint8Array[srcColorBase + 3]
    }
  }

  swapVertices(indexA, indexB) {
    this.getPosition(indexA, tempVector3A)
    this.getPosition(indexB, tempVector3B)
    this.setPosition(indexB, tempVector3A)
    this.setPosition(indexA, tempVector3B)

    this.getScale(indexA, tempVector3A)
    this.getScale(indexB, tempVector3B)
    this.setScale(indexB, tempVector3A)
    this.setScale(indexA, tempVector3B)

    this.getRotation(indexA, tempQuaternion4A)
    this.getRotation(indexB, tempQuaternion4B)
    this.setRotation(indexB, tempQuaternion4A)
    this.setRotation(indexA, tempQuaternion4B)

    this.getColor(indexA, tempVector4A)
    this.getColor(indexB, tempVector4B)
    this.setColor(indexB, tempVector4A)
    this.setColor(indexA, tempVector4B)
  }

  copyVertexFromSplatBuffer(otherSplatBuffer, srcIndex, destIndex) {
    const srcArray = new Float32Array(
      otherSplatBuffer.bufferData,
      srcIndex * SplatBuffer.RowSizeBytes,
      SplatBuffer.RowSizeFloats
    )
    const destArray = new Float32Array(
      this.bufferData,
      destIndex * SplatBuffer.RowSizeBytes,
      SplatBuffer.RowSizeFloats
    )
    destArray.set(srcArray)
  }
}

class PlyParser {
  constructor(plyBuffer) {
    this.plyBuffer = plyBuffer
  }

  decodeHeader(plyBuffer) {
    const decoder = new TextDecoder()
    let headerOffset = 0
    let headerText = ''

    while (true) {
      const headerChunk = new Uint8Array(plyBuffer, headerOffset, 50)
      headerText += decoder.decode(headerChunk)
      headerOffset += 50
      if (headerText.includes('end_header')) {
        break
      }
    }

    const headerLines = headerText.split('\n')

    let vertexCount = 0
    let propertyTypes = {}

    for (let i = 0; i < headerLines.length; i++) {
      const line = headerLines[i].trim()
      if (line.startsWith('element vertex')) {
        const vertexCountMatch = line.match(/\d+/)
        if (vertexCountMatch) {
          vertexCount = parseInt(vertexCountMatch[0])
        }
      } else if (line.startsWith('property')) {
        const propertyMatch = line.match(/(\w+)\s+(\w+)\s+(\w+)/)
        if (propertyMatch) {
          const propertyType = propertyMatch[2]
          const propertyName = propertyMatch[3]
          propertyTypes[propertyName] = propertyType
        }
      } else if (line === 'end_header') {
        break
      }
    }

    const vertexByteOffset =
      headerText.indexOf('end_header') + 'end_header'.length + 1
    const vertexData = new DataView(plyBuffer, vertexByteOffset)

    return {
      vertexCount: vertexCount,
      propertyTypes: propertyTypes,
      vertexData: vertexData,
      headerOffset: headerOffset,
    }
  }

  readRawVertexFast(
    vertexData,
    offset,
    fieldOffsets,
    propertiesToRead,
    propertyTypes,
    outVertex
  ) {
    let rawVertex = outVertex || {}
    for (let property of propertiesToRead) {
      const propertyType = propertyTypes[property]
      if (propertyType === 'float') {
        rawVertex[property] = vertexData.getFloat32(
          offset + fieldOffsets[property],
          true
        )
      } else if (propertyType === 'uchar') {
        rawVertex[property] =
          vertexData.getUint8(offset + fieldOffsets[property]) / 255.0
      }
    }
  }

  parseToSplatBuffer() {
    console.time('PLY load')

    const { vertexCount, propertyTypes, vertexData } = this.decodeHeader(
      this.plyBuffer
    )

    // figure out the SH degree from the number of coefficients
    let nRestCoeffs = 0
    for (const propertyName in propertyTypes) {
      if (propertyName.startsWith('f_rest_')) {
        nRestCoeffs += 1
      }
    }
    const nCoeffsPerColor = nRestCoeffs / 3

    // TODO: Eventually properly support multiple degree spherical harmonics
    // const sphericalHarmonicsDegree = Math.sqrt(nCoeffsPerColor + 1) - 1;
    const sphericalHarmonicsDegree = 0

    console.log(
      'Detected degree',
      sphericalHarmonicsDegree,
      'with ',
      nCoeffsPerColor,
      'coefficients per color'
    )

    // figure out the order in which spherical harmonics should be read
    const shFeatureOrder = []
    for (let rgb = 0; rgb < 3; ++rgb) {
      shFeatureOrder.push(`f_dc_${rgb}`)
    }
    for (let i = 0; i < nCoeffsPerColor; ++i) {
      for (let rgb = 0; rgb < 3; ++rgb) {
        shFeatureOrder.push(`f_rest_${rgb * nCoeffsPerColor + i}`)
      }
    }

    let plyRowSize = 0
    let fieldOffsets = {}
    const fieldSize = {
      double: 8,
      int: 4,
      uint: 4,
      float: 4,
      short: 2,
      ushort: 2,
      uchar: 1,
    }
    for (let fieldName in propertyTypes) {
      if (propertyTypes.hasOwnProperty(fieldName)) {
        const type = propertyTypes[fieldName]
        fieldOffsets[fieldName] = plyRowSize
        plyRowSize += fieldSize[type]
      }
    }

    let rawVertex = {}

    const propertiesToRead = [
      'scale_0',
      'scale_1',
      'scale_2',
      'rot_0',
      'rot_1',
      'rot_2',
      'rot_3',
      'x',
      'y',
      'z',
      'f_dc_0',
      'f_dc_1',
      'f_dc_2',
      'opacity',
    ]

    console.time('Importance computations')
    let sizeList = new Float32Array(vertexCount)
    let sizeIndex = new Uint32Array(vertexCount)
    for (let row = 0; row < vertexCount; row++) {
      this.readRawVertexFast(
        vertexData,
        row * plyRowSize,
        fieldOffsets,
        propertiesToRead,
        propertyTypes,
        rawVertex
      )
      sizeIndex[row] = row
      if (!propertyTypes['scale_0']) continue
      const size =
        Math.exp(rawVertex.scale_0) *
        Math.exp(rawVertex.scale_1) *
        Math.exp(rawVertex.scale_2)
      const opacity = 1 / (1 + Math.exp(-rawVertex.opacity))
      sizeList[row] = size * opacity
    }
    console.timeEnd('Importance computations')

    console.time('Importance sort')
    sizeIndex.sort((b, a) => sizeList[a] - sizeList[b])
    console.timeEnd('Importance sort')

    const splatBufferData = new ArrayBuffer(
      SplatBuffer.RowSizeBytes * vertexCount
    )

    for (let j = 0; j < vertexCount; j++) {
      const row = sizeIndex[j]
      const offset = row * plyRowSize
      this.readRawVertexFast(
        vertexData,
        offset,
        fieldOffsets,
        propertiesToRead,
        propertyTypes,
        rawVertex
      )
      const position = new Float32Array(
        splatBufferData,
        j * SplatBuffer.RowSizeBytes,
        3
      )
      const scales = new Float32Array(
        splatBufferData,
        j * SplatBuffer.RowSizeBytes + SplatBuffer.ScaleRowOffsetBytes,
        3
      )
      const rgba = new Uint8ClampedArray(
        splatBufferData,
        j * SplatBuffer.RowSizeBytes + SplatBuffer.ColorRowOffsetBytes,
        4
      )
      const rot = new Float32Array(
        splatBufferData,
        j * SplatBuffer.RowSizeBytes + SplatBuffer.RotationRowOffsetBytes,
        4
      )

      if (propertyTypes['scale_0']) {
        const quat = new THREE.Quaternion(
          rawVertex.rot_1,
          rawVertex.rot_2,
          rawVertex.rot_3,
          rawVertex.rot_0
        )
        quat.normalize()
        rot.set([quat.w, quat.x, quat.y, quat.z])
        scales.set([
          Math.exp(rawVertex.scale_0),
          Math.exp(rawVertex.scale_1),
          Math.exp(rawVertex.scale_2),
        ])
      } else {
        scales.set([0.01, 0.01, 0.01])
        rot.set([1.0, 0.0, 0.0, 0.0])
      }

      position.set([rawVertex.x, rawVertex.y, rawVertex.z])

      if (propertyTypes['f_dc_0']) {
        const SH_C0 = 0.28209479177387814
        rgba.set([
          (0.5 + SH_C0 * rawVertex.f_dc_0) * 255,
          (0.5 + SH_C0 * rawVertex.f_dc_1) * 255,
          (0.5 + SH_C0 * rawVertex.f_dc_2) * 255,
        ])
      } else {
        rgba.set([255, 0, 0])
      }
      if (propertyTypes['opacity']) {
        rgba[3] = (1 / (1 + Math.exp(-rawVertex.opacity))) * 255
      } else {
        rgba[3] = 255
      }
    }

    console.timeEnd('PLY load')

    const splatBuffer = new SplatBuffer(splatBufferData)
    return splatBuffer
  }
}

class PlyLoader {
  constructor() {
    this.splatBuffer = null
  }

  fetchFile(fileName) {
    return new Promise((resolve, reject) => {
      fetch(fileName)
        .then((res) => {
          return res.arrayBuffer()
        })
        .then((data) => {
          resolve(data)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  loadFromFile(fileName) {
    return new Promise((resolve, reject) => {
      const loadPromise = this.fetchFile(fileName)
      loadPromise
        .then((plyFileData) => {
          const plyParser = new PlyParser(plyFileData)
          const splatBuffer = plyParser.parseToSplatBuffer()
          this.splatBuffer = splatBuffer
          resolve(splatBuffer)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}

class SplatLoader {
  constructor(splatBuffer = null) {
    this.splatBuffer = splatBuffer
    this.downLoadLink = null
  }

  loadFromFile(fileName) {
    return new Promise((resolve, reject) => {
      fetch(fileName)
        .then((res) => {
          return res.arrayBuffer()
        })
        .then((bufferData) => {
          const splatBuffer = new SplatBuffer(bufferData)
          resolve(splatBuffer)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  setFromBuffer(splatBuffer) {
    this.splatBuffer = splatBuffer
  }

  saveToFile(fileName) {
    const splatData = new Uint8Array(this.splatBuffer.getBufferData())
    const blob = new Blob([splatData.buffer], {
      type: 'application/octet-stream',
    })

    if (!this.downLoadLink) {
      this.downLoadLink = document.createElement('a')
      document.body.appendChild(this.downLoadLink)
    }
    this.downLoadLink.download = fileName
    this.downLoadLink.href = URL.createObjectURL(blob)
    this.downLoadLink.click()
  }
}

// OrbitControls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

const _changeEvent = { type: 'change' }
const _startEvent = { type: 'start' }
const _endEvent = { type: 'end' }
const _ray = new Ray()
const _plane = new Plane()
const TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD)

class OrbitControls extends EventDispatcher {
  constructor(object, domElement) {
    super()

    this.object = object
    this.domElement = domElement
    this.domElement.style.touchAction = 'none' // disable touch scroll

    // Set to false to disable this control
    this.enabled = true

    // "target" sets the location of focus, where the object orbits around
    this.target = new Vector3()

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0
    this.maxDistance = Infinity

    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = 0
    this.maxZoom = Infinity

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0 // radians
    this.maxPolarAngle = Math.PI // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, the interval [min, max] must be a sub-interval of [- 2 PI, 2 PI], with ( max - min < 2 PI )
    this.minAzimuthAngle = -Infinity // radians
    this.maxAzimuthAngle = Infinity // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = false
    this.dampingFactor = 0.05

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true
    this.zoomSpeed = 1.0

    // Set to false to disable rotating
    this.enableRotate = true
    this.rotateSpeed = 1.0

    // Set to false to disable panning
    this.enablePan = true
    this.panSpeed = 1.0
    this.screenSpacePanning = true // if false, pan orthogonal to world-space direction camera.up
    this.keyPanSpeed = 7.0 // pixels moved per arrow key push
    this.zoomToCursor = false

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false
    this.autoRotateSpeed = 2.0 // 30 seconds per orbit when fps is 60

    // The four arrow keys
    this.keys = {
      LEFT: 'ArrowLeft',
      UP: 'ArrowUp',
      RIGHT: 'ArrowRight',
      BOTTOM: 'ArrowDown',
    }

    // Mouse buttons
    this.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN,
    }

    // Touch fingers
    this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }

    // for reset
    this.target0 = this.target.clone()
    this.position0 = this.object.position.clone()
    this.zoom0 = this.object.zoom

    // the target DOM element for key events
    this._domElementKeyEvents = null

    //
    // public methods
    //

    this.getPolarAngle = function () {
      return spherical.phi
    }

    this.getAzimuthalAngle = function () {
      return spherical.theta
    }

    this.getDistance = function () {
      return this.object.position.distanceTo(this.target)
    }

    this.listenToKeyEvents = function (domElement) {
      domElement.addEventListener('keydown', onKeyDown)
      this._domElementKeyEvents = domElement
    }

    this.stopListenToKeyEvents = function () {
      this._domElementKeyEvents.removeEventListener('keydown', onKeyDown)
      this._domElementKeyEvents = null
    }

    this.saveState = function () {
      scope.target0.copy(scope.target)
      scope.position0.copy(scope.object.position)
      scope.zoom0 = scope.object.zoom
    }

    this.reset = function () {
      scope.target.copy(scope.target0)
      scope.object.position.copy(scope.position0)
      scope.object.zoom = scope.zoom0

      scope.object.updateProjectionMatrix()
      scope.dispatchEvent(_changeEvent)

      scope.update()

      state = STATE.NONE
    }

    // this method is exposed, but perhaps it would be better if we can make it private...
    this.update = (function () {
      const offset = new Vector3()

      // so camera.up is the orbit axis
      const quat = new Quaternion().setFromUnitVectors(
        object.up,
        new Vector3(0, 1, 0)
      )
      const quatInverse = quat.clone().invert()

      const lastPosition = new Vector3()
      const lastQuaternion = new Quaternion()
      const lastTargetPosition = new Vector3()

      const twoPI = 2 * Math.PI

      return function update() {
        const position = scope.object.position

        offset.copy(position).sub(scope.target)

        // rotate offset to "y-axis-is-up" space
        offset.applyQuaternion(quat)

        // angle from z-axis around y-axis
        spherical.setFromVector3(offset)

        if (scope.autoRotate && state === STATE.NONE) {
          rotateLeft(getAutoRotationAngle())
        }

        if (scope.enableDamping) {
          spherical.theta += sphericalDelta.theta * scope.dampingFactor
          spherical.phi += sphericalDelta.phi * scope.dampingFactor
        } else {
          spherical.theta += sphericalDelta.theta
          spherical.phi += sphericalDelta.phi
        }

        // restrict theta to be between desired limits

        let min = scope.minAzimuthAngle
        let max = scope.maxAzimuthAngle

        if (isFinite(min) && isFinite(max)) {
          if (min < -Math.PI) min += twoPI
          else if (min > Math.PI) min -= twoPI

          if (max < -Math.PI) max += twoPI
          else if (max > Math.PI) max -= twoPI

          if (min <= max) {
            spherical.theta = Math.max(min, Math.min(max, spherical.theta))
          } else {
            spherical.theta =
              spherical.theta > (min + max) / 2
                ? Math.max(min, spherical.theta)
                : Math.min(max, spherical.theta)
          }
        }

        // restrict phi to be between desired limits
        spherical.phi = Math.max(
          scope.minPolarAngle,
          Math.min(scope.maxPolarAngle, spherical.phi)
        )

        spherical.makeSafe()

        // move target to panned location

        if (scope.enableDamping === true) {
          scope.target.addScaledVector(panOffset, scope.dampingFactor)
        } else {
          scope.target.add(panOffset)
        }

        // adjust the camera position based on zoom only if we're not zooming to the cursor or if it's an ortho camera
        // we adjust zoom later in these cases
        if (
          (scope.zoomToCursor && performCursorZoom) ||
          scope.object.isOrthographicCamera
        ) {
          spherical.radius = clampDistance(spherical.radius)
        } else {
          spherical.radius = clampDistance(spherical.radius * scale)
        }

        offset.setFromSpherical(spherical)

        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion(quatInverse)

        position.copy(scope.target).add(offset)

        scope.object.lookAt(scope.target)

        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor
          sphericalDelta.phi *= 1 - scope.dampingFactor

          panOffset.multiplyScalar(1 - scope.dampingFactor)
        } else {
          sphericalDelta.set(0, 0, 0)

          panOffset.set(0, 0, 0)
        }

        // adjust camera position
        let zoomChanged = false
        if (scope.zoomToCursor && performCursorZoom) {
          let newRadius = null
          if (scope.object.isPerspectiveCamera) {
            // move the camera down the pointer ray
            // this method avoids floating point error
            const prevRadius = offset.length()
            newRadius = clampDistance(prevRadius * scale)

            const radiusDelta = prevRadius - newRadius
            scope.object.position.addScaledVector(dollyDirection, radiusDelta)
            scope.object.updateMatrixWorld()
          } else if (scope.object.isOrthographicCamera) {
            // adjust the ortho camera position based on zoom changes
            const mouseBefore = new Vector3(mouse.x, mouse.y, 0)
            mouseBefore.unproject(scope.object)

            scope.object.zoom = Math.max(
              scope.minZoom,
              Math.min(scope.maxZoom, scope.object.zoom / scale)
            )
            scope.object.updateProjectionMatrix()
            zoomChanged = true

            const mouseAfter = new Vector3(mouse.x, mouse.y, 0)
            mouseAfter.unproject(scope.object)

            scope.object.position.sub(mouseAfter).add(mouseBefore)
            scope.object.updateMatrixWorld()

            newRadius = offset.length()
          } else {
            console.warn(
              'WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.'
            )
            scope.zoomToCursor = false
          }

          // handle the placement of the target
          if (newRadius !== null) {
            if (this.screenSpacePanning) {
              // position the orbit target in front of the new camera position
              scope.target
                .set(0, 0, -1)
                .transformDirection(scope.object.matrix)
                .multiplyScalar(newRadius)
                .add(scope.object.position)
            } else {
              // get the ray and translation plane to compute target
              _ray.origin.copy(scope.object.position)
              _ray.direction
                .set(0, 0, -1)
                .transformDirection(scope.object.matrix)

              // if the camera is 20 degrees above the horizon then don't adjust the focus target to avoid
              // extremely large values
              if (Math.abs(scope.object.up.dot(_ray.direction)) < TILT_LIMIT) {
                object.lookAt(scope.target)
              } else {
                _plane.setFromNormalAndCoplanarPoint(
                  scope.object.up,
                  scope.target
                )
                _ray.intersectPlane(_plane, scope.target)
              }
            }
          }
        } else if (scope.object.isOrthographicCamera) {
          scope.object.zoom = Math.max(
            scope.minZoom,
            Math.min(scope.maxZoom, scope.object.zoom / scale)
          )
          scope.object.updateProjectionMatrix()
          zoomChanged = true
        }

        scale = 1
        performCursorZoom = false

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if (
          zoomChanged ||
          lastPosition.distanceToSquared(scope.object.position) > EPS ||
          8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS ||
          lastTargetPosition.distanceToSquared(scope.target) > 0
        ) {
          scope.dispatchEvent(_changeEvent)

          lastPosition.copy(scope.object.position)
          lastQuaternion.copy(scope.object.quaternion)
          lastTargetPosition.copy(scope.target)

          zoomChanged = false

          return true
        }

        return false
      }
    })()

    this.dispose = function () {
      scope.domElement.removeEventListener('contextmenu', onContextMenu)

      scope.domElement.removeEventListener('pointerdown', onPointerDown)
      scope.domElement.removeEventListener('pointercancel', onPointerUp)
      scope.domElement.removeEventListener('wheel', onMouseWheel)

      scope.domElement.removeEventListener('pointermove', onPointerMove)
      scope.domElement.removeEventListener('pointerup', onPointerUp)

      if (scope._domElementKeyEvents !== null) {
        scope._domElementKeyEvents.removeEventListener('keydown', onKeyDown)
        scope._domElementKeyEvents = null
      }
    }

    //
    // internals
    //

    const scope = this

    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_PAN: 4,
      TOUCH_DOLLY_PAN: 5,
      TOUCH_DOLLY_ROTATE: 6,
    }

    let state = STATE.NONE

    const EPS = 0.000001

    // current position in spherical coordinates
    const spherical = new Spherical()
    const sphericalDelta = new Spherical()

    let scale = 1
    const panOffset = new Vector3()

    const rotateStart = new Vector2()
    const rotateEnd = new Vector2()
    const rotateDelta = new Vector2()

    const panStart = new Vector2()
    const panEnd = new Vector2()
    const panDelta = new Vector2()

    const dollyStart = new Vector2()
    const dollyEnd = new Vector2()
    const dollyDelta = new Vector2()

    const dollyDirection = new Vector3()
    const mouse = new Vector2()
    let performCursorZoom = false

    const pointers = []
    const pointerPositions = {}

    function getAutoRotationAngle() {
      return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed
    }

    function getZoomScale() {
      return Math.pow(0.95, scope.zoomSpeed)
    }

    function rotateLeft(angle) {
      sphericalDelta.theta -= angle
    }

    function rotateUp(angle) {
      sphericalDelta.phi -= angle
    }

    const panLeft = (function () {
      const v = new Vector3()

      return function panLeft(distance, objectMatrix) {
        v.setFromMatrixColumn(objectMatrix, 0) // get X column of objectMatrix
        v.multiplyScalar(-distance)

        panOffset.add(v)
      }
    })()

    const panUp = (function () {
      const v = new Vector3()

      return function panUp(distance, objectMatrix) {
        if (scope.screenSpacePanning === true) {
          v.setFromMatrixColumn(objectMatrix, 1)
        } else {
          v.setFromMatrixColumn(objectMatrix, 0)
          v.crossVectors(scope.object.up, v)
        }

        v.multiplyScalar(distance)

        panOffset.add(v)
      }
    })()

    // deltaX and deltaY are in pixels; right and down are positive
    const pan = (function () {
      const offset = new Vector3()

      return function pan(deltaX, deltaY) {
        const element = scope.domElement

        if (scope.object.isPerspectiveCamera) {
          // perspective
          const position = scope.object.position
          offset.copy(position).sub(scope.target)
          let targetDistance = offset.length()

          // half of the fov is center to top of screen
          targetDistance *= Math.tan(((scope.object.fov / 2) * Math.PI) / 180.0)

          // we use only clientHeight here so aspect ratio does not distort speed
          panLeft(
            (2 * deltaX * targetDistance) / element.clientHeight,
            scope.object.matrix
          )
          panUp(
            (2 * deltaY * targetDistance) / element.clientHeight,
            scope.object.matrix
          )
        } else if (scope.object.isOrthographicCamera) {
          // orthographic
          panLeft(
            (deltaX * (scope.object.right - scope.object.left)) /
              scope.object.zoom /
              element.clientWidth,
            scope.object.matrix
          )
          panUp(
            (deltaY * (scope.object.top - scope.object.bottom)) /
              scope.object.zoom /
              element.clientHeight,
            scope.object.matrix
          )
        } else {
          // camera neither orthographic nor perspective
          console.warn(
            'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.'
          )
          scope.enablePan = false
        }
      }
    })()

    function dollyOut(dollyScale) {
      if (
        scope.object.isPerspectiveCamera ||
        scope.object.isOrthographicCamera
      ) {
        scale /= dollyScale
      } else {
        console.warn(
          'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'
        )
        scope.enableZoom = false
      }
    }

    function dollyIn(dollyScale) {
      if (
        scope.object.isPerspectiveCamera ||
        scope.object.isOrthographicCamera
      ) {
        scale *= dollyScale
      } else {
        console.warn(
          'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'
        )
        scope.enableZoom = false
      }
    }

    function updateMouseParameters(event) {
      if (!scope.zoomToCursor) {
        return
      }

      performCursorZoom = true

      const rect = scope.domElement.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const w = rect.width
      const h = rect.height

      mouse.x = (x / w) * 2 - 1
      mouse.y = -(y / h) * 2 + 1

      dollyDirection
        .set(mouse.x, mouse.y, 1)
        .unproject(object)
        .sub(object.position)
        .normalize()
    }

    function clampDistance(dist) {
      return Math.max(scope.minDistance, Math.min(scope.maxDistance, dist))
    }

    //
    // event callbacks - update the object state
    //

    function handleMouseDownRotate(event) {
      rotateStart.set(event.clientX, event.clientY)
    }

    function handleMouseDownDolly(event) {
      updateMouseParameters(event)
      dollyStart.set(event.clientX, event.clientY)
    }

    function handleMouseDownPan(event) {
      panStart.set(event.clientX, event.clientY)
    }

    function handleMouseMoveRotate(event) {
      rotateEnd.set(event.clientX, event.clientY)

      rotateDelta
        .subVectors(rotateEnd, rotateStart)
        .multiplyScalar(scope.rotateSpeed)

      const element = scope.domElement

      rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight) // yes, height

      rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight)

      rotateStart.copy(rotateEnd)

      scope.update()
    }

    function handleMouseMoveDolly(event) {
      dollyEnd.set(event.clientX, event.clientY)

      dollyDelta.subVectors(dollyEnd, dollyStart)

      if (dollyDelta.y > 0) {
        dollyOut(getZoomScale())
      } else if (dollyDelta.y < 0) {
        dollyIn(getZoomScale())
      }

      dollyStart.copy(dollyEnd)

      scope.update()
    }

    function handleMouseMovePan(event) {
      panEnd.set(event.clientX, event.clientY)

      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed)

      pan(panDelta.x, panDelta.y)

      panStart.copy(panEnd)

      scope.update()
    }

    function handleMouseWheel(event) {
      updateMouseParameters(event)

      if (event.deltaY < 0) {
        dollyIn(getZoomScale())
      } else if (event.deltaY > 0) {
        dollyOut(getZoomScale())
      }

      scope.update()
    }

    function handleKeyDown(event) {
      let needsUpdate = false

      switch (event.code) {
        case scope.keys.UP:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateUp(
              (2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight
            )
          } else {
            pan(0, scope.keyPanSpeed)
          }

          needsUpdate = true
          break

        case scope.keys.BOTTOM:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateUp(
              (-2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight
            )
          } else {
            pan(0, -scope.keyPanSpeed)
          }

          needsUpdate = true
          break

        case scope.keys.LEFT:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateLeft(
              (2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight
            )
          } else {
            pan(scope.keyPanSpeed, 0)
          }

          needsUpdate = true
          break

        case scope.keys.RIGHT:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateLeft(
              (-2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight
            )
          } else {
            pan(-scope.keyPanSpeed, 0)
          }

          needsUpdate = true
          break
      }

      if (needsUpdate) {
        // prevent the browser from scrolling on cursor keys
        event.preventDefault()

        scope.update()
      }
    }

    function handleTouchStartRotate() {
      if (pointers.length === 1) {
        rotateStart.set(pointers[0].pageX, pointers[0].pageY)
      } else {
        const x = 0.5 * (pointers[0].pageX + pointers[1].pageX)
        const y = 0.5 * (pointers[0].pageY + pointers[1].pageY)

        rotateStart.set(x, y)
      }
    }

    function handleTouchStartPan() {
      if (pointers.length === 1) {
        panStart.set(pointers[0].pageX, pointers[0].pageY)
      } else {
        const x = 0.5 * (pointers[0].pageX + pointers[1].pageX)
        const y = 0.5 * (pointers[0].pageY + pointers[1].pageY)

        panStart.set(x, y)
      }
    }

    function handleTouchStartDolly() {
      const dx = pointers[0].pageX - pointers[1].pageX
      const dy = pointers[0].pageY - pointers[1].pageY

      const distance = Math.sqrt(dx * dx + dy * dy)

      dollyStart.set(0, distance)
    }

    function handleTouchStartDollyPan() {
      if (scope.enableZoom) handleTouchStartDolly()

      if (scope.enablePan) handleTouchStartPan()
    }

    function handleTouchStartDollyRotate() {
      if (scope.enableZoom) handleTouchStartDolly()

      if (scope.enableRotate) handleTouchStartRotate()
    }

    function handleTouchMoveRotate(event) {
      if (pointers.length == 1) {
        rotateEnd.set(event.pageX, event.pageY)
      } else {
        const position = getSecondPointerPosition(event)

        const x = 0.5 * (event.pageX + position.x)
        const y = 0.5 * (event.pageY + position.y)

        rotateEnd.set(x, y)
      }

      rotateDelta
        .subVectors(rotateEnd, rotateStart)
        .multiplyScalar(scope.rotateSpeed)

      const element = scope.domElement

      rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight) // yes, height

      rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight)

      rotateStart.copy(rotateEnd)
    }

    function handleTouchMovePan(event) {
      if (pointers.length === 1) {
        panEnd.set(event.pageX, event.pageY)
      } else {
        const position = getSecondPointerPosition(event)

        const x = 0.5 * (event.pageX + position.x)
        const y = 0.5 * (event.pageY + position.y)

        panEnd.set(x, y)
      }

      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed)

      pan(panDelta.x, panDelta.y)

      panStart.copy(panEnd)
    }

    function handleTouchMoveDolly(event) {
      const position = getSecondPointerPosition(event)

      const dx = event.pageX - position.x
      const dy = event.pageY - position.y

      const distance = Math.sqrt(dx * dx + dy * dy)

      dollyEnd.set(0, distance)

      dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed))

      dollyOut(dollyDelta.y)

      dollyStart.copy(dollyEnd)
    }

    function handleTouchMoveDollyPan(event) {
      if (scope.enableZoom) handleTouchMoveDolly(event)

      if (scope.enablePan) handleTouchMovePan(event)
    }

    function handleTouchMoveDollyRotate(event) {
      if (scope.enableZoom) handleTouchMoveDolly(event)

      if (scope.enableRotate) handleTouchMoveRotate(event)
    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    function onPointerDown(event) {
      if (scope.enabled === false) return

      if (pointers.length === 0) {
        scope.domElement.setPointerCapture(event.pointerId)

        scope.domElement.addEventListener('pointermove', onPointerMove)
        scope.domElement.addEventListener('pointerup', onPointerUp)
      }

      //

      addPointer(event)

      if (event.pointerType === 'touch') {
        onTouchStart(event)
      } else {
        onMouseDown(event)
      }
    }

    function onPointerMove(event) {
      if (scope.enabled === false) return

      if (event.pointerType === 'touch') {
        onTouchMove(event)
      } else {
        onMouseMove(event)
      }
    }

    function onPointerUp(event) {
      removePointer(event)

      if (pointers.length === 0) {
        scope.domElement.releasePointerCapture(event.pointerId)

        scope.domElement.removeEventListener('pointermove', onPointerMove)
        scope.domElement.removeEventListener('pointerup', onPointerUp)
      }

      scope.dispatchEvent(_endEvent)

      state = STATE.NONE
    }

    function onMouseDown(event) {
      let mouseAction

      switch (event.button) {
        case 0:
          mouseAction = scope.mouseButtons.LEFT
          break

        case 1:
          mouseAction = scope.mouseButtons.MIDDLE
          break

        case 2:
          mouseAction = scope.mouseButtons.RIGHT
          break

        default:
          mouseAction = -1
      }

      switch (mouseAction) {
        case MOUSE.DOLLY:
          if (scope.enableZoom === false) return

          handleMouseDownDolly(event)

          state = STATE.DOLLY

          break

        case MOUSE.ROTATE:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enablePan === false) return

            handleMouseDownPan(event)

            state = STATE.PAN
          } else {
            if (scope.enableRotate === false) return

            handleMouseDownRotate(event)

            state = STATE.ROTATE
          }

          break

        case MOUSE.PAN:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enableRotate === false) return

            handleMouseDownRotate(event)

            state = STATE.ROTATE
          } else {
            if (scope.enablePan === false) return

            handleMouseDownPan(event)

            state = STATE.PAN
          }

          break

        default:
          state = STATE.NONE
      }

      if (state !== STATE.NONE) {
        scope.dispatchEvent(_startEvent)
      }
    }

    function onMouseMove(event) {
      switch (state) {
        case STATE.ROTATE:
          if (scope.enableRotate === false) return

          handleMouseMoveRotate(event)

          break

        case STATE.DOLLY:
          if (scope.enableZoom === false) return

          handleMouseMoveDolly(event)

          break

        case STATE.PAN:
          if (scope.enablePan === false) return

          handleMouseMovePan(event)

          break
      }
    }

    function onMouseWheel(event) {
      if (
        scope.enabled === false ||
        scope.enableZoom === false ||
        state !== STATE.NONE
      )
        return

      event.preventDefault()

      scope.dispatchEvent(_startEvent)

      handleMouseWheel(event)

      scope.dispatchEvent(_endEvent)
    }

    function onKeyDown(event) {
      if (scope.enabled === false || scope.enablePan === false) return

      handleKeyDown(event)
    }

    function onTouchStart(event) {
      trackPointer(event)

      switch (pointers.length) {
        case 1:
          switch (scope.touches.ONE) {
            case TOUCH.ROTATE:
              if (scope.enableRotate === false) return

              handleTouchStartRotate()

              state = STATE.TOUCH_ROTATE

              break

            case TOUCH.PAN:
              if (scope.enablePan === false) return

              handleTouchStartPan()

              state = STATE.TOUCH_PAN

              break

            default:
              state = STATE.NONE
          }

          break

        case 2:
          switch (scope.touches.TWO) {
            case TOUCH.DOLLY_PAN:
              if (scope.enableZoom === false && scope.enablePan === false)
                return

              handleTouchStartDollyPan()

              state = STATE.TOUCH_DOLLY_PAN

              break

            case TOUCH.DOLLY_ROTATE:
              if (scope.enableZoom === false && scope.enableRotate === false)
                return

              handleTouchStartDollyRotate()

              state = STATE.TOUCH_DOLLY_ROTATE

              break

            default:
              state = STATE.NONE
          }

          break

        default:
          state = STATE.NONE
      }

      if (state !== STATE.NONE) {
        scope.dispatchEvent(_startEvent)
      }
    }

    function onTouchMove(event) {
      trackPointer(event)

      switch (state) {
        case STATE.TOUCH_ROTATE:
          if (scope.enableRotate === false) return

          handleTouchMoveRotate(event)

          scope.update()

          break

        case STATE.TOUCH_PAN:
          if (scope.enablePan === false) return

          handleTouchMovePan(event)

          scope.update()

          break

        case STATE.TOUCH_DOLLY_PAN:
          if (scope.enableZoom === false && scope.enablePan === false) return

          handleTouchMoveDollyPan(event)

          scope.update()

          break

        case STATE.TOUCH_DOLLY_ROTATE:
          if (scope.enableZoom === false && scope.enableRotate === false) return

          handleTouchMoveDollyRotate(event)

          scope.update()

          break

        default:
          state = STATE.NONE
      }
    }

    function onContextMenu(event) {
      if (scope.enabled === false) return

      event.preventDefault()
    }

    function addPointer(event) {
      pointers.push(event)
    }

    function removePointer(event) {
      delete pointerPositions[event.pointerId]

      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i].pointerId == event.pointerId) {
          pointers.splice(i, 1)
          return
        }
      }
    }

    function trackPointer(event) {
      let position = pointerPositions[event.pointerId]

      if (position === undefined) {
        position = new Vector2()
        pointerPositions[event.pointerId] = position
      }

      position.set(event.pageX, event.pageY)
    }

    function getSecondPointerPosition(event) {
      const pointer =
        event.pointerId === pointers[0].pointerId ? pointers[1] : pointers[0]

      return pointerPositions[pointer.pointerId]
    }

    //

    scope.domElement.addEventListener('contextmenu', onContextMenu)

    scope.domElement.addEventListener('pointerdown', onPointerDown)
    scope.domElement.addEventListener('pointercancel', onPointerUp)
    scope.domElement.addEventListener('wheel', onMouseWheel, { passive: false })

    // force an update at start

    this.update()
  }
}

class LoadingSpinner {
  constructor(message) {
    this.message = message || 'Loading...'

    this.spinnerDivContainer = document.createElement('div')
    this.spinnerDiv = document.createElement('div')
    this.messageDiv = document.createElement('div')
    this.spinnerDivContainer.className = 'loaderContainer'
    this.spinnerDiv.className = 'loader'
    this.spinnerDivContainer.style.display = 'none'
    this.messageDiv.className = 'message'
    this.messageDiv.innerHTML = this.message
    this.spinnerDivContainer.appendChild(this.spinnerDiv)
    this.spinnerDivContainer.appendChild(this.messageDiv)
    document.body.appendChild(this.spinnerDivContainer)

    const style = document.createElement('style')
    style.innerHTML = `

            .message {
                font-family: arial;
                font-size: 12pt;
                color: #ffffff;
                text-align: center;
                padding-top:15px;
            }

            .loaderContainer {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-60px, -60px);
                width: 120px;
            }

            .loader {
                width: 120px;        /* the size */
                padding: 15px;       /* the border thickness */
                background: #07e8d6; /* the color */
                z-index:99999;
            
                aspect-ratio: 1;
                border-radius: 50%;
                --_m: 
                    conic-gradient(#0000,#000),
                    linear-gradient(#000 0 0) content-box;
                -webkit-mask: var(--_m);
                    mask: var(--_m);
                -webkit-mask-composite: source-out;
                    mask-composite: subtract;
                box-sizing: border-box;
                animation: load 1s linear infinite;
            }
            
            @keyframes load {
                to{transform: rotate(1turn)}
            }

        `
    document.getElementsByTagName('head')[0].appendChild(style)
  }

  show() {
    this.spinnerDivContainer.style.display = 'block'
  }

  hide() {
    this.spinnerDivContainer.style.display = 'none'
  }
}

let idGen = 0

class OctreeNode {
  constructor(min, max, depth, id) {
    this.min = new THREE.Vector3().copy(min)
    this.max = new THREE.Vector3().copy(max)
    this.center = new THREE.Vector3()
      .copy(this.max)
      .sub(this.min)
      .multiplyScalar(0.5)
      .add(this.min)
    this.depth = depth
    this.children = []
    this.data = null
    this.id = id || idGen++
  }
}

class Octree {
  constructor(maxDepth, maxPositionsPerNode) {
    this.maxDepth = maxDepth
    this.maxPositionsPerNode = maxPositionsPerNode
    this.sceneDimensions = new THREE.Vector3()
    this.sceneMin = new THREE.Vector3()
    this.sceneMax = new THREE.Vector3()
    this.rootNode = null
    this.addedIndexes = {}
    this.nodesWithIndexes = []
  }

  processScene(splatBuffer) {
    this.nodesWithIndexes = []
    const vertexCount = splatBuffer.getVertexCount()

    const position = new THREE.Vector3()
    for (let i = 0; i < vertexCount; i++) {
      splatBuffer.getPosition(i, position)
      if (i === 0 || position.x < this.sceneMin.x) this.sceneMin.x = position.x
      if (i === 0 || position.x > this.sceneMax.x) this.sceneMax.x = position.x
      if (i === 0 || position.y < this.sceneMin.y) this.sceneMin.y = position.y
      if (i === 0 || position.y > this.sceneMax.y) this.sceneMax.y = position.y
      if (i === 0 || position.z < this.sceneMin.z) this.sceneMin.z = position.z
      if (i === 0 || position.z > this.sceneMax.z) this.sceneMax.z = position.z
    }

    this.sceneDimensions.copy(this.sceneMin).sub(this.sceneMin)

    const indexes = []
    for (let i = 0; i < vertexCount; i++) indexes.push(i)
    this.rootNode = new OctreeNode(this.sceneMin, this.sceneMax, 0)
    this.rootNode.data = {
      indexes: indexes,
    }
    this.processNode(this.rootNode, splatBuffer)
  }

  processNode(node, splatBuffer) {
    const vertexCount = node.data.indexes.length

    if (vertexCount < this.maxPositionsPerNode || node.depth > this.maxDepth) {
      for (let i = 0; i < node.data.indexes.length; i++) {
        if (this.addedIndexes[node.data.indexes[i]]) {
          node.data.indexes.splice(i, 1)
        } else {
          this.addedIndexes[node.data.indexes[i]] = true
        }
      }
      this.nodesWithIndexes.push(node)
      return
    }

    const nodeDimensions = new THREE.Vector3().copy(node.max).sub(node.min)
    const halfDimensions = new THREE.Vector3()
      .copy(nodeDimensions)
      .multiplyScalar(0.5)

    const nodeCenter = new THREE.Vector3().copy(node.min).add(halfDimensions)

    const childrenBounds = [
      // top section, clockwise from upper-left (looking from above, +Y)
      new THREE.Box3(
        new THREE.Vector3(
          nodeCenter.x - halfDimensions.x,
          nodeCenter.y,
          nodeCenter.z - halfDimensions.z
        ),
        new THREE.Vector3(
          nodeCenter.x,
          nodeCenter.y + halfDimensions.y,
          nodeCenter.z
        )
      ),
      new THREE.Box3(
        new THREE.Vector3(
          nodeCenter.x,
          nodeCenter.y,
          nodeCenter.z - halfDimensions.z
        ),
        new THREE.Vector3(
          nodeCenter.x + halfDimensions.x,
          nodeCenter.y + halfDimensions.y,
          nodeCenter.z
        )
      ),
      new THREE.Box3(
        new THREE.Vector3(nodeCenter.x, nodeCenter.y, nodeCenter.z),
        new THREE.Vector3(
          nodeCenter.x + halfDimensions.x,
          nodeCenter.y + halfDimensions.y,
          nodeCenter.z + halfDimensions.z
        )
      ),
      new THREE.Box3(
        new THREE.Vector3(
          nodeCenter.x - halfDimensions.x,
          nodeCenter.y,
          nodeCenter.z
        ),
        new THREE.Vector3(
          nodeCenter.x,
          nodeCenter.y + halfDimensions.y,
          nodeCenter.z + halfDimensions.z
        )
      ),

      // bottom section, clockwise from lower-left (looking from above, +Y)
      new THREE.Box3(
        new THREE.Vector3(
          nodeCenter.x - halfDimensions.x,
          nodeCenter.y - halfDimensions.y,
          nodeCenter.z - halfDimensions.z
        ),
        new THREE.Vector3(nodeCenter.x, nodeCenter.y, nodeCenter.z)
      ),
      new THREE.Box3(
        new THREE.Vector3(
          nodeCenter.x,
          nodeCenter.y - halfDimensions.y,
          nodeCenter.z - halfDimensions.z
        ),
        new THREE.Vector3(
          nodeCenter.x + halfDimensions.x,
          nodeCenter.y,
          nodeCenter.z
        )
      ),
      new THREE.Box3(
        new THREE.Vector3(
          nodeCenter.x,
          nodeCenter.y - halfDimensions.y,
          nodeCenter.z
        ),
        new THREE.Vector3(
          nodeCenter.x + halfDimensions.x,
          nodeCenter.y,
          nodeCenter.z + halfDimensions.z
        )
      ),
      new THREE.Box3(
        new THREE.Vector3(
          nodeCenter.x - halfDimensions.x,
          nodeCenter.y - halfDimensions.y,
          nodeCenter.z
        ),
        new THREE.Vector3(
          nodeCenter.x,
          nodeCenter.y,
          nodeCenter.z + halfDimensions.z
        )
      ),
    ]

    const vertexCounts = []
    const baseIndexes = []
    for (let i = 0; i < childrenBounds.length; i++) {
      vertexCounts[i] = 0
      baseIndexes[i] = []
    }

    const position = new THREE.Vector3()
    for (let i = 0; i < vertexCount; i++) {
      const splatIndex = node.data.indexes[i]
      splatBuffer.getPosition(splatIndex, position)
      for (let j = 0; j < childrenBounds.length; j++) {
        if (childrenBounds[j].containsPoint(position)) {
          vertexCounts[j]++
          baseIndexes[j].push(splatIndex)
        }
      }
    }

    for (let i = 0; i < childrenBounds.length; i++) {
      const childNode = new OctreeNode(
        childrenBounds[i].min,
        childrenBounds[i].max,
        node.depth + 1
      )
      childNode.data = {
        indexes: baseIndexes[i],
      }
      node.children.push(childNode)
    }

    node.data = {}
    for (let child of node.children) {
      this.processNode(child, splatBuffer)
    }
  }

  countLeaves() {
    let leafCount = 0
    this.visitLeaves(() => {
      leafCount++
    })

    return leafCount
  }

  visitLeaves(visitFunc) {
    const visitLeavesFromNode = (node, visitFunc) => {
      if (node.children.length === 0) visitFunc(node)
      for (let child of node.children) {
        visitLeavesFromNode(child, visitFunc)
      }
    }

    return visitLeavesFromNode(this.rootNode, visitFunc)
  }
}

var SorterWasm =
  'AGFzbQEAAAAADAZkeWxpbmsAAAAAAAEXA2AAAGAMf39/f399fX1/f39/AGAAAX8CEgEDZW52Bm1lbW9yeQIDAICABAMEAwABAgc5AxFfX3dhc21fY2FsbF9jdG9ycwAAC3NvcnRJbmRleGVzAAETZW1zY3JpcHRlbl90bHNfaW5pdAACCoEEAwMAAQv1AwEEfwJAIAkEQEH4////ByEOQYiAgIB4IQwDQCACIA9BAnQiDWogASAAIA1qKAIAQQxsaiINKAIEIAMoAhhsIA0oAgAgAygCCGxqIA0oAgggAygCKGxqIg02AgAgDSAOIA0gDkgbIQ4gDSAMIAwgDUgbIQwgD0EBaiIPIAlHDQALIAIgC0ECdGohAyAIsyAMsiAOspOVIQUgCUUNAUEAIQEDQCADAn8gBSACIAFBAnRqKAIAIA5rspQiBotDAAAAT10EQCAGqAwBC0GAgICAeAtBAnRqIgwgDCgCAEEBajYCACABQQFqIgEgCUcNAAsMAQsgAiALQQJ0aiEDIAizQwAAgK+UIQVB+P///wchDgsgCEECTwRAIAMoAgAhDEEBIQEDQCACIAEgC2pBAnRqIgMgAygCACAMaiIMNgIAIAFBAWoiASAIRw0ACwsgCSAKQQFrIgFMBEADQCAEIAFBAnQiA2ogACADaigCADYCACABQQFrIgEgCU4NAAsLIAlBAEoEQANAIAQgAgJ/IAUgAiAJQQFrIgFBAnQiCGooAgAgDmuylCIGi0MAAABPXQRAIAaoDAELQYCAgIB4CyALakECdGoiAygCAEEBayIKQQJ0aiAAIAhqKAIANgIAIAMgCjYCACAJQQFKIQMgASEJIAMNAAsLCwQAQQAL'

class Constants {
  static DepthMapRange = 1 << 16
  static MemoryPageSize = 65536
  static BytesPerFloat = 4
  static BytesPerInt = 4
}

function sortWorker(self) {
  let wasmInstance
  let vertexCount
  let indexesOffset
  let positionsOffset
  let viewProjOffset
  let indexesOutOffset
  let sortBuffersOffset
  let wasmMemory
  let positions
  let countsZero

  let Constants

  function sort(vertexSortCount, vertexRenderCount, viewProj, cameraPosition) {
    // console.time('WASM SORT');
    if (!countsZero) countsZero = new Uint32Array(Constants.DepthMapRange)
    const viewProjArray = new Int32Array(wasmMemory, viewProjOffset, 16)
    for (let i = 0; i < 16; i++) {
      viewProjArray[i] = Math.round(viewProj[i] * 1000.0)
    }
    const frequencies = new Uint32Array(
      wasmMemory,
      sortBuffersOffset + vertexCount * 4,
      Constants.DepthMapRange
    )
    frequencies.set(countsZero)
    wasmInstance.exports.sortIndexes(
      indexesOffset,
      positionsOffset,
      sortBuffersOffset,
      viewProjOffset,
      indexesOutOffset,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      Constants.DepthMapRange,
      vertexSortCount,
      vertexRenderCount,
      vertexCount
    )

    // console.timeEnd('WASM SORT');

    self.postMessage({
      sortDone: true,
      vertexSortCount: vertexSortCount,
      vertexRenderCount: vertexRenderCount,
    })
  }

  self.onmessage = (e) => {
    if (e.data.positions) {
      positions = e.data.positions
      const floatPositions = new Float32Array(positions)
      const intPositions = new Int32Array(vertexCount * 3)
      for (let i = 0; i < vertexCount * 3; i++) {
        intPositions[i] = Math.round(floatPositions[i] * 1000.0)
      }
      new Int32Array(wasmMemory, positionsOffset, vertexCount * 3).set(
        intPositions
      )
      self.postMessage({
        sortSetupComplete: true,
      })
    } else if (e.data.sort) {
      const renderCount = e.data.sort.vertexRenderCount || 0
      const sortCount = e.data.sort.vertexSortCount || 0
      sort(
        sortCount,
        renderCount,
        e.data.sort.view,
        e.data.sort.cameraPosition,
        e.data.sort.inIndexBuffer
      )
    } else if (e.data.init) {
      // Yep, this is super hacky and gross :(
      Constants = e.data.init.Constants

      vertexCount = e.data.init.vertexCount

      const INDEXES_BYTES_PER_ENTRY = Constants.BytesPerInt
      const POSITIONS_BYTES_PER_ENTRY = Constants.BytesPerFloat * 3

      const sorterWasmBytes = new Uint8Array(e.data.init.sorterWasmBytes)
      const memoryBytesPerVertex =
        INDEXES_BYTES_PER_ENTRY + POSITIONS_BYTES_PER_ENTRY
      const memoryRequiredForVertices = vertexCount * memoryBytesPerVertex
      const memoryRequiredForSortBuffers =
        vertexCount * Constants.BytesPerInt * 2 +
        Constants.DepthMapRange * Constants.BytesPerInt * 2
      const extraMemory = Constants.MemoryPageSize * 32
      const totalRequiredMemory =
        memoryRequiredForVertices + memoryRequiredForSortBuffers + extraMemory
      const totalPagesRequired =
        Math.floor(totalRequiredMemory / Constants.MemoryPageSize) + 1
      const sorterWasmImport = {
        module: {},
        env: {
          memory: new WebAssembly.Memory({
            initial: totalPagesRequired * 2,
            maximum: totalPagesRequired * 3,
            shared: true,
          }),
        },
      }
      WebAssembly.compile(sorterWasmBytes)
        .then((wasmModule) => {
          return WebAssembly.instantiate(wasmModule, sorterWasmImport)
        })
        .then((instance) => {
          wasmInstance = instance
          indexesOffset = 0
          positionsOffset = vertexCount * INDEXES_BYTES_PER_ENTRY
          viewProjOffset =
            positionsOffset + vertexCount * POSITIONS_BYTES_PER_ENTRY
          sortBuffersOffset = viewProjOffset + 16 * Constants.BytesPerFloat
          indexesOutOffset =
            sortBuffersOffset +
            vertexCount * Constants.BytesPerInt +
            Constants.DepthMapRange * Constants.BytesPerInt * 2
          wasmMemory = sorterWasmImport.env.memory.buffer
          self.postMessage({
            sortSetupPhase1Complete: true,
            inIndexBuffer: wasmMemory,
            inIndexOffset: 0,
            outIndexBuffer: wasmMemory,
            outIndexOffset: indexesOutOffset,
          })
        })
    }
  }
}

function createSortWorker(vertexCount, splatBufferRowBytes) {
  const worker = new Worker(
    URL.createObjectURL(
      new Blob(['(', sortWorker.toString(), ')(self)'], {
        type: 'application/javascript',
      })
    )
  )

  const sorterWasmBinaryString = atob(SorterWasm)
  const sorterWasmBytes = new Uint8Array(sorterWasmBinaryString.length)
  for (let i = 0; i < sorterWasmBinaryString.length; i++) {
    sorterWasmBytes[i] = sorterWasmBinaryString.charCodeAt(i)
  }

  worker.postMessage({
    init: {
      sorterWasmBytes: sorterWasmBytes.buffer,
      vertexCount: vertexCount,
      splatBufferRowBytes: splatBufferRowBytes,
      // Super hacky
      Constants: {
        BytesPerFloat: Constants.BytesPerFloat,
        BytesPerInt: Constants.BytesPerInt,
        DepthMapRange: Constants.DepthMapRange,
        MemoryPageSize: Constants.MemoryPageSize,
      },
    },
  })
  return worker
}

const DEFAULT_CAMERA_SPECS = {
  fx: 1159.5880733038064,
  fy: 1164.6601287484507,
  near: 0.1,
  far: 500,
}

const CENTER_COVARIANCE_DATA_TEXTURE_WIDTH = 4096
const CENTER_COVARIANCE_DATA_TEXTURE_HEIGHT = 4096

const COLOR_DATA_TEXTURE_WIDTH = 4096
const COLOR_DATA_TEXTURE_HEIGHT = 2048

class Viewer {
  constructor(
    /**
     * The root element to attach the Viewer canvas to.
     * @type {HTMLElement}
     */
    rootElement = null,
    cameraUp = [0, 1, 0],
    initialCameraPos = [0, 10, 15],
    initialCameraLookAt = [0, 0, 0],
    splatAlphaRemovalThreshold = 0,
    cameraSpecs = DEFAULT_CAMERA_SPECS,
    controls = null,
    selfDrivenMode = true
  ) {
    this.rootElement = rootElement
    this.cameraUp = new THREE.Vector3().fromArray(cameraUp)
    this.initialCameraPos = new THREE.Vector3().fromArray(initialCameraPos)
    this.initialCameraLookAt = new THREE.Vector3().fromArray(
      initialCameraLookAt
    )
    this.cameraSpecs = cameraSpecs
    this.splatAlphaRemovalThreshold = splatAlphaRemovalThreshold
    this.controls = controls
    this.selfDrivenMode = selfDrivenMode
    this.scene = null
    this.camera = null
    this.realProjectionMatrix = new THREE.Matrix4()
    this.renderer = null
    this.selfDrivenUpdateFunc = this.update.bind(this)
    this.resizeFunc = this.onResize.bind(this)

    this.sortWorker = null
    this.vertexRenderCount = 0
    this.vertexSortCount = 0

    this.inIndexArray = null

    this.splatBuffer = null
    this.splatMesh = null

    this.octree = null
    this.octreeNodeMap = {}

    this.sortRunning = false
  }

  getRenderDimensions(outDimensions) {
    outDimensions.x = this.rootElement.offsetWidth
    outDimensions.y = this.rootElement.offsetHeight
  }

  updateRealProjectionMatrix(renderDimensions) {
    this.realProjectionMatrix.elements = [
      [(2 * this.cameraSpecs.fx) / renderDimensions.x, 0, 0, 0],
      [0, (2 * this.cameraSpecs.fy) / renderDimensions.y, 0, 0],
      [
        0,
        0,
        -(this.cameraSpecs.far + this.cameraSpecs.near) /
          (this.cameraSpecs.far - this.cameraSpecs.near),
        -1,
      ],
      [
        0,
        0,
        -(2.0 * this.cameraSpecs.far * this.cameraSpecs.near) /
          (this.cameraSpecs.far - this.cameraSpecs.near),
        0,
      ],
    ].flat()
  }
  onResize = (function () {
    const renderDimensions = new THREE.Vector2()

    return function () {
      this.renderer.setSize(1, 1)
      this.getRenderDimensions(renderDimensions)
      this.camera.aspect = renderDimensions.x / renderDimensions.y
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(renderDimensions.x, renderDimensions.y)
      this.updateRealProjectionMatrix(renderDimensions)
      this.updateSplatMeshUniforms()
    }
  })()

  init() {
    if (!this.rootElement) {
      this.rootElement = document.createElement('div')
      this.rootElement.style.width = '100%'
      this.rootElement.style.height = '100%'
      document.body.appendChild(this.rootElement)
    }

    const renderDimensions = new THREE.Vector2()
    this.getRenderDimensions(renderDimensions)

    this.camera = new THREE.PerspectiveCamera(
      70,
      renderDimensions.x / renderDimensions.y,
      0.1,
      500
    )
    this.camera.position.copy(this.initialCameraPos)
    this.camera.lookAt(this.initialCameraLookAt)
    this.camera.up.copy(this.cameraUp).normalize()
    this.updateRealProjectionMatrix(renderDimensions)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setSize(renderDimensions.x, renderDimensions.y)

    if (!this.controls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.rotateSpeed = 0.5
      this.controls.maxPolarAngle = (0.9 * Math.PI) / 2
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.15
      this.controls.target.copy(this.initialCameraLookAt)
    }

    window.addEventListener('resize', this.resizeFunc, false)

    this.rootElement.appendChild(this.renderer.domElement)
  }

  updateSplatMeshAttributes(colors, centerCovariances, vertexCount) {
    const ELEMENTS_PER_TEXEL = 4

    const geometry = this.splatMesh.geometry

    const paddedCenterCovariances = new Float32Array(
      CENTER_COVARIANCE_DATA_TEXTURE_WIDTH *
        CENTER_COVARIANCE_DATA_TEXTURE_HEIGHT *
        ELEMENTS_PER_TEXEL
    )
    for (let c = 0; c < vertexCount; c++) {
      let destOffset = c * 12
      let srcOffset = c * 9
      for (let i = 0; i < 9; i++) {
        paddedCenterCovariances[destOffset + i] =
          centerCovariances[srcOffset + i]
      }
    }
    const centerCovarianceTexture = new THREE.DataTexture(
      paddedCenterCovariances,
      CENTER_COVARIANCE_DATA_TEXTURE_WIDTH,
      CENTER_COVARIANCE_DATA_TEXTURE_HEIGHT,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    centerCovarianceTexture.needsUpdate = true
    this.splatMesh.material.uniforms.centerCovarianceTexture.value =
      centerCovarianceTexture

    const paddedColors = new Float32Array(
      COLOR_DATA_TEXTURE_WIDTH * COLOR_DATA_TEXTURE_HEIGHT * ELEMENTS_PER_TEXEL
    )
    paddedColors.set(colors)
    const colorTexture = new THREE.DataTexture(
      paddedColors,
      COLOR_DATA_TEXTURE_WIDTH,
      COLOR_DATA_TEXTURE_HEIGHT,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    colorTexture.needsUpdate = true
    this.splatMesh.material.uniforms.colorTexture.value = colorTexture

    geometry.instanceCount = vertexCount
  }

  updateSplatMeshIndexes(indexes, renderVertexCount) {
    const geometry = this.splatMesh.geometry

    geometry.attributes.splatIndex.set(indexes)
    geometry.attributes.splatIndex.needsUpdate = true

    geometry.instanceCount = renderVertexCount
  }

  updateSplatMeshUniforms = (function () {
    const renderDimensions = new THREE.Vector2()

    return function () {
      const vertexCount = this.splatBuffer.getVertexCount()
      if (vertexCount > 0) {
        this.getRenderDimensions(renderDimensions)
        this.splatMesh.material.uniforms.realProjectionMatrix.value.copy(
          this.realProjectionMatrix
        )
        this.splatMesh.material.uniforms.focal.value.set(
          this.cameraSpecs.fx,
          this.cameraSpecs.fy
        )
        this.splatMesh.material.uniforms.viewport.value.set(
          renderDimensions.x,
          renderDimensions.y
        )
        this.splatMesh.material.uniformsNeedUpdate = true
      }
    }
  })()

  loadFile(fileName) {
    const loadingSpinner = new LoadingSpinner()
    loadingSpinner.show()
    return new Promise((resolve, reject) => {
      let fileLoadPromise
      if (fileName.endsWith('.splat')) {
        fileLoadPromise = new SplatLoader().loadFromFile(fileName)
      } else if (fileName.endsWith('.ply')) {
        fileLoadPromise = new PlyLoader().loadFromFile(fileName)
      } else {
        reject(
          new Error(
            `Viewer::loadFile -> File format not supported: ${fileName}`
          )
        )
      }
      fileLoadPromise
        .then((splatBuffer) => {
          this.splatBuffer = splatBuffer

          this.splatBuffer.optimize(this.splatAlphaRemovalThreshold)
          const vertexCount = this.splatBuffer.getVertexCount()
          console.log(`Splat count: ${vertexCount}`)

          this.splatBuffer.buildPreComputedBuffers()
          this.splatMesh = this.buildMesh(this.splatBuffer)
          this.splatMesh.frustumCulled = false
          this.splatMesh.renderOrder = 10
          this.scene.add(this.splatMesh)
          this.updateSplatMeshUniforms()

          this.octree = new Octree(8, 5000)
          console.time('Octree build')
          this.octree.processScene(splatBuffer)
          console.timeEnd('Octree build')

          let leavesWithVertices = 0
          let avgVertexCount = 0
          let maxVertexCount = 0
          let nodeCount = 0

          this.octree.visitLeaves((node) => {
            const vertexCount = node.data.indexes.length
            if (vertexCount > 0) {
              this.octreeNodeMap[node.id] = node
              avgVertexCount += vertexCount
              maxVertexCount = Math.max(maxVertexCount, vertexCount)
              nodeCount++
              leavesWithVertices++
            }
          })
          console.log(`Octree leaves: ${this.octree.countLeaves()}`)
          console.log(`Octree leaves with vertices:${leavesWithVertices}`)
          avgVertexCount /= nodeCount
          console.log(`Avg vertex count per node: ${avgVertexCount}`)

          this.vertexRenderCount = vertexCount
          loadingSpinner.hide()

          this.sortWorker = createSortWorker(
            vertexCount,
            SplatBuffer.RowSizeBytes
          )
          this.sortWorker.onmessage = (e) => {
            if (e.data.sortDone) {
              this.sortRunning = false
              this.updateSplatMeshIndexes(
                this.outIndexArray,
                e.data.vertexRenderCount
              )
            } else if (e.data.sortCanceled) {
              this.sortRunning = false
            } else if (e.data.sortSetupPhase1Complete) {
              console.log('Sorting web worker WASM setup complete.')
              const workerTransferPositionArray = new Float32Array(
                vertexCount * SplatBuffer.PositionComponentCount
              )
              this.splatBuffer.fillPositionArray(workerTransferPositionArray)
              this.sortWorker.postMessage({
                positions: workerTransferPositionArray.buffer,
              })
              this.outIndexArray = new Uint32Array(
                e.data.outIndexBuffer,
                e.data.outIndexOffset,
                this.splatBuffer.getVertexCount()
              )
              this.inIndexArray = new Uint32Array(
                e.data.inIndexBuffer,
                e.data.inIndexOffset,
                this.splatBuffer.getVertexCount()
              )
              for (let i = 0; i < vertexCount; i++) this.inIndexArray[i] = i
            } else if (e.data.sortSetupComplete) {
              console.log('Sorting web worker ready.')
              const attributeData = this.getAttributeDataFromSplatBuffer(
                this.splatBuffer
              )
              this.updateSplatMeshIndexes(
                this.outIndexArray,
                this.splatBuffer.getVertexCount()
              )
              this.updateSplatMeshAttributes(
                attributeData.colors,
                attributeData.centerCovariances,
                this.splatBuffer.getVertexCount()
              )
              this.updateView(true, true)
              resolve()
            }
          }
        })
        .catch((e) => {
          reject(
            new Error(`Viewer::loadFile -> Could not load file ${fileName}`)
          )
        })
    })
  }

  addDebugMeshesToScene(renderOrder) {
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)

    const debugMeshRoot = new THREE.Object3D()
    this.scene.add(debugMeshRoot)

    let sphereMesh = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    sphereMesh.renderOrder = renderOrder
    debugMeshRoot.add(sphereMesh)
    sphereMesh.position.set(-50, 0, 0)

    sphereMesh = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    sphereMesh.renderOrder = renderOrder
    debugMeshRoot.add(sphereMesh)
    sphereMesh.position.set(50, 0, 0)

    sphereMesh = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    sphereMesh.renderOrder = renderOrder
    debugMeshRoot.add(sphereMesh)
    sphereMesh.position.set(0, 0, -50)

    sphereMesh = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    sphereMesh.renderOrder = renderOrder
    debugMeshRoot.add(sphereMesh)
    sphereMesh.position.set(0, 0, 50)

    return debugMeshRoot
  }

  gatherSceneNodes = (function () {
    const nodeRenderList = []
    const tempVectorYZ = new THREE.Vector3()
    const tempVectorXZ = new THREE.Vector3()
    const tempVector = new THREE.Vector3()
    const tempMatrix4 = new THREE.Matrix4()
    const renderDimensions = new THREE.Vector3()

    const tempMax = new THREE.Vector3()
    const nodeSize = (node) => {
      return tempMax.copy(node.max).sub(node.min).length()
    }

    const MaximumDistanceToSort = 125

    return function (gatherAllNodes) {
      this.getRenderDimensions(renderDimensions)
      const fovXOver2 = Math.atan(
        renderDimensions.x / (2.0 * this.cameraSpecs.fx)
      )
      const fovYOver2 = Math.atan(
        renderDimensions.y / (2.0 * this.cameraSpecs.fy)
      )
      const cosFovXOver2 = Math.cos(fovXOver2)
      const cosFovYOver2 = Math.cos(fovYOver2)
      tempMatrix4.copy(this.camera.matrixWorld).invert()

      let nodeRenderCount = 0
      let verticesToCopy = 0
      const nodeCount = this.octree.nodesWithIndexes.length
      for (let i = 0; i < nodeCount; i++) {
        const node = this.octree.nodesWithIndexes[i]
        tempVector.copy(node.center).sub(this.camera.position)
        const distanceToNode = tempVector.length()
        tempVector.normalize()
        tempVector.transformDirection(tempMatrix4)

        tempVectorYZ.copy(tempVector).setX(0).normalize()
        tempVectorXZ.copy(tempVector).setY(0).normalize()
        tempVector.set(0, 0, -1)
        const cameraAngleXZDot = tempVector.dot(tempVectorXZ)
        const cameraAngleYZDot = tempVector.dot(tempVectorYZ)

        const ns = nodeSize(node)
        const outOfFovY = cameraAngleYZDot < cosFovYOver2 - 0.4
        const outOfFovX = cameraAngleXZDot < cosFovXOver2 - 0.4
        if (
          !gatherAllNodes &&
          (outOfFovX || outOfFovY) &&
          distanceToNode > ns
        ) {
          continue
        }
        verticesToCopy += node.data.indexes.length
        nodeRenderList[nodeRenderCount] = node
        node.data.distanceToNode = distanceToNode
        nodeRenderCount++
      }

      nodeRenderList.length = nodeRenderCount
      nodeRenderList.sort((a, b) => {
        if (a.data.distanceToNode > b.data.distanceToNode) return 1
        else return -1
      })

      this.vertexRenderCount = verticesToCopy
      this.vertexSortCount = 0
      let currentByteOffset = 0
      for (let i = 0; i < nodeRenderCount; i++) {
        const node = nodeRenderList[i]
        const shouldSort = node.data.distanceToNode <= MaximumDistanceToSort
        if (shouldSort) {
          this.vertexSortCount += node.data.indexes.length
        }

        const windowSizeInts = node.data.indexes.length
        let destView = new Uint32Array(
          this.inIndexArray.buffer,
          currentByteOffset,
          windowSizeInts
        )
        destView.set(node.data.indexes)
        currentByteOffset += windowSizeInts * Constants.BytesPerInt
      }
    }
  })()

  start() {
    if (this.selfDrivenMode) {
      requestAnimationFrame(this.selfDrivenUpdateFunc)
    } else {
      throw new Error('Cannot start viewer unless it is in self driven mode.')
    }
  }

  update() {
    if (this.selfDrivenMode) {
      requestAnimationFrame(this.selfDrivenUpdateFunc)
    }
    this.controls.update()
    this.updateView()
    this.renderer.autoClear = false
    this.renderer.render(this.scene, this.camera)
  }

  updateView = (function () {
    const tempMatrix = new THREE.Matrix4()
    const tempVector2 = new THREE.Vector2()
    const cameraPositionArray = []
    const lastSortViewDir = new THREE.Vector3(0, 0, -1)
    const sortViewDir = new THREE.Vector3(0, 0, -1)
    const lastSortViewPos = new THREE.Vector3()
    const sortViewOffset = new THREE.Vector3()

    return function (force = false, gatherAllNodes = false) {
      if (!force) {
        sortViewDir.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
        if (sortViewDir.dot(lastSortViewDir) > 0.95) return
        if (
          sortViewOffset
            .copy(this.camera.position)
            .sub(lastSortViewPos)
            .length() < 1.0
        )
          return
      }

      this.getRenderDimensions(tempVector2)
      tempMatrix.copy(this.camera.matrixWorld).invert()
      tempMatrix.premultiply(this.realProjectionMatrix)
      cameraPositionArray[0] = this.camera.position.x
      cameraPositionArray[1] = this.camera.position.y
      cameraPositionArray[2] = this.camera.position.z

      if (!this.sortRunning) {
        this.gatherSceneNodes(gatherAllNodes)
        this.sortRunning = true
        this.sortWorker.postMessage({
          sort: {
            view: tempMatrix.elements,
            cameraPosition: cameraPositionArray,
            vertexRenderCount: this.vertexRenderCount,
            vertexSortCount: this.vertexSortCount,
            inIndexBuffer: this.inIndexArray.buffer,
          },
        })
        lastSortViewPos.copy(this.camera.position)
        lastSortViewDir.copy(sortViewDir)
      }
    }
  })()

  buildMaterial() {
    const vertexShaderSource = `
            #include <common>
            precision mediump float;

            attribute uint splatIndex;
            attribute vec4 splatColor;
            attribute mat3 splatCenterCovariance;

            uniform sampler2D centerCovarianceTexture;
            uniform sampler2D colorTexture;
            uniform mat4 realProjectionMatrix;
            uniform vec2 focal;
            uniform vec2 viewport;

            uniform vec2 centerCovarianceTextureSize;
            uniform vec2 colorTextureSize;

            varying vec4 vColor;
            varying vec2 vPosition;
            varying vec2 vUv;
            varying vec4 conicOpacity;

            vec2 getDataUV(in int stride, in int offset, in vec2 dimensions) {
                vec2 samplerUV = vec2(0.0, 0.0);
                float covarianceD = float(splatIndex * uint(stride) + uint(offset)) / dimensions.x;
                samplerUV.y = float(floor(covarianceD)) / dimensions.y;
                samplerUV.x = fract(covarianceD);
                return samplerUV;
            }

            void main () {

                vec4 sampledCenterCovarianceA = texture2D(centerCovarianceTexture, getDataUV(3, 0, centerCovarianceTextureSize));
                vec4 sampledCenterCovarianceB = texture2D(centerCovarianceTexture, getDataUV(3, 1, centerCovarianceTextureSize));
                vec4 sampledCenterCovarianceC = texture2D(centerCovarianceTexture, getDataUV(3, 2, centerCovarianceTextureSize));

                vec3 splatCenter = sampledCenterCovarianceA.xyz;
                vec3 cov3D_M11_M12_M13 = vec3(sampledCenterCovarianceA.w, sampledCenterCovarianceB.xy);
                vec3 cov3D_M22_M23_M33 = vec3(sampledCenterCovarianceB.zw, sampledCenterCovarianceC.r);

                vec2 colorUV = vec2(0.0, 0.0);
                float colorD = float(splatIndex * uint(4)) / 4.0 / colorTextureSize.x;
                colorUV.y = float(int(colorD)) / colorTextureSize.y;
                colorUV.x = fract(colorD);
                vec4 sampledColor = texture2D(colorTexture, colorUV);

                vec4 camspace = viewMatrix * vec4(splatCenter, 1);
                vec4 pos2d = realProjectionMatrix * camspace;

                float bounds = 1.2 * pos2d.w;
                if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
                    || pos2d.y < -bounds || pos2d.y > bounds) {
                    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
                    return;
                }
    
                mat3 Vrk = mat3(
                    cov3D_M11_M12_M13.x, cov3D_M11_M12_M13.y, cov3D_M11_M12_M13.z,
                    cov3D_M11_M12_M13.y, cov3D_M22_M23_M33.x, cov3D_M22_M23_M33.y,
                    cov3D_M11_M12_M13.z, cov3D_M22_M23_M33.y, cov3D_M22_M23_M33.z
                );

                mat3 J = mat3(
                    focal.x / camspace.z, 0., -(focal.x * camspace.x) / (camspace.z * camspace.z),
                    0., focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z),
                    0., 0., 0.
                );

                mat3 W = transpose(mat3(viewMatrix));
                mat3 T = W * J;
                mat3 cov2Dm = transpose(T) * Vrk * T;
                cov2Dm[0][0] += 0.3;
                cov2Dm[1][1] += 0.3;
                vec3 cov2Dv = vec3(cov2Dm[0][0], cov2Dm[0][1], cov2Dm[1][1]);


                vec2 vCenter = vec2(pos2d) / pos2d.w;

                float diagonal1 = cov2Dv.x;
                float offDiagonal = cov2Dv.y;
                float diagonal2 = cov2Dv.z;

                float mid = 0.5 * (diagonal1 + diagonal2);
                float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
                float lambda1 = mid + radius;
                float lambda2 = max(mid - radius, 0.1);
                vec2 diagonalVector = normalize(vec2(offDiagonal, lambda1 - diagonal1));
                vec2 v1 = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
                vec2 v2 = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

                vColor = sampledColor;
                vPosition = position.xy;

                vec2 projectedCovariance = vCenter +
                                        position.x * v1 / viewport * 2.0 +
                                        position.y * v2 / viewport * 2.0;

                gl_Position = vec4(projectedCovariance, 0.0, 1.0);

            }`

    const fragmentShaderSource = `
            #include <common>
            precision mediump float;

            uniform vec3 debugColor;

            varying vec4 vColor;
            varying vec2 vPosition;
            varying vec4 conicOpacity;
            varying vec2 vUv;

            vec3 gamma(vec3 value, float param) {
                return vec3(pow(abs(value.r), param),pow(abs(value.g), param),pow(abs(value.b), param));
            }  

            void main () {
                float A = -dot(vPosition, vPosition);
                if (A < -4.0) discard;
                vec3 color = vColor.rgb;
                float B = exp(A) * vColor.a;
                vec3 colorB = B * color.rgb;
                gl_FragColor = vec4(colorB, B);

            }`

    const uniforms = {
      centerCovarianceTexture: {
        type: 't',
        value: null,
      },
      colorTexture: {
        type: 't',
        value: null,
      },
      realProjectionMatrix: {
        type: 'v4v',
        value: new THREE.Matrix4(),
      },
      focal: {
        type: 'v2',
        value: new THREE.Vector2(),
      },
      viewport: {
        type: 'v2',
        value: new THREE.Vector2(),
      },
      debugColor: {
        type: 'v3',
        value: new THREE.Color(),
      },
      centerCovarianceTextureSize: {
        type: 'v2',
        value: new THREE.Vector2(
          CENTER_COVARIANCE_DATA_TEXTURE_WIDTH,
          CENTER_COVARIANCE_DATA_TEXTURE_HEIGHT
        ),
      },
      colorTextureSize: {
        type: 'v2',
        value: new THREE.Vector2(
          COLOR_DATA_TEXTURE_WIDTH,
          COLOR_DATA_TEXTURE_HEIGHT
        ),
      },
    }

    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShaderSource,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      alphaTest: 1.0,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneMinusDstAlphaFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneMinusDstAlphaFactor,
      blendDstAlpha: THREE.OneFactor,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  }

  buildGeomtery(splatBuffer) {
    const vertexCount = splatBuffer.getVertexCount()

    const baseGeometry = new THREE.BufferGeometry()

    const positionsArray = new Float32Array(6 * 3)
    const positions = new THREE.BufferAttribute(positionsArray, 3)
    baseGeometry.setAttribute('position', positions)
    positions.setXYZ(2, -2.0, 2.0, 0.0)
    positions.setXYZ(1, -2.0, -2.0, 0.0)
    positions.setXYZ(0, 2.0, 2.0, 0.0)
    positions.setXYZ(5, -2.0, -2.0, 0.0)
    positions.setXYZ(4, 2.0, -2.0, 0.0)
    positions.setXYZ(3, 2.0, 2.0, 0.0)
    positions.needsUpdate = true

    const geometry = new THREE.InstancedBufferGeometry().copy(baseGeometry)

    const splatIndexArray = new Uint32Array(vertexCount)
    const splatIndexes = new THREE.InstancedBufferAttribute(
      splatIndexArray,
      1,
      false
    )
    splatIndexes.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('splatIndex', splatIndexes)

    const splatColorsArray = new Float32Array(vertexCount * 4)
    const splatColors = new THREE.InstancedBufferAttribute(
      splatColorsArray,
      4,
      false
    )
    splatColors.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('splatColor', splatColors)

    const splatCentersArray = new Float32Array(vertexCount * 9)
    const splatCenters = new THREE.InstancedBufferAttribute(
      splatCentersArray,
      9,
      false
    )
    splatCenters.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('splatCenterCovariance', splatCenters)

    return geometry
  }

  buildMesh(splatBuffer) {
    const geometry = this.buildGeomtery(splatBuffer)
    const material = this.buildMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    return mesh
  }

  getAttributeDataFromSplatBuffer(splatBuffer) {
    const vertexCount = splatBuffer.getVertexCount()

    const splatArray = new Float32Array(splatBuffer.getBufferData())
    const pCovarianceArray = new Float32Array(
      splatBuffer.getPrecomputedCovarianceBufferData()
    )
    const pColorArray = new Float32Array(
      splatBuffer.getPrecomputedColorBufferData()
    )
    const color = new Float32Array(vertexCount * 4)
    const centerCov = new Float32Array(vertexCount * 9)

    for (let i = 0; i < vertexCount; i++) {
      const centerCovBase = 9 * i
      const pCovarianceBase = 6 * i
      const colorBase = 4 * i
      const pcColorBase = 4 * i
      const splatArrayBase = SplatBuffer.RowSizeFloats * i

      centerCov[centerCovBase] = splatArray[splatArrayBase]
      centerCov[centerCovBase + 1] = splatArray[splatArrayBase + 1]
      centerCov[centerCovBase + 2] = splatArray[splatArrayBase + 2]

      color[colorBase] = pColorArray[pcColorBase]
      color[colorBase + 1] = pColorArray[pcColorBase + 1]
      color[colorBase + 2] = pColorArray[pcColorBase + 2]
      color[colorBase + 3] = pColorArray[pcColorBase + 3]

      centerCov[centerCovBase + 3] = pCovarianceArray[pCovarianceBase]
      centerCov[centerCovBase + 4] = pCovarianceArray[pCovarianceBase + 1]
      centerCov[centerCovBase + 5] = pCovarianceArray[pCovarianceBase + 2]
      centerCov[centerCovBase + 6] = pCovarianceArray[pCovarianceBase + 3]
      centerCov[centerCovBase + 7] = pCovarianceArray[pCovarianceBase + 4]
      centerCov[centerCovBase + 8] = pCovarianceArray[pCovarianceBase + 5]
    }

    return {
      colors: color,
      centerCovariances: centerCov,
    }
  }
}

export { PlyLoader, SplatLoader, Viewer }
