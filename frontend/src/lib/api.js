import { API_BASE_URL, API_TOKEN, TOKEN_KEY, USER_TOKEN_KEY } from './constants'

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|;)\\s*' + name + '\\s*=\\s*([^;]+)'))
  return match ? match[1] : null
}

function setCookie(name, value) {
  document.cookie = `${name}=${value};max-age=${365 * 24 * 60 * 60};path=/;SameSite=Lax`
}

export function ensureLocalIdentity() {
  if (!localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, API_TOKEN)
  }

  if (!getCookie(USER_TOKEN_KEY)) {
    const token = crypto.randomUUID?.() ?? `user-${Date.now()}-${Math.random().toString(16).slice(2)}`
    setCookie(USER_TOKEN_KEY, token)
  }
}

export function authHeaders(includeJson = true) {
  return {
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? API_TOKEN}`,
    'X-User-Token': getCookie(USER_TOKEN_KEY) ?? '',
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...options.headers,
    },
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed with status ${response.status}`)
  }

  return body
}
