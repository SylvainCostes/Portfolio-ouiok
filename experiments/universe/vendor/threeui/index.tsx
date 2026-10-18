import { createElement } from 'react'
import type { NeuformCraftEffectProps } from './src/shaders/neuform-isolated/NeuformCraftEffects'
import { NebulaBackground } from './src/shaders/neuform-isolated/NeuformCraftEffects'
import type { OrbitalSphereBackgroundProps } from './src/shaders/orbital-sphere/OrbitalSphereBackground'
import { OrbitalSphereBackground } from './src/shaders/orbital-sphere/OrbitalSphereBackground'

// Eager imports avoid the React Suspense resolution crash seen in the local
// browser bundle for this file-based package dependency.
type Props = ({ variant: 'nebula' } & NeuformCraftEffectProps) | ({ variant: 'orbital-sphere' } & OrbitalSphereBackgroundProps)
export function StructureFlowCollection(props: Props) {
  if (props.variant === 'nebula') {
    const { variant, ...options } = props
    return createElement(NebulaBackground, options)
  }
  const { variant, ...options } = props
  return createElement(OrbitalSphereBackground, options)
}
