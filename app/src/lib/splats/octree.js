import * as THREE from 'three'

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

export class Octree {
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
