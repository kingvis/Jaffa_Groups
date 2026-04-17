import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Map clean virtual asset paths → actual on-disk directories (with spaces)
const ASSET_ALIASES = {
  '/assets/fonts':     path.resolve(__dirname, 'fonts and logos-20260417T055848Z-3-001/fonts and logos'),
  '/assets/logos':     path.resolve(__dirname, 'fonts and logos-20260417T055848Z-3-001/fonts and logos'),
  '/assets/hero':      path.resolve(__dirname, 'Jaffa Group-20260417T055549Z-3-001/Jaffa Group/Hero Photos'),
  '/assets/portfolio': path.resolve(__dirname, 'Jaffa Group-20260417T055549Z-3-001/Jaffa Group/Jaffa Group Portfolo'),
}

const MIME_TYPES = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.otf':  'font/otf',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.glb':  'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.hdr':  'application/octet-stream',
  '.mp4':  'video/mp4',
}

function assetMiddlewarePlugin() {
  return {
    name: 'jaffa-asset-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent(req.url.split('?')[0])

        for (const [prefix, dir] of Object.entries(ASSET_ALIASES)) {
          if (url.startsWith(prefix + '/') || url === prefix) {
            const relativePath = url.slice(prefix.length)
            const filePath = path.join(dir, relativePath)

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase()
              const contentType = MIME_TYPES[ext] || 'application/octet-stream'
              res.setHeader('Content-Type', contentType)
              res.setHeader('Cache-Control', 'public, max-age=3600')
              fs.createReadStream(filePath).pipe(res)
              return
            }
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [assetMiddlewarePlugin()],
  publicDir: 'public',
  server: {
    port: 5173,
    open: true,
    fs: {
      strict: false,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
        },
      },
    },
  },
})
