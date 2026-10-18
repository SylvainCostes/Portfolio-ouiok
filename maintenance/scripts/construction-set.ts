import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { constructionPose } from './construction-cycle'

/** A ceramic and titanium architecture model. All stationary details are batched. */
export function createConstructionSet() {
  const group = new THREE.Group()
  const fixed = new THREE.Group()
  group.add(fixed)
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  const cache = new Map<string, THREE.BufferGeometry>()
  const mat = (color: string, roughness = 0.6, metalness = 0.2) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    materials.add(m)
    return m
  }
  const ceramic = mat('#d9d7cc', 0.68, 0.12)
  const pale = mat('#f0eadd', 0.56, 0.15)
  const graphite = mat('#243a3f', 0.57, 0.55)
  const metal = mat('#78918f', 0.32, 0.72)
  const dark = mat('#152d33', 0.8, 0.2)
  const glass = mat('#335d61', 0.22, 0.55)
  const amber = mat('#dc8a32', 0.4, 0.45)
  const cyan = mat('#7fd6c9', 0.38, 0.25)
  cyan.emissive.set('#3bbaa9')
  cyan.emissiveIntensity = 0.75
  const signal = mat('#ffc782', 0.35, 0.15)
  signal.emissive.set('#f5a947')
  signal.emissiveIntensity = 0.8
  const active = mat('#8bd9cf', 0.3, 0.3)
  active.emissive.set('#40bbac')

  const mesh = (
    geo: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = fixed
  ) => {
    geometries.add(geo)
    const object = new THREE.Mesh(geo, material)
    object.position.set(x, y, z)
    object.castShadow = true
    object.receiveShadow = true
    parent.add(object)
    return object
  }
  const box = (
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = fixed,
    bevel = 0.018
  ) => {
    const key = `b${w},${h},${d},${bevel}`
    if (!cache.has(key))
      cache.set(
        key,
        bevel
          ? new RoundedBoxGeometry(
              w,
              h,
              d,
              1,
              Math.min(bevel, w / 4, h / 4, d / 4)
            )
          : new THREE.BoxGeometry(w, h, d)
      )
    return mesh(cache.get(key)!, material, x, y, z, parent)
  }
  const cylinder = (
    r: number,
    h: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = fixed,
    segments = 12
  ) => {
    const key = `c${r},${h},${segments}`
    if (!cache.has(key))
      cache.set(key, new THREE.CylinderGeometry(r, r, h, segments))
    return mesh(cache.get(key)!, material, x, y, z, parent)
  }
  const beam = (
    a: number[],
    b: number[],
    r: number,
    material: THREE.Material,
    parent: THREE.Object3D = fixed
  ) => {
    const delta = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    const result = cylinder(
      r,
      delta.length(),
      material,
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      (a[2] + b[2]) / 2,
      parent,
      6
    )
    result.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize()
    )
    return result
  }
  const ring = (
    radius: number,
    tube: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = fixed
  ) => {
    const result = mesh(
      new THREE.TorusGeometry(radius, tube, 6, 64),
      material,
      x,
      y,
      z,
      parent
    )
    result.rotation.x = Math.PI / 2
    return result
  }
  function batch(parent: THREE.Group) {
    parent.updateWorldMatrix(true, true)
    const inverse = parent.matrixWorld.clone().invert()
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
    parent.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const material = object.material as THREE.Material
      let geo = object.geometry
        .clone()
        .applyMatrix4(
          new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld)
        )
      if (geo.index) {
        const indexed = geo
        geo = geo.toNonIndexed()
        indexed.dispose()
      }
      for (const attribute of Object.keys(geo.attributes))
        if (!['position', 'normal', 'uv'].includes(attribute))
          geo.deleteAttribute(attribute)
      const list = batches.get(material) ?? []
      list.push(geo)
      batches.set(material, list)
    })
    parent.clear()
    for (const [material, list] of batches) {
      const merged = mergeGeometries(list)
      if (merged) mesh(merged, material, 0, 0, 0, parent)
      list.forEach((geo) => geo.dispose())
    }
  }
  function octagon(w: number, d: number, cut: number) {
    return [
      [-w / 2 + cut, -d / 2],
      [w / 2 - cut, -d / 2],
      [w / 2, -d / 2 + cut],
      [w / 2, d / 2 - cut],
      [w / 2 - cut, d / 2],
      [-w / 2 + cut, d / 2],
      [-w / 2, d / 2 - cut],
      [-w / 2, -d / 2 + cut]
    ]
  }
  function slab(
    w: number,
    d: number,
    h: number,
    material: THREE.Material,
    y: number,
    parent: THREE.Object3D,
    hollow = false
  ) {
    const shape = new THREE.Shape(
      octagon(w, d, 0.32).map((p) => new THREE.Vector2(...p))
    )
    if (hollow) {
      const hole = new THREE.Path()
      hole.absellipse(0, 0, 0.64, 0.54, 0, Math.PI * 2, true, 0)
      shape.holes.push(hole)
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      steps: 1,
      curveSegments: 32
    })
    geo.rotateX(-Math.PI / 2)
    return mesh(geo, material, 0, y, 0, parent)
  }
  function rail(a: number[], b: number[], parent: THREE.Object3D = fixed) {
    beam(a, b, 0.015, metal, parent)
    beam(
      [a[0], a[1] - 0.18, a[2]],
      [b[0], b[1] - 0.18, b[2]],
      0.008,
      metal,
      parent
    )
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.5)
    for (let i = 0; i <= steps; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / steps,
        z = a[2] + ((b[2] - a[2]) * i) / steps
      beam([x, a[1] - 0.4, z], [x, a[1], z], 0.012, metal, parent)
    }
  }

  // A layered, chamfered foundation. Recessed service ducts give the edge depth.
  slab(9.6, 6.6, 0.24, graphite, -0.24, fixed)
  slab(9.4, 6.4, 0.14, metal, 0.03, fixed)
  slab(9.22, 6.22, 0.11, ceramic, 0.2, fixed)
  for (let x = -4.1; x <= 4.2; x += 0.58) {
    box(0.31, 0.07, 0.035, dark, x, -0.08, 3.3)
    box(0.12, 0.018, 0.04, x % 2 > 1 ? cyan : amber, x, -0.02, 3.33)
  }
  for (let x = -4; x < 4.3; x += 0.8) {
    box(0.014, 0.006, 5.8, metal, x, 0.333, 0, fixed, 0)
    box(0.3, 0.006, 0.025, pale, x, 0.34, 2.76, fixed, 0)
  }
  for (let z = -2.5; z < 3; z += 0.8)
    box(8.6, 0.006, 0.014, metal, 0, 0.333, z, fixed, 0)
  for (const x of [-4.1, 4.1]) {
    rail([x, 0.77, -0.9], [x, 0.77, 1.3])
    for (const z of [-2.5, 2.5]) {
      cylinder(0.1, 0.1, graphite, x, 0.37, z)
      cylinder(0.025, 0.65, metal, x, 0.69, z)
      cylinder(0.06, 0.09, cyan, x, 1.03, z)
    }
  }
  // Raised deck and wide approach stairs.
  slab(4.8, 3.6, 0.26, graphite, 0.34, fixed)
  slab(4.66, 3.46, 0.1, pale, 0.61, fixed)
  for (let i = 0; i < 4; i++)
    box(2.3, 0.08, 0.18, ceramic, 0, 0.38 + i * 0.08, 2.02 - i * 0.18)
  for (const x of [-2.17, 2.17]) {
    box(0.045, 0.06, 2.9, cyan, x, 0.64, 0)
    for (let z = -0.9; z < 1.4; z += 0.55)
      box(0.3, 0.03, 0.26, graphite, x, 0.75, z)
  }

  // Five terraced floors surround a real atrium, with facade fins and service ribs.
  const floors: THREE.Group[] = []
  for (let level = 0; level < 5; level++) {
    const floor = new THREE.Group()
    floor.position.set(0.12 * level, 0.79 + level * 1.02, -0.08 * level)
    group.add(floor)
    floors.push(floor)
    const width = 3.9 - level * 0.16,
      depth = 2.8 - level * 0.09
    slab(width, depth, 0.13, pale, 0, floor, true)
    slab(width - 0.14, depth - 0.14, 0.06, graphite, 0.17, floor, true)
    ring(0.66, 0.018, cyan, 0, 0.21, 0, floor)
    if (level < 4) {
      for (const side of [-1, 1]) {
        box(
          width - 0.62,
          0.65,
          0.05,
          glass,
          0,
          0.56,
          side * (depth / 2 - 0.26),
          floor
        )
        for (let x = -width / 2 + 0.26; x < width / 2 - 0.2; x += 0.2) {
          box(
            0.032,
            0.76,
            0.16,
            level % 2 ? metal : ceramic,
            x,
            0.59,
            side * (depth / 2 - 0.13),
            floor,
            0
          )
        }
        box(
          width - 0.44,
          0.025,
          0.03,
          level === 1 ? signal : cyan,
          0,
          0.29,
          side * (depth / 2 - 0.11),
          floor,
          0
        )
        for (const z of [-0.78, -0.3, 0.3, 0.78])
          box(
            0.09,
            0.77,
            0.07,
            metal,
            side * (width / 2 - 0.17),
            0.56,
            z,
            floor
          )
      }
      // Opaque service blocks deliberately alternate with deep glazed recesses.
      box(0.36, 0.78, depth - 0.56, graphite, -width / 2 + 0.35, 0.59, 0, floor)
      for (let z = -0.75; z < 0.8; z += 0.12)
        box(0.12, 0.55, 0.025, metal, -width / 2 + 0.12, 0.56, z, floor, 0)
    } else {
      // The exposed top floor reveals the structure beneath the transported module.
      for (const x of [-1.18, 1.18])
        for (const z of [-0.74, 0.74]) {
          box(0.12, 1.04, 0.12, metal, x, 0.67, z, floor)
          cylinder(0.034, 0.22, amber, x, 1.27, z, floor)
        }
      for (const z of [-0.74, 0.74])
        box(2.5, 0.1, 0.12, metal, 0, 1.13, z, floor)
      rail([-1.42, 0.65, 1.1], [1.42, 0.65, 1.1], floor)
    }
    batch(floor)
  }
  // Three large structural ribbons carry the skyline and leave the atrium readable.
  for (const [x, z, height] of [
    [-1.9, -0.9, 6.8],
    [1.85, -0.8, 7.15],
    [1.8, 0.82, 5.5]
  ]) {
    const spine = box(0.3, height, 0.34, ceramic, x, 0.75 + height / 2, z)
    spine.rotation.z = x < 0 ? -0.045 : 0.045
    box(
      0.06,
      height - 0.2,
      0.07,
      graphite,
      x + 0.08,
      0.75 + height / 2,
      z + 0.2
    )
    for (let y = 1; y < height + 0.2; y += 0.32)
      box(0.4, 0.035, 0.45, metal, x, y, z)
    box(0.035, height - 0.7, 0.04, cyan, x - 0.1, 0.9 + height / 2, z + 0.2)
  }
  beam([-1.88, 1, 0.96], [1.9, 5.4, 0.84], 0.045, metal)
  beam([-1.88, 1, 0.96], [-1.48, 5.68, 0.48], 0.06, graphite)
  // Swept ceramic buttresses turn the regular floors into a single sculptural silhouette.
  // Each ribbon is an extruded structural plate, not a screen-facing decoration.
  const sweep = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-2.22, 0.65, 0),
    new THREE.Vector3(-3.05, 6.7, 0),
    new THREE.Vector3(0.25, 8.8, 0),
    new THREE.Vector3(1.85, 6.65, 0)
  )
  const outline: THREE.Vector2[] = []
  const inner: THREE.Vector2[] = []
  for (let i = 0; i <= 48; i++) {
    const t = i / 48,
      p = sweep.getPoint(t),
      direction = sweep.getTangent(t)
    const width = 0.12 + Math.sin(t * Math.PI) * 0.045
    outline.push(
      new THREE.Vector2(p.x - direction.y * width, p.y + direction.x * width)
    )
    inner.push(
      new THREE.Vector2(p.x + direction.y * width, p.y - direction.x * width)
    )
  }
  const ribbon = new THREE.ExtrudeGeometry(
    new THREE.Shape([...outline, ...inner.reverse()]),
    {
      depth: 0.16,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1
    }
  )
  for (const z of [-1.43, 1.25]) {
    mesh(ribbon, pale, 0, 0, z)
    mesh(
      new THREE.TubeGeometry(sweep, 48, 0.018, 5, false),
      cyan,
      0.03,
      0,
      z + 0.19
    )
  }
  for (let i = 6; i < 25; i += 3) {
    const p = sweep.getPoint(i / 48)
    beam([p.x, p.y, -1.42], [p.x, p.y, 1.4], 0.025, metal)
  }
  // An offset rooftop antenna and open working scaffold.
  box(1.7, 0.12, 1.25, graphite, -0.8, 6.25, -0.78)
  rail([-1.65, 6.71, -1.38], [-0.05, 6.71, -1.38])
  for (let y = 0.7; y < 6.3; y += 0.26)
    beam([-2.38, y, -0.85], [-2.1, y, -0.85], 0.014, metal)
  for (const x of [-2.38, -2.1])
    beam([x, 0.7, -0.85], [x, 6.55, -0.85], 0.018, amber)
  for (let y = 1.7; y < 6; y += 1.4) {
    box(0.72, 0.075, 1.85, graphite, -2.2, y, -0.3)
    rail([-2.53, y + 0.46, -0.95], [-2.53, y + 0.46, 0.5])
    beam([-2.5, y, 0.5], [-2.5, y + 1.4, -0.95], 0.014, metal)
  }

  // Fabrication bay: the hoist returns the same component, never teleports it.
  box(1.9, 0.16, 1.45, graphite, 3.3, 0.43, 1.7)
  for (const x of [2.5, 4.1])
    for (const z of [1.12, 2.28]) box(0.12, 0.18, 0.12, amber, x, 0.55, z)
  for (let z = 1.13; z < 2.3; z += 0.16) {
    const roller = cylinder(0.035, 1.48, metal, 3.3, 0.55, z)
    roller.rotation.z = Math.PI / 2
  }
  // Sidecar infrastructure, cooling fins, cable trays and stacked components.
  for (let i = 0; i < 3; i++) {
    box(0.64, 0.66, 0.72, graphite, 3.2, 0.72, -1.95 + i * 0.79)
    box(0.55, 0.04, 0.65, ceramic, 3.2, 1.07, -1.95 + i * 0.79)
    for (let y = 0.49; y < 0.99; y += 0.075)
      box(0.018, 0.025, 0.57, metal, 3.53, y, -1.95 + i * 0.79, fixed, 0)
    box(0.03, 0.045, 0.18, cyan, 3.55, 1, -1.95 + i * 0.79)
  }
  for (let i = 0; i < 3; i++)
    box(1.2, 0.14, 0.75, ceramic, -3.1, 0.45 + i * 0.2, 1.6)
  for (const x of [-3.68, -2.52]) box(0.06, 0.85, 0.82, amber, x, 0.74, 1.6)
  const pipe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.85, 0.38, -2.5),
    new THREE.Vector3(2, 0.38, -2.7),
    new THREE.Vector3(-1, 0.38, -2.7),
    new THREE.Vector3(-2.8, 0.38, -2.3)
  ])
  mesh(new THREE.TubeGeometry(pipe, 28, 0.042, 6, false), graphite, 0, 0, 0)

  // A lightweight lattice crane, with an actual slewing boom and travelling trolley.
  const mastX = -3.2,
    mastZ = -1.65,
    craneHeight = 9.3
  box(1.3, 0.27, 1.3, graphite, mastX, 0.48, mastZ)
  for (const dx of [-0.25, 0.25])
    for (const dz of [-0.25, 0.25])
      beam(
        [mastX + dx, 0.6, mastZ + dz],
        [mastX + dx, craneHeight, mastZ + dz],
        0.04,
        amber
      )
  for (let y = 0.7; y < craneHeight - 0.5; y += 0.62)
    for (const side of [-1, 1]) {
      beam(
        [mastX - 0.25, y, mastZ + side * 0.25],
        [mastX + 0.25, y + 0.62, mastZ + side * 0.25],
        0.023,
        amber
      )
      beam(
        [mastX + side * 0.25, y, mastZ - 0.25],
        [mastX + side * 0.25, y + 0.62, mastZ + 0.25],
        0.023,
        amber
      )
      beam(
        [mastX - 0.25, y, mastZ + side * 0.25],
        [mastX + 0.25, y, mastZ + side * 0.25],
        0.027,
        graphite
      )
    }
  const boom = new THREE.Group()
  boom.position.set(mastX, craneHeight, mastZ)
  group.add(boom)
  cylinder(0.43, 0.19, graphite, 0, 0, 0, boom)
  for (const z of [-0.2, 0.2]) {
    beam([-1.55, 0.2, z], [7.5, 0.2, z], 0.04, amber, boom)
    beam([-1.55, 0.58, 0], [7.5, 0.58, 0], 0.03, amber, boom)
    for (let x = -1.5; x < 7.1; x += 0.5) {
      beam([x, 0.2, z], [x + 0.25, 0.58, 0], 0.018, amber, boom)
      beam([x + 0.25, 0.58, 0], [x + 0.5, 0.2, z], 0.018, amber, boom)
    }
  }
  for (let x = -1.5; x < -0.7; x += 0.2)
    box(0.17, 0.65, 0.85, graphite, x, -0.04, 0, boom)
  beam([0, 0.3, 0], [0, 1.1, 0], 0.04, metal, boom)
  beam([0, 1.1, 0], [5.9, 0.58, 0], 0.012, graphite, boom)
  beam([0, 1.1, 0], [-1.45, 0.58, 0], 0.012, graphite, boom)
  box(0.54, 0.57, 0.6, ceramic, 0.3, -0.15, -0.45, boom)
  box(0.43, 0.28, 0.02, glass, 0.3, -0.14, -0.76, boom)
  cylinder(0.055, 0.1, signal, 0, 1.15, 0, boom)
  batch(boom)
  const trolley = new THREE.Group()
  group.add(trolley)
  box(0.46, 0.18, 0.63, graphite, 0, 0, 0, trolley)
  for (const x of [-0.2, 0.2])
    for (const z of [-0.23, 0.23])
      cylinder(0.08, 0.05, metal, x, 0.02, z, trolley)
  batch(trolley)
  const load = new THREE.Group()
  group.add(load)
  box(1.78, 0.18, 1.1, pale, 0, -0.22, 0, load)
  box(1.52, 0.4, 0.83, glass, 0, 0.04, 0, load)
  box(1.86, 0.1, 1.18, ceramic, 0, 0.3, 0, load)
  for (let x = -0.73; x < 0.8; x += 0.18)
    for (const z of [-0.47, 0.47]) box(0.03, 0.43, 0.1, metal, x, 0.03, z, load)
  box(1.5, 0.025, 0.025, active, 0, -0.08, 0.53, load)
  batch(load)
  const hook = new THREE.Group()
  group.add(hook)
  box(0.31, 0.15, 0.26, amber, 0, 0, 0, hook)
  for (const x of [-0.72, 0.72])
    beam([0, -0.07, 0], [x, -0.35, 0], 0.012, metal, hook)
  batch(hook)
  const cable = cylinder(0.009, 1, graphite, 0, 0, 0, group, 6)

  // A restrained etched identity on the face of the architectural model.
  const sign = document.createElement('canvas')
  sign.width = 256
  sign.height = 80
  const ctx = sign.getContext('2d')!
  ctx.fillStyle = '#243a3f'
  ctx.fillRect(0, 0, 256, 80)
  ctx.fillStyle = '#e6dfcf'
  ctx.font = '500 48px Arial'
  ctx.fillText('SC', 14, 57)
  ctx.fillStyle = '#dc8a32'
  ctx.fillRect(108, 38, 126, 3)
  const texture = new THREE.CanvasTexture(sign)
  texture.colorSpace = THREE.SRGBColorSpace
  textures.add(texture)
  const signMaterial = new THREE.MeshBasicMaterial({ map: texture })
  materials.add(signMaterial)
  mesh(new THREE.PlaneGeometry(1.15, 0.35), signMaterial, -2.6, 0.01, 3.31)
  batch(fixed)

  const rotations = floors.map((floor) => floor.position.clone())
  let phase = ''
  return {
    group,
    update(time: number, scatter: number) {
      const pose = constructionPose(time)
      phase = pose.phase
      floors.forEach((floor, index) => {
        floor.position.copy(rotations[index])
        floor.position.y += scatter * index * 0.3
        floor.position.x += scatter * (index % 2 ? 0.38 : -0.38)
      })
      load.position.set(pose.x, Math.min(8.45, pose.y + scatter * 0.85), pose.z)
      const dx = load.position.x - mastX,
        dz = load.position.z - mastZ
      boom.rotation.y = -Math.atan2(dz, dx)
      trolley.position.set(load.position.x, craneHeight + 0.16, load.position.z)
      trolley.rotation.y = boom.rotation.y
      hook.position.copy(load.position)
      hook.position.y += 0.71
      const cableLength = craneHeight + 0.08 - hook.position.y
      cable.scale.y = cableLength
      cable.position.set(
        load.position.x,
        hook.position.y + cableLength / 2,
        load.position.z
      )
      active.emissiveIntensity = 0.35 + pose.activation * 2
      cyan.emissiveIntensity = 0.52 + pose.activation * 0.5
      signal.emissiveIntensity = 0.7 + Math.sin(time * 1.5) * 0.2
    },
    get phase() {
      return phase
    },
    dispose() {
      geometries.forEach((geo) => geo.dispose())
      materials.forEach((material) => material.dispose())
      textures.forEach((texture) => texture.dispose())
      group.clear()
    }
  }
}
