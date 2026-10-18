# sylvaincostes.com

My personal portfolio, blog & projects, built with Astro.

## Temporary construction installation

The build defaults to the interactive maintenance experience. The homepage returns HTTP 200 and old or unknown routes return HTTP 302 to `/`. Only the maintenance source and its small public asset directory are included in that build. `robots.txt` remains crawlable and the homepage has a canonical URL; there is no global `noindex`.

To preview locally, run `pnpm dev`. To build and check the maintenance mode, run `pnpm build`. The Docker image also defaults to maintenance mode, so the existing deployment pipeline can use its normal build command.

To restore the original portfolio, build with `MAINTENANCE_MODE=false` (for example, `MAINTENANCE_MODE=false pnpm build:node` on Linux, or `$env:MAINTENANCE_MODE='false'; pnpm build:node` in PowerShell). For Docker, pass `--build-arg MAINTENANCE_MODE=false` when building the image. Rebuild and redeploy after changing this flag: it is intentionally a build-time switch. The original `src/` pages, components, articles and `public/` assets stay in place.

`pnpm build:node` skips the existing source-wide Astro type check when restoring the original site; this matches the previous Docker build behavior. `pnpm build` still runs the check. The maintenance build always type checks its own source before building. Run `node --test tests/maintenance-routing.test.mjs` after a maintenance build to check production routing and asset isolation.

## 📚 Tech Stack

- Framework: [Astro](https://astro.build/) with TypeScript
- Styling: [Tailwind CSS](https://tailwindcss.com/)
- Content: MDX
- Hosting: Deployed on [Vercel](https://vercel.com/)

## 🚀 How to Run

1. Clone this repository
2. Setup the environment variables
   ```sh
   mv .env.example .env
   ```
3. Install the dependency
   ```sh
   pnpm i
   ```
4. Run the development server
   ```sh
   pnpm dev
   ```
5. Open your browser and navigate to http://localhost:4321.

## 🌐 Preview the Built Project Locally

To serve the built project locally, run the following command:

```sh
pnpm preview
```

This will start a local server to preview the production build. It will be available at http://localhost:3000. You can adjust the local URL in the `package.json` file if needed.

## 🐳 Docker

The CI/CD pipeline (GitHub Actions) automatically builds and pushes a multi-platform image (`linux/amd64`, `linux/arm64`) to Docker Hub on every push to `master`.

To run the production image locally:

```sh
docker run -p 4321:4321 --env-file .env sylvaincostes/portfolio:latest
```
