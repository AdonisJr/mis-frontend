import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useAuthStore } from '@/stores/authStore.js'

const RFID_CHANNEL = 'rfid'
const ASSIGN_RFID_EVENT = 'AssignRfid'
const BROADCAST_AUTH_PATH = '/api/broadcasting/auth'
const PUSHER_BROADCASTER = 'pusher'
const HTTPS_SCHEME = 'https'
const AUTH_TRANSPORT = 'ajax'
const ENABLED_TRANSPORTS = ['ws', 'wss']
const AUTHORIZATION_HEADER = 'Authorization'
const BEARER_PREFIX = 'Bearer '
const MISSING_KEY_MESSAGE = 'Pusher key is not configured.'
const MISSING_CLUSTER_MESSAGE = 'Pusher cluster is not configured.'
const MISSING_API_URL_MESSAGE = 'VITE_API_URL must be an absolute URL.'
const MISSING_SCAN_HANDLER_MESSAGE = 'A scan handler is required.'

let echoClient = null

export function buildBroadcastAuthUrl(apiBaseUrl) {
  if (typeof apiBaseUrl !== 'string' || apiBaseUrl === '') throw new Error(MISSING_API_URL_MESSAGE)
  try {
    return new URL(BROADCAST_AUTH_PATH, apiBaseUrl).href
  } catch {
    throw new Error(MISSING_API_URL_MESSAGE)
  }
}

function buildAuthHeaders() {
  const authHeaders = { Accept: 'application/json' }
  const token = useAuthStore().token
  if (token) authHeaders[AUTHORIZATION_HEADER] = BEARER_PREFIX + token
  return authHeaders
}

function buildSocketOptions(viteEnv) {
  if (!viteEnv.VITE_PUSHER_HOST) return {}
  const socketPort = Number(viteEnv.VITE_PUSHER_PORT) || undefined
  return {
    wsHost: viteEnv.VITE_PUSHER_HOST,
    wsPort: socketPort,
    wssPort: socketPort,
    enabledTransports: ENABLED_TRANSPORTS,
  }
}

export function buildEchoOptions(viteEnv) {
  if (!viteEnv.VITE_PUSHER_APP_KEY) throw new Error(MISSING_KEY_MESSAGE)
  if (!viteEnv.VITE_PUSHER_APP_CLUSTER) throw new Error(MISSING_CLUSTER_MESSAGE)
  return {
    broadcaster: PUSHER_BROADCASTER,
    Pusher,
    key: viteEnv.VITE_PUSHER_APP_KEY,
    cluster: viteEnv.VITE_PUSHER_APP_CLUSTER,
    forceTLS: viteEnv.VITE_PUSHER_SCHEME === HTTPS_SCHEME,
    ...buildSocketOptions(viteEnv),
    channelAuthorization: {
      endpoint: buildBroadcastAuthUrl(viteEnv.VITE_API_URL),
      transport: AUTH_TRANSPORT,
      headersProvider: buildAuthHeaders,
    },
  }
}

function getEchoClient() {
  if (echoClient) return echoClient
  echoClient = new Echo(buildEchoOptions(import.meta.env))
  return echoClient
}

export function listenForRfidScans(onScan, onError) {
  if (typeof onScan !== 'function') throw new Error(MISSING_SCAN_HANDLER_MESSAGE)
  getEchoClient()
    .private(RFID_CHANNEL)
    .listen(ASSIGN_RFID_EVENT, (scanEvent) => {
      const rawUid = scanEvent?.message
      const scannedUid = typeof rawUid === 'string' ? rawUid.trim() : ''
      if (scannedUid !== '') onScan(scannedUid)
    })
    .error(onError)
}

export function leaveRfidChannel() {
  if (!echoClient) return
  echoClient.leave(RFID_CHANNEL)
}
