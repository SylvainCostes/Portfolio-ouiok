import type { Camera, Object3D, Scene, WebGLRenderer, WebGLRenderTarget } from 'three'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'

/** Contact shadows for architectural joints. Light and cloud shaders never enter the normal buffer. */
export class ArchitecturalOcclusion extends GTAOPass {
  private excluded: Object3D[]
  private resolutionScale: number

  constructor(scene: Scene, camera: Camera, excluded: Object3D[], mobile: boolean) {
    super(scene, camera, 1, 1)
    this.excluded = excluded
    this.resolutionScale = mobile ? .5 : .75
    this.blendIntensity = .85
    this.updateGtaoMaterial({ radius: .7, distanceExponent: 1.5, thickness: 1.2, distanceFallOff: 1, scale: 1.4, samples: mobile ? 8 : 16, screenSpaceRadius: false })
    this.updatePdMaterial({ radius: 4, samples: mobile ? 8 : 16 })
  }

  override setSize(width: number, height: number) {
    super.setSize(Math.max(1, Math.round(width * this.resolutionScale)), Math.max(1, Math.round(height * this.resolutionScale)))
  }

  override render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime: number, maskActive: boolean) {
    const visibility = this.excluded.map(object => object.visible)
    for (const object of this.excluded) object.visible = false
    try { super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) }
    finally { this.excluded.forEach((object, index) => { object.visible = visibility[index] }) }
  }

  override dispose() {
    // r180's pass owns these two materials but does not release them itself.
    this.gtaoMaterial.dispose()
    this.blendMaterial.dispose()
    super.dispose()
  }
}
