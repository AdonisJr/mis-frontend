import http from '@/services/http.js'

const RFID_OPEN_PATH = '/rfid/open'
const RFID_CLOSE_PATH = '/rfid/close'

export async function openRfidChannel() {
  const response = await http.post(RFID_OPEN_PATH)
  return response.data
}

export async function closeRfidChannel() {
  // runs during cleanup (unmount, logout, route leave), where a 401/403 toast would be noise
  const response = await http.post(RFID_CLOSE_PATH, null, { skipAuthHandling: true })
  return response.data
}
