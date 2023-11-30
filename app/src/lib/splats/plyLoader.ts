import * as THREE from 'three'
import { SplatBuffer } from './buffer'

export class PlyLoader {
  splatBuffer?: SplatBuffer

  async loadFromBlob(blob: Blob) {
    const data = await blob.arrayBuffer()
    const parser = new PlyParser(data)
    const splatBuffer = parser.parseToSplatBuffer()
    this.splatBuffer = splatBuffer
    return splatBuffer
  }
}

class PlyParser {
  plyBuffer: ArrayBuffer

  constructor(plyBuffer: ArrayBuffer) {
    this.plyBuffer = plyBuffer
  }

  decodeHeader(plyBuffer: ArrayBuffer) {
    const decoder = new TextDecoder()
    let headerOffset = 0
    let headerText = ''

    do {
      const headerChunk = new Uint8Array(plyBuffer, headerOffset, 50)
      headerText += decoder.decode(headerChunk)
      headerOffset += 50
    } while (!headerText.includes('end_header'))

    const headerLines = headerText.split('\n')

    let vertexCount = 0
    const propertyTypes = {} as Record<string, string>

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
    vertexData: DataView,
    offset: number,
    fieldOffsets: Record<string, number>,
    propertiesToRead: string[],
    propertyTypes: Record<string, string>,
    outVertex: Record<string, number>
  ) {
    const rawVertex = outVertex || {}
    for (const property of propertiesToRead) {
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
    const fieldOffsets = {} as Record<string, number>
    const fieldSize = {
      double: 8,
      int: 4,
      uint: 4,
      float: 4,
      short: 2,
      ushort: 2,
      uchar: 1,
    } as Record<string, number>
    for (const fieldName in propertyTypes) {
      if (Object.prototype.hasOwnProperty.call(propertyTypes, fieldName)) {
        const type = propertyTypes[fieldName]
        fieldOffsets[fieldName] = plyRowSize
        plyRowSize += fieldSize[type]
      }
    }

    const rawVertex = {} as Record<string, number>

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
    ] as string[]

    console.time('Importance computations')
    const sizeList = new Float32Array(vertexCount)
    const sizeIndex = new Uint32Array(vertexCount)
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
