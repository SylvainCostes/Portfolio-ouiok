import React from 'react'
import { createRoot } from 'react-dom/client'
import { StructureFlowCollection } from '../vendor/threeui'
import '../vendor/threeui/src/shaders/threeui.css'

// Only lifecycle and pointer coordination are added to the authored srcDoc.
// The registered HTML, component, shaders, CDN URLs and props are unchanged.
const nebulaBridge = `<script data-universe-bridge>
(() => {
  const nativeRAF = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const waiting = new Map();
  let paused = false, ready = false;
  const report = () => {
    if (ready) return;
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl && gl.getParameter(gl.CURRENT_PROGRAM)) {
      ready = true;
      parent.postMessage({type:'universe-nebula-ready'}, '*');
    }
  };
  window.requestAnimationFrame = callback => {
    let id = nativeRAF(time => {
      if (paused && ready) { waiting.set(id, callback); return; }
      callback(time); report();
    });
    return id;
  };
  window.cancelAnimationFrame = id => { waiting.delete(id); nativeCancel(id); };
  window.addEventListener('message', event => {
    if (event.source !== parent || event.data?.type !== 'universe-nebula-state') return;
    const data = event.data;
    if (typeof data.x === 'number') window.dispatchEvent(new PointerEvent('pointermove', {clientX:data.x*innerWidth, clientY:data.y*innerHeight}));
    if (typeof data.paused === 'boolean') {
      paused = data.paused;
      if (!paused) { const callbacks = [...waiting.values()]; waiting.clear(); callbacks.forEach(callback => window.requestAnimationFrame(callback)); }
    }
  });
})();
</script>`

export async function createThreeUIScenes(root: HTMLElement, signal: AbortSignal) {
  const nebulaHost = root.querySelector<HTMLElement>('#universe-nebula')!
  const sphereHost = root.querySelector<HTMLElement>('#universe-orbital')!
  const nebulaRoot = createRoot(nebulaHost)
  const sphereRoot = createRoot(sphereHost)
  let frame: HTMLIFrameElement | null = null
  let disposed = false, view = 0, paused = false
  const options = { signal }
  const send = (payload: Record<string, unknown>) => frame?.contentWindow?.postMessage({ type: 'universe-nebula-state', ...payload }, '*')
  const observer = new MutationObserver(() => {
    frame = nebulaHost.querySelector('iframe')
    if (frame && !frame.dataset.universeBridge) {
      frame.dataset.universeBridge = 'true'
      frame.tabIndex = -1
      frame.srcdoc = frame.srcdoc.replace('<head>', `<head>${nebulaBridge}`)
    }
  })
  observer.observe(nebulaHost, { childList: true, subtree: true })
  const settled = new Promise<void>(resolve => {
    const settle = () => {
      if (disposed) return
      const canvas = sphereHost.querySelector('canvas')
      if (!frame || !canvas) {
        requestAnimationFrame(settle)
        return
      }
      requestAnimationFrame(() => {
        if (disposed) return
        nebulaHost.dataset.loaded = sphereHost.dataset.loaded = 'true'
        send({ paused: true })
        sphereHost.dataset.active = 'false'
        resolve()
      })
    }
    requestAnimationFrame(settle)
  })
  root.addEventListener('pointermove', event => {
    if (view !== 4 || paused) return
    const bounds = root.getBoundingClientRect()
    send({ x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height })
  }, options)
  document.addEventListener('visibilitychange', () => {
    send({ paused: view !== 4 || paused || document.hidden })
    sphereHost.dataset.active = String(view === 5 && !document.hidden)
  }, options)
  function dispose() {
    if (disposed) return
    disposed = true; observer.disconnect()
    nebulaRoot.unmount(); sphereRoot.unmount()
  }
  signal.addEventListener('abort', dispose, { once: true })
  nebulaRoot.render(<div className="shader-frame"><StructureFlowCollection variant="nebula" hue={-53} saturation={0.65} brightness={1.00} /></div>)
  const renderSphere = () => sphereRoot.render(<div className="shader-frame"><StructureFlowCollection variant="orbital-sphere" speed={paused ? 0 : 1.00} particleSize={0.015} particleOpacity={0.80} orbitOpacity={0.25} hue={0} scale={1.00} haloOpacity={0.20} /></div>)
  renderSphere()
  await settled
  if (disposed) throw new DOMException('Experience disposed', 'AbortError')
  return {
    setView(next: number) {
      view = next
      send({ paused: next !== 4 || paused || document.hidden })
      sphereHost.dataset.active = String(next === 5)
    },
    setPaused(value: boolean) {
      if (paused !== value) { paused = value; renderSphere() }
      send({ paused: view !== 4 || paused || document.hidden })
    },
    dispose
  }
}
