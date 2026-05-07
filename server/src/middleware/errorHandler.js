import { fail } from '../utils/response.js'

export default function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message)
  if (err.name === 'MulterError') {
    return fail(res, '文件上传失败: ' + err.message, -1, 400)
  }
  return fail(res, '服务器内部错误', -1, 500)
}
