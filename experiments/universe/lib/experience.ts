import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createArchitecture } from './world-architecture'
import { createArchipelago } from './archipelago'
import { createAtmosphere } from './atmosphere'
import { ArchitecturalOcclusion } from './architectural-occlusion'
import { createIslandLife, OBJECTS, type ObjectId } from './island-life'
import { createThreeUIScenes } from './threeui-scenes'
import { SceneAlphaPass } from './scene-alpha'
import { createExplorationUI } from './exploration-ui'
import type { createLoading } from './loading'

const VIEWS = [
  { name: 'overview', label: 'Vue d’ensemble de l’île', position: [43, 21, 66], target: [0, 9, -6] },
  { name: 'core', label: 'Le cœur énergétique', position: [24, 16, 37], target: [0, 3, 6] },
  { name: 'architecture', label: 'L’architecture des tours', position: [-34, 22, 48], target: [-2, 11, -14] },
  { name: 'workshop', label: 'L’atelier. Trois objets à explorer.', position: [-77, 23, 32], target: [-99, 6, -2] },
  { name: 'observatory', label: 'L’observatoire. Deux instruments et un portail.', position: [64, 32, -39], target: [35, 16, -85] },
  { name: 'dimension', label: 'De l’autre côté. À propos de Sylvain Costes.', position: [0, 11, 933], target: [7, 8, 890] }
] as const

