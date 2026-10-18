import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type Island = 'workshop' | 'observatory'
export type ObjectId = 'fabricator' | 'console' | 'drone' | 'beacon' | 'scanner' | 'portal'
export const OBJECTS: { id: ObjectId; island: Island; label: string; position: [number, number, number] }[] = [
  { id: 'fabricator', island: 'workshop', label: 'La fabrique', position: [-105, 4, 4] },
  { id: 'console', island: 'workshop', label: 'Le réseau', position: [-99, 3.5, 5.5] },
  { id: 'drone', island: 'workshop', label: 'Le drone', position: [-91, 5, 3] },
  { id: 'beacon', island: 'observatory', label: 'La balise', position: [27, 12, -79] },
  { id: 'scanner', island: 'observatory', label: 'Le radar', position: [43, 12, -80] },
  { id: 'portal', island: 'observatory', label: 'Le portail', position: [35, 17.7, -84.9] }
]

/** Small inhabitants and working machines, with shared geometry and materials. */
export function createIslandLife() {
  const group = new THREE.Group()
  group.name = 'Inhabitants and interactive equipment'
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const keep = <T extends THREE.BufferGeometry>(geometry: T) => { geometries.add(geometry); return geometry }
  const metal = new THREE.MeshStandardMaterial({ color: '#80999a', roughness: .54, metalness: .65 })
  const dark = new THREE.MeshStandardMaterial({ color: '#203c45', roughness: .7, metalness: .5 })
  const cyan = new THREE.MeshStandardMaterial({ color: '#9ee2df', emissive: '#64d8df', emissiveIntensity: 2 })
  const amber = new THREE.MeshStandardMaterial({ color: '#d1aa71', emissive: '#d49a45', emissiveIntensity: .5 })
  const proxyMaterial = new THREE.MeshBasicMaterial({ visible: false })
  ;[metal, dark, cyan, amber, proxyMaterial].forEach(material => materials.add(material))
  const cube = keep(new THREE.BoxGeometry(1, 1, 1))
  function box(parent: THREE.Object3D, size: number[], position: number[], material = metal) {
    const mesh = new THREE.Mesh(cube, material)
    mesh.scale.set(size[0], size[1], size[2])
    mesh.position.set(position[0], position[1], position[2])
    parent.add(mesh)
    return mesh
  }
  function model(id: ObjectId) {
    const object = new THREE.Group()
    object.position.fromArray(OBJECTS.find(item => item.id === id)!.position)
    object.name = id
    group.add(object)
    return object
  }
  const fabricator = model('fabricator')
  box(fabricator, [3.1, .5, 2.7], [0, -1.5, 0], dark)
  for (const x of [-1.3, 1.3]) box(fabricator, [.2, 2.8, .2], [x, -.1, -.8])
  box(fabricator, [2.8, .24, .4], [0, 1.25, -.8])
  const printHead = box(fabricator, [.7, .5, .6], [0, .9, -.5], amber)
  const artifact = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(.72, 0)), cyan)
  artifact.position.y = -.45
  fabricator.add(artifact)

  const console = model('console')
  box(console, [2.3, 1.1, 1.5], [0, -.65, 0], dark)
  const consoleScreen = box(console, [2.1, .08, 1.35], [0, -.05, 0], cyan)
  consoleScreen.rotation.x = .25
  const network = new THREE.Group()
  network.position.set(0, 1, 0)
  console.add(network)
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(.65 + i * .22, .025, 5, 32)), cyan)
    ring.rotation.set(i * .8, i * 1.1, .3)
    network.add(ring)
  }

  // Each drone body is merged once; three copies share the same two geometries.
  const droneParts = [new THREE.BoxGeometry(1.4, .45, .9)]
  for (const angle of [-.62, .62]) {
    const arm = new THREE.BoxGeometry(3.3, .14, .18)
    arm.rotateY(angle); droneParts.push(arm)
  }
  const droneBody = keep(mergeGeometries(droneParts)!)
  droneParts.forEach(part => part.dispose())
  const rotorParts: THREE.BufferGeometry[] = []
  for (const x of [-1.25, 1.25]) for (const z of [-.85, .85]) {
    const rotor = new THREE.TorusGeometry(.46, .045, 5, 20)
    rotor.rotateX(Math.PI / 2); rotor.translate(x, .14, z); rotorParts.push(rotor)
  }
  const rotorGeometry = keep(mergeGeometries(rotorParts)!)
  rotorParts.forEach(part => part.dispose())
  const drones: THREE.Group[] = []
  for (let i = 0; i < 3; i++) {
    const drone = i === 0 ? model('drone') : new THREE.Group()
    if (i) group.add(drone)
    drone.add(new THREE.Mesh(droneBody, metal), new THREE.Mesh(rotorGeometry, cyan))
    box(drone, [.25, .17, .16], [0, 0, .5], amber)
    drones.push(drone)
  }

  const beacon = model('beacon')
  box(beacon, [1.3, 3.4, 1.3], [0, -.9, 0], dark)
  const beaconLight = new THREE.Mesh(keep(new THREE.OctahedronGeometry(.95)), amber)
  beaconLight.position.y = 1.2; beacon.add(beaconLight)
  const scanner = model('scanner')
  box(scanner, [1.4, 2.4, 1.4], [0, -1.2, 0], metal)
  const dish = new THREE.Group()
  scanner.add(dish)
  const dishMesh = new THREE.Mesh(keep(new THREE.SphereGeometry(1.8, 20, 12, 0, Math.PI * 2, 0, .75)), metal)
  dishMesh.rotation.x = 1.1
  dish.add(dishMesh)
  const dishRing = new THREE.Mesh(keep(new THREE.TorusGeometry(1.25, .045, 5, 36)), cyan)
  dishRing.position.z = 1.2; dish.add(dishRing)

  const portal = model('portal')
  const portalMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uActive: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform float uTime,uActive;
      void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float a=atan(p.y,p.x);
      float spiral=pow(.5+.5*sin(r*35.-a*3.-uTime*1.8),5.);
      float rim=pow(r,5.);float alpha=(.06+spiral*.18+rim*.38)*(1.-smoothstep(.92,1.,r));
      gl_FragColor=vec4(mix(vec3(.25,.65,.8),vec3(.75,.5,.95),uActive),alpha*(1.+uActive));}`
  })
  materials.add(portalMaterial)
  portal.add(new THREE.Mesh(keep(new THREE.CircleGeometry(5.7, 64)), portalMaterial))

  const proxies = new Map<string, THREE.Mesh>()
  for (const item of OBJECTS) {
    const proxy = new THREE.Mesh(keep(new THREE.SphereGeometry(item.id === 'portal' ? 6 : 2.4, 12, 8)), proxyMaterial)
    proxy.position.fromArray(item.position)
    proxy.userData.action = item.id
    proxies.set(item.id, proxy); group.add(proxy)
  }
  for (const [id, position, size] of [
    ['workshop', [-99, 7, -3], [32, 31, 25]],
    ['observatory', [35, 14, -86], [28, 34, 26]]
  ] as const) {
    const proxy = new THREE.Mesh(cube, proxyMaterial)
    proxy.position.fromArray(position); proxy.scale.fromArray(size); proxy.userData.action = id
    proxies.set(id, proxy); group.add(proxy)
  }

  // Warm work suits and articulated legs give the structures a human scale.
  const peopleCount = 16
  const torsos = new THREE.InstancedMesh(keep(new THREE.CapsuleGeometry(.16, .43, 3, 6)), amber, peopleCount)
  const heads = new THREE.InstancedMesh(keep(new THREE.SphereGeometry(.16, 7, 5)), metal, peopleCount)
  const legs = new THREE.InstancedMesh(cube, dark, peopleCount * 2)
  ;[torsos, heads, legs].forEach(mesh => { mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; group.add(mesh) })
  const routes = [
    [[-108, 2.25, 4.5], [-90, 2.25, 4.5]],
    [[-106, 2.25, 6], [-97, 2.25, 5.5]],
    [[28, 7.25, -78], [41, 7.25, -78]],
    [[32, 7.25, -82], [36, 7.25, -75]],
    [[-9, .25, 18], [9, .25, 18]],
    [[-22, 1.25, 6], [-16, 1.25, 11]]
  ]
  const dummy = new THREE.Object3D()
  const state = { printing: true, network: true, dronePatrol: false, beacon: true, scanning: true, portal: false }
  let disposed = false
  return {
    group, proxies, state,
    update(time: number, energy: number) {
      if (disposed) return
      cyan.emissiveIntensity = 1.6 * energy
      amber.emissiveIntensity = .4 + Math.sin(time * 1.5) * .12
      printHead.position.x = state.printing ? Math.sin(time * 1.4) * .9 : 0
      artifact.scale.setScalar(state.printing ? .8 + Math.sin(time) * .12 : .7)
      artifact.rotation.y = state.printing ? time * .5 : 0
      network.rotation.y = state.network ? time * .45 : 0
      network.visible = state.network
      dish.rotation.y = state.scanning ? Math.sin(time * .45) * 1.1 : 0
      beaconLight.rotation.y = time * .55
      beaconLight.visible = state.beacon
      portalMaterial.uniforms.uTime.value = time
      portalMaterial.uniforms.uActive.value = state.portal ? 1 : 0
      drones[0].position.set(-91 + (state.dronePatrol ? Math.sin(time * .28) * 7 : 0), 5 + Math.sin(time * 1.6) * .25 + (state.dronePatrol ? 3 : 0), 3 + (state.dronePatrol ? Math.cos(time * .28) * 4 : 0))
      drones[1].position.set(-25 + Math.sin(time * .09) * 35, 9 + Math.sin(time * .4), 6 + Math.cos(time * .09) * 15)
      drones[2].position.set(32 + Math.sin(time * .15) * 8, 12 + Math.sin(time), -77 + Math.cos(time * .15) * 6)
      drones.forEach((drone, index) => { drone.rotation.y = time * (index ? .12 : .2); drone.rotation.z = Math.sin(time * .8 + index) * .06 })
      proxies.get('drone')!.position.copy(drones[0].position)
      for (let i = 0; i < peopleCount; i++) {
        const [a, b] = routes[i % routes.length]
        const phase = (time * .025 + i * .167) % 2
        const t = phase <= 1 ? phase : 2 - phase
        const x = THREE.MathUtils.lerp(a[0], b[0], t), y = a[1], z = THREE.MathUtils.lerp(a[2], b[2], t)
        dummy.rotation.set(0, Math.atan2(b[0] - a[0], b[2] - a[2]) + (phase > 1 ? Math.PI : 0), 0)
        dummy.scale.setScalar(1); dummy.position.set(x, y + .72, z); dummy.updateMatrix(); torsos.setMatrixAt(i, dummy.matrix)
        dummy.position.y = y + 1.19; dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix)
        for (let side = 0; side < 2; side++) {
          dummy.position.set(x + (side ? .1 : -.1), y + .25, z)
          dummy.scale.set(.12, .5, .13); dummy.rotation.x = Math.sin(time * 5 + i + side * Math.PI) * .4
          dummy.updateMatrix(); legs.setMatrixAt(i * 2 + side, dummy.matrix)
        }
      }
      torsos.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; legs.instanceMatrix.needsUpdate = true
    },
    dispose() {
      disposed = true
      ;[torsos, heads, legs].forEach(mesh => mesh.dispose())
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); group.clear()
    }
  }
}
