import multer from 'multer'
import path from 'path'
import config from '../config.js'
import { success, fail } from '../utils/response.js'
import fs from 'fs'

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) return cb(null, true)
    cb(new Error('不支持的文件格式'))
  }
})

export function uploadImage(req, res, next) {
  upload.single('file')(req, res, err => {
    if (err) return next(err)
    if (!req.file) return fail(res, '请选择文件', -1)
    success(res, { url: '/uploads/' + req.file.filename })
  })
}
