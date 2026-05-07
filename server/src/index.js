import express from 'express'
import cors from 'cors'
import config from './config.js'
import errorHandler from './middleware/errorHandler.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'
import aiRoutes from './routes/ai.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(config.uploadDir))

app.use('/api/public', publicRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ai', aiRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
})
