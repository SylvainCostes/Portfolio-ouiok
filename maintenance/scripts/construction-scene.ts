import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import { createConstructionLife } from './construction-life'
import { createConstructionSet } from './construction-set'

/** The existing accessible controls drive one locally generated architectural set. */
export function createConstructionScene() {
  const canvas = document.querySelector<HTMLCanvasElement>('#site-canvas')!
  const viewport = document.querySelector<HTMLElement>('#model-viewport')!
  const area = document.querySelector<HTMLElement>('#model-area')!
  const controls = document.querySelector<HTMLElement>('#model-controls')!
  const explodeButton =
    document.querySelector<HTMLButtonElement>('#explode-control')!
  const pauseButton =
    document.querySelector<HTMLButtonElement>('#pause-control')!
  const resetButton =
    document.querySelector<HTMLButtonElement>('#reset-control')!
  const announcement = document.querySelector<HTMLElement>(
    '#scene-announcement'
  )!
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const compact = matchMedia('(max-width: 760px)').matches
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    })
  } catch {
    return
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1.4 : 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 90)
  const target = new THREE.Vector3(0, 4.35, 0)
  const world = new THREE.Group()
  scene.add(world)
  const studio = new RoomEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(studio, 0.04)
  scene.environment = environment.texture
  scene.environmentIntensity = 0.55
  studio.dispose()
  pmrem.dispose()
  const architecture = createConstructionSet()
  const life = createConstructionLife()
  world.add(architecture.group, life.group)

  scene.add(new THREE.HemisphereLight('#f9ecda', '#7a9694', 1.25))
  const sun = new THREE.DirectionalLight('#ffe8c4', 3.1)
  sun.position.set(-5, 13, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048)
  Object.assign(sun.shadow.camera, {
    left: -10,
    right: 10,
    top: 12,
    bottom: -9,
    near: 0.5,
    far: 40
  })
  sun.shadow.normalBias = 0.025
  sun.shadow.bias = -0.00015
  sun.shadow.radius = 4
  scene.add(sun)
  const rim = new THREE.DirectionalLight('#c6eff0', 2.1)
  rim.position.set(7, 6, -7)
  scene.add(rim)
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.18 })
  const shadowGeometry = new THREE.PlaneGeometry(200, 200)
  const ground = new THREE.Mesh(shadowGeometry, shadowMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.29
  ground.receiveShadow = true
  scene.add(ground)
  // Broad contact shade keeps the miniature grounded without another render pass.
  const contactCanvas = document.createElement('canvas')
  contactCanvas.width = contactCanvas.height = 128
  const context = contactCanvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 12, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(35,55,53,.28)')
  gradient.addColorStop(1, 'rgba(35,55,53,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const contactTexture = new THREE.CanvasTexture(contactCanvas)
  const contactMaterial = new THREE.MeshBasicMaterial({
    map: contactTexture,
    transparent: true,
    depthWrite: false
  })
  const contactGeometry = new THREE.PlaneGeometry(14, 11)
  const contact = new THREE.Mesh(contactGeometry, contactMaterial)
  contact.rotation.x = -Math.PI / 2
  contact.position.y = -0.28
  scene.add(contact)

  let exploded = false
  let paused = motion.matches
  let visible = true
  let destroyed = false
  let angle = -0.08
  let desiredAngle = -0.08
  let elevation = 0
  let desiredElevation = 0
  let scatter = 0
  let time = 10
  let previous = 0
  let lastRender = 0
  let frame = 0
  let interacting = false
  let pointerX = 0
  let pointerY = 0
  let smoothPointerX = 0
  let smoothPointerY = 0
  let startX = 0
  let startY = 0
  let startAngle = 0
  let startElevation = 0
  let slowFrames = 0
  let qualityLowered = false
  const abort = new AbortController()
  const signal = abort.signal
  const syncPause = () => {
    pauseButton.setAttribute('aria-pressed', String(paused))
    pauseButton.setAttribute(
      'aria-label',
      paused ? 'Reprendre l’animation' : 'Mettre l’animation en pause'
    )
    pauseButton.dataset.tooltip = paused ? 'Reprendre' : 'Pause'
  }
  const resize = () => {
    const { width, height } = viewport.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    const aspect = width / height
    const halfHeight = Math.max(6.95, 6.45 / aspect)
    camera.left = -halfHeight * aspect
    camera.right = halfHeight * aspect
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    wake()
  }
  function render(now: number) {
    frame = 0
    if (destroyed || !visible || document.hidden) return
    const interval = compact ? 1000 / 30 : 1000 / 45
    if (now - lastRender < interval - 1) {
      wake()
      return
    }
    const dt = Math.min((now - (previous || now)) / 1000, 0.05)
    previous = now
    lastRender = now
    if (!paused && !motion.matches && scatter < 0.001 && !exploded) time += dt
    const ease = motion.matches ? 1 : 1 - Math.exp(-dt * 6)
    angle += (desiredAngle - angle) * ease
    elevation += (desiredElevation - elevation) * ease
    scatter += ((exploded ? 1 : 0) - scatter) * ease
    if (!paused && !motion.matches) {
      smoothPointerX += (pointerX - smoothPointerX) * ease
      smoothPointerY += (pointerY - smoothPointerY) * ease
    }
    world.rotation.y = angle
    camera.position.set(
      10.2 + smoothPointerX * 0.45,
      9.1 + elevation + smoothPointerY * 0.3,
      14.6
    )
    camera.lookAt(target)
    architecture.update(time, scatter)
    life.update(time, smoothPointerX, smoothPointerY)
    const before = performance.now()
    renderer.render(scene, camera)
    if (performance.now() - before > 25) slowFrames++
    if (slowFrames > 30 && !qualityLowered) {
      renderer.setPixelRatio(1)
      qualityLowered = true
      resize()
    }
    canvas.dataset.drawCalls = String(renderer.info.render.calls)
    canvas.dataset.triangles = String(renderer.info.render.triangles)
    canvas.dataset.phase = architecture.phase
    const settling =
      Math.abs(desiredAngle - angle) +
        Math.abs(desiredElevation - elevation) +
        Math.abs((exploded ? 1 : 0) - scatter) >
      0.001
    if ((!paused && !motion.matches && !exploded) || interacting || settling)
      wake()
  }
  function wake() {
    if (!frame && !destroyed && visible && !document.hidden)
      frame = requestAnimationFrame(render)
  }
  explodeButton.addEventListener(
    'click',
    () => {
      exploded = !exploded
      explodeButton.setAttribute('aria-pressed', String(exploded))
      explodeButton.setAttribute(
        'aria-label',
        exploded ? 'Réassembler' : 'Vue éclatée'
      )
      explodeButton.dataset.tooltip = exploded ? 'Réassembler' : 'Vue éclatée'
      announcement.textContent = exploded
        ? 'Les blocs se séparent. Vue éclatée de la maquette.'
        : 'Les blocs sont réassemblés.'
      wake()
    },
    { signal }
  )
  pauseButton.addEventListener(
    'click',
    () => {
      paused = !paused
      syncPause()
      announcement.textContent = paused
        ? 'Animation en pause.'
        : motion.matches
          ? 'Les mouvements automatiques restent désactivés selon votre préférence.'
          : 'Animation reprise.'
      wake()
    },
    { signal }
  )
  resetButton.addEventListener(
    'click',
    () => {
      desiredAngle = -0.08
      desiredElevation = 0
      pointerX = pointerY = 0
      exploded = false
      explodeButton.setAttribute('aria-pressed', 'false')
      explodeButton.setAttribute('aria-label', 'Vue éclatée')
      explodeButton.dataset.tooltip = 'Vue éclatée'
      announcement.textContent = 'Vue initiale restaurée.'
      wake()
    },
    { signal }
  )
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary) return
      interacting = true
      startX = event.clientX
      startY = event.clientY
      startAngle = desiredAngle
      startElevation = desiredElevation
      canvas.setPointerCapture(event.pointerId)
      wake()
    },
    { signal }
  )
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (interacting) {
        desiredAngle = startAngle + (event.clientX - startX) * 0.007
        desiredElevation = THREE.MathUtils.clamp(
          startElevation + (event.clientY - startY) * 0.008,
          -2,
          3
        )
      } else if (!paused && !motion.matches && event.pointerType === 'mouse') {
        const rect = canvas.getBoundingClientRect()
        pointerX = (event.clientX - rect.left) / rect.width - 0.5
        pointerY = (event.clientY - rect.top) / rect.height - 0.5
      }
      wake()
    },
    { signal }
  )
  const endDrag = () => {
    interacting = false
    wake()
  }
  canvas.addEventListener('pointerup', endDrag, { signal })
  canvas.addEventListener('pointercancel', endDrag, { signal })
  canvas.addEventListener('lostpointercapture', endDrag, { signal })
  canvas.addEventListener(
    'keydown',
    (event) => {
      if (
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(
          event.key
        )
      )
        return
      event.preventDefault()
      if (event.key === 'ArrowLeft') desiredAngle -= 0.2
      if (event.key === 'ArrowRight') desiredAngle += 0.2
      if (event.key === 'ArrowUp')
        desiredElevation = Math.min(3, desiredElevation + 0.3)
      if (event.key === 'ArrowDown')
        desiredElevation = Math.max(-2, desiredElevation - 0.3)
      if (event.key === 'Home') resetButton.click()
      wake()
    },
    { signal }
  )
  motion.addEventListener(
    'change',
    () => {
      paused = motion.matches
      syncPause()
      wake()
    },
    { signal }
  )
  document.addEventListener(
    'visibilitychange',
    () => {
      previous = 0
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
      } else wake()
    },
    { signal }
  )
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting
    previous = 0
    if (!visible) {
      cancelAnimationFrame(frame)
      frame = 0
    } else wake()
  })
  intersection.observe(viewport)
  const sizeObserver = new ResizeObserver(resize)
  sizeObserver.observe(viewport)
  const dispose = () => {
    if (destroyed) return
    destroyed = true
    cancelAnimationFrame(frame)
    abort.abort()
    sizeObserver.disconnect()
    intersection.disconnect()
    architecture.dispose()
    life.dispose()
    environment.dispose()
    shadowGeometry.dispose()
    shadowMaterial.dispose()
    contactGeometry.dispose()
    contactMaterial.dispose()
    contactTexture.dispose()

    renderer.dispose()
  }
  canvas.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault()
      area.classList.remove('is-ready')
      canvas.hidden = true
      controls.hidden = true
      document.getElementById('model-fallback')!.removeAttribute('aria-hidden')
      announcement.textContent =
        'La vue illustrée remplace la maquette interactive.'
      dispose()
    },
    { signal }
  )
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) dispose()
    },
    { signal }
  )
  canvas.hidden = false
  controls.hidden = false
  syncPause()
  resize()
  camera.position.set(10.2, 9.1, 14.6)
  camera.lookAt(target)
  world.rotation.y = angle
  architecture.update(time, scatter)
  life.update(time, 0, 0)
  renderer.render(scene, camera)
  area.classList.add('is-ready')
  document.getElementById('model-fallback')!.setAttribute('aria-hidden', 'true')
  // Public, read-only diagnostics for the browser's performance inspector.
  canvas.dataset.scene = 'ready'
  canvas.dataset.drawCalls = String(renderer.info.render.calls)
  canvas.dataset.triangles = String(renderer.info.render.triangles)
  canvas.dataset.motion = motion.matches ? 'reduced' : 'full'
  wake()
  if (import.meta.hot) import.meta.hot.dispose(dispose)
}
