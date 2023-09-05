const express = require('express')
const mongoose = require('mongoose')
const cookiesParser = require('cookie-parser')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Message = require('./models/Message')
const cors = require('cors')
const ws = require('ws')
const fs = require('fs')

// #!/usr/bin / env node

dotenv.config()
mongoose.connect(process.env.MONGO_URL)
const jwtSecret = process.env.JWT_SECRET

const app = express()
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.json())
app.use(cookiesParser())
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL,
  methods: ['POST', 'GET']
  // origin: process.env.CLIENT_URL,
}));

const getUserDataFromRequest = async (req) => {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err
        resolve(userData)
      })
    }
    else {
      reject('no token')
    }
  })

}

app.get('/test', (req, res) => {
  res.json('Hello World 1')
})

app.get('/', (req, res) => {
  res.json('Hello World 1')
})

app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params
  const userData = await getUserDataFromRequest(req)
  const ourUserId = userData.userId
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  })
  res.json(messages)
})

app.get('/profile', (req, res) => {
  const token = req.cookies?.token
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err
      res.json(userData)
    })
  }
  else {
    res.status(422).json('no token')
  }
})

app.get('/people', async (req, res) => {
  const users = await User.find({}, { '_id': 1, username: 1 })
  res.json(users)

})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const foundUser = await User.findOne({ username })
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password)
    if (passOk) {
      jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id: foundUser._id,
          token: "12324",
        })
      })
    }
  }
})

app.post('/logout', async (req, res) => {
  res.clearCookie('token').json({ message: 'ok' })

})

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const createdUser = await User.create({
      username: username,
      password: bcrypt.hashSync(password, 10),
    });

    jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.status(201).json({
        id: createdUser._id,
      });
    });
  } catch (err) {

    res.status(500).json({ message: 'Tài khoản đã tồn tại' });
  }
});



const server = app.listen(4040)


const wss = new ws.WebSocketServer({ server })
wss.on('connection', (connection, req) => {
  const notifyAboutOnlinePeople = () => {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({ online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username })) }))
    })
  }
  connection.isAlive = true
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log('dead');
    }, 1000);
  }, 5000);
  connection.on('pong', () => {
    clearTimeout(connection.deathTimer)
  })
  const cookies = req.headers.cookie
  const token = cookies && cookies?.split(';')?.find(cookie => cookie?.includes('token'))?.split('=')[1]
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err
      const { username, userId } = userData
      connection.userId = userId
      connection.username = username
    })
  }
  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString())
    const { recipient, text, file } = messageData
    let fileName = null
    if (file) {
      const parts = file.name.split('.');
      const extension = parts[parts.length - 1];
      fileName = Date.now() + "." + extension;
      const path = __dirname + '/uploads/' + fileName;
      const bufferData = Buffer.from(file.data.split(',')[1], "base64"); // Sử dụng Buffer.from() thay thế
      fs.writeFile(path, bufferData, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('done', path);
        }
      });
    }

    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? fileName : null,
      });
      [...wss.clients].filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
          text,
          sender: connection.userId,
          file: file ? fileName : null,
          recipient,
          _id: messageDoc._id,
        })))
    }
  });

  notifyAboutOnlinePeople()
})



// XKnCRT4QdCg4AxhX
