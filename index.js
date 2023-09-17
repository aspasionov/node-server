const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth')
const session = require('express-session')
const columnRoutes = require('./routes/column')
const taskRoutes = require('./routes/task')
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv')

dotenv.config()
const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use(cors());

app.use('/auth', authRoutes)
app.use('/api/column', columnRoutes)
app.use('/api/task', taskRoutes)

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI, {
      useNewUrlParser: true,
    })
    app.listen(8080, () => {
      console.log(`server is running on port ${process.env.PORT || 8080}`)
    })
  } catch(err) {
    console.log(err)
  }
}

start()