const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** A single scene owns its listeners, GPU resources and clock. Nothing persists globally. */
export async function createExperience(root: HTMLElement, loading: ReturnType<typeof createLoading>, lifetime: AbortSignal): Promise<() => void> {
  const canvas = root.querySelector<HTMLCanvasElement>('#universe-canvas')!
  const actions = root.querySelector<HTMLElement>('#universe-actions')!
  const viewButton = root.querySelector<HTMLButtonElement>('#universe-view')!
  const pauseButton = root.querySelector<HTMLButtonElement>('#universe-pause')!
  const retry = root.querySelector<HTMLButtonElement>('#universe-retry')!
  const status = root.querySelector<HTMLElement>('#universe-status')!
  const illustration = root.querySelector<HTMLElement>('#universe-fallback')!
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const abort = new AbortController()
  const cleanups: (() => void)[] = []
  let disposed = false
  let frame = 0
  let renderer: THREE.WebGLRenderer | undefined
  const dispose = () => {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    abort.abort()
    for (const clean of cleanups.reverse()) clean()
    if (renderer) {
      renderer.dispose()
      renderer.forceContextLoss()
    }
    canvas.dataset.disposed = 'true'
  }
  const fallback = (message: string) => {
    root.dataset.state = 'fallback'
    root.style.setProperty('--portal-veil', '0')
    loading.fail(message)
    illustration.removeAttribute('aria-hidden')
    canvas.hidden = true
    actions.hidden = true
    retry.hidden = false
    status.textContent = message
  }
  // Kept outside the scene's aborted listeners so a lost context remains recoverable.
  retry.onclick = () => location.reload()
  lifetime.addEventListener('abort', dispose, { once: true })
  cleanups.push(() => lifetime.removeEventListener('abort', dispose))
  if (lifetime.aborted) { dispose(); return dispose }

  try {
    await document.fonts.load('400 16px "Universe Switzer"').catch(() => undefined)
    await loading.advance(2)
    if (disposed) return dispose
    const mobile = matchMedia('(max-width: 700px), (pointer: coarse)').matches
    let reduced = motion.matches
    let paused = false
    let inViewport = true
    let view = 0
    let time = 12
    let portalTransit = 0
    let dimensionReveal = 0
    let inDimension = false
    let cameraSettling = 0
    let lastStamp = 0
    let nextDrawTime = 0
    let readyToRender = false
    const frameInterval = 1000 / (mobile ? 30 : 60)
    let frames = 0
    let dirty = true
    let width = 1
    let height = 1
    let pixelRatio = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5)
    let slowSamples = 0
    let sampleFrames = 0
    let sampleStart = 0
    let sampleCPU = 0
    let sampleIntervals: number[] = []
    let hovered = false
    let hover = 0
    const pointer = new THREE.Vector2()
    const pointerSmooth = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const currentPosition = new THREE.Vector3(...VIEWS[0].position)
    const currentTarget = new THREE.Vector3(...VIEWS[0].target)
    const desiredPosition = new THREE.Vector3()
    const desiredTarget = new THREE.Vector3()
    const offset = new THREE.Vector3()

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'high-performance' })
    const gl = renderer
    gl.setPixelRatio(pixelRatio)
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.12
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    gl.info.autoReset = false

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x879a9e, .0038)
    const camera = new THREE.PerspectiveCamera(49, 1, .2, 600)
    const architecture = createArchitecture()
    cleanups.push(architecture.dispose)
    scene.add(architecture.group)
    await loading.advance(3)
    if (disposed) return dispose
    const archipelago = createArchipelago()
    cleanups.push(archipelago.dispose)
    scene.add(archipelago.group)
    const life = createIslandLife()
    cleanups.push(life.dispose)
    scene.add(life.group)
    const stateKeys = { fabricator: 'printing', console: 'network', drone: 'dronePatrol', beacon: 'beacon', scanner: 'scanning' } as const
    const activate = (id: ObjectId) => {
      if (id === 'portal') { changeView(5); return }
      exploration.showObject(id)
    }
    const exploration = createExplorationUI(root, abort.signal, {
      navigate: next => changeView(next), activate,
      isActive: id => life.state[stateKeys[id]],
      toggle: id => {
        const key = stateKeys[id]
        life.state[key] = !life.state[key]
        dirty = true; requestRender()
        return life.state[key]
      }
    })
    cleanups.push(exploration.dispose)
    await loading.advance(4)
    if (disposed) return dispose
    const atmosphere = createAtmosphere({ mobile })
    cleanups.push(atmosphere.dispose)
    scene.add(atmosphere.group)
    await loading.advance(5)
    if (disposed) return dispose
    const threeui = await createThreeUIScenes(root, abort.signal)
    cleanups.push(threeui.dispose)
    if (disposed) return dispose

    // Small, locally generated HDR-like studio sky for coherent metal reflections.
    const skyMapCanvas = document.createElement('canvas')
    skyMapCanvas.width = 256
    skyMapCanvas.height = 128
    const ctx = skyMapCanvas.getContext('2d')!
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 128)
    skyGradient.addColorStop(0, '#99b0bb')
    skyGradient.addColorStop(.45, '#bcc5bd')
    skyGradient.addColorStop(.52, '#6a858c')
    skyGradient.addColorStop(1, '#1f3038')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, 256, 128)
    const sun = ctx.createRadialGradient(48, 35, 2, 48, 35, 38)
    sun.addColorStop(0, '#fff2cc')
    sun.addColorStop(1, 'rgba(240,219,179,0)')
    ctx.fillStyle = sun
    ctx.fillRect(0, 0, 256, 128)
    const environmentTexture = new THREE.CanvasTexture(skyMapCanvas)
    environmentTexture.mapping = THREE.EquirectangularReflectionMapping
    environmentTexture.colorSpace = THREE.SRGBColorSpace
    const pmrem = new THREE.PMREMGenerator(gl)
    const environment = pmrem.fromEquirectangular(environmentTexture)
    scene.environment = environment.texture
    scene.environmentIntensity = .62
    environmentTexture.dispose()
    pmrem.dispose()
    cleanups.push(() => environment.dispose())

    const hemisphere = new THREE.HemisphereLight(0xc9e4ec, 0x364b53, 1.1)
    scene.add(hemisphere)
    const key = new THREE.DirectionalLight(0xffdbac, 3.6)
    key.position.set(-50, 65, 42)
    key.castShadow = true
    key.shadow.mapSize.setScalar(mobile ? 1024 : 2048)
    Object.assign(key.shadow.camera, { left: -49, right: 49, top: 49, bottom: -42, near: 1, far: 180 })
    key.shadow.normalBias = .05
    key.shadow.bias = -.00015
    key.shadow.radius = 3
    key.target.position.set(0, 8, 0)
    scene.add(key, key.target)
    cleanups.push(() => key.shadow.dispose())
    const rim = new THREE.DirectionalLight(0x96d6ed, 2.5)
    rim.position.set(24, 20, -45)
    scene.add(rim)
    const reactorLight = new THREE.PointLight(0x83dfe2, 0, 22, 2)
    reactorLight.position.set(0, 4, 8)
    scene.add(reactorLight)

    const beamGeometry = new THREE.CylinderGeometry(.24, .65, 54, 24, 1, true)
    const beamMaterial = new THREE.ShaderMaterial({
      uniforms: { energy: { value: 0 }, time: { value: 0 } },
      vertexShader: `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
        void main(){vUv=uv; vec4 p=modelViewMatrix*vec4(position,1.); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); gl_Position=projectionMatrix*p;}`,
      fragmentShader: `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; uniform float energy; uniform float time;
        void main(){float center=pow(abs(dot(normalize(vNormal),normalize(vView))),1.6);
        float fade=pow(1.-vUv.y,2.)*smoothstep(0.,.035,vUv.y);
        float grain=.93+.07*sin(vUv.y*95.-time*.5);
        gl_FragColor=vec4(vec3(.34,.83,.90)*1.65,center*fade*energy*.26*grain);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    })
    const beam = new THREE.Mesh(beamGeometry, beamMaterial)
    beam.position.set(0, 28.5, 8)
    beam.renderOrder = 2
    scene.add(beam)
    cleanups.push(() => { beamGeometry.dispose(); beamMaterial.dispose() })

    const renderTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: mobile ? 0 : 2 })
    const composer = new EffectComposer(gl, renderTarget)
    const renderPass = new RenderPass(scene, camera)
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .22, .65, 1.3)
    const output = new OutputPass()
    const coverage = new SceneAlphaPass()
    output.uniforms.tSceneCoverage = { value: coverage.target.texture }
    output.material.fragmentShader = output.material.fragmentShader
      .replace('uniform sampler2D tDiffuse;', 'uniform sampler2D tDiffuse;\n uniform sampler2D tSceneCoverage;')
      .replace('gl_FragColor = texture2D( tDiffuse, vUv );', 'gl_FragColor = texture2D( tDiffuse, vUv );\n gl_FragColor.a = texture2D(tSceneCoverage, vUv).r;')
    const aoExcluded: THREE.Object3D[] = [atmosphere.group, beam, architecture.core, life.group]
    architecture.group.traverse(object => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) aoExcluded.push(object)
    })
    archipelago.group.traverse(object => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) aoExcluded.push(object)
    })
    const occlusion = new ArchitecturalOcclusion(scene, camera, aoExcluded, mobile)
    composer.addPass(renderPass)
    composer.addPass(coverage)
    composer.addPass(occlusion)
    composer.addPass(bloom)
    composer.addPass(output)
    cleanups.push(() => { renderPass.dispose(); coverage.dispose(); occlusion.dispose(); bloom.dispose(); output.dispose(); composer.dispose() })
    await loading.advance(6)
    if (disposed) return dispose

    const setDimension = (enabled: boolean) => {
      if (inDimension && !enabled) {
        currentPosition.fromArray(VIEWS[view].position)
        currentTarget.fromArray(VIEWS[view].target)
      }
      inDimension = enabled
      root.dataset.realm = enabled ? 'dimension' : 'archipelago'
      threeui.setView(enabled ? 5 : view === 5 ? 4 : view)
      architecture.group.visible = archipelago.group.visible = atmosphere.group.visible = life.group.visible = beam.visible = !enabled
      occlusion.enabled = !enabled
      scene.background = enabled ? new THREE.Color(0x081b22) : null
      if (enabled) {
        currentPosition.fromArray(VIEWS[5].position)
        currentTarget.fromArray(VIEWS[5].target)
      }
    }

    const syncMotion = () => {
      threeui.setPaused(paused || reduced)
      canvas.dataset.motion = reduced ? 'reduced' : paused ? 'paused' : 'running'
      pauseButton.setAttribute('aria-pressed', String(paused || reduced))
      pauseButton.setAttribute('aria-label', paused ? 'Reprendre l’animation' : 'Mettre l’animation en pause')
      pauseButton.title = pauseButton.getAttribute('aria-label')!
      pauseButton.hidden = reduced
    }
    const resize = () => {
      width = Math.max(1, root.clientWidth)
      height = Math.max(1, root.clientHeight)
      camera.aspect = width / height
      camera.setViewOffset(width, height, width > 700 ? -width * .04 : 0, width <= 700 ? height * .07 : 0, width, height)
      camera.updateProjectionMatrix()
      gl.setSize(width, height, false)
      composer.setPixelRatio(pixelRatio)
      composer.setSize(width, height)
      dirty = true
      requestRender()
    }
    const changeView = (next: number) => {
      view = (next + VIEWS.length) % VIEWS.length
      root.dataset.view = VIEWS[view].name
      status.textContent = VIEWS[view].label
      viewButton.setAttribute('aria-label', `${VIEWS[view].label.replace(/\.$/, '')}. Passer à la perspective suivante`)
      cameraSettling = reduced ? 0 : view === 5 ? 3.5 : 2.5
      portalTransit = view === 5 && !reduced ? 1.5 : 0
      dimensionReveal = 0
      life.state.portal = view === 5
      if (view !== 5 || reduced) setDimension(view === 5)
      root.style.setProperty('--portal-veil', '0')
      exploration.setView(view)
      if (reduced) {
        currentPosition.fromArray(VIEWS[view].position)
        currentTarget.fromArray(VIEWS[view].target)
      }
      dirty = true
      requestRender()
    }
    const render = (stamp: number) => {
      frame = 0
      if (disposed || document.hidden || !inViewport) { resetFrameClock(); return }
      const animation = !paused && !reduced && !inDimension
      // Advance an absolute deadline, not "last draw + interval". The preserved
      // phase delivers an average 60/30 fps even on 144/165 Hz displays.
      if ((animation || cameraSettling > 0) && !dirty && nextDrawTime && stamp < nextDrawTime - .1) {
        requestRender()
        return
      }
      if (!nextDrawTime) nextDrawTime = stamp
      if (stamp >= nextDrawTime - .1) {
        nextDrawTime += Math.max(1, Math.floor((stamp - nextDrawTime) / frameInterval) + 1) * frameInterval
      }
      const rawDelta = lastStamp ? (stamp - lastStamp) / 1000 : frameInterval / 1000
      const dt = Math.min(rawDelta, .05)
      lastStamp = stamp
      const start = performance.now()
      if (animation) time += dt
      cameraSettling = Math.max(0, cameraSettling - dt)
      if (portalTransit > 0) {
        portalTransit = Math.max(0, portalTransit - dt)
        root.style.setProperty('--portal-veil', String(smoothstep(.4, 1.5, 1.5 - portalTransit)))
        if (portalTransit === 0) { setDimension(true); dimensionReveal = .8 }
      } else if (dimensionReveal > 0) {
        dimensionReveal = Math.max(0, dimensionReveal - dt)
        root.style.setProperty('--portal-veil', String(dimensionReveal / .8))
      }
      const intro = smoothstep(0, 8, time)
      const energy = smoothstep(1.2, 5.8, time)
      ;(scene.fog as THREE.FogExp2).density = inDimension ? .009 : .0038 + (1 - intro) * .019
      desiredTarget.fromArray(VIEWS[view].target)
      desiredPosition.fromArray(VIEWS[view].position)
      if (portalTransit > 0) { desiredPosition.set(35, 17.7, -80); desiredTarget.set(35, 17.7, -90) }
      if (view === 0) desiredPosition.add(offset.set(6 * (1 - intro), 3 * (1 - intro), 7 * (1 - intro)))
      const ease = reduced ? 1 : 1 - Math.exp(-dt * 3.1)
      currentPosition.lerp(desiredPosition, ease)
      currentTarget.lerp(desiredTarget, ease)
      pointerSmooth.lerp(pointer, reduced || paused ? 1 : 1 - Math.exp(-dt * 2.2))
      camera.position.copy(currentPosition).sub(currentTarget).multiplyScalar(Math.max(1, .69 / camera.aspect)).add(currentTarget)
      if (animation) camera.position.add(offset.set(pointerSmooth.x * .8, pointerSmooth.y * .48, -pointerSmooth.x * .25))
      camera.lookAt(currentTarget)
      camera.updateMatrixWorld()
      hover = THREE.MathUtils.lerp(hover, hovered ? 1 : 0, reduced ? 1 : 1 - Math.exp(-dt * 4))
      architecture.update(time, energy, hover)
      archipelago.update(time, energy)
      atmosphere.update(time, camera, pointerSmooth, view === 4 || portalTransit > 0 ? 1 : 0)
      life.update(time, energy)
      beamMaterial.uniforms.energy.value = energy * (1 + hover * .4)
      beamMaterial.uniforms.time.value = time
      reactorLight.intensity = energy * (35 + hover * 20)
      gl.info.reset()
      if (!inDimension) composer.render(dt)
      const cpu = performance.now() - start
      frames++
      canvas.dataset.frames = String(frames)
      if (frames === 1) {
        loading.finish()
        root.dataset.state = 'ready'
        illustration.setAttribute('aria-hidden', 'true')
        canvas.dataset.scene = 'ready'
        actions.hidden = false
        canvas.hidden = false
      }
      exploration.update(camera, width, height, cameraSettling < .5 && portalTransit === 0 && dimensionReveal === 0, life.proxies.get('drone')!.position)
      // Diagnostics are DOM data attributes only, never visible UI or a global API.
      if (frames % 20 === 0 || frames === 1) {
        canvas.dataset.drawCalls = String(gl.info.render.calls)
        canvas.dataset.triangles = String(gl.info.render.triangles)
        canvas.dataset.dpr = pixelRatio.toFixed(2)
        canvas.dataset.geometries = String(gl.info.memory.geometries)
        canvas.dataset.textures = String(gl.info.memory.textures)
      }
      if (animation && frames > 90) {
        // Each sampled draw owns its preceding interval, including the first.
        if (!sampleStart) sampleStart = stamp - rawDelta * 1000
        sampleCPU += cpu
        sampleFrames++
        sampleIntervals.push(rawDelta * 1000)
        if (stamp - sampleStart > 4000) {
          const fps = sampleFrames * 1000 / (stamp - sampleStart)
          const sorted = sampleIntervals.sort((a, b) => a - b)
          canvas.dataset.fps = fps.toFixed(1)
          canvas.dataset.renderMs = (sampleCPU / sampleFrames).toFixed(2)
          canvas.dataset.frameP95 = (sorted[Math.floor(sorted.length * .95)] || 0).toFixed(2)
          const slow = fps < (mobile ? 25 : 46)
          slowSamples = slow ? slowSamples + 1 : 0
          if (slowSamples >= 2 && pixelRatio > .85) {
            pixelRatio = Math.max(.85, pixelRatio - .2)
            gl.setPixelRatio(pixelRatio)
            resize()
            slowSamples = 0
          }
          sampleStart = 0; sampleFrames = 0; sampleCPU = 0; sampleIntervals = []
        }
      }
      dirty = false
      if (animation || cameraSettling > 0 || portalTransit > 0 || dimensionReveal > 0) requestRender()
    }
    function resetFrameClock() {
      cancelAnimationFrame(frame)
      frame = 0
      lastStamp = 0
      nextDrawTime = 0
      sampleStart = 0; sampleFrames = 0; sampleCPU = 0; sampleIntervals = []
    }
    function safeRender(stamp: number) {
      try {
        render(stamp)
      } catch (error) {
        fallback('La scène a été interrompue. L’illustration de l’île reste disponible.')
        dispose()
        console.warn('Universe: render fallback.', error)
      }
    }
    function requestRender() {
      if (!frame && readyToRender && !disposed && !document.hidden && inViewport) frame = requestAnimationFrame(safeRender)
    }
    const options = { signal: abort.signal }
    let hoveredAction: string | null = null
    const hitTargets = () => view === 3 || view === 4
      ? OBJECTS.filter(item => item.island === (view === 3 ? 'workshop' : 'observatory')).map(item => life.proxies.get(item.id)!)
      : view === 5 ? [] : [architecture.core, life.proxies.get('workshop')!, life.proxies.get('observatory')!]
    architecture.core.userData.action = 'core'
    const checkHover = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      ndc.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1)
      pointer.copy(ndc).clampScalar(-1, 1)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects(hitTargets(), false)[0]
      hoveredAction = hit?.object.userData.action ?? null
      hovered = hoveredAction === 'core'
      canvas.style.cursor = hoveredAction ? 'pointer' : ''
      if (!reduced && !paused) { dirty = true; requestRender() }
    }
    canvas.addEventListener('pointermove', checkHover, options)
    canvas.addEventListener('pointerleave', () => { pointer.set(0, 0); hovered = false; hoveredAction = null; canvas.style.cursor = '' }, options)
    let pointerDown = new THREE.Vector2()
    canvas.addEventListener('pointerdown', event => { pointerDown.set(event.clientX, event.clientY) }, options)
    canvas.addEventListener('pointerup', event => {
      if (pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 10) return
      checkHover(event)
      if (hoveredAction === 'core') changeView(view === 1 ? 0 : 1)
      else if (hoveredAction === 'workshop') changeView(3)
      else if (hoveredAction === 'observatory') changeView(4)
      else if (hoveredAction) activate(hoveredAction as ObjectId)
    }, options)
    canvas.addEventListener('keydown', event => {
      if (['ArrowRight', 'ArrowLeft', 'Enter', 'Escape', ' '].includes(event.key)) event.preventDefault()
      if (event.key === 'ArrowRight') changeView((view + 1) % 5)
      if (event.key === 'ArrowLeft') changeView((view + 4) % 5)
      if (event.key === 'Enter') changeView(view < 3 ? 3 : view === 3 ? 4 : 5)
      if (event.key === ' ' && !reduced) pauseButton.click()
    }, options)
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (!exploration.closePanel()) changeView(view === 5 ? 4 : 0)
    }, options)
    viewButton.addEventListener('click', () => changeView((view + 1) % 5), options)
    pauseButton.addEventListener('click', () => {
      paused = !paused
      // The first paused frame is fully illuminated, never frozen halfway through entry.
      time = Math.max(time, 9)
      resetFrameClock()
      syncMotion()
      dirty = true
      requestRender()
    }, options)
    motion.addEventListener('change', () => {
      reduced = motion.matches
      if (reduced) {
        time = Math.max(12, time); cameraSettling = 0; portalTransit = 0; dimensionReveal = 0
        setDimension(view === 5); root.style.setProperty('--portal-veil', '0')
        currentPosition.fromArray(VIEWS[view].position); currentTarget.fromArray(VIEWS[view].target)
      }
      resetFrameClock()
      syncMotion(); dirty = true; requestRender()
    }, options)
    document.addEventListener('visibilitychange', () => {
      resetFrameClock()
      if (!document.hidden) requestRender()
    }, options)
    const observer = new IntersectionObserver(entries => {
      inViewport = entries[0].isIntersecting
      if (inViewport) requestRender()
      else resetFrameClock()
    })
    observer.observe(root)
    cleanups.push(() => observer.disconnect())
    const resizer = new ResizeObserver(resize)
    resizer.observe(root)
    cleanups.push(() => resizer.disconnect())
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault()
      fallback('La scène a été interrompue. Une illustration de l’île est affichée. Vous pouvez recharger la scène.')
      dispose()
    }, options)
    window.addEventListener('pagehide', event => {
      if (!event.persisted) dispose()
      else resetFrameClock()
    }, options)
    window.addEventListener('pageshow', () => requestRender(), options)
    syncMotion()
    resize()
    // Compile shader variants without blocking the main thread where supported.
    camera.position.copy(currentPosition)
    camera.lookAt(currentTarget)
    await gl.compileAsync(scene, camera)
    if (disposed) return dispose
    await loading.advance(7)
    if (disposed) return dispose
    setDimension(false)
    readyToRender = true
    requestRender()
    return dispose
  } catch (error) {
    if (disposed) return dispose
    fallback('L’illustration de l’île est affichée. L’exploration 3D n’est pas disponible sur cet appareil.')
    dispose()
    console.warn('Universe: illustration fallback.', error)
    return dispose
  }
}
