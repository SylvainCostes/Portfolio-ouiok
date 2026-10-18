import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * Cathédrale des nuages — original parametric architectural model.
 *
 * The structure is authored as a kit of chamfered lofts, annular extrusions,
 * shaped radial buttresses and service galleries. Repeated facade details are
 * baked into material batches, so the model remains a small number of draws.
 * The reactor is offset toward the visitor; the three tower crowns form a
 * stepped silhouette behind it. Units are architectural, rather than metres.
 * No external models, textures or third-party artwork are used.
 */
export function createArchitecture() {
  const group = new THREE.Group()
  group.name = 'Cathedrale-des-nuages'
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  const temp = new THREE.Object3D()
  let seed = 73411
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }

  // Fine deterministic surface grain. A tiny shared map avoids heavy textures.
  const grainData = new Uint8Array(128 * 128 * 4)
  for (let i = 0; i < grainData.length; i += 4) {
    const shade = 175 + Math.floor(random() * 70)
    grainData[i] = grainData[i + 1] = grainData[i + 2] = shade
    grainData[i + 3] = 255
  }
  const grain = new THREE.DataTexture(grainData, 128, 128)
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.magFilter = THREE.LinearFilter
  grain.minFilter = THREE.LinearMipmapLinearFilter
  grain.generateMipmaps = true
  grain.needsUpdate = true
  textures.add(grain)

  function metal(color: string, roughness: number, metalness = 0.55) {
    const mat = new THREE.MeshStandardMaterial({
      color, roughness, metalness, bumpMap: grain, bumpScale: 0.027,
      roughnessMap: grain,
    })
    materials.add(mat)
    return mat
  }
  const graphite = metal('#26363c', 0.69, 0.58)
  const shell = metal('#536168', 0.75, 0.32)
  const titanium = metal('#849092', 0.42, 0.72)
  const pale = metal('#a1a9a5', 0.84, 0.19)
  const dark = metal('#0b171e', 0.75, 0.48)
  const recess = metal('#10282e', 0.42, 0.8)
  const bronze = metal('#a57c49', 0.5, 0.67)
  const energyMat = new THREE.MeshStandardMaterial({
    color: '#79c9d5', emissive: '#58d4df', emissiveIntensity: 2.3,
    roughness: 0.34, metalness: 0.25,
  })
  const amberMat = new THREE.MeshStandardMaterial({
    color: '#d5ab66', emissive: '#f2b15d', emissiveIntensity: 0.9,
    roughness: 0.5, metalness: 0.25,
  })
  materials.add(energyMat)
  materials.add(amberMat)

  const at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  function bake(
    geometry: THREE.BufferGeometry, material: THREE.Material,
    x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0,
  ) {
    temp.position.set(x, y, z)
    temp.rotation.set(rx, ry, rz)
    temp.scale.set(1, 1, 1)
    temp.updateMatrix()
    geometry.applyMatrix4(temp.matrix)
    const flat = geometry.index ? geometry.toNonIndexed() : geometry
    if (flat !== geometry) geometry.dispose()
    flat.deleteAttribute('uv')
    const p = flat.getAttribute('position')
    const uv = new Float32Array(p.count * 2)
    for (let i = 0; i < p.count; i++) {
      uv[i * 2] = p.getX(i) * 0.23 + p.getY(i) * 0.15
      uv[i * 2 + 1] = p.getZ(i) * 0.23 + p.getY(i) * 0.15
    }
    flat.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    if (!flat.getAttribute('normal')) flat.computeVertexNormals()
    const parts = batches.get(material) ?? []
    parts.push(flat)
    batches.set(material, parts)
  }
  function box(w: number, h: number, d: number, material: THREE.Material,
    x = 0, y = 0, z = 0, ry = 0) {
    bake(new THREE.BoxGeometry(w, h, d), material, x, y, z, 0, ry)
  }

  type Level = { y: number; w: number; d: number; c: number }
  function loft(levels: Level[]) {
    const vertices: number[] = []
    const indices: number[] = []
    for (const l of levels) {
      const w = l.w / 2, d = l.d / 2, c = Math.min(l.c, w * 0.7, d * 0.7)
      const ring = [[-w + c, -d], [w - c, -d], [w, -d + c], [w, d - c],
        [w - c, d], [-w + c, d], [-w, d - c], [-w, -d + c]]
      for (const [x, z] of ring) vertices.push(x, l.y, z)
    }
    for (let n = 0; n < levels.length - 1; n++) {
      for (let i = 0; i < 8; i++) {
        const a = n * 8 + i, b = n * 8 + (i + 1) % 8
        indices.push(a, a + 8, b, b, a + 8, b + 8)
      }
    }
    for (let i = 1; i < 7; i++) {
      indices.push(0, i, i + 1)
      const t = (levels.length - 1) * 8
      indices.push(t, t + i + 1, t + i)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    const result = geometry.toNonIndexed()
    geometry.dispose()
    result.computeVertexNormals()
    return result
  }
  function chamfer(w: number, h: number, d: number, material: THREE.Material,
    x = 0, y = 0, z = 0, cut = 0.16, ry = 0) {
    const edge = Math.min(0.11, h / 4)
    bake(loft([
      { y: -h / 2, w: w - edge, d: d - edge, c: cut },
      { y: -h / 2 + edge, w, d, c: cut },
      { y: h / 2 - edge, w, d, c: cut },
      { y: h / 2, w: w - edge, d: d - edge, c: cut },
    ]), material, x, y, z, 0, ry)
  }
  function pipe(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, sides = 8) {
    const geometry = new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), sides, 1)
    const center = a.clone().add(b).multiplyScalar(0.5)
    const direction = b.clone().sub(a).normalize()
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(at(0, 1, 0), direction))
    bake(geometry, material, center.x, center.y, center.z)
  }
  function annulus(outer: number, inner: number, depth: number,
    material: THREE.Material, y = 0, z = 0, segments = 96, start = 0, arc = Math.PI * 2) {
    const shape = new THREE.Shape()
    const full = arc >= Math.PI * 2 - 0.001
    for (let i = 0; i <= segments; i++) {
      const a = start + i / segments * arc
      if (i === 0) shape.moveTo(Math.cos(a) * outer, Math.sin(a) * outer)
      else shape.lineTo(Math.cos(a) * outer, Math.sin(a) * outer)
    }
    if (full) {
      shape.closePath()
      const hole = new THREE.Path()
      for (let i = segments; i >= 0; i--) {
        const a = start + i / segments * arc
        if (i === segments) hole.moveTo(Math.cos(a) * inner, Math.sin(a) * inner)
        else hole.lineTo(Math.cos(a) * inner, Math.sin(a) * inner)
      }
      shape.holes.push(hole)
    } else {
      for (let i = segments; i >= 0; i--) {
        const a = start + i / segments * arc
        shape.lineTo(Math.cos(a) * inner, Math.sin(a) * inner)
      }
      shape.closePath()
    }
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: false, steps: 1, curveSegments: 1,
    })
    bake(geometry, material, 0, y, z, -Math.PI / 2)
  }

  // A deliberately asymmetric deck: the visible reactor well cuts through the
  // main plate and reveals a second structural layer beneath the walking level.
  const deck = new THREE.Shape()
  for (let i = 0; i <= 64; i++) {
    const a = i / 64 * Math.PI * 2
    const x = Math.cos(a) * 11.65, y = Math.sin(a) * 10.8
    if (i === 0) deck.moveTo(x, y)
    else deck.lineTo(x, y)
  }
  const well = new THREE.Path()
  // Shape coordinates are flipped in z by the horizontal extrusion rotation.
  for (let i = 96; i >= 0; i--) {
    const a = i / 96 * Math.PI * 2
    const x = Math.cos(a) * 3.45, y = Math.sin(a) * 3.45 - 2
    if (i === 96) well.moveTo(x, y)
    else well.lineTo(x, y)
  }
  deck.holes.push(well)
  bake(new THREE.ExtrudeGeometry(deck, {
    depth: 0.44, bevelEnabled: true, bevelSegments: 3,
    bevelThickness: 0.12, bevelSize: 0.13, steps: 1,
  }), shell, 0, -0.45, 0, -Math.PI / 2)
  annulus(11.45, 8.95, 0.38, graphite, -0.98, 0, 96)
  annulus(10.85, 8.9, 0.28, titanium, -1.3, 0, 96)
  annulus(10.3, 8.75, 0.5, dark, -1.85, 0, 96)
  annulus(9.95, 8.9, 0.23, shell, -2.15, 0, 96)

  // Segmented perimeter armor and inset service windows.
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2
    const x = Math.cos(a), z = Math.sin(a)
    chamfer(2.6, 0.8, 0.55, i % 3 === 0 ? pale : shell,
      x * 11.3, -0.5, z * 10.48, 0.12, -a + Math.PI / 2)
    box(1.93, 0.19, 0.09, dark, x * 11.59, -0.48, z * 10.74, -a + Math.PI / 2)
    if (i % 2 === 0) {
      box(0.9, 0.055, 0.105, amberMat, x * 11.62, -0.45, z * 10.77, -a + Math.PI / 2)
    }
    // Radial deck grooves and cap plates provide real architectural scale.
    box(0.045, 0.018, 2.6, dark, x * 9.2, 0.025, z * 9.2, -a + Math.PI / 2)
    chamfer(0.7, 0.14, 1.1, graphite, x * 9.85, 0.12, z * 9.85, 0.12, -a)
    // Lower service apertures sit behind the broad perimeter armor.
    box(1.3, 0.43, 0.1, recess, x * 10.25, -1.52, z * 10.25, -a + Math.PI / 2)
    for (let l = 0; l < 4; l++) {
      box(1.22, 0.035, 0.12, titanium, x * 10.3, -1.68 + l * 0.105,
        z * 10.3, -a + Math.PI / 2)
    }
    if (i % 3 !== 0) {
      annulus(10.14, 10.08, 0.055, amberMat, -2.05, 0, 8,
        a + 0.035, Math.PI * 2 / 24 - 0.07)
    }
  }

  // A sculpted load path beneath the floating platform, narrowing to a keel.
  // Each buttress has a designed section, rather than an unstructured cone.
  const ribShape = new THREE.Shape()
  ribShape.moveTo(1.35, -7.3)
  ribShape.lineTo(3.2, -6.6)
  ribShape.lineTo(8.9, -1.0)
  ribShape.lineTo(9.6, -1.0)
  ribShape.lineTo(8.9, -3.15)
  ribShape.lineTo(4.6, -7.3)
  ribShape.lineTo(2.0, -8.0)
  ribShape.closePath()
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2
    const rib = new THREE.ExtrudeGeometry(ribShape, {
      depth: 0.65, bevelEnabled: true, bevelSegments: 1,
      bevelSize: 0.13, bevelThickness: 0.12, steps: 1,
    })
    rib.translate(0, 0, -0.325)
    bake(rib, i % 3 === 0 ? titanium : graphite, 0, 0, 0, 0, a)
    const dir = at(Math.cos(a), 0, -Math.sin(a))
    const top = dir.clone().multiplyScalar(8.9).setY(-1.5)
    const bottom = dir.clone().multiplyScalar(3.7).setY(-6.0)
    pipe(top, bottom, 0.13, titanium)
    pipe(top.clone().add(at(0, -0.35, 0)), bottom.clone().add(at(0, -0.35, 0)), 0.045, energyMat, 6)
    chamfer(1.2, 1.6, 1.3, dark, dir.x * 7.8, -2.6, dir.z * 7.8, 0.22, a)
    // A second, separated load-bearing member makes each radial bay legible.
    const branch = new THREE.Shape()
    branch.moveTo(3.1, -6.2)
    branch.lineTo(5.15, -5.7)
    branch.lineTo(8.2, -2.6)
    branch.lineTo(9.75, -1.1)
    branch.lineTo(9.75, -1.6)
    branch.lineTo(8.3, -3.55)
    branch.lineTo(5.25, -6.45)
    branch.closePath()
    const branchGeometry = new THREE.ExtrudeGeometry(branch, {
      depth: 0.3, bevelEnabled: true, bevelSegments: 2,
      bevelSize: 0.07, bevelThickness: 0.07, steps: 1,
    })
    branchGeometry.translate(0, 0, 0.47)
    bake(branchGeometry, shell, 0, 0, 0, 0, a)
    // Insulated feed pipes occupy the open space between the structural ribs.
    const tangent = at(Math.sin(a) * 0.72, 0, Math.cos(a) * 0.72)
    const feed = [dir.clone().multiplyScalar(8.3).setY(-2.25).add(tangent),
      dir.clone().multiplyScalar(6.65).setY(-4.35).add(tangent),
      dir.clone().multiplyScalar(3.85).setY(-6.4).add(tangent)]
    for (let p = 0; p < 2; p++) {
      pipe(feed[p], feed[p + 1], 0.14, dark)
      pipe(feed[p].clone().add(at(0, 0.05, 0)),
        feed[p + 1].clone().add(at(0, 0.05, 0)), 0.035, energyMat)
    }
    chamfer(0.55, 0.5, 0.55, bronze,
      feed[1].x, feed[1].y, feed[1].z, 0.07, a)
  }
  bake(loft([
    { y: -8.7, w: 1.8, d: 1.8, c: 0.3 },
    { y: -7.6, w: 3.3, d: 3.3, c: 0.65 },
    { y: -5.7, w: 5.3, d: 5.3, c: 1.0 },
    { y: -2.2, w: 7.7, d: 7.7, c: 1.4 },
    { y: -1.4, w: 8.5, d: 8.5, c: 1.6 },
  ]), dark)
  annulus(5.8, 4.85, 0.5, shell, -4.0, 0, 48)
  annulus(3.85, 3.1, 0.45, graphite, -6.2, 0, 48)
  annulus(1.5, 1.15, 0.13, energyMat, -8.1, 0, 48)

  function tower(x: number, z: number, w: number, d: number, h: number, index: number) {
    chamfer(w + 1.0, 0.45, d + 0.8, titanium, x, 0.3, z, 0.45)
    chamfer(w + 0.5, 0.75, d + 0.45, graphite, x, 0.8, z, 0.4)
    bake(loft([
      { y: 1.0, w, d, c: 0.5 },
      { y: h - 1.6, w: w * 0.96, d: d * 0.95, c: 0.5 },
      { y: h - 0.8, w: w * 0.88, d: d * 0.87, c: 0.45 },
      { y: h, w: w * 0.82, d: d * 0.8, c: 0.4 },
    ]), graphite, x, 0, z)
    // Recessed facade cassettes are framed by long continuous blade fins.
    const faceHeight = h - 3.0
    for (const side of [-1, 1]) {
      box(w - 1.0, faceHeight, 0.08, recess, x, faceHeight / 2 + 1.5, z + side * d / 2)
      const fins = index === 1 ? 5 : index === 2 ? 8 : 7
      for (let k = 0; k < fins; k++) {
        const offset = (k - (fins - 1) / 2) * (w - 0.5) / fins
        chamfer(index === 1 ? 0.15 : 0.105, faceHeight + 0.6, 0.28, k % 3 === 0 ? titanium : shell,
          x + offset, faceHeight / 2 + 1.5, z + side * (d / 2 + 0.1), 0.025)
      }
      const rows = Math.floor(faceHeight / 0.35)
      for (let k = 0; k < rows; k++) {
        const y = 1.6 + k * 0.35
        box(w - 1.15, 0.055, 0.13, dark, x, y, z + side * (d / 2 + 0.11))
        if ((k + index) % 8 === 0) {
          box(0.27, 0.045, 0.025, amberMat,
            x - w * 0.25, y + 0.12, z + side * (d / 2 + 0.19))
          box(0.13, 0.045, 0.025, energyMat,
            x + w * 0.24, y + 0.12, z + side * (d / 2 + 0.19))
        }
      }
      // Side service faces with a single luminous vertical riser.
      box(0.09, faceHeight, d - 1.0, dark, x + side * w / 2,
        faceHeight / 2 + 1.5, z)
      for (let k = 0; k < 5; k++) {
        box(0.2, faceHeight + 0.3, 0.095, shell, x + side * (w / 2 + 0.06),
          faceHeight / 2 + 1.5, z + (k - 2) * (d - 0.7) / 5)
      }
      box(0.08, faceHeight * 0.87, 0.055, energyMat,
        x + side * (w / 2 + 0.17), faceHeight / 2 + 1.5, z - d * 0.25)
      // Tower crown is a stepped machined cap, with a warm roof slot.
      chamfer(w * 0.88, 0.18, 0.3, titanium, x, h - 0.6, z + side * d * 0.39, 0.07)
      box(w * 0.65, 0.055, 0.08, amberMat, x, h - 0.46, z + side * d * 0.39)
      // Mechanical transfer floors interrupt the long vertical blades. Each
      // tower has a different rhythm, making the cluster read as architecture.
      const floors = index === 1 ? [5.4, 12.0] : index === 2 ? [4.3, 9.5] : [6.9]
      for (const y of floors) {
        chamfer(w + 0.18, 0.55, 0.45, graphite, x, y,
          z + side * (d / 2 + 0.12), 0.1)
        box(w - 0.2, 0.065, 0.47, titanium, x, y - 0.2,
          z + side * (d / 2 + 0.13))
        box(w * 0.5, 0.045, 0.48, amberMat, x + w * 0.13, y + 0.16,
          z + side * (d / 2 + 0.14))
      }
      // Insets conceal the blade behind actual service cassettes.
      if (index !== 0) {
        const y = index === 1 ? 8.7 : 11.75
        chamfer(w * 0.68, 1.25, 0.33, dark, x, y,
          z + side * (d / 2 + 0.18), 0.12)
        for (let l = 0; l < 5; l++) {
          box(w * 0.59, 0.055, 0.35, shell, x, y - 0.43 + l * 0.2,
            z + side * (d / 2 + 0.19))
        }
      }
      if (index === 0 || index === 2) {
        const base = index === 0 ? 3.2 : 5.0
        const front = z + side * (d / 2 + 0.33)
        pipe(at(x - w * 0.4, base, front), at(x + w * 0.4, base + 2.7, front), 0.055, titanium, 6)
        pipe(at(x + w * 0.4, base, front), at(x - w * 0.4, base + 2.7, front), 0.055, titanium, 6)
      }
    }
    chamfer(w * 0.63, 0.22, d * 0.62, shell, x, h + 0.08, z, 0.3)
    // Crown vents are read as finely spaced strakes in the hero silhouette.
    for (let k = 0; k < 8; k++) {
      box(w * 0.48, 0.13, 0.08, dark, x, h + 0.23, z + (k - 3.5) * d * 0.055)
    }
    if (index === 1) {
      pipe(at(x - 0.7, h, z - 0.5), at(x - 0.7, h + 2.1, z - 0.5), 0.055, titanium)
      pipe(at(x + 0.65, h, z + 0.4), at(x + 0.65, h + 1.2, z + 0.4), 0.035, titanium)
      box(0.06, 0.1, 0.06, amberMat, x - 0.7, h + 2.1, z - 0.5)
    }
    // Each lower facade has two enlarged coolant connections. The deck channel
    // network below joins these connection points to the reactor ring.
    for (const s of [-1, 1]) {
      const sx = x + s * (w * 0.28)
      pipe(at(sx, 1.6, z + d / 2 + 0.1), at(sx, 0.24, z + d / 2 + 0.45), 0.11, graphite)
      pipe(at(sx, 1.6, z + d / 2 + 0.16), at(sx, 0.24, z + d / 2 + 0.51), 0.038, energyMat)
      chamfer(0.45, 0.25, 0.5, titanium, sx, 0.14, z + d / 2 + 0.5, 0.08)
    }
  }
  tower(-4.55, -3.0, 3.3, 3.8, 14.1, 0)
  tower(-0.25, -4.65, 3.8, 4.1, 19.9, 1)
  tower(4.4, -3.4, 3.3, 3.8, 16.0, 2)

  // Recessed service trenches form a connected, readable energy network. The
  // wider dark bed and twin metallic edges make the light feel embedded.
  function channel(points: [number, number][], width = 0.36) {
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, az] = points[i], [bx, bz] = points[i + 1]
      const dx = bx - ax, dz = bz - az, length = Math.hypot(dx, dz)
      const angle = Math.atan2(dx, dz)
      const mx = (ax + bx) / 2, mz = (az + bz) / 2
      box(width, 0.035, length + 0.05, dark, mx, 0.065, mz, angle)
      box(width * 0.18, 0.04, length, energyMat, mx, 0.1, mz, angle)
      for (const s of [-1, 1]) {
        box(0.025, 0.05, length, titanium,
          mx + Math.cos(angle) * s * width * 0.48, 0.1,
          mz - Math.sin(angle) * s * width * 0.48, angle)
      }
    }
    for (const [x, z] of points.slice(1, -1)) {
      chamfer(width + 0.08, 0.07, width + 0.08, titanium, x, 0.09, z, 0.08)
      box(width * 0.5, 0.035, width * 0.5, energyMat, x, 0.14, z)
    }
  }
  channel([[-5.474, -0.6], [-5.474, 2], [-3.46, 2]])
  channel([[-3.626, -0.6], [-3.626, 0], [-2.86, 0.08]])
  channel([[-1.314, -2.1], [-1.314, -1.2]])
  channel([[0.814, -2.1], [0.814, -1.37]])
  channel([[3.476, -1.0], [3.476, 0.3], [2.87, 0.06]])
  channel([[5.324, -1.0], [5.324, 2.0], [3.46, 2.0]])
  channel([[-7.55, 2.1], [-7.55, 4.3], [-5.8, 4.3], [-4.6, 5.4], [-2.25, 4.65]])
  channel([[7.55, 2.1], [7.55, 4.7], [5.8, 4.7], [4.7, 5.7], [2.35, 4.55]])

  // A low heat-exchange plant fills the service quarter, not the reactor's
  // negative space. Its offset orientation distinguishes the platform plan.
  chamfer(2.25, 0.2, 3.7, dark, -6.1, 0.15, 6.5, 0.27, -0.2)
  chamfer(1.7, 0.75, 2.65, graphite, -6.1, 0.64, 6.4, 0.25, -0.2)
  for (let i = 0; i < 12; i++) {
    box(1.5, 0.1, 0.065, titanium, -6.1 - Math.sin(0.2) * (i - 5.5) * 0.18,
      1.05, 6.4 + Math.cos(0.2) * (i - 5.5) * 0.18, -0.2)
  }
  pipe(at(-7, 0.4, 5.1), at(-7, 0.4, 7.5), 0.11, bronze)
  pipe(at(-7, 0.4, 7.5), at(-5.7, 0.4, 7.5), 0.11, bronze)
  for (const z of [5.35, 6.25, 7.15]) {
    chamfer(0.38, 0.42, 0.16, shell, -7, 0.38, z, 0.05)
  }

  // An asymmetric maintenance dock breaks the perfect disc silhouette. The
  // angular plan, embedded tracks and exposed underslung truss explain its use.
  const dock = new THREE.Shape()
  const dockPlan = [[-8.4, 5.4], [-10.7, 7.9], [-10.1, 10.2],
    [-7.6, 12.4], [-5.8, 12.4], [-5.3, 10.7], [-6.5, 8.2]]
  dockPlan.forEach(([x, z], i) => {
    if (i === 0) dock.moveTo(x, -z)
    else dock.lineTo(x, -z)
  })
  dock.closePath()
  bake(new THREE.ExtrudeGeometry(dock, {
    depth: 0.32, bevelEnabled: true, bevelSegments: 2,
    bevelSize: 0.1, bevelThickness: 0.08, steps: 1,
  }), shell, 0, -0.03, 0, -Math.PI / 2)
  const dockStart = at(-8.9, 0.34, 7.6), dockEnd = at(-6.9, 0.34, 11.8)
  for (const s of [-1, 1]) {
    const offset = at(s * 0.57, 0, -s * 0.27)
    pipe(dockStart.clone().add(offset), dockEnd.clone().add(offset), 0.07, dark)
    pipe(dockStart.clone().add(offset).add(at(0, 0.07, 0)),
      dockEnd.clone().add(offset).add(at(0, 0.07, 0)), 0.028, bronze, 6)
  }
  for (let i = 0; i < 7; i++) {
    const p = dockStart.clone().lerp(dockEnd, i / 6)
    pipe(p.clone().add(at(-0.8, 0, 0.38)), p.clone().add(at(0.8, 0, -0.38)), 0.028, titanium, 6)
  }
  pipe(at(-7.8, -2.4, 6.2), at(-6.9, -0.35, 11.7), 0.13, graphite)
  pipe(at(-8.9, -1.7, 6.8), at(-9.8, -0.35, 9.7), 0.13, graphite)
  pipe(at(-9.8, -0.35, 9.7), at(-6.9, -0.35, 11.7), 0.1, titanium)
  for (const [x, z] of [[-9.8, 9.9], [-7.7, 12.1], [-6.2, 12.1]]) {
    chamfer(0.17, 0.38, 0.17, graphite, x, 0.45, z, 0.035)
    box(0.13, 0.045, 0.13, amberMat, x, 0.67, z)
  }

  // Elevated industrial galleries link the server monoliths at their base.
  chamfer(10.1, 0.4, 1.1, shell, 0, 2.9, -2.4, 0.2)
  for (let i = 0; i < 29; i++) box(0.035, 0.7, 0.035, titanium, -5 + i * 0.36, 3.43, -1.92)
  pipe(at(-5, 3.8, -1.92), at(5, 3.8, -1.92), 0.035, titanium, 6)
  for (const s of [-1, 1]) {
    chamfer(2.0, 2.1, 4.1, graphite, s * 7.55, 1.2, 0.0, 0.35)
    chamfer(1.7, 0.25, 3.7, shell, s * 7.55, 2.35, 0.0, 0.22)
    for (let k = 0; k < 12; k++) {
      box(1.4, 0.13, 0.075, titanium, s * 7.55, 2.54, -1.4 + k * 0.25)
    }
    pipe(at(s * 8.8, 0.2, -2), at(s * 8.8, 1.7, -2), 0.17, graphite)
    pipe(at(s * 8.8, 1.7, -2), at(s * 8.8, 1.7, 2.5), 0.17, graphite)
    pipe(at(s * 8.8, 1.7, 2.5), at(s * 8.8, 0.2, 2.5), 0.17, graphite)
    for (const z of [-1.8, 0, 1.8]) chamfer(0.14, 0.65, 0.45, bronze, s * 8.8, 1.7, z, 0.04)
  }

  // Reactor: a deep well, concentric machinery and a precisely spaced crown.
  const coreZ = 2
  annulus(3.42, 2.87, 2.7, dark, -2.5, coreZ)
  annulus(3.72, 3.35, 0.2, titanium, 0.08, coreZ)
  annulus(3.52, 3.37, 0.08, energyMat, 0.3, coreZ)
  annulus(3.25, 2.85, 0.3, graphite, 0.05, coreZ)
  annulus(2.8, 2.58, 0.1, energyMat, -0.5, coreZ)
  annulus(2.5, 2.2, 0.18, titanium, -1.4, coreZ)
  annulus(2.24, 2.1, 0.12, energyMat, -1.15, coreZ)
  bake(new THREE.CylinderGeometry(2.13, 1.9, 0.12, 64), recess, 0, -2.1, coreZ)
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2
    const x = Math.cos(a), z = Math.sin(a)
    chamfer(0.3, 0.38, 0.77, shell, x * 3.47, 0.4, coreZ + z * 3.47, 0.06, -a + Math.PI / 2)
    box(0.095, 0.045, 0.4, i % 3 === 0 ? amberMat : energyMat,
      x * 3.49, 0.61, coreZ + z * 3.49, -a + Math.PI / 2)
    pipe(at(x * 2.93, -2.0, coreZ + z * 2.93),
      at(x * 2.93, 0.05, coreZ + z * 2.93), 0.06, titanium, 6)
  }
  // Elevated reactor guard rails describe scale without UI markers.
  for (let i = 0; i < 7; i++) {
    const a = 0.2 + i / 6 * 2.75
    const x = Math.cos(a) * 4.15, z = Math.sin(a) * 4.15 + coreZ
    pipe(at(x, 0.1, z), at(x, 0.9, z), 0.035, titanium, 6)
    if (i < 6) {
      const b = 0.2 + (i + 1) / 6 * 2.75
      pipe(at(x, 0.9, z), at(Math.cos(b) * 4.15, 0.9, Math.sin(b) * 4.15 + coreZ), 0.03, titanium, 6)
    }
  }

  // Front arrival causeway, engraved joints and a gently descending stair.
  chamfer(2.6, 0.13, 3.4, graphite, 0, 0.14, 8.5, 0.22)
  for (let i = 0; i < 10; i++) {
    box(2.2, 0.045, 0.035, titanium, 0, 0.23, 7.05 + i * 0.3)
  }
  for (const s of [-1, 1]) {
    box(0.045, 0.035, 2.9, energyMat, s * 1.05, 0.24, 8.5)
    for (let k = 0; k < 4; k++) {
      const z = 7.0 + k * 0.9
      chamfer(0.15, 0.48, 0.17, titanium, s * 1.5, 0.29, z, 0.03)
      box(0.12, 0.07, 0.13, amberMat, s * 1.5, 0.55, z)
    }
  }

  for (const [material, parts] of batches) {
    const geometry = mergeGeometries(parts, false)
    if (!geometry) throw new Error('Unable to merge universe architecture material batch')
    geometries.add(geometry)
    for (const part of parts) part.dispose()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `Architecture-${material.uuid.slice(0, 6)}`
    mesh.castShadow = material !== energyMat && material !== amberMat
    mesh.receiveShadow = true
    mesh.frustumCulled = true
    group.add(mesh)
  }
  batches.clear()

  // Only the rotor and energy membrane move. Geometry is otherwise immutable.
  const rotor = new THREE.Group()
  rotor.position.set(0, -0.85, coreZ)
  group.add(rotor)
  const rotorMaterial = new THREE.MeshStandardMaterial({
    color: '#97bcc2', metalness: 0.8, roughness: 0.36,
    emissive: '#49b8ce', emissiveIntensity: 0.35,
  })
  materials.add(rotorMaterial)
  const rotorParts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2
    const blade = new THREE.BoxGeometry(0.4, 0.15, 0.85)
    blade.rotateY(-a + Math.PI / 2 + 0.4)
    blade.translate(Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1)
    rotorParts.push(blade)
  }
  const rotorGeometry = mergeGeometries(rotorParts, false)!
  for (const part of rotorParts) part.dispose()
  geometries.add(rotorGeometry)
  const rotorMesh = new THREE.Mesh(rotorGeometry, rotorMaterial)
  rotor.add(rotorMesh)

  const membraneMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uEnergy: { value: 0 }, uHover: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uEnergy; uniform float uHover;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
        float wave = sin(r * 37.0 - uTime * 1.4) * 0.5 + 0.5;
        float ring = pow(wave, 14.0) * 0.13;
        float center = exp(-r * 3.0) * 0.34;
        float alpha = (center + ring) * smoothstep(1.0, 0.75, r) * uEnergy;
        gl_FragColor = vec4(vec3(0.32, 0.78, 0.89) * (1.0 + uHover * 0.6), alpha);
      }
    `,
  })
  materials.add(membraneMaterial)
  const membraneGeometry = new THREE.CircleGeometry(2.57, 64)
  geometries.add(membraneGeometry)
  const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial)
  membrane.rotation.x = -Math.PI / 2
  membrane.position.set(0, -0.4, coreZ)
  group.add(membrane)

  // Invisible proxy has no render draw (visibility is disabled). Three.js
  // raycasting can still target it directly without including the full model.
  const proxyGeometry = new THREE.CylinderGeometry(3.85, 3.85, 1.6, 32)
  geometries.add(proxyGeometry)
  const proxyMaterial = new THREE.MeshBasicMaterial({ visible: false })
  materials.add(proxyMaterial)
  const core = new THREE.Mesh(proxyGeometry, proxyMaterial)
  core.name = 'Reactor-focus-target'
  core.position.set(0, 0.6, coreZ)
  group.add(core)

  let disposed = false
  return {
    group,
    core,
    update(time: number, energy: number, hover: number) {
      if (disposed) return
      rotor.rotation.y = time * 0.055
      energyMat.emissiveIntensity = energy * (2.3 + Math.sin(time * 0.8) * 0.045 + hover * 0.55)
      amberMat.emissiveIntensity = energy * 0.8
      rotorMaterial.emissiveIntensity = energy * (0.3 + hover * 0.3)
      membraneMaterial.uniforms.uTime.value = time
      membraneMaterial.uniforms.uEnergy.value = energy
      membraneMaterial.uniforms.uHover.value = hover
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials) material.dispose()
      for (const texture of textures) texture.dispose()
      group.clear()
    },
  }
}
