import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const channel = { listen: vi.fn(), error: vi.fn() }
  const client = { private: vi.fn(() => channel), leave: vi.fn() }
  return {
    channel,
    client,
    EchoConstructor: vi.fn(function EchoMock() {
      return client
    }),
    PusherMock: class PusherMock {},
    authState: { token: 'tok-123' },
  }
})

vi.mock('laravel-echo', () => ({ default: mocks.EchoConstructor }))
vi.mock('pusher-js', () => ({ default: mocks.PusherMock }))
vi.mock('@/stores/authStore.js', () => ({ useAuthStore: () => mocks.authState }))

const API_URL = 'http://localhost:8000/api/mis'
const BASE_ENV = {
  VITE_API_URL: API_URL,
  VITE_PUSHER_APP_KEY: 'test-key',
  VITE_PUSHER_APP_CLUSTER: 'mt1',
  VITE_PUSHER_HOST: '127.0.0.1',
  VITE_PUSHER_PORT: '6001',
  VITE_PUSHER_SCHEME: 'http',
}

let echoModule

function stubEnv(envOverrides) {
  for (const [envName, envValue] of Object.entries({ ...BASE_ENV, ...envOverrides })) vi.stubEnv(envName, envValue)
}

beforeEach(async () => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
  mocks.channel.listen.mockReturnValue(mocks.channel)
  mocks.channel.error.mockReturnValue(mocks.channel)
  mocks.client.private.mockReturnValue(mocks.channel)
  mocks.authState.token = 'tok-123'
  echoModule = await import('@/services/echo.js')
})

describe('buildBroadcastAuthUrl', () => {
  it('derives the auth URL from the API origin', () => {
    expect(echoModule.buildBroadcastAuthUrl(API_URL)).toBe('http://localhost:8000/api/broadcasting/auth')
  })

  it('throws for a missing or relative API URL', () => {
    for (const badUrl of ['', undefined, 'api/mis']) {
      expect(() => echoModule.buildBroadcastAuthUrl(badUrl)).toThrow('VITE_API_URL must be an absolute URL.')
    }
  })
})

describe('buildEchoOptions', () => {
  it('builds the pusher options from the env', () => {
    const echoOptions = echoModule.buildEchoOptions(BASE_ENV)
    expect(echoOptions).toMatchObject({
      broadcaster: 'pusher',
      Pusher: mocks.PusherMock,
      key: 'test-key',
      cluster: 'mt1',
      wsHost: '127.0.0.1',
      wsPort: 6001,
      wssPort: 6001,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    })
    expect(echoOptions.channelAuthorization).toMatchObject({
      endpoint: 'http://localhost:8000/api/broadcasting/auth',
      transport: 'ajax',
    })
  })

  it('omits the socket host and forces TLS for https without a host', () => {
    const echoOptions = echoModule.buildEchoOptions({ ...BASE_ENV, VITE_PUSHER_HOST: '', VITE_PUSHER_SCHEME: 'https' })
    expect(echoOptions).not.toHaveProperty('wsHost')
    expect(echoOptions.forceTLS).toBe(true)
  })

  it('fails fast on a missing key or cluster', () => {
    expect(() => echoModule.buildEchoOptions({ ...BASE_ENV, VITE_PUSHER_APP_KEY: '' })).toThrow(
      'Pusher key is not configured.',
    )
    expect(() => echoModule.buildEchoOptions({ ...BASE_ENV, VITE_PUSHER_APP_CLUSTER: '' })).toThrow(
      'Pusher cluster is not configured.',
    )
  })

  it('reads the bearer token on every auth request', () => {
    const { headersProvider } = echoModule.buildEchoOptions(BASE_ENV).channelAuthorization
    expect(headersProvider()).toEqual({ Accept: 'application/json', Authorization: 'Bearer tok-123' })
    mocks.authState.token = 'tok-456'
    expect(headersProvider().Authorization).toBe('Bearer tok-456')
  })

  it('sends only Accept without a token', () => {
    mocks.authState.token = null
    const { headersProvider } = echoModule.buildEchoOptions(BASE_ENV).channelAuthorization
    expect(headersProvider()).toEqual({ Accept: 'application/json' })
  })
})

describe('listenForRfidScans', () => {
  it('builds Echo once and listens on private rfid', () => {
    stubEnv({})
    echoModule.listenForRfidScans(vi.fn(), vi.fn())
    echoModule.listenForRfidScans(vi.fn(), vi.fn())
    expect(mocks.EchoConstructor).toHaveBeenCalledTimes(1)
    expect(mocks.client.private).toHaveBeenCalledWith('rfid')
    expect(mocks.channel.listen).toHaveBeenCalledWith('AssignRfid', expect.any(Function))
  })

  it('passes a trimmed UID and drops empty messages', () => {
    stubEnv({})
    const onScan = vi.fn()
    echoModule.listenForRfidScans(onScan, vi.fn())
    const scanListener = mocks.channel.listen.mock.calls[0][1]
    scanListener({})
    scanListener({ message: '' })
    expect(onScan).not.toHaveBeenCalled()
    scanListener({ message: ' 04:A3 ' })
    expect(onScan).toHaveBeenCalledWith('04:A3')
  })

  it('hands the error callback to the channel', () => {
    stubEnv({})
    const onError = vi.fn()
    echoModule.listenForRfidScans(vi.fn(), onError)
    expect(mocks.channel.error).toHaveBeenCalledWith(onError)
  })

  it('throws before building Echo when the handler is not a function', () => {
    stubEnv({})
    expect(() => echoModule.listenForRfidScans('nope', vi.fn())).toThrow('A scan handler is required.')
    expect(mocks.EchoConstructor).not.toHaveBeenCalled()
  })

})

describe('leaveRfidChannel', () => {
  it('does nothing before any listen, then leaves rfid after one', () => {
    stubEnv({})
    echoModule.leaveRfidChannel()
    expect(mocks.EchoConstructor).not.toHaveBeenCalled()
    expect(mocks.client.leave).not.toHaveBeenCalled()
    echoModule.listenForRfidScans(vi.fn(), vi.fn())
    echoModule.leaveRfidChannel()
    expect(mocks.client.leave).toHaveBeenCalledWith('rfid')
  })
})
