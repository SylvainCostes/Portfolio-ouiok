# Product

## Register

brand

## Users and purpose

Sylvain Costes's personal portfolio, projects and technical articles, built with Astro and MDX. The existing English and French routes serve visitors exploring his development work and potential collaborators. Contact links in the repository point to contact@sylvaincostes.com, GitHub and LinkedIn.

## Current mission

Temporarily replace the public site with a French interactive construction installation, likely for several months. The homepage returns 200; old and unknown URLs redirect temporarily to it with 302. Preserve the entire portfolio source and provide an explicit build-time switch to restore it. The actual deployment is the Node standalone adapter inside Docker, published by GitHub Actions.

## Personality

Sculptural, tactile, playful. Construction is a physical metaphor for making software. The user has explicitly delegated the visual direction and concept selection.

## Design principles

- One memorable, interactive architectural model is the focus.
- Communicate temporary maintenance immediately, with minimal French copy.
- Keep a real contact route available.
- Limit visible copy to the logo/name, “Tout se (re)construit.”, “Building something.” and a discreet contact link. Icon controls have accessible labels and contextual tooltips. The user approved the art direction and explicitly requested preserving all 3D detail.
- Avoid generic coming-soon templates, fake dates and fake progress indicators.
- Preserve existing content, indexable homepage and temporary redirect semantics. No global noindex or robots disallow.

## Accessibility

Readable HTML independent of WebGL or JavaScript; keyboard-accessible controls; reduced-motion support; pause control; responsive layout; lightweight illustrated fallback.
