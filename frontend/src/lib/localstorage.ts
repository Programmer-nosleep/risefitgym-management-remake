export function getLocalStorageItem(key: string) {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage.getItem(key)
  } catch (err) {
    console.error(`Error getting localStorage item: ${err}`)
    return null
  }
}

export function setLocalStorageItem(key: string, value: string) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(key, value)
  } catch (err) {
    console.error(`Error setting localStorage item: ${err}`)
  }
}

export function removeLocalStorageItem(key: string) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(key)
  } catch (err) {
    console.error(`Error removing localStorage item: ${err}`)
  }
}

export function getLocalStorageJson<T>(key: string, fallback: T): T {
  const raw = getLocalStorageItem(key)
  if (raw === null) return fallback

  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.error(`Error parsing localStorage item: ${err}`)
    return fallback
  }
}

export function setLocalStorageJson<T>(key: string, value: T) {
  setLocalStorageItem(key, JSON.stringify(value))
}
