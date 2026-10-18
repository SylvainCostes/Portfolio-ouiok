import * as THREE from 'three'

type Finish = 'ivory' | 'graphite' | 'metal' | 'amber' | 'signal'
type Primitive = 'box' | 'sphere' | 'cylinder' | 'ring'
type Part = { node: THREE.Object3D; primitive: Primitive; finish: Finish }
type Batch = { mesh: THREE.InstancedMesh; parts: Part[] }
type Technician = {
  root: THREE.Object3D
  head: THREE.Object3D
  arms: THREE.Object3D[]
  forearms: THREE.Object3D[]
  legs: THREE.Object3D[]
  knees: THREE.Object3D[]
  phase: number
}

/** Small, physical occupants for the construction model. Time is owned by the scene. */
export function createConstructionLife(): {
  group: THREE.Group
  update(time: number, pointerX: number, pointerY: number): void
  dispose(): void
} {
  const group = new THREE.Group()
  group.name = 'construction-life'
  // Transform-only rigs stay outside the rendered hierarchy. Every visible part
  // is copied into an instance, so articulated occupants share their draw calls.
  const rigs = new THREE.Group()
  const parts: Part[] = []
  const geometry: Record<Primitive, THREE.BufferGeometry> = {
    box: new THREE.BoxGeometry(1, 1, 1),
    sphere: new THREE.SphereGeometry(1, 12, 8),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    ring: new THREE.TorusGeometry(1, 0.065, 6, 32)
  }
  const material: Record<Finish, THREE.MeshStandardMaterial> = {
    ivory: new THREE.MeshStandardMaterial({
      color: '#d8d4c8',
      roughness: 0.39,
      metalness: 0.23
    }),
    graphite: new THREE.MeshStandardMaterial({
      color: '#21383d',
      roughness: 0.48,
      metalness: 0.5
    }),
    metal: new THREE.MeshStandardMaterial({
      color: '#768e8b',
      roughness: 0.28,
      metalness: 0.78
    }),
    amber: new THREE.MeshStandardMaterial({
      color: '#dd882d',
      roughness: 0.38,
      metalness: 0.32
    }),
    signal: new THREE.MeshStandardMaterial({
      color: '#67d0c5',
      emissive: '#67d0c5',
      emissiveIntensity: 1.25,
      roughness: 0.3,
      metalness: 0.2
    })
  }

  function pivot(parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    const node = new THREE.Object3D()
    node.position.set(x, y, z)
    parent.add(node)
    return node
  }

  function part(
    parent: THREE.Object3D,
    primitive: Primitive,
    finish: Finish,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rx = 0,
    ry = 0,
    rz = 0
  ) {
    const node = pivot(parent, x, y, z)
    node.scale.set(sx, sy, sz)
    node.rotation.set(rx, ry, rz)
    parts.push({ node, primitive, finish })
    return node
  }

  const drones: {
    root: THREE.Object3D
    sensor: THREE.Object3D
    rotors: THREE.Object3D[]
  }[] = []
  for (let i = 0; i < 2; i++) {
    const root = pivot(rigs)
    root.name = `inspection-drone-${i + 1}`
    root.scale.setScalar(i === 0 ? 1 : 0.84)
    const rotors: THREE.Object3D[] = []
    // A layered oval fuselage, inset spine and exposed undercarriage.
    part(root, 'sphere', 'graphite', 0, -0.022, 0, 0.22, 0.07, 0.154)
    part(root, 'sphere', 'ivory', 0, 0.018, 0, 0.229, 0.065, 0.158)
    part(root, 'box', 'metal', 0, 0.073, -0.025, 0.08, 0.018, 0.15)
    part(root, 'box', 'amber', 0, 0.085, -0.025, 0.027, 0.005, 0.118)
    part(root, 'box', 'signal', 0, 0.04, 0.145, 0.092, 0.016, 0.012)
    for (const side of [-1, 1]) {
      part(
        root,
        'box',
        'graphite',
        side * 0.105,
        -0.096,
        0,
        0.018,
        0.085,
        0.018,
        0,
        0,
        -side * 0.17
      )
      part(root, 'box', 'metal', side * 0.115, -0.14, 0, 0.022, 0.018, 0.27)
      // Service vents on the back of the shell.
      for (let vent = 0; vent < 3; vent++) {
        part(
          root,
          'box',
          'graphite',
          side * (0.091 + vent * 0.031),
          0.056,
          -0.035,
          0.012,
          0.009,
          0.072
        )
      }
      for (const end of [-1, 1]) {
        part(
          root,
          'box',
          'metal',
          side * 0.19,
          -0.005,
          end * 0.15,
          0.22,
          0.025,
          0.028,
          0,
          -side * end * 0.58
        )
        const motor = pivot(root, side * 0.285, 0.01, end * 0.225)
        part(motor, 'cylinder', 'graphite', 0, 0, 0, 0.036, 0.068, 0.036)
        part(motor, 'cylinder', 'metal', 0, 0.037, 0, 0.026, 0.018, 0.026)
        part(motor, 'ring', 'metal', 0, 0.041, 0, 0.15, 0.15, 0.15, Math.PI / 2)
        part(
          motor,
          'ring',
          'signal',
          0,
          0.043,
          0,
          0.142,
          0.142,
          0.047,
          Math.PI / 2
        )
        for (const cross of [-1, 1]) {
          part(
            motor,
            'box',
            'metal',
            0,
            0.016,
            cross * 0.075,
            0.009,
            0.013,
            0.14
          )
        }
        const rotor = pivot(motor, 0, 0.054, 0)
        part(
          rotor,
          'box',
          'graphite',
          0,
          0,
          0,
          0.249,
          0.006,
          0.027,
          0,
          0,
          0.035
        )
        part(rotor, 'box', 'graphite', 0, 0, 0, 0.027, 0.006, 0.249, 0.035)
        part(rotor, 'sphere', 'metal', 0, 0.007, 0, 0.022, 0.014, 0.022)
        rotors.push(rotor)
      }
    }
    const sensor = pivot(root, 0, -0.064, 0.151)
    part(sensor, 'sphere', 'graphite', 0, 0, 0.015, 0.058, 0.052, 0.052)
    part(
      sensor,
      'cylinder',
      'metal',
      0,
      0,
      0.057,
      0.034,
      0.02,
      0.034,
      Math.PI / 2
    )
    part(sensor, 'sphere', 'signal', 0, 0, 0.068, 0.023, 0.023, 0.009)
    drones.push({ root, sensor, rotors })
  }

  const technicians: Technician[] = []
  for (let i = 0; i < 5; i++) {
    const root = pivot(rigs)
    root.name = `maintenance-technician-${i + 1}`
    root.scale.setScalar([1, 0.92, 1.05, 0.96, 0.89][i])
    const arms: THREE.Object3D[] = []
    const forearms: THREE.Object3D[] = []
    const legs: THREE.Object3D[] = []
    const knees: THREE.Object3D[] = []
    part(root, 'sphere', 'ivory', 0, 0.335, 0, 0.086, 0.108, 0.065)
    part(root, 'box', 'graphite', 0, 0.245, 0, 0.123, 0.036, 0.085)
    part(root, 'box', 'amber', 0, 0.366, 0.06, 0.107, 0.032, 0.014)
    part(root, 'box', 'signal', 0.031, 0.334, 0.064, 0.015, 0.013, 0.007)
    // Rear battery and a very small equipment socket.
    part(root, 'box', 'graphite', 0, 0.338, -0.066, 0.072, 0.106, 0.027)
    part(root, 'box', 'metal', 0, 0.36, -0.083, 0.041, 0.055, 0.012)
    part(root, 'cylinder', 'metal', 0, 0.439, 0, 0.026, 0.03, 0.026)
    const head = pivot(root, 0, 0.488, 0)
    part(head, 'sphere', 'ivory', 0, 0, 0, 0.068, 0.06, 0.061)
    part(head, 'sphere', 'graphite', 0, -0.002, 0.045, 0.052, 0.027, 0.025)
    part(head, 'box', 'signal', 0, 0, 0.067, 0.067, 0.01, 0.005)
    part(
      head,
      'sphere',
      i === 3 ? 'metal' : 'amber',
      0,
      0.039,
      -0.002,
      0.077,
      0.024,
      0.069
    )
    for (const side of [-1, 1]) {
      const arm = pivot(root, side * 0.097, 0.389, 0)
      part(arm, 'sphere', 'graphite', 0, 0, 0, 0.03, 0.03, 0.03)
      part(arm, 'cylinder', 'ivory', 0, -0.052, 0, 0.026, 0.085, 0.026)
      const forearm = pivot(arm, 0, -0.102, 0)
      part(forearm, 'sphere', 'metal', 0, 0, 0, 0.026, 0.026, 0.026)
      part(forearm, 'cylinder', 'ivory', 0, -0.041, 0, 0.023, 0.069, 0.023)
      part(forearm, 'sphere', 'graphite', 0, -0.085, 0, 0.024, 0.025, 0.024)
      arms.push(arm)
      forearms.push(forearm)
      const leg = pivot(root, side * 0.042, 0.246, 0)
      part(leg, 'sphere', 'metal', 0, 0, 0, 0.031, 0.031, 0.031)
      part(leg, 'cylinder', 'ivory', 0, -0.054, 0, 0.029, 0.083, 0.029)
      const knee = pivot(leg, 0, -0.108, 0)
      part(knee, 'sphere', 'graphite', 0, 0, 0, 0.028, 0.026, 0.028)
      part(knee, 'cylinder', 'metal', 0, -0.052, 0, 0.022, 0.086, 0.022)
      part(knee, 'box', 'graphite', 0, -0.113, 0.017, 0.061, 0.035, 0.09)
      legs.push(leg)
      knees.push(knee)
    }
    if (i === 2 || i === 4) {
      // A slate is rigidly held by the right hand, following its articulation.
      const slate = pivot(forearms[1], -0.045, -0.079, 0.024)
      part(slate, 'box', 'graphite', 0, 0, 0, 0.108, 0.077, 0.014, -0.32)
      part(slate, 'box', 'signal', 0, 0.002, 0.008, 0.085, 0.052, 0.003, -0.32)
    }
    technicians.push({
      root,
      head,
      arms,
      forearms,
      legs,
      knees,
      phase: i * 1.67
    })
  }

  const cart = pivot(rigs)
  cart.name = 'autonomous-service-cart'
  part(cart, 'box', 'graphite', 0, 0.105, 0, 0.37, 0.1, 0.53)
  part(cart, 'box', 'ivory', 0, 0.17, 0, 0.365, 0.064, 0.51)
  part(cart, 'box', 'metal', 0, 0.21, -0.035, 0.302, 0.022, 0.33)
  part(cart, 'box', 'amber', 0, 0.255, -0.045, 0.23, 0.078, 0.25)
  part(cart, 'box', 'graphite', 0, 0.297, -0.045, 0.022, 0.008, 0.255)
  part(cart, 'box', 'graphite', 0, 0.297, -0.045, 0.234, 0.008, 0.02)
  part(cart, 'box', 'signal', 0, 0.163, 0.258, 0.22, 0.014, 0.009)
  part(cart, 'cylinder', 'metal', 0, 0.241, 0.185, 0.023, 0.065, 0.023)
  part(cart, 'cylinder', 'graphite', 0, 0.285, 0.185, 0.052, 0.03, 0.052)
  part(
    cart,
    'ring',
    'signal',
    0,
    0.292,
    0.185,
    0.052,
    0.052,
    0.052,
    Math.PI / 2
  )
  const wheels: THREE.Object3D[] = []
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const wheel = pivot(cart, side * 0.193, 0.079, end * 0.164)
      part(
        wheel,
        'cylinder',
        'graphite',
        0,
        0,
        0,
        0.077,
        0.047,
        0.077,
        0,
        0,
        Math.PI / 2
      )
      part(
        wheel,
        'cylinder',
        'metal',
        side * 0.027,
        0,
        0,
        0.041,
        0.008,
        0.041,
        0,
        0,
        Math.PI / 2
      )
      part(wheel, 'box', 'amber', side * 0.033, 0, 0, 0.005, 0.063, 0.009)
      wheels.push(wheel)
    }
  }

  const buckets = new Map<string, Part[]>()
  for (const item of parts) {
    const key = `${item.primitive}:${item.finish}`
    const bucket = buckets.get(key)
    if (bucket) bucket.push(item)
    else buckets.set(key, [item])
  }
  const batches: Batch[] = []
  for (const bucket of buckets.values()) {
    const first = bucket[0]
    const mesh = new THREE.InstancedMesh(
      geometry[first.primitive],
      material[first.finish],
      bucket.length
    )
    mesh.name = `life-${first.primitive}-${first.finish}`
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    // Animated instances share a changing envelope; the full miniature is
    // always in view, so avoid rebuilding bounding spheres every frame.
    mesh.frustumCulled = false
    mesh.castShadow = first.finish !== 'signal'
    mesh.receiveShadow = first.finish !== 'signal'
    group.add(mesh)
    batches.push({ mesh, parts: bucket })
  }

  let disposed = false
  let previousTime = Number.NaN
  function update(time: number, pointerX: number, pointerY: number) {
    if (disposed || time === previousTime) return
    previousTime = time
    const px = THREE.MathUtils.clamp(pointerX, -1, 1)
    const py = THREE.MathUtils.clamp(pointerY, -1, 1)
    for (let i = 0; i < drones.length; i++) {
      const drone = drones[i]
      const orbit = time * (i === 0 ? 0.13 : 0.105) + i * 2.2
      if (i === 0) {
        // Keep the full rotor envelope behind the front-right hoist corridor.
        drone.root.position.set(
          3.19 + Math.sin(orbit) * 0.25,
          4.28 + Math.sin(orbit * 1.37) * 0.58,
          -0.83 + Math.cos(orbit) * 0.89
        )
        drone.root.rotation.set(
          Math.sin(orbit) * 0.025,
          -Math.PI / 2 + Math.cos(orbit) * 0.22,
          Math.cos(orbit) * 0.035
        )
      } else {
        drone.root.position.set(
          0.12 + Math.sin(orbit) * 1.93,
          6.05 + Math.sin(orbit * 1.3) * 0.42,
          2.01 + Math.cos(orbit) * 0.2
        )
        drone.root.rotation.set(
          Math.cos(orbit) * 0.025,
          Math.PI + Math.sin(orbit) * 0.22,
          Math.cos(orbit) * -0.035
        )
      }
      drone.sensor.rotation.set(
        py * 0.16 + Math.sin(time * 0.32 + i) * 0.065,
        px * 0.24,
        0
      )
      for (let j = 0; j < drone.rotors.length; j++) {
        drone.rotors[j].rotation.y = time * (j % 2 ? -26 : 26) + j * 0.8
      }
    }

    for (let i = 0; i < technicians.length; i++) {
      const tech = technicians[i]
      const moving = i < 2
      const stride = time * 2.3 + tech.phase
      if (moving) {
        // Separate short walking segments leave the front vehicle lane clear.
        const route = time * 0.075 + i * Math.PI
        tech.root.position.set(
          (i === 0 ? -1.11 : 0.66) + Math.sin(route) * (i === 0 ? 0.64 : 0.48),
          0.325 + Math.abs(Math.sin(stride)) * 0.006,
          2.26
        )
        tech.root.rotation.y = Math.atan2(
          Math.cos(route),
          Math.sin(route) * 0.2
        )
      } else {
        const x = i === 2 ? -2.48 : i === 3 ? 1.53 : 2.77
        const z = i === 2 ? 2.32 : i === 3 ? 2.36 : -0.7
        tech.root.position.set(x, 0.325, z)
        tech.root.rotation.y = i === 4 ? -Math.PI / 2 : i === 2 ? 0.6 : -0.62
      }
      tech.head.rotation.y = Math.sin(time * 0.32 + tech.phase) * 0.2
      tech.head.rotation.x =
        i === 2 || i === 4 ? 0.18 : Math.sin(time * 0.25 + i) * 0.06
      for (let side = 0; side < 2; side++) {
        const step = Math.sin(stride + side * Math.PI)
        tech.legs[side].rotation.x = moving ? step * 0.3 : 0
        tech.knees[side].rotation.x = moving ? Math.max(0, -step) * 0.32 : 0
        tech.arms[side].rotation.z = (side === 0 ? 1 : -1) * 0.095
        tech.arms[side].rotation.x = moving
          ? -step * 0.25
          : i === 3
            ? -0.16
            : -0.35
        tech.forearms[side].rotation.x = moving
          ? -0.12
          : i === 3
            ? -0.35
            : -0.92 + Math.sin(time * 0.5 + i) * 0.035
      }
      if (i === 3) {
        // One stationary technician gestures towards the structure.
        tech.arms[0].rotation.x = -0.92 + Math.sin(time * 0.35) * 0.1
        tech.forearms[0].rotation.x = -0.75
      }
    }

    // Front service lane: the vehicle stays clear of the crane, tower and
    // right-hand pickup bay. Its shallow turnarounds fit the clear front apron.
    const travel = time * 0.065
    cart.position.set(
      -0.78 + Math.sin(travel) * 2.68,
      0.325,
      2.78 + Math.cos(travel) * 0.08
    )
    cart.rotation.y = Math.atan2(
      Math.cos(travel) * 2.68,
      -Math.sin(travel) * 0.08
    )
    for (const wheel of wheels) wheel.rotation.x = time * 1.45

    rigs.updateMatrixWorld(true)
    for (const batch of batches) {
      for (let i = 0; i < batch.parts.length; i++) {
        batch.mesh.setMatrixAt(i, batch.parts[i].node.matrixWorld)
      }
      batch.mesh.instanceMatrix.needsUpdate = true
    }
  }

  update(0, 0, 0)
  return {
    group,
    update,
    dispose() {
      if (disposed) return
      disposed = true
      for (const batch of batches) batch.mesh.dispose()
      for (const item of Object.values(geometry)) item.dispose()
      for (const item of Object.values(material)) item.dispose()
      group.clear()
      rigs.clear()
    }
  }
}
