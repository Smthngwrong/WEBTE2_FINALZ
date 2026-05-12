export const API_BASE_URL = '/api'
export const API_TOKEN = 'webte2-dev-secret'
export const TOKEN_KEY = 'webte2_api_token'
export const USER_TOKEN_KEY = 'webte2_user_token'

export const pages = [
  { path: '/', label: 'Prehlad' },
  { path: '/terminal', label: 'Octave terminal' },
  { path: '/simulate/pendulum', label: 'Kyvadlo' },
  { path: '/simulate/ballbeam', label: 'Gulicka' },
  { path: '/stats', label: 'Statistiky' },
  { path: '/docs', label: 'API docs' },
]

export const examples = ['a = 1 + 1', 'x = [1 2 3]; sum(x)', 'sin(pi / 2)']

export const apiDocs = [
  ['GET', '/api/ping', 'Health check aplikacie'],
  ['POST', '/api/session/create', 'Vytvorenie perzistentnej Octave session'],
  ['POST', '/api/execute', 'Spustenie prikazu v Octave session'],
  ['DELETE', '/api/session/{id}', 'Zrusenie Octave session'],
  ['POST', '/api/simulate/pendulum', 'Simulacia obrateneho kyvadla'],
  ['POST', '/api/simulate/ballbeam', 'Simulacia gulicky na nosniku'],
  ['GET', '/api/stats', 'Statistiky vykonani a animacii'],
  ['GET', '/api/docs/pdf', 'Stiahnutie PDF dokumentacie'],
]
