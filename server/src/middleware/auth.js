import jwt from 'jsonwebtoken'
import config from '../config.js'
import { fail } from '../utils/response.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, '未登录', -1, 401)
  }
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret)
    next()
  } catch {
    return fail(res, '登录已过期', -1, 401)
  }
}

export function generateToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}
