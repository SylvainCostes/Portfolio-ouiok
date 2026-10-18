import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/** Two distant architectural destinations and their suspended service bridges.
 * Original geometry only. Everything is merged by material; bridge energy is
 * animated in one shared shader, without per-frame geometry allocations.
 */
export function createArchipelago() {
  const group = new THREE.Group()
  group.name = 'Suspended-archipelago'
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const origin = new THREE.Vector3()
  const temp = new THREE.Object3D()
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

  function metal(color: string, roughness = 0.72, metalness = 0.45) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    materials.add(m)
    return m
  }
  const graphite = metal('#263840')
  const titanium = metal('#71838a', 0.53, 0.68)
  const concrete = metal('#586a70', 0.87, 0.18)
  const pale = metal('#95a6a7', 0.78, 0.25)
  const dark = metal('#10252c', 0.8, 0.4)
  const copper = metal('#a07b50', 0.63, 0.55)
  const energyMaterial = new THREE.MeshStandardMaterial({
    color: '#6eb9c4', emissive: '#57c9dc', emissiveIntensity: 1.9,
    metalness: 0.15, roughness: 0.35,
  })
  const amberMaterial = new THREE.MeshStandardMaterial({
    color: '#d3ac6d', emissive: '#e5ad59', emissiveIntensity: 1.1,
    metalness: 0.25, roughness: 0.4,
  })
  materials.add(energyMaterial)
  materials.add(amberMaterial)

  function bake(geometry: THREE.BufferGeometry, material: THREE.Material,
    x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    temp.position.set(x + origin.x, y + origin.y, z + origin.z)
    temp.rotation.set(rx, ry, rz)
    temp.scale.set(1, 1, 1)
    temp.updateMatrix()
    geometry.applyMatrix4(temp.matrix)
    const flat = geometry.index ? geometry.toNonIndexed() : geometry
    if (flat !== geometry) geometry.dispose()
    flat.deleteAttribute('uv')
    if (!flat.getAttribute('normal')) flat.computeVertexNormals()
    const parts = batches.get(material) ?? []
    parts.push(flat)
    batches.set(material, parts)
  }
  function box(w: number, h: number, d: number, material: THREE.Material,
    x = 0, y = 0, z = 0, ry = 0) {
    bake(new THREE.BoxGeometry(w, h, d), material, x, y, z, 0, ry)
  }
  function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, material: THREE.Material, segments = 6) {
    const delta = b.clone().sub(a)
    const center = a.clone().add(b).multiplyScalar(0.5)
    const g = new THREE.CylinderGeometry(r, r, delta.length(), segments)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), delta.normalize()))
    bake(g, material, center.x, center.y, center.z)
  }
  function beam(a: THREE.Vector3, b: THREE.Vector3, width: number, height: number, material: THREE.Material) {
    const delta = b.clone().sub(a)
    const center = a.clone().add(b).multiplyScalar(0.5)
    const g = new THREE.BoxGeometry(width, height, delta.length())
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, 0, 1), delta.normalize()))
    bake(g, material, center.x, center.y, center.z)
  }
  type Plan = [number, number][]
  type Level = { y: number; scale: number; dx?: number; dz?: number }
  function polygonLoft(plan: Plan, levels: Level[]) {
    const points: number[] = [], indices: number[] = [], n = plan.length
    for (const l of levels) {
      for (const [x, z] of plan) points.push(x * l.scale + (l.dx ?? 0), l.y, z * l.scale + (l.dz ?? 0))
    }
    for (let j = 0; j < levels.length - 1; j++) {
      for (let i = 0; i < n; i++) {
        const a = j * n + i, b = j * n + (i + 1) % n
        indices.push(a, a + n, b, b, a + n, b + n)
      }
    }
    for (let i = 1; i < n - 1; i++) {
      indices.push(0, i, i + 1)
      const top = n * (levels.length - 1)
      indices.push(top, top + i + 1, top + i)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    g.setIndex(indices)
    const flat = g.toNonIndexed()
    g.dispose()
    flat.computeVertexNormals()
    return flat
  }
  function chamfer(w: number, h: number, d: number, material: THREE.Material,
    x: number, y: number, z: number, cut = 0.3, ry = 0) {
    const a = w / 2, b = d / 2, c = Math.min(cut, a * 0.7, b * 0.7)
    const plan: Plan = [[-a + c, -b], [a - c, -b], [a, -b + c], [a, b - c],
      [a - c, b], [-a + c, b], [-a, b - c], [-a, -b + c]]
    bake(polygonLoft(plan, [{ y: -h / 2, scale: 0.95 },
      { y: -h / 2 + Math.min(0.1, h / 4), scale: 1 },
      { y: h / 2 - Math.min(0.1, h / 4), scale: 1 },
      { y: h / 2, scale: 0.95 }]), material, x, y, z, 0, ry)
  }

  function foundation(plan: Plan, skew: number) {
    bake(polygonLoft(plan, [
      { y: -12.4, scale: 0.14, dx: skew, dz: -1.8 },
      { y: -9.5, scale: 0.3, dx: skew * 0.75, dz: -1.2 },
      { y: -6.6, scale: 0.56, dx: skew * 0.4, dz: -0.5 },
      { y: -2.2, scale: 0.84 }, { y: -0.55, scale: 0.97 },
    ]), graphite)
    bake(polygonLoft(plan, [{ y: -0.75, scale: 0.97 },
      { y: -0.3, scale: 1.02 }, { y: 0.2, scale: 1 },
    ]), concrete)
    bake(polygonLoft(plan, [{ y: -2.7, scale: 0.85 },
      { y: -2.3, scale: 0.88 }, { y: -2.0, scale: 0.86 },
    ]), titanium)
    for (let i = 0; i < plan.length; i++) {
      const [x, z] = plan[i], [nx, nz] = plan[(i + 1) % plan.length]
      const top = v(x * 0.96, -0.9, z * 0.96)
      const bottom = v(x * 0.27 + skew, -10.4, z * 0.27 - 1.5)
      beam(top, bottom, 0.4, 0.32, titanium)
      rod(top.clone().add(v(0.3, -0.3, 0.2)), bottom.clone().add(v(0.3, 0.5, 0.2)), 0.055, energyMaterial)
      beam(v(x * 0.86, -2.6, z * 0.86), v(nx * 0.86, -2.6, nz * 0.86), 0.21, 0.2, dark)
      const edgeA = v(x, 0.28, z), edgeB = v(nx, 0.28, nz)
      beam(edgeA, edgeB, 0.09, 0.08, titanium)
      const mid = edgeA.clone().lerp(edgeB, 0.5)
      chamfer(1.5, 0.3, 0.7, dark, mid.x * 0.94, -1.0, mid.z * 0.94, 0.15,
        Math.atan2(nx - x, nz - z))
      const innerA = edgeA.clone().lerp(edgeB, 0.22).multiplyScalar(0.99).setY(-0.65)
      const innerB = edgeA.clone().lerp(edgeB, 0.72).multiplyScalar(0.99).setY(-0.65)
      beam(innerA, innerB, 0.055, 0.055, i % 2 ? amberMaterial : energyMaterial)
      // Recess-like armor cassettes follow the sloping hull face. Their narrow
      // borders articulate the otherwise broad structural panels at distance.
      const facePoint = (t: number, y: number) => {
        const f = (-y - 2.2) / 4.4
        const scale = 0.84 - f * 0.28
        const px = (x + (nx - x) * t) * scale + skew * f * 0.4
        const pz = (z + (nz - z) * t) * scale - f * 0.5
        const out = v(px, 0, pz).normalize().multiplyScalar(0.055)
        return v(px + out.x, y, pz + out.z)
      }
      const pa = facePoint(0.17, -3.0), pb = facePoint(0.83, -3.0)
      const pc = facePoint(0.83, -5.6), pd = facePoint(0.17, -5.6)
      const panel = new THREE.BufferGeometry()
      panel.setAttribute('position', new THREE.Float32BufferAttribute([
        ...pa.toArray(), ...pb.toArray(), ...pc.toArray(),
        ...pa.toArray(), ...pc.toArray(), ...pd.toArray(),
      ], 3))
      panel.computeVertexNormals()
      bake(panel, i % 3 === 0 ? dark : concrete)
      rod(pd, pc, 0.045, titanium)
    }
  }

  // WEST / fabrication hangar. A long vaulted shell contrasts with the central
  // cathedral's vertical architecture. Its exposed roof ribs reveal its span.
  origin.set(-99, 2, -3)
  const leftPlan: Plan = [[-14, -5], [-9, -11], [4, -12], [12, -5],
    [13, 4], [5, 10], [-9, 9], [-15, 2]]
  foundation(leftPlan, -1.4)
  const vault = new THREE.Shape()
  vault.moveTo(-7.2, 0)
  vault.lineTo(-7.2, 1.6)
  vault.quadraticCurveTo(-6.9, 5.9, 0, 7.1)
  vault.quadraticCurveTo(6.9, 5.9, 7.2, 1.6)
  vault.lineTo(7.2, 0)
  vault.lineTo(6.65, 0)
  vault.lineTo(6.65, 1.6)
  vault.quadraticCurveTo(6.3, 5.4, 0, 6.55)
  vault.quadraticCurveTo(-6.3, 5.4, -6.65, 1.6)
  vault.lineTo(-6.65, 0)
  vault.closePath()
  bake(new THREE.ExtrudeGeometry(vault, { depth: 12.5, bevelEnabled: false,
    curveSegments: 16, steps: 1 }), graphite, -1, 0.45, -7.0)
  for (let z = -7.0; z <= 5.5; z += 1.55) {
    bake(new THREE.ExtrudeGeometry(vault, { depth: 0.16, bevelEnabled: true,
      bevelSize: 0.07, bevelThickness: 0.06, bevelSegments: 1,
      curveSegments: 16, steps: 1 }), titanium, -1, 0.45, z)
  }
  // Dark inner end wall and large entrance reveal the shell as a usable volume.
  chamfer(12.8, 4.1, 0.35, dark, -1, 2.5, -6.8, 0.4)
  for (let i = 0; i < 13; i++) {
    box(0.09, 4.0, 0.19, concrete, -6.6 + i * 0.94, 2.6, -6.5)
  }
  beam(v(-7.3, 0.75, 5.8), v(5.3, 0.75, 5.8), 0.12, 0.1, amberMaterial)
  for (const x of [-6, -2.5, 1, 4.5]) {
    beam(v(x, 0.33, 2.7), v(x + 1.5, 0.33, 7.5), 0.1, 0.045, titanium)
  }
  // Raised loading apron and attached low service plant.
  chamfer(11.5, 0.3, 2.6, concrete, -1.2, 0.35, 7.1, 0.35)
  chamfer(3.7, 2.5, 5.5, graphite, 8.3, 1.65, -1.3, 0.5)
  for (let i = 0; i < 13; i++) box(3.25, 0.13, 0.09, titanium, 8.3, 3.0, -3.5 + i * 0.37)
  for (let i = 0; i < 6; i++) {
    beam(v(6.1, 0.55, -3.6 + i * 0.65), v(5.1, 0.55, -3.6 + i * 0.65), 0.09, 0.07, copper)
  }
  // A tall asymmetrical vane has a tapered, machined profile; it is a skyline
  // landmark rather than another server tower.
  const vanePlan: Plan = [[-0.8, -1.6], [0.8, -1.6], [1.25, 1.1], [-1.1, 1.4]]
  bake(polygonLoft(vanePlan, [{ y: 0.5, scale: 1.2 },
    { y: 10, scale: 1.0, dx: 1.1 }, { y: 18.8, scale: 0.4, dx: 2.4 },
    { y: 21.5, scale: 0.12, dx: 3.1 }]), concrete, -9.8, 0, -4.5)
  beam(v(-9.2, 2.2, -2.85), v(-7.0, 18.2, -3.7), 0.085, 0.085, energyMaterial)
  for (let i = 0; i < 5; i++) {
    const y = 4 + i * 2.6, x = -9.7 + i * 0.39
    chamfer(2.0 - i * 0.14, 0.18, 2.9 - i * 0.27, titanium, x, y, -4.4, 0.16)
  }
  // Dock connects exactly to the bridge's western endpoint.
  chamfer(5.3, 0.35, 3.5, concrete, 12.8, 0.05, 1.0, 0.35)
  beam(v(8, 0.35, 2), v(14, 0.35, 1), 0.06, 0.04, energyMaterial)

  // NORTH-EAST / gateway. Two split pylons embrace a vertical annular aperture;
  // the clear circular void is the dominant shape at this distance.
  origin.set(35, 7, -86)
  const rightPlan: Plan = [[-10, -10], [5, -11], [12, -2],
    [8, 10], [-5, 12], [-13, 5]]
  foundation(rightPlan, 1.5)
  for (const s of [-1, 1]) {
    const spirePlan: Plan = [[-1.8, -1.6], [1.4, -1.6], [1.9, -0.6],
      [1.5, 1.4], [-1.5, 1.5], [-1.9, 0.5]]
    bake(polygonLoft(spirePlan, [{ y: 0.4, scale: 1.35 },
      { y: 6, scale: 1.05, dx: s * 0.9 },
      { y: 17.0, scale: 0.62, dx: s * 1.8 },
      { y: 23.5 - (s === 1 ? 2.3 : 0), scale: 0.25, dx: s * 2.1 },
    ]), concrete, s * 5.1, 0, -1.3)
    beam(v(s * 5.0, 1.2, 0.3), v(s * 6.9, 19.5, -0.35), 0.1, 0.1, energyMaterial)
    for (let i = 0; i < 8; i++) {
      const y = 2.4 + i * 1.8, x = s * (5.2 + i * 0.21)
      chamfer(2.5 - i * 0.14, 0.2, 2.8 - i * 0.12, graphite, x, y, -1.25, 0.2)
    }
  }
  const ringShape = new THREE.Shape()
  ringShape.absarc(0, 0, 6.65, 0, Math.PI * 2, false)
  const ringHole = new THREE.Path()
  ringHole.absarc(0, 0, 5.72, 0, Math.PI * 2, true)
  ringShape.holes.push(ringHole)
  bake(new THREE.ExtrudeGeometry(ringShape, { depth: 0.95,
    bevelEnabled: true, bevelSize: 0.17, bevelThickness: 0.14,
    bevelSegments: 2, curveSegments: 64, steps: 1 }), titanium, 0, 10.7, -0.2)
  bake(new THREE.TorusGeometry(5.79, 0.095, 6, 96), energyMaterial, 0, 10.7, 0.88)
  bake(new THREE.TorusGeometry(6.4, 0.07, 6, 96), dark, 0, 10.7, 0.96)
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2
    chamfer(0.28, 0.75, 0.25, graphite,
      Math.cos(a) * 6.2, Math.sin(a) * 6.2 + 10.7, 1.0, 0.05)
    if (i % 4 === 0) {
      box(0.1, 0.3, 0.08, amberMaterial,
        Math.cos(a) * 6.2, Math.sin(a) * 6.2 + 10.7, 1.17)
    }
  }
  chamfer(9.3, 1.0, 4.8, graphite, 0, 0.7, 0.2, 0.6)
  chamfer(7.6, 0.3, 3.4, titanium, 0, 1.38, 0.2, 0.4)
  for (let i = 0; i < 8; i++) {
    box(0.07, 0.055, 5.8, energyMaterial, -2.5 + i * 0.7, 0.3, 5.4)
    chamfer(0.17, 0.35, 2.7, titanium, -2.5 + i * 0.7, 1.65, 0.2, 0.03)
  }
  for (const s of [-1, 1]) {
    chamfer(2.0, 2.3, 4.7, dark, s * 7.8, 1.5, 4.7, 0.32)
    for (let i = 0; i < 8; i++) box(1.7, 0.1, 0.08, titanium, s * 7.8, 2.8, 3.1 + i * 0.42)
  }
  // The approach apron extends from the angular platform to the east bridge.
  chamfer(4.1, 0.35, 5.5, concrete, -2, 0.05, 12.0, 0.4)

  origin.set(0, 0, 0)
  const pulseParts: THREE.BufferGeometry[] = []
  function bridge(start: THREE.Vector3, end: THREE.Vector3, variant: number) {
    const direction = end.clone().sub(start)
    const length = direction.length()
    const side = v(direction.z, 0, -direction.x).normalize()
    const width = 2.85
    const sections = Math.ceil(length / 1.7)
    const point = (t: number) => start.clone().lerp(end, t).add(v(0, -Math.sin(t * Math.PI) * 0.35, 0))
    const cable = (t: number, sign: number) => {
      // Catenary normalized between the two endpoint pylons. Both ends follow
      // their deck altitude, so the inclined northern bridge remains coherent.
      const k = 1.95
      const sag = (Math.cosh(k * (2 * t - 1)) - 1) / (Math.cosh(k) - 1)
      return start.clone().lerp(end, t).addScaledVector(side, sign * (width / 2 + 0.2))
        .add(v(0, 1.25 + sag * 6.1, 0))
    }
    for (let i = 0; i < sections; i++) {
      const ta = i / sections, tb = (i + 1) / sections
      const a = point(ta), b = point(tb)
      beam(a, b, width, 0.16, graphite)
      // Transverse walking-deck joints avoid a long featureless strip.
      beam(a.clone().addScaledVector(side, -width / 2),
        a.clone().addScaledVector(side, width / 2), 0.04, 0.045, titanium)
      for (const s of [-1, 1]) {
        const edgeA = a.clone().addScaledVector(side, s * width / 2)
        const edgeB = b.clone().addScaledVector(side, s * width / 2)
        beam(edgeA, edgeB, 0.12, 0.25, titanium)
        beam(edgeA.clone().add(v(0, -0.8, 0)), edgeB.clone().add(v(0, -0.8, 0)), 0.09, 0.12, graphite)
        rod(edgeA, edgeB.clone().add(v(0, -0.8, 0)), 0.045, titanium)
        rod(edgeA.clone().add(v(0, -0.8, 0)), edgeB, 0.045, titanium)
        rod(cable(ta, s), cable(tb, s), 0.075, titanium, 8)
        if (i % 2 === 0) rod(edgeA, cable(ta, s), 0.028, pale)
        rod(edgeA.clone().add(v(0, 0.85, 0)), edgeB.clone().add(v(0, 0.85, 0)), 0.026, titanium)
        if (i % 3 === 0) rod(edgeA, edgeA.clone().add(v(0, 0.85, 0)), 0.025, titanium)
      }
      // A thin ribbon carries distance in its UVs. The fragment shader creates
      // a slow, low-amplitude energy pulse rather than chasing bright dots.
      const delta = b.clone().sub(a), center = a.clone().add(b).multiplyScalar(0.5)
      const ribbon = new THREE.PlaneGeometry(0.065, delta.length() + 0.015)
      ribbon.rotateX(-Math.PI / 2)
      ribbon.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, 0, 1), delta.normalize()))
      ribbon.translate(center.x, center.y + 0.105, center.z)
      const uv = ribbon.getAttribute('uv')
      for (let q = 0; q < uv.count; q++) {
        uv.setY(q, (ta + uv.getY(q) / sections) * (variant === 0 ? 1 : -1))
      }
      pulseParts.push(ribbon)
    }
    for (const t of [0, 1]) {
      const deck = point(t)
      for (const s of [-1, 1]) {
        const foot = deck.clone().addScaledVector(side, s * (width / 2 + 0.2))
        beam(foot.clone().add(v(0, -0.4, 0)), foot.clone().add(v(0, 7.55, 0)), 0.32, 0.4, graphite)
        rod(foot.clone().add(v(0, 0.7, 0)), foot.clone().add(v(0, 7.6, 0)), 0.055, copper)
        chamfer(0.65, 0.35, 0.65, concrete, foot.x, foot.y + 0.2, foot.z, 0.1)
        box(0.17, 0.13, 0.17, amberMaterial, foot.x, foot.y + 7.7, foot.z)
      }
      beam(deck.clone().addScaledVector(side, -width / 2 - 0.2).add(v(0, 6.7, 0)),
        deck.clone().addScaledVector(side, width / 2 + 0.2).add(v(0, 6.7, 0)), 0.21, 0.32, titanium)
    }
  }
  bridge(v(-29, 0, 4), v(-85, 2, -2), 0)
  bridge(v(24, 3, -7), v(33, 7, -72), 1)

  // A few distant service stacks are only silhouettes; they are deliberately
  // much simpler than either reachable architectural destination.
  for (const [x, y, z, size] of [[-98, -2, -139, 10], [63, 5, -168, 8], [5, -9, -193, 12]]) {
    origin.set(x, y, z)
    const p: Plan = [[-size, -4], [-size * 0.4, -7], [size * 0.7, -5],
      [size, 3], [size * 0.1, 6], [-size * 0.8, 4]]
    bake(polygonLoft(p, [{ y: -size * 0.8, scale: 0.2 },
      { y: -1, scale: 1 }, { y: 0, scale: 1 }]), graphite)
    chamfer(size * 0.3, size * 1.1, size * 0.4, graphite, 0, size * 0.55, -1, 0.4)
    chamfer(size * 0.18, size * 0.65, size * 0.3, graphite, -size * 0.4, size * 0.32, 1, 0.3)
  }
  origin.set(0, 0, 0)

  for (const [material, parts] of batches) {
    const geometry = mergeGeometries(parts, false)
    if (!geometry) throw new Error('Unable to merge archipelago geometry')
    for (const part of parts) part.dispose()
    geometries.add(geometry)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = false
    mesh.receiveShadow = true
    group.add(mesh)
  }
  batches.clear()

  const pulseGeometry = mergeGeometries(pulseParts, false)!
  for (const part of pulseParts) part.dispose()
  geometries.add(pulseGeometry)
  const pulseMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, fog: false,
    uniforms: { uTime: { value: 0 }, uEnergy: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying float vDistance;
      void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);
      vDistance=length(mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec2 vUv; varying float vDistance;
      uniform float uTime; uniform float uEnergy;
      void main(){float pulse=pow(0.5+0.5*sin(vUv.y*23.0-uTime*0.75),8.0);
      float fade=1.0-smoothstep(90.0,240.0,vDistance);
      gl_FragColor=vec4(vec3(0.29,0.75,0.87)*(1.0+pulse*0.55),
      (0.34+pulse*0.35)*uEnergy*fade);}`,
  })
  materials.add(pulseMaterial)
  group.add(new THREE.Mesh(pulseGeometry, pulseMaterial))

  let disposed = false
  return {
    group,
    update(time: number, energy: number) {
      if (disposed) return
      energyMaterial.emissiveIntensity = energy * (1.85 + Math.sin(time * 0.4) * 0.035)
      amberMaterial.emissiveIntensity = energy * 1.05
      pulseMaterial.uniforms.uTime.value = time
      pulseMaterial.uniforms.uEnergy.value = energy
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials) material.dispose()
      group.clear()
    },
  }
}
