import * as THREE from 'three'

/**
 * The sky and cloud sea share a single screen-space pass. The cloud positions are
 * world-space, so the atmosphere retains depth during the directed camera moves.
 * No image download, canvas texture, or per-frame allocation is required.
 */
const skyVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999999, 1.0);
  }
`

const skyFragment = /* glsl */ `
  uniform float uTime;
  uniform float uBackdrop;
  uniform mat4 uCameraWorld;
  uniform mat4 uProjectionInverse;
  uniform vec3 uCameraPosition;
  varying vec2 vUv;

  const vec3 SUN = vec3(-0.487, 0.812, 0.325);

  float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  // Rotating the noise domain between octaves removes aligned lattice details.
  const mat3 ROT = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
  float cloudNoise(vec3 p) {
    float n = noise(p) * 0.56;
    p = ROT * p * 2.03 + 3.1;
    n += noise(p) * 0.28;
    p = ROT * p * 2.02 + 7.7;
    n += noise(p) * 0.14;
    return n;
  }

  float density(vec3 p) {
    p.xz += vec2(uTime * 0.48, -uTime * 0.19);
    p.y += sin(p.x * 0.035 + uTime * 0.12) * 0.45;
    vec2 cell = floor(p.xz / 26.0);
    float distanceToCloud = 10000.0;
    // Smooth unions of irregular ellipsoids create genuine billowing caps.
    // The noise erodes their edges rather than flattening the entire ocean.
    for (int x = -1; x <= 1; x++) {
      for (int z = -1; z <= 1; z++) {
        vec2 index = cell + vec2(float(x), float(z));
        float n = hash(vec3(index, 17.0));
        vec2 offset = vec2(fract(n * 31.13), fract(n * 47.71));
        vec3 center = vec3((index.x + 0.18 + offset.x * 0.64) * 26.0,
          -31.0 + fract(n * 19.31) * 4.0,
          (index.y + 0.18 + offset.y * 0.64) * 26.0);
        float radius = 12.5 + fract(n * 17.19) * 5.5;
        vec3 difference = p - center;
        difference.xz *= 0.83 + offset * 0.25;
        float sphere = length(difference) - radius;
        float blend = max(3.0 - abs(distanceToCloud - sphere), 0.0) / 3.0;
        distanceToCloud = min(distanceToCloud, sphere) - blend * blend * 0.75;
      }
    }
    float erosion = (cloudNoise(p * 0.13) - 0.47) * 2.2;
    float topFade = 1.0 - smoothstep(-10.0, -8.5, p.y);
    return (1.0 - smoothstep(-3.0, 3.5, distanceToCloud + erosion)) * topFade * 0.42;
  }

  vec3 sky(vec3 ray) {
    float altitude = clamp(ray.y * 1.35 + 0.08, 0.0, 1.0);
    vec3 horizon = vec3(0.15, 0.205, 0.25);
    vec3 zenith = vec3(0.025, 0.052, 0.078);
    vec3 color = mix(horizon, zenith, pow(altitude, 0.58));

    float sunDot = max(dot(ray, SUN), 0.0);
    color += vec3(0.13, 0.075, 0.028) * pow(sunDot, 9.0);
    color += vec3(0.30, 0.19, 0.08) * pow(sunDot, 90.0);
    // The sun itself is obscured; a broad, soft disc gives the sky direction.
    color += vec3(1.0, 0.78, 0.49) * pow(sunDot, 1200.0) * 0.65;
    float azimuth = dot(normalize(ray.xz), normalize(SUN.xz)) * 0.5 + 0.5;
    float warmHorizon = exp(-pow((ray.y + 0.025) * 4.2, 2.0)) * pow(azimuth, 2.0);
    color += vec3(0.21, 0.095, 0.022) * warmHorizon;

    // Thin high-altitude layers, distinct from the billowing lower cloud ocean.
    vec3 highPosition = ray * (120.0 / max(ray.y + 0.42, 0.08));
    float highCloud = cloudNoise(highPosition * vec3(0.012, 0.003, 0.012)
      + vec3(uTime * 0.006, 8.0, -uTime * 0.002));
    float veil = smoothstep(0.49, 0.76, highCloud) * 0.19;
    color = mix(color, vec3(0.30, 0.33, 0.35), veil);
    return color;
  }

  void main() {
    vec4 projected = uProjectionInverse * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
    vec3 ray = normalize(mat3(uCameraWorld) * (projected.xyz / projected.w));
    vec3 background = sky(ray);
    vec3 color = background;
    float cloudCoverage = 0.0;

    if (ray.y < -0.006) {
      float enter = max((-8.5 - uCameraPosition.y) / ray.y, 0.0);
      float leave = min((-36.0 - uCameraPosition.y) / ray.y, 580.0);
      if (leave > enter) {
        float stepLength = (leave - enter) / float(CLOUD_STEPS);
        // Stable screen-space dithering softens ray steps without temporal noise.
        float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float distanceAlongRay = enter + stepLength * (0.47 + jitter * 0.06);
        vec3 accumulated = vec3(0.0);
        float transmission = 1.0;

        for (int i = 0; i < CLOUD_STEPS; i++) {
          vec3 p = uCameraPosition + ray * distanceAlongRay;
          float d = density(p);
          if (d > 0.005) {
            float lightSample = density(p + SUN * 4.5);
            float light = exp(-lightSample * 4.2);
            float altitude = smoothstep(-33.0, -10.0, p.y);
            vec3 shade = mix(vec3(0.048, 0.078, 0.10), vec3(0.43, 0.43, 0.37),
              clamp(light * 0.86 + altitude * 0.07, 0.0, 1.0));
            shade += vec3(0.09, 0.045, 0.012) * light * pow(max(dot(ray, SUN), 0.0), 6.0);

            float haze = 1.0 - exp(-distanceAlongRay * 0.0018);
            shade = mix(shade, background, haze * 0.72);
            float alpha = 1.0 - exp(-d * stepLength * 0.34);
            accumulated += shade * alpha * transmission;
            transmission *= 1.0 - alpha;
            if (transmission < 0.018) break;
          }
          distanceAlongRay += stepLength;
        }
        // The ocean falls into luminous aerial perspective at the horizon.
        vec3 distantSea = mix(vec3(0.075, 0.13, 0.18), background, 0.54);
        color = accumulated + distantSea * transmission;
        // Extinction toward the horizon hides the far boundary of the volume.
        color = mix(background, color, 1.0 - smoothstep(160.0, 510.0, enter));
        cloudCoverage = (1.0 - transmission) * (1.0 - smoothstep(160.0, 510.0, enter));
      }
    }

    // Very gentle photographic falloff, independent of the HTML composition.
    float vignette = dot(vUv - 0.5, vUv - 0.5);
    color *= 1.0 - vignette * 0.16;
    gl_FragColor = vec4(color, mix(1.0, cloudCoverage, uBackdrop));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const motesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aPhase;
  attribute float aSize;
  varying float vOpacity;
  void main() {
    vec3 p = position;
    float loop = fract(aPhase + uTime * 0.008);
    p.y = -9.0 + loop * 34.0;
    p.x += sin(uTime * 0.07 + aPhase * 25.0) * 0.65;
    p.z += cos(uTime * 0.05 + aPhase * 17.0) * 0.45;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * 67.0 / max(-viewPosition.z, 1.0), 0.7, 3.0) * uPixelRatio;
    vOpacity = smoothstep(0.0, 0.12, loop) * (1.0 - smoothstep(0.78, 1.0, loop));
    vOpacity *= 0.27 * (1.0 - smoothstep(35.0, 90.0, -viewPosition.z));
  }
