import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type Plan = Array<[number, number]>
export type Section = { y: number; w: number; d: number; c?: number; x?: number; z?: number }

/** Authored architectural sections, machined profiles and material batching. */
export function createArchitecturalKit() {
  const group = new THREE.Group()
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const ownedGeometry = new Set<THREE.BufferGeometry>()
  const ownedMaterial = new Set<THREE.Material>()
  let seed = 74617
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const data = new Uint8Array(256 * 256 * 4)
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const i = (y * 256 + x) * 4
    const shade = 170 + random() * 55 + Math.sin(y * .18) * 8
    data[i] = data[i + 1] = data[i + 2] = shade; data[i + 3] = 255
  }
  const grain = new THREE.DataTexture(data, 256, 256)
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.magFilter = THREE.LinearFilter
  grain.minFilter = THREE.LinearMipmapLinearFilter
  grain.generateMipmaps = true
  grain.needsUpdate = true
  const metal = (color: string, roughness: number, metalness: number) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, bumpMap: grain, bumpScale: .025, roughnessMap: grain })
    ownedMaterial.add(material)
    return material
  }
  const m = {
    graphite: metal('#26383e', .68, .55),
    shell: metal('#53646a', .73, .34),
    titanium: metal('#87938e', .43, .72),
    concrete: metal('#889087', .89, .08),
    dark: metal('#101d24', .78, .45),
    glass: metal('#15303a', .28, .78),
    bronze: metal('#a28863', .52, .67),
    energy: new THREE.MeshStandardMaterial({ color: '#85c9cd', emissive: '#69becb', emissiveIntensity: 1.7, roughness: .45, metalness: .2 }),
    amber: new THREE.MeshStandardMaterial({ color: '#bc9e74', emissive: '#dda35e', emissiveIntensity: .7, roughness: .55, metalness: .2 })
  }
  Object.values(m).forEach(material => ownedMaterial.add(material))
  const temp = new THREE.Object3D()
  const bake = (geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    temp.position.set(x, y, z); temp.rotation.set(rx, ry, rz); temp.updateMatrix()
    geometry.applyMatrix4(temp.matrix)
    const flat = geometry.index ? geometry.toNonIndexed() : geometry
    if (flat !== geometry) geometry.dispose()
    const positions = flat.getAttribute('position')
    const uv = new Float32Array(positions.count * 2)
    for (let i = 0; i < positions.count; i++) {
      uv[i * 2] = positions.getX(i) * .13 + positions.getY(i) * .14
      uv[i * 2 + 1] = positions.getZ(i) * .13 + positions.getY(i) * .14
    }
    flat.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    if (!flat.getAttribute('normal')) flat.computeVertexNormals()
    const batch = batches.get(material) ?? []
    batch.push(flat); batches.set(material, batch)
  }
  const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, ry = 0) => bake(new THREE.BoxGeometry(w, h, d), mat, x, y, z, 0, ry)
  const loft = (levels: Section[]) => {
    const vertices: number[] = [], indices: number[] = []
    for (const level of levels) {
      const w = level.w / 2, d = level.d / 2, c = Math.min(level.c ?? .3, w * .7, d * .7)
      for (const [x, z] of [[-w + c, -d], [w - c, -d], [w, -d + c], [w, d - c], [w - c, d], [-w + c, d], [-w, d - c], [-w, -d + c]]) {
        vertices.push(x + (level.x ?? 0), level.y, z + (level.z ?? 0))
      }
    }
    for (let n = 0; n < levels.length - 1; n++) for (let i = 0; i < 8; i++) {
      const a = n * 8 + i, b = n * 8 + (i + 1) % 8
      indices.push(a, a + 8, b, b, a + 8, b + 8)
    }
    for (let i = 1; i < 7; i++) { const t = (levels.length - 1) * 8; indices.push(0, i, i + 1, t, t + i + 1, t + i) }
    const raw = new THREE.BufferGeometry()
    raw.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); raw.setIndex(indices)
    const geometry = raw.toNonIndexed(); raw.dispose(); geometry.computeVertexNormals()
    return geometry
  }
  const chamfer = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, ry = 0, edge = .17) => {
    const e = Math.min(edge, h * .25)
    bake(loft([{ y: -h / 2, w: w - e, d: d - e, c: edge }, { y: -h / 2 + e, w, d, c: edge }, { y: h / 2 - e, w, d, c: edge }, { y: h / 2, w: w - e, d: d - e, c: edge }]), mat, x, y, z, 0, ry)
  }
  const pipe = (a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material, sides = 7) => {
    const g = new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), sides, 1)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()))
    const c = a.clone().add(b).multiplyScalar(.5); bake(g, mat, c.x, c.y, c.z)
  }
  const plate = (plan: Plan, y: number, depth: number, mat: THREE.Material, bevel = .15) => {
    const shape = new THREE.Shape()
    plan.forEach(([x, z], i) => i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z))
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1, curveSegments: 1 })
    bake(geometry, mat, 0, y - depth, 0, -Math.PI / 2)
  }
  const profile = (points: Plan, depth: number, mat: THREE.Material, x: number, y: number, z: number, ry = 0) => {
    const shape = new THREE.Shape()
    points.forEach(([px, py], i) => i === 0 ? shape.moveTo(px, py) : shape.lineTo(px, py)); shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 2, steps: 1 })
    g.translate(0, 0, -depth * .5); bake(g, mat, x, y, z, 0, ry)
  }
  const ring = (outer: number, inner: number, height: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const shape = new THREE.Shape(), hole = new THREE.Path()
    shape.absarc(0, 0, outer, 0, Math.PI * 2, false)
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true); shape.holes.push(hole)
    bake(new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelSegments: 2, bevelSize: .055, bevelThickness: .055, curveSegments: 48 }), mat, x, y, z, -Math.PI / 2)
  }
  return {
    group, m, random, bake, box, loft, chamfer, pipe, plate, profile, ring,
    finish() {
      for (const [material, parts] of batches) {
        const geometry = mergeGeometries(parts, false)!
        parts.forEach(part => part.dispose()); ownedGeometry.add(geometry)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = material !== m.energy && material !== m.amber
        mesh.receiveShadow = true
        group.add(mesh)
      }
      batches.clear()
    },
    dispose() { ownedGeometry.forEach(g => g.dispose()); ownedMaterial.forEach(mat => mat.dispose()); grain.dispose(); group.clear() }
  }
}
