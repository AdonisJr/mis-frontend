import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import {
  createRoom,
  deactivateRoom,
  fetchActiveRooms,
  fetchRooms,
  reactivateRoom,
  updateRoom,
} from '@/services/roomService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const ROOM_PAYLOAD = { name: 'RM 101', building: null, capacity: 40, type: 'classroom' }
const ID_MESSAGE = 'A valid room id is required.'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchRooms', () => {
  it('gets /rooms with the params and returns the response data', async () => {
    http.get.mockResolvedValue({ data: { rooms: [] } })
    await expect(fetchRooms({ page: 2 })).resolves.toEqual({ rooms: [] })
    expect(http.get).toHaveBeenCalledWith('/rooms', { params: { page: 2 } })
  })
})

describe('fetchActiveRooms', () => {
  it('gets /rooms/active', async () => {
    http.get.mockResolvedValue({ data: { rooms: [1] } })
    await expect(fetchActiveRooms()).resolves.toEqual({ rooms: [1] })
    expect(http.get).toHaveBeenCalledWith('/rooms/active')
  })
})

describe('createRoom', () => {
  it('posts the payload to /rooms', async () => {
    http.post.mockResolvedValue({ data: { room: { id: 1 } } })
    await expect(createRoom(ROOM_PAYLOAD)).resolves.toEqual({ room: { id: 1 } })
    expect(http.post).toHaveBeenCalledWith('/rooms', ROOM_PAYLOAD)
  })
})

describe('updateRoom', () => {
  it('puts the payload to /rooms/{id}', async () => {
    http.put.mockResolvedValue({ data: { room: { id: 7 } } })
    await expect(updateRoom(7, ROOM_PAYLOAD)).resolves.toEqual({ room: { id: 7 } })
    expect(http.put).toHaveBeenCalledWith('/rooms/7', ROOM_PAYLOAD)
  })
})

describe('deactivateRoom and reactivateRoom', () => {
  it('put without a body to the status segments', async () => {
    http.put.mockResolvedValue({ data: { room: { id: 7 } } })
    await deactivateRoom(7)
    await reactivateRoom(7)
    expect(http.put).toHaveBeenNthCalledWith(1, '/rooms/7/deactivate')
    expect(http.put).toHaveBeenNthCalledWith(2, '/rooms/7/reactivate')
  })
})

describe('room id guard', () => {
  it('rejects a non-integer or non-positive id before any request', async () => {
    await expect(updateRoom('7', ROOM_PAYLOAD)).rejects.toThrow(ID_MESSAGE)
    await expect(deactivateRoom(0)).rejects.toThrow(ID_MESSAGE)
    await expect(reactivateRoom(null)).rejects.toThrow(ID_MESSAGE)
    expect(http.put).not.toHaveBeenCalled()
  })
})

describe('failed requests', () => {
  it('rejects with the same error object the client raised', async () => {
    const validationError = { response: { status: 422, data: { errors: { name: ['taken'] } } } }
    http.post.mockRejectedValue(validationError)
    await expect(createRoom(ROOM_PAYLOAD)).rejects.toBe(validationError)
  })
})
