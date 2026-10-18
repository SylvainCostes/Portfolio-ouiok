import * as THREE from 'three'
import { createArchitecturalKit, type Plan } from './architectural-kit'

/** V2: inhabited infrastructure terrain, designed in silhouette before surface detail. */
export function createArchitecture() {
  const kit = createArchitecturalKit()
  const { group, m, box, chamfer, bake, loft, pipe, plate, profile, ring } = kit
  group.name = 'Platform Engineering / suspended continent'
  const p = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  const footprint: Plan = [[-29, 4], [-23, 14], [-16, 15], [-16, 22], [-5, 25], [1, 21], [14, 21], [26, 10], [24, 0], [28, -7], [20, -17], [10, -18], [5, -25], [-10, -24], [-17, -18], [-26, -16], [-26, -5], [-31, -1]]
  // Successive terraces carve a geological silhouette from engineered material.
  plate(footprint, 0, 1.35, m.shell, .28)
  plate(footprint.map(([x, z]) => [x * .96, z * .96]), -1.65, 1.2, m.dark, .22)
  plate(footprint.map(([x, z]) => [x * .91 + .8, z * .91 - .4]), -3, 1.5, m.graphite, .2)
  plate([[-23, -16], [-19, -23], [5, -25], [10, -18], [20, -17], [22, -7], [-20, -4]], 2, 2, m.concrete, .24)
  plate([[13, -5], [26, -7], [24, 8], [19, 14], [11, 13]], 3, 3, m.graphite, .25)
  plate([[-26, 1], [-14, -3], [-9, 2], [-12, 15], [-23, 14], [-29, 4]], 1, 1, m.concrete, .18)

  // An irregular multi-keel foundation with deep open bays and flying buttresses.
  bake(loft([{ y: -24, w: 9, d: 12, c: 2, x: 3, z: -4 }, { y: -15, w: 24, d: 23, c: 3, x: 1, z: -3 }, { y: -6, w: 36, d: 33, c: 5 }, { y: -3.5, w: 39, d: 37, c: 5 }]), m.dark)
  for (const [x, z, h] of [[-16, 12, 15], [-8, 18, 20], [3, 15, 16], [14, 12, 18]]) {
    bake(loft([{ y: -h, w: 2.8, d: 3.1, c: .5, z: -3 }, { y: -h + 3, w: 4.3, d: 4, c: .7, z: -2 }, { y: -3.6, w: 6, d: 5.4, c: .8 }]), m.graphite, x, 0, z)
    pipe(p(x - 1, -3.4, z + 2.8), p(x - .8, -h + 1.2, z - 1.4), .13, m.titanium)
    for (let i = 0; i < 3; i++) chamfer(3.8, .25, 4.5, m.shell, x, -6 - i * 2.1, z - .5, 0, .07)
  }
  for (let i = 0; i < footprint.length; i++) {
    const a = footprint[i], b = footprint[(i + 1) % footprint.length]
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz)
    const center = p((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2)
    const angle = Math.atan2(dx, dz)
    chamfer(.45, 2.8, length - .3, m.graphite, center.x, -1.45, center.z, angle, .12)
    box(.04, .11, length * .55, i % 3 ? m.amber : m.dark, center.x * 1.008, -1.2, center.z * 1.008, angle)
    for (let k = 1; k < Math.floor(length / 1.5); k++) {
      const t = k / Math.floor(length / 1.5)
      chamfer(.5, 3.8, .5, m.titanium, a[0] + dx * t, -2.05, a[1] + dz * t, angle, .07)
    }
    const radial = Math.atan2(center.z, center.x)
    const radius = Math.hypot(center.x, center.z)
    profile([[0, -12], [2, -12.8], [radius - 3, -5], [radius, -3], [radius, -1.5], [radius - 4, -2.4], [2, -10]], 1.25, i % 3 ? m.graphite : m.shell, 0, 0, 0, -radial)
    pipe(p(center.x * .86, -3.5, center.z * .86), p(center.x * .35, -12, center.z * .35), .18, m.titanium)
  }
  for (const [x, z, depth] of [[-15, -4, 14], [15, -1, 11], [-8, 13, 10]]) {
    bake(loft([{ y: -depth, w: 2.5, d: 3.2, c: .6 }, { y: -depth + 3, w: 5.4, d: 5.8, c: 1.2 }, { y: -4, w: 7, d: 7, c: 1.6 }]), m.shell, x, 0, z)
    for (let q = 0; q < 4; q++) box(5.5, .24, 5.8, q % 2 ? m.graphite : m.dark, x, -6 - q * 1.1, z)
  }

  // Main asymmetric citadel. Its offset crown, cut-out spine and inclined walls
  // read as one institution, not repeated freestanding server blocks.
  bake(loft([{ y: 2, w: 13, d: 12, c: .9 }, { y: 7, w: 11.8, d: 11, c: .8 }, { y: 25, w: 9, d: 10, c: .7, x: 1.1 }, { y: 29, w: 8.8, d: 9.5, c: .8, x: 1.2 }]), m.graphite, 3, 0, -11)
  bake(loft([{ y: 2, w: 6.2, d: 10, c: .7 }, { y: 31, w: 5, d: 8, c: .6, x: .7 }, { y: 38, w: 3, d: 6, c: .4, x: 1.8 }]), m.shell, 10, 0, -14)
  profile([[-4.3, 3], [-4.3, 31], [-2.3, 35.5], [-1.5, 35.5], [-1.5, 28], [-2.4, 27], [-2.4, 3]], 8.5, m.concrete, 3, 0, -11)
  profile([[4.5, 3], [4.5, 32], [6.3, 37], [7.2, 37], [7.2, 30], [6.3, 29], [6.3, 3]], 7.6, m.titanium, 3, 0, -11)
  chamfer(18, 2.1, 5.5, m.graphite, 5.2, 27.5, -10.2, 0, .4)
  chamfer(10.7, .55, 9.6, m.titanium, 4, 29.3, -11, 0, .15)
  box(7.8, 1.6, .18, m.dark, 4.5, 27.3, -7.35)
  for (let i = 0; i < 8; i++) {
    const x = -.6 + i * 1.1
    box(.27, 22.5, .6, m.titanium, x, 14.5, -5.85)
    box(.54, 20, .15, m.glass, x + .41, 13.7, -6.04)
    for (let row = 0; row < 25; row++) {
      box(.64, .12, .45, m.graphite, x + .4, 4 + row * .83, -5.75)
      if ((row + i) % 7 === 0) box(.18, .065, .06, m.amber, x + .4, 4.2 + row * .83, -5.5)
    }
  }
  for (let i = 0; i < 12; i++) {
    const z = -18.7 + i * .7
    box(.44, 22.6, .18, m.titanium, 8.9, 14.3, z)
    box(.2, 27, .08, m.dark, 13.2, 16.5, z)
  }
  for (const y of [8, 15, 23]) {
    chamfer(12.5, .55, 12.5, m.shell, 3.2, y, -11, 0, .1)
    box(9.1, .07, .07, m.amber, 3, y + .3, -4.68)
  }
  for (const [x, h, z] of [[11.8, 40, -15.2], [10.4, 39, -13.4], [1.1, 32, -12]]) {
    pipe(p(x, h - 3, z), p(x, h, z), .055, m.titanium)
  }
  // Crown service plates and recessed seams continue the facade language into
  // the large inclined silhouettes without covering them in decorative greebles.
  for (const [x, y, z, w, h] of [[.15, 31.2, -6.69, 1.35, 4.5], [9.1, 33.1, -7.15, .75, 4.9], [11.6, 33.5, -10.35, 1.2, 5]]) {
    box(w, h, .055, m.dark, x, y, z)
    for (let q = 0; q < 8; q++) box(w * .86, .07, .11, m.titanium, x, y - h * .4 + q * h * .11, z + .045)
  }
  for (let i = 0; i < 7; i++) {
    chamfer(.7, .6, 2.8, m.dark, .5 + i * 1.1, 29.65, -11, 0, .08)
    box(.18, .7, 2.6, m.titanium, .5 + i * 1.1, 29.9, -11)
  }

  // West works: saw-tooth roof sheds, ventilation stacks and heavy buttresses.
  chamfer(14, 5.2, 18, m.dark, -13.5, 4.6, -7, 0, .4)
  for (let row = 0; row < 6; row++) {
    const z = -14.5 + row * 3
    profile([[-7, 0], [7, 0], [7, 1.2], [-4.4, 3], [-7, 3]], 2.8, m.shell, -13.5, 7.1, z)
    box(.08, 1.65, 2.5, m.glass, -17.9, 8.25, z)
    chamfer(.3, 7.5, .55, m.concrete, -20.4, 5.1, z, 0, .07)
    for (let k = 0; k < 6; k++) box(.12, 3.2, .27, m.titanium, -18.7 + k * 2, 4.4, z + 1.43)
  }
  for (const [x, z, h] of [[-21, -14, 18], [-17.5, -17.5, 14], [-23.5, -9, 11]]) {
    bake(loft([{ y: 2, w: 3.4, d: 4.6, c: .55 }, { y: h - 2, w: 2.5, d: 3.7, c: .4 }, { y: h, w: 1.9, d: 3.7, c: .3, x: -.45 }]), m.concrete, x, 0, z)
    for (let q = 0; q < 4; q++) box(1.7, .13, .12, m.dark, x - .25, h - 1 - q * .42, z + 1.86)
  }
  for (let bay = 0; bay < 5; bay++) {
    const x = -19.1 + bay * 2.7
    chamfer(2.2, 3.9, .3, m.graphite, x, 4.1, 2.14, 0, .08)
    box(1.85, 2.7, .08, m.dark, x, 3.85, 2.31)
    for (let l = 0; l < 8; l++) box(1.8, .08, .12, m.titanium, x, 2.6 + l * .32, 2.36)
    box(1.1, .07, .11, m.amber, x, 5.55, 2.37)
    chamfer(.2, 4.6, .6, m.concrete, x - 1.2, 4.35, 2.1, 0, .06)
  }

  // East: stacked cantilevers, staggered in plan and capped by a long observatory.
  for (let level = 0; level < 4; level++) {
    const x = 15.3 + level * .8, y = 4.6 + level * 3.3
    chamfer(10.3 - level * .6, 2.4, 10 - level * .5, level % 2 ? m.graphite : m.shell, x, y, -.5 - level, -.14, .35)
    box(8.2 - level * .6, .65, .11, m.glass, x, y, 4.52 - level * 1.25, -.14)
    box(5.7, .07, .12, m.amber, x - .4, y + .7, 4.65 - level * 1.25, -.14)
  }
  profile([[-3.5, 3], [-1.2, 16], [.4, 16], [-1.6, 3]], 6, m.concrete, 18.6, 0, -1)
  chamfer(15.5, 1.9, 5.7, m.titanium, 16.8, 17, -3, -.14, .5)
  for (let i = 0; i < 11; i++) box(.14, .6, 4.5, m.dark, 10 + i * 1.2, 18, -3, -.14)

  // A broad, raised reactor court is one district of the continent.
  const coreX = 0, coreZ = 8
  ring(5.4, 4.4, .75, m.graphite, coreX, .2, coreZ)
  ring(4.6, 3.95, .32, m.titanium, coreX, 1, coreZ)
  ring(4.19, 4.05, .09, m.energy, coreX, 1.36, coreZ)
  ring(3.7, 3.48, .2, m.dark, coreX, .73, coreZ)
  ring(3.5, 3.32, .07, m.energy, coreX, .94, coreZ)
  bake(new THREE.CylinderGeometry(3.32, 3.32, .2, 64), m.glass, coreX, .48, coreZ)
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2
    chamfer(.34, .6, .83, m.shell, Math.cos(a) * 4.65, 1.18, coreZ + Math.sin(a) * 4.65, -a + Math.PI / 2, .08)
    if (i % 3 === 0) box(.11, .06, .5, m.amber, Math.cos(a) * 4.65, 1.52, coreZ + Math.sin(a) * 4.65, -a + Math.PI / 2)
  }
  const routes = [[p(-4.5, .16, 8), p(-9, .16, 8), p(-10, .16, -2)], [p(4.5, .16, 8), p(10, .16, 8), p(13, .16, 4)], [p(0, .16, 3.5), p(0, .16, 0), p(3, .16, -4)]]
  for (const route of routes) for (let i = 0; i < route.length - 1; i++) {
    pipe(route[i], route[i + 1], .22, m.dark)
    pipe(route[i].clone().add(p(0, .13, 0)), route[i + 1].clone().add(p(0, .13, 0)), .055, m.energy)
  }
  for (const [a, b, c] of [[p(-29, .22, 4), p(-23, .22, 4), p(-23, .22, 0)], [p(24, 3.23, -7), p(24, 3.23, -2), p(20, 3.23, 0)]]) {
    pipe(a, b, .16, m.dark); pipe(b, c, .16, m.dark)
    pipe(a.clone().add(p(0, .1, 0)), b.clone().add(p(0, .1, 0)), .035, m.energy)
    pipe(b.clone().add(p(0, .1, 0)), c.clone().add(p(0, .1, 0)), .035, m.energy)
  }
  // Scale cues: paved joints, tiny railings, stair flights and service cabinets.
  for (let x = -10; x <= 10; x += 2) for (let z = 15; z <= 19; z += 2) {
    box(1.9, .035, 1.9, (x + z) % 3 ? m.shell : m.graphite, x, .04, z)
  }
  for (const z of [-1, 0, 1, 2, 3, 4]) box(4, .15 + (4 - z) * .15, .88, m.titanium, -14, .075 + (4 - z) * .075, z + 11)
  for (const [x, z] of [[-6, -1], [-10, 17], [9, 14], [-22, 4], [22, 7]]) {
    chamfer(2, 1.8, 3.5, m.graphite, x, .95, z, 0, .15)
    for (let i = 0; i < 7; i++) box(1.7, .08, .12, m.titanium, x, 1.91, z - 1.2 + i * .4)
  }
  for (const [x, y, z] of [[-22, 1.03, 8], [-18, 1.03, 9], [17, 3.03, 8], [20, 3.03, 6], [5, .03, 17]]) {
    box(2.1, .045, 3.2, m.graphite, x, y, z)
    for (let q = 0; q < 10; q++) box(1.9, .06, .085, m.titanium, x, y + .04, z - 1.35 + q * .3)
  }
  // Several handrail runs, not an ornamental ring around the whole landmass.
  for (const [a, b] of [[p(-21, .25, 13), p(-17, .25, 14)], [p(-14, .2, 22), p(-6, .2, 24)], [p(10, .2, 20), p(22, .2, 12)]]) {
    const count = Math.ceil(a.distanceTo(b) / 1.8)
    for (let i = 0; i <= count; i++) { const c = a.clone().lerp(b, i / count); pipe(c, c.clone().add(p(0, .9, 0)), .035, m.titanium, 5) }
    pipe(a.clone().add(p(0, .9, 0)), b.clone().add(p(0, .9, 0)), .04, m.titanium, 6)
  }

  // Foreground arrival viaduct: its cropped edge establishes the viewer inside
  // the environment and leads the eye toward the inhabited central plateau.
  const arrivalA = p(18, .2, 17), arrivalB = p(27, -1.4, 47)
  const direction = arrivalB.clone().sub(arrivalA), length = direction.length()
  const ry = Math.atan2(direction.x, direction.z)
  const center = arrivalA.clone().lerp(arrivalB, .5)
  chamfer(4.5, 1.2, length, m.graphite, center.x, center.y - .7, center.z, ry, .18)
  const cross = p(Math.cos(ry), 0, -Math.sin(ry))
  for (const side of [-1, 1]) {
    const a = arrivalA.clone().addScaledVector(cross, side * 2), b = arrivalB.clone().addScaledVector(cross, side * 2)
    pipe(a.clone().add(p(0, 1.4, 0)), b.clone().add(p(0, 1.4, 0)), .065, m.titanium)
    pipe(a.clone().add(p(0, .15, 0)), b.clone().add(p(0, .15, 0)), .06, m.amber)
    for (let i = 0; i <= 14; i++) { const c = a.clone().lerp(b, i / 14); pipe(c, c.clone().add(p(0, 1.4, 0)), .055, m.titanium, 6) }
  }
  for (const t of [.26, .72]) {
    const c = arrivalA.clone().lerp(arrivalB, t)
    for (const side of [-1, 1]) {
      const foot = c.clone().addScaledVector(cross, side * 2.5)
      profile([[-.8, -4], [.8, -4], [.5, 7.2], [0, 9], [-.6, 8]], 1.2, m.graphite, foot.x, foot.y, foot.z, ry)
    }
    chamfer(6.4, .65, 1.3, m.shell, c.x, c.y + 7.3, c.z, ry, .1)
  }
  kit.finish()

  const membraneGeometry = new THREE.CircleGeometry(3.28, 64)
  const membraneMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uEnergy: { value: 0 }, uHover: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float uTime,uEnergy,uHover;void main(){float r=length(vUv-.5)*2.;float wave=pow(.5+.5*cos(r*32.-uTime),18.)*.11;float alpha=(exp(-r*3.)*.32+wave)*(1.-smoothstep(.8,1.,r))*uEnergy;gl_FragColor=vec4(vec3(.32,.7,.78)*(1.+uHover*.4),alpha);}`
  })
  const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial)
  membrane.rotation.x = -Math.PI / 2; membrane.position.set(coreX, .72, coreZ); group.add(membrane)
  const proxyGeometry = new THREE.CylinderGeometry(5.3, 5.3, 2, 32)
  const proxyMaterial = new THREE.MeshBasicMaterial({ visible: false })
  const core = new THREE.Mesh(proxyGeometry, proxyMaterial)
  core.position.set(coreX, 1.1, coreZ); group.add(core)
  let disposed = false
  return {
    group, core,
    update(time: number, energy: number, hover: number) {
      m.energy.emissiveIntensity = energy * (1.7 + hover * .45)
      m.amber.emissiveIntensity = energy * .65
      membraneMaterial.uniforms.uTime.value = time
      membraneMaterial.uniforms.uEnergy.value = energy
      membraneMaterial.uniforms.uHover.value = hover
    },
    dispose() {
      if (disposed) return; disposed = true
      kit.dispose(); membraneGeometry.dispose(); membraneMaterial.dispose(); proxyGeometry.dispose(); proxyMaterial.dispose()
    }
  }
}
