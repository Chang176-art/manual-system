import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config.js'
import errorHandler from './middleware/errorHandler.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'
import aiRoutes from './routes/ai.js'

const app = express()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(config.uploadDir))

app.use('/api/public', publicRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ai', aiRoutes)

// Serve built client (production)
const clientDist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
})
