import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { transformAsync } from '@babel/core'
import stylexPlugin from '@stylexjs/babel-plugin'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import riskAssessmentHandler from './api/risk-assessment'

const projectRoot = dirname(fileURLToPath(import.meta.url))

interface RequestWithOriginalUrl extends IncomingMessage {
  originalUrl?: string;
}

const readRequestBody = (request: IncomingMessage): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []

    request.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk)
    })

    request.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    request.on('error', reject)
  })

const getRequestHeaders = (request: IncomingMessage): Headers => {
  const headers = new Headers()

  for (const [headerName, headerValue] of Object.entries(request.headers)) {
    if (typeof headerValue === 'string') {
      headers.set(headerName, headerValue)
    }

    if (Array.isArray(headerValue)) {
      for (const value of headerValue) {
        headers.append(headerName, value)
      }
    }
  }

  return headers
}

const sendWebResponse = async (
  webResponse: Response,
  serverResponse: ServerResponse,
) => {
  serverResponse.statusCode = webResponse.status

  webResponse.headers.forEach((value, name) => {
    serverResponse.setHeader(name, value)
  })

  const responseBody = await webResponse.arrayBuffer()
  serverResponse.end(Buffer.from(responseBody))
}

const createLocalApiPlugin = (): Plugin => ({
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use(
      '/api/risk-assessment',
      async (request: RequestWithOriginalUrl, serverResponse) => {
        try {
          const requestBody = await readRequestBody(request)
          const originalUrl = request.originalUrl ?? '/api/risk-assessment'
          const url = new URL(originalUrl, 'http://localhost')
          const webRequest = new Request(url, {
            method: request.method,
            headers: getRequestHeaders(request),
            body:
              request.method === 'GET' || request.method === 'HEAD'
                ? undefined
                : requestBody,
          })

          const webResponse = await riskAssessmentHandler(webRequest)
          await sendWebResponse(webResponse, serverResponse)
        } catch (caughtError) {
          console.error(
            'Local API error:',
            caughtError instanceof Error ? caughtError.message : 'Unknown error',
          )

          serverResponse.statusCode = 500
          serverResponse.setHeader('Content-Type', 'application/json')
          serverResponse.end(
            JSON.stringify({
              data: null,
              error: 'Failed to generate risk assessment',
            }),
          )
        }
      },
    )
  },
})

const stylexVitePlugin = (): Plugin => ({
  name: 'stylex',
  enforce: 'pre',
  async transform(code, id) {
    const [filename] = id.split('?')

    if (!filename.endsWith('.stylex.ts')) {
      return null
    }

    const result = await transformAsync(code, {
      filename,
      sourceMaps: true,
      configFile: false,
      babelrc: false,
      plugins: [
        [
          stylexPlugin,
          {
            dev: true,
            test: false,
            runtimeInjection: true,
            treeshakeCompensation: true,
            unstable_moduleResolution: {
              type: 'commonJS',
              rootDir: projectRoot,
            },
          },
        ],
      ],
    })

    return result
      ? {
          code: result.code ?? code,
          map: result.map,
        }
      : null
  },
})

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, projectRoot, '')

  process.env.ANTHROPIC_API_KEY =
    process.env.ANTHROPIC_API_KEY ?? environment.ANTHROPIC_API_KEY

  return {
    plugins: [createLocalApiPlugin(), stylexVitePlugin(), react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
    },
  }
})
