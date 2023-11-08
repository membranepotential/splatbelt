import * as THREE from 'three'

import { SplatBuffer } from './buffer'
import { Octree } from './octree'
import { LoadingSpinner } from './loadingSpinner'
import { createSortWorker, Constants } from './sorter'
import { OrbitControls } from './controls'
import { PlyLoader } from './plyLoader'

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

export class Viewer {
  rootElement: HTMLElement
  cameraUp: THREE.Vector3
  initialCameraPos: THREE.Vector3
  initialCameraLookAt: THREE.Vector3
  cameraSpecs: typeof DEFAULT_CAMERA_SPECS
  splatAlphaRemovalThreshold: number
  controls: OrbitControls | null
  selfDrivenMode: boolean
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  realProjectionMatrix: THREE.Matrix4
  renderer: THREE.WebGLRenderer | null
  selfDrivenUpdateFunc: () => void
  sortWorker: Worker | null
  vertexRenderCount: number
  vertexSortCount: number
  inIndexArray: Uint32Array | null
  splatBuffer: SplatBuffer | null
  splatMesh: THREE.Mesh | null
  octree: Octree | null
  octreeNodeMap: Record<string, Octree>
  sortRunning: boolean
  resizeFunc: () => void

  constructor(
    /**
     * The root element to attach the Viewer canvas to.
     * @type {HTMLElement}
     */
    rootElement: HTMLElement,
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

  getRenderDimensions(outDimensions: THREE.Vector2) {
    outDimensions.x = this.rootElement.offsetWidth
    outDimensions.y = this.rootElement.offsetHeight
    return outDimensions
  }

  updateRealProjectionMatrix(renderDimensions: THREE.Vector2) {
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
  onResize = (() => {
    const renderDimensions = new THREE.Vector2()

    return () => {
      if (this.camera && this.renderer) {
        this.renderer.setSize(1, 1)
        this.getRenderDimensions(renderDimensions)

        this.camera.aspect = renderDimensions.x / renderDimensions.y
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(renderDimensions.x, renderDimensions.y)
        this.updateRealProjectionMatrix(renderDimensions)
        this.updateSplatMeshUniforms()
      }
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

  updateSplatMeshAttributes(
    colors: any,
    centerCovariances: any,
    vertexCount: number
  ) {
    const ELEMENTS_PER_TEXEL = 4

    if (!this.splatMesh) throw new Error('Splat mesh not initialized.')

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

  loadBlob(blob: Blob) {
    const loadingSpinner = new LoadingSpinner()
    loadingSpinner.show()
    return new Promise((resolve, reject) => {
      const fileLoadPromise = new PlyLoader().loadFromBlob(blob)
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
        .catch(() => {
          reject(new Error(`Viewer::loadFile -> Could not load file ${url}`))
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
