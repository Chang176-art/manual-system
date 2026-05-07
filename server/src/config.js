export default {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'usermanual-admin-secret-key',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'usermanual'
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: 10 * 1024 * 1024
}
