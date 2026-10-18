import * as THREE from 'three'

/** A separate, precompiled space behind the portal, using the same renderer. */
export function createDigitalDimension() {
  const group = new THREE.Group()
  group.name = 'Digital dimension'
  group.position.set(0, 0, 900)
  const material = new THREE.MeshBasicMaterial({ color: '#83dbd6', wireframe: true, transparent: true, opacity: .22 })
  const geometry = new THREE.IcosahedronGeometry(7, 1)
  const sculpture = new THREE.Mesh(geometry, material)
  sculpture.position.set(10, 9, -9); group.add(sculpture)
  const ringGeometry = new THREE.TorusGeometry(12, .025, 4, 100)
  const rings: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeometry, material)
    ring.position.copy(sculpture.position); ring.rotation.set(i * .9, i * .8, .4)
    rings.push(ring); group.add(ring)
  }
  const grid = new THREE.GridHelper(220, 55, '#295459', '#18393e')
  grid.position.y = -3; group.add(grid)
  const points = new Float32Array(360 * 3)
  for (let i = 0; i < 360; i++) {
    points[i * 3] = Math.sin(i * 127.1) * 65
    points[i * 3 + 1] = Math.cos(i * 57.7) * 35 + 20
    points[i * 3 + 2] = Math.sin(i * 73.3) * 65 - 30
  }
  const pointGeometry = new THREE.BufferGeometry()
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
  const pointMaterial = new THREE.PointsMaterial({ color: '#b6e5d7', size: .13, transparent: true, opacity: .7 })
  const stars = new THREE.Points(pointGeometry, pointMaterial)
  group.add(stars)
  return {
    group,
    update(time: number) {
      sculpture.rotation.set(time * .06, time * .1, .2)
      sculpture.position.y = 9 + Math.sin(time * .5) * .5
      rings.forEach((ring, i) => { ring.rotation.z = time * .03 * (i + 1) })
      stars.rotation.y = time * .008
    },
    dispose() {
      geometry.dispose(); ringGeometry.dispose(); material.dispose(); grid.geometry.dispose()
      const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material]
      gridMaterials.forEach(item => item.dispose()); pointGeometry.dispose(); pointMaterial.dispose(); group.clear()
    }
  }
}
