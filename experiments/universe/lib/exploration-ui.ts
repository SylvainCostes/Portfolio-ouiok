import * as THREE from 'three'
import { OBJECTS, type ObjectId } from './island-life'

const DETAILS: Record<Exclude<ObjectId, 'portal'>, { title: string; description: string; action: string; active: string }> = {
  fabricator: { title: 'La fabrique', description: 'Une idée, quelques couches de matière, un nouvel objet. La fabrique façonne les pièces qui font vivre l’archipel.', action: 'Relancer la fabrication', active: 'Suspendre la fabrication' },
  console: { title: 'Tout est connecté.', description: 'Sous les ponts, un même réseau relie les îles. Cette console rend ses échanges visibles.', action: 'Afficher le réseau', active: 'Éteindre l’hologramme' },
  drone: { title: 'Prêt pour un tour ?', description: 'Ce petit éclaireur surveille les ateliers. Envoie-le inspecter la plateforme, ou rappelle-le à son poste.', action: 'Lancer une patrouille', active: 'Rappeler le drone' },
  beacon: { title: 'Un signal dans la brume.', description: 'La balise guide les voyageurs jusqu’à l’observatoire. À toi de décider si elle éclaire leur chemin.', action: 'Allumer la balise', active: 'Éteindre la balise' },
  scanner: { title: 'À l’écoute du ciel.', description: 'Le radar explore l’horizon au-delà des nuages. Suspends son balayage pour observer sa mécanique.', action: 'Reprendre le balayage', active: 'Suspendre le balayage' }
}

export function createExplorationUI(root: HTMLElement, signal: AbortSignal, callbacks: {
  navigate: (view: number) => void
  activate: (id: ObjectId) => void
  toggle: (id: Exclude<ObjectId, 'portal'>) => boolean
  isActive: (id: Exclude<ObjectId, 'portal'>) => boolean
}) {
  const layer = root.querySelector<HTMLElement>('#universe-hotspots')!
  const panel = root.querySelector<HTMLElement>('#universe-detail')!
  const title = panel.querySelector<HTMLElement>('h2')!
  const description = panel.querySelector<HTMLElement>('.detail-description')!
  const toggle = panel.querySelector<HTMLButtonElement>('.detail-toggle')!
  const close = panel.querySelector<HTMLButtonElement>('.detail-close')!
  const location = root.querySelector<HTMLElement>('#universe-location')!
  const about = root.querySelector<HTMLElement>('#universe-about')!
  const back = root.querySelector<HTMLButtonElement>('#universe-back')!
  const status = root.querySelector<HTMLElement>('#universe-status')!
  let active: Exclude<ObjectId, 'portal'> | null = null
  let currentView = 0
  let restoreFocus: HTMLElement | null = null
  const options = { signal }
  const markers: { button: HTMLButtonElement; position: THREE.Vector3; views: number[]; id: string }[] = []
  function marker(id: string, label: string, position: number[], views: number[], action: () => void, number: string) {
    const button = document.createElement('button')
    button.type = 'button'; button.className = 'universe-hotspot'; button.dataset.target = id
    const dot = document.createElement('span'); dot.className = 'hotspot-dot'; dot.textContent = number; dot.setAttribute('aria-hidden', 'true')
    const text = document.createElement('span'); text.className = 'hotspot-label'; text.textContent = label
    button.append(dot, text); button.setAttribute('aria-label', label)
    button.addEventListener('click', action, options)
    layer.append(button)
    markers.push({ button, position: new THREE.Vector3(position[0], position[1], position[2]), views, id })
  }
  marker('workshop', 'Visiter l’atelier', [-99, 12, -3], [0, 1, 2], () => callbacks.navigate(3), '01')
  marker('observatory', 'Visiter l’observatoire', [35, 33, -86], [0, 1, 2], () => callbacks.navigate(4), '02')
  for (const [index, item] of OBJECTS.entries()) marker(item.id, item.label, item.position, [item.island === 'workshop' ? 3 : 4], () => callbacks.activate(item.id), String(index % 3 + 1).padStart(2, '0'))
  function hidePanel(returnFocus = false) {
    panel.hidden = true; root.dataset.detail = 'false'; active = null
    if (returnFocus && restoreFocus?.isConnected && !restoreFocus.hidden) restoreFocus.focus({ preventScroll: true })
  }
  close.addEventListener('click', () => hidePanel(true), options)
  toggle.addEventListener('click', () => {
    if (!active) return
    const enabled = callbacks.toggle(active)
    toggle.textContent = enabled ? DETAILS[active].active : DETAILS[active].action
    status.textContent = enabled ? `${DETAILS[active].title} Activé.` : `${DETAILS[active].title} En pause.`
  }, options)
  back.addEventListener('click', () => callbacks.navigate(currentView === 5 ? 4 : 0), options)
  root.querySelectorAll<HTMLButtonElement>('[data-travel]').forEach(button => {
    button.addEventListener('click', () => callbacks.navigate(Number(button.dataset.travel)), options)
  })
  root.querySelector<HTMLButtonElement>('#about-return')!.addEventListener('click', () => callbacks.navigate(4), options)
  const projected = new THREE.Vector3()
  let awaitingFocus = false
  return {
    showObject(id: Exclude<ObjectId, 'portal'>) {
      active = id; restoreFocus = document.activeElement as HTMLElement
      title.textContent = DETAILS[id].title; description.textContent = DETAILS[id].description
      toggle.textContent = callbacks.isActive(id) ? DETAILS[id].active : DETAILS[id].action
      panel.hidden = false; root.dataset.detail = 'true'; close.focus({ preventScroll: true })
    },
    closePanel() { const wasOpen = !panel.hidden; hidePanel(true); return wasOpen },
    setView(view: number) {
      hidePanel(); currentView = view; back.hidden = view === 0
      back.textContent = view === 5 ? '← Revenir à l’observatoire' : '← Vue d’ensemble'
      about.hidden = true; awaitingFocus = view === 5
      location.textContent = view === 3 ? '01 / L’atelier' : view === 4 ? '02 / L’observatoire' : view === 5 ? '03 / De l’autre côté' : 'Un archipel à explorer'
      root.querySelectorAll<HTMLButtonElement>('[data-travel]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.travel) === view)))
      root.querySelector<HTMLElement>('.universe-editorial')!.inert = view >= 3
      // A selected marker disappears during travel; keep keyboard focus in the scene.
      if (view !== 0) back.focus({ preventScroll: true })
      else root.querySelector<HTMLCanvasElement>('#universe-canvas')!.focus({ preventScroll: true })
    },
    update(camera: THREE.PerspectiveCamera, width: number, height: number, settled: boolean, drone: THREE.Vector3) {
      const ready = root.dataset.state === 'ready'
      for (const marker of markers) {
        if (marker.id === 'drone') marker.position.copy(drone)
        projected.copy(marker.position).project(camera)
        const visible = ready && settled && marker.views.includes(currentView) && projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < .95
        marker.button.hidden = !visible
        if (visible) {
          const x = THREE.MathUtils.clamp((projected.x + 1) * width / 2, 70, width - 70)
          const y = THREE.MathUtils.clamp((1 - projected.y) * height / 2 - 30, 110, height - 130)
          marker.button.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`
        }
      }
      if (currentView === 5 && settled && ready) {
        about.hidden = false
        if (awaitingFocus) { about.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true }); awaitingFocus = false }
      }
    },
    dispose() { markers.forEach(marker => marker.button.remove()) }
  }
}
