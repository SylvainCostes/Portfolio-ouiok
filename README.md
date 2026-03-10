# sylvaincostes.com

My personal portfolio, blog & projects, built with Astro.

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
