import { ShaderMaterial, WebGLRenderTarget, type WebGLRenderer } from 'three'
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js'

/** Keep the beauty pass coverage before AO and additive bloom overwrite alpha. */
export class SceneAlphaPass extends Pass {
  readonly target = new WebGLRenderTarget(1, 1, { depthBuffer: false })
  private material = new ShaderMaterial({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){float a=texture2D(tDiffuse,vUv).a;gl_FragColor=vec4(a,a,a,1.);}'
  })
  private quad = new FullScreenQuad(this.material)
  constructor() { super(); this.needsSwap = false }
  override setSize(width: number, height: number) { this.target.setSize(width, height) }
  override render(renderer: WebGLRenderer, _write: WebGLRenderTarget, read: WebGLRenderTarget) {
    this.material.uniforms.tDiffuse.value = read.texture
    renderer.setRenderTarget(this.target)
    this.quad.render(renderer)
  }
  override dispose() { this.target.dispose(); this.material.dispose(); this.quad.dispose() }
}