`

const motesFragment = /* glsl */ `
  varying float vOpacity;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.1, 1.0, radius)) * vOpacity;
    gl_FragColor = vec4(0.72, 0.87, 0.9, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const bankVertex = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const bankFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCenter;
  uniform vec3 uHalfSize;
  uniform float uExtinction;
  uniform float uSeed;
  uniform float uWispiness;
  varying vec3 vWorldPosition;

  float bankHash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float bankNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(bankHash(i), bankHash(i + vec3(1,0,0)), f.x),
          mix(bankHash(i + vec3(0,1,0)), bankHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(bankHash(i + vec3(0,0,1)), bankHash(i + vec3(1,0,1)), f.x),
          mix(bankHash(i + vec3(0,1,1)), bankHash(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  float bankDensity(vec3 world) {
    vec3 local = (world - uCenter) / uHalfSize;
    // Smooth, flattened irregular envelopes disappear before the volume bounds.
    // This is a veil of drifting vapor, with no visible sphere or billboard edge.
    float envelope = 1.0 - smoothstep(0.20, 1.0,
      length(local * vec3(0.96, 1.12, 0.96)));
    if (envelope <= 0.0) return 0.0;
    vec3 p = world * 0.125 + vec3(uSeed, uSeed * 0.7, uSeed * 0.3);
    p.xz += vec2(uTime * 0.035, -uTime * 0.014);
    float broad = bankNoise(p);
    float detail = bankNoise(p * 2.13 + vec3(4.7, 1.3, 8.1));
    // More open foreground density leaves gaps between separate drifting wisps.
    float threshold = mix(0.28, 0.43, uWispiness);
    float density = max(broad * 0.72 + detail * 0.28 - threshold, 0.0)
      * mix(1.0, 1.65, uWispiness);
    return density * envelope;
  }

  void main() {
    vec3 ray = normalize(vWorldPosition - cameraPosition);
    vec3 origin = cameraPosition - uCenter;
    vec3 inverseRay = 1.0 / ray;
    vec3 nearPlane = (-uHalfSize - origin) * inverseRay;
    vec3 farPlane = (uHalfSize - origin) * inverseRay;
    vec3 entry = min(nearPlane, farPlane);
    vec3 exitPoint = max(nearPlane, farPlane);
    float enter = max(max(entry.x, entry.y), max(entry.z, 0.0));
    float leave = min(min(exitPoint.x, exitPoint.y), exitPoint.z);
    if (enter >= leave) discard;
    float stepLength = (leave - enter) / float(BANK_STEPS);
    float distanceAlongRay = enter + stepLength * 0.5;
    vec3 accumulated = vec3(0.0);
    float transmission = 1.0;
    const vec3 sun = vec3(-0.487, 0.812, 0.325);

    for (int i = 0; i < BANK_STEPS; i++) {
      vec3 world = cameraPosition + ray * distanceAlongRay;
      float d = bankDensity(world);
      if (d > 0.001) {
        float light = exp(-bankDensity(world + sun * 4.0) * 5.5);
        float altitude = clamp((world.y - uCenter.y) / uHalfSize.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 shade = mix(vec3(0.070, 0.105, 0.125), vec3(0.34, 0.35, 0.32),
          clamp(light * 0.74 + altitude * 0.14, 0.0, 1.0));
        float alpha = 1.0 - exp(-d * stepLength * uExtinction);
        accumulated += shade * alpha * transmission;
        transmission *= 1.0 - alpha;
      }
      distanceAlongRay += stepLength;
    }

    float opacity = 1.0 - transmission;
    if (opacity < 0.002) discard;
    gl_FragColor = vec4(accumulated / max(opacity, 0.001), opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export interface Atmosphere {
  group: THREE.Group
  update: (time: number, camera: THREE.PerspectiveCamera, pointer: THREE.Vector2, backdrop?: number) => void
  dispose: () => void
}

export function createAtmosphere({ mobile }: { mobile: boolean }): Atmosphere {
  const group = new THREE.Group()
  group.name = 'Cloud sea and atmosphere'
  const skyGeometry = new THREE.PlaneGeometry(2, 2)
  const skyMaterial = new THREE.ShaderMaterial({
    name: 'World-space cloud sea',
    defines: { CLOUD_STEPS: mobile ? 24 : 40 },
    uniforms: {
      uTime: { value: 0 },
      uBackdrop: { value: 0 },
      uCameraWorld: { value: new THREE.Matrix4() },
      uProjectionInverse: { value: new THREE.Matrix4() },
      uCameraPosition: { value: new THREE.Vector3() }
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    depthTest: false,
    depthWrite: false,
    fog: false
  })
  const backdrop = new THREE.Mesh(skyGeometry, skyMaterial)
  backdrop.name = 'Atmospheric background'
  backdrop.frustumCulled = false
  backdrop.renderOrder = -1000
  group.add(backdrop)

  const count = mobile ? 36 : 86
  const positions = new Float32Array(count * 3)
  const phases = new Float32Array(count)
  const sizes = new Float32Array(count)
  // Deterministic distribution keeps compositions stable during hot reloads.
  let seed = 8173
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let index = 0; index < count; index++) {
    const angle = random() * Math.PI * 2
    const radius = 10 + random() * 22
    positions[index * 3] = Math.cos(angle) * radius
    positions[index * 3 + 1] = random() * 34 - 9
    positions[index * 3 + 2] = Math.sin(angle) * radius
    phases[index] = random()
    sizes[index] = 0.45 + random() * 0.85
  }
  const motesGeometry = new THREE.BufferGeometry()
  motesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  motesGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  motesGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  const motesMaterial = new THREE.ShaderMaterial({
    name: 'Suspended atmospheric motes',
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: mobile ? 1 : 1.3 } },
    vertexShader: motesVertex,
    fragmentShader: motesFragment,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
  const motes = new THREE.Points(motesGeometry, motesMaterial)
  motes.name = 'Quiet suspended particles'
  motes.frustumCulled = false
  group.add(motes)

  const bankGeometry = new THREE.BoxGeometry(2, 2, 2)
  const bankMaterials: THREE.ShaderMaterial[] = []
  const bankTime = { value: 0 }
  const banks = [
    { name: 'Mist within the lower foundations', center: [-3, -19, -2], halfSize: [31, 7, 28], extinction: 0.075, wispiness: 0.20 },
    { name: 'Foreground vapor across the suspended apron', center: [7, -9, 29], halfSize: [30, 3.5, 11], extinction: 0.11, wispiness: 1.0 },
    { name: 'Cloud veil through the western bridge', center: [-57, -5, 1], halfSize: [23, 5, 17], extinction: 0.14, wispiness: 0.45 },
    { name: 'Cloud veil through the eastern bridge', center: [28, -2, -42], halfSize: [17, 6, 23], extinction: 0.13, wispiness: 0.35 },
    { name: 'Distant bank below the outer infrastructure', center: [-25, -10, -60], halfSize: [65, 10, 20], extinction: 0.10, wispiness: 0.25 }
  ]
  for (const [index, bank] of banks.entries()) {
    const center = new THREE.Vector3(...bank.center as [number, number, number])
    const halfSize = new THREE.Vector3(...bank.halfSize as [number, number, number])
    const material = new THREE.ShaderMaterial({
      name: bank.name,
      defines: { BANK_STEPS: mobile ? 8 : 12 },
      uniforms: {
        uTime: bankTime,
        uCenter: { value: center },
        uHalfSize: { value: halfSize },
        uExtinction: { value: bank.extinction },
        uSeed: { value: index * 7.31 },
        uWispiness: { value: bank.wispiness }
      },
      vertexShader: bankVertex,
      fragmentShader: bankFragment,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      fog: false
    })
    const volume = new THREE.Mesh(bankGeometry, material)
    volume.name = bank.name
    volume.position.copy(center)
    volume.scale.copy(halfSize)
    group.add(volume)
    bankMaterials.push(material)
  }

  return {
    group,
    update(time, camera, _pointer, backdrop = 0) {
      camera.updateMatrixWorld()
      skyMaterial.uniforms.uTime.value = time
      skyMaterial.uniforms.uBackdrop.value = backdrop
      skyMaterial.uniforms.uCameraWorld.value.copy(camera.matrixWorld)
      skyMaterial.uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse)
      skyMaterial.uniforms.uCameraPosition.value.copy(camera.position)
      motesMaterial.uniforms.uTime.value = time
      bankTime.value = time
    },
    dispose() {
      skyGeometry.dispose()
      skyMaterial.dispose()
      motesGeometry.dispose()
      motesMaterial.dispose()
      bankGeometry.dispose()
      bankMaterials.forEach(material => material.dispose())
      group.clear()
    }
  }
}
