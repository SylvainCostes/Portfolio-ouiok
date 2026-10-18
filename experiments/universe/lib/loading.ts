/** Progress counts completed preparation stages, never simulated download bytes. */
export function createLoading(root: HTMLElement) {
  const progress = root.querySelector<HTMLProgressElement>('#universe-progress')!
  const count = root.querySelector<HTMLElement>('#universe-load-count')!
  const label = root.querySelector<HTMLElement>('#universe-load-label')!
  const loader = root.querySelector<HTMLElement>('#universe-loader')!
  const shell = root.querySelector<HTMLElement>('#universe-interface')!
  const stages = ['Chargement de l’expérience', 'Typographie', 'Architecture', 'Îles & habitants', 'Atmosphère', 'Ciel & dimension numérique', 'Préparation du rendu', 'Ouverture du monde']
  let done = 0
  return {
    async advance(step: number) {
      done = Math.max(done, step)
      progress.value = done; count.textContent = String(Math.round(done / 8 * 100)).padStart(3, '0')
      label.textContent = stages[Math.min(done, 7)]
      loader.style.setProperty('--load', String(done / 8))
      // Yield to the browser so the loader paints between CPU-heavy stages.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    },
    finish() {
      progress.value = 8; count.textContent = '100'; loader.style.setProperty('--load', '1')
      label.textContent = 'Le monde est prêt'; loader.setAttribute('aria-hidden', 'true'); loader.inert = true
      shell.inert = false; root.setAttribute('aria-busy', 'false')
    },
    fail(message: string) {
      loader.hidden = true; shell.inert = false; root.setAttribute('aria-busy', 'false')
      root.querySelector<HTMLElement>('#universe-failure')!.textContent = message
      root.querySelector<HTMLButtonElement>('#universe-retry')!.hidden = false
    }
  }
}
