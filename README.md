# biblesearch

Angular Bible reader and offline full-text search application. Bible translations run entirely in the browser using SQLite WASM and are cached for offline use.

## Development

```sh
bun install
bun start
```

## GitHub Pages

Push to `main`. The [GitHub Pages workflow](.github/workflows/deploy-pages.yml) builds the application and deploys it.

Enable **GitHub Actions** as the Pages source in the repository settings once.

To verify the production artifact locally:

```sh
bun run build:pages
```
