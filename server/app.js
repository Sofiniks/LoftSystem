const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function (_, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    )
    next()
})

app.use(express.static(path.join(process.cwd(), 'build')))
app.use(express.static(path.join(process.cwd(), 'upload')))

require('./models/connection')
require('./auth/passport')

app.use('/api', require('./routes'))

app.use('*', (_req, res) => {
    const file = path.resolve(process.cwd(), 'build', 'index.html')
    res.sendFile(file)
})

app.use((err, _, res, __) => {
    console.log(err.stack)
    res.status(500).json({
        code: 500,
        message: err.message
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, function () {
    console.log(`Server running. Use our API on port: ${PORT}`)
})

const connectedUsers = {};
const historyMessage = {};

io.on('connection', (socket) => {
    const socketId = socket.id;

    socket.on('users:connect', (data) => {
        const user = { ...data, activeRoom: null, socketId }
        connectedUsers[socketId] = user;

        socket.emit('users:list', Object.values(connectedUsers))
        socket.broadcast.emit('users:add', user)
    })
    socket.on('message:add', data => {
        const { senderId, recipientId, roomId } = data;
        console.log('message:add', data)

        socket.emit('message:add', data);
        socket.broadcast.to(roomId).emit('message:add', data);
        addMessageHistory(senderId, recipientId, data);
        if (senderId !== recipientId) {
            addMessageHistory(recipientId, senderId, data)
        }
    })

    socket.on('message:history', (data) => {
        if (historyMessage[data.userId] && historyMessage[data.userId][data.recipientId]) {
            socket.emit('message:history', historyMessage[data.userId][data.recipientId])
        }
    })

    socket.on('disconnect', () => {
        delete connectedUsers[socketId]

        socket.broadcast.emit('users:leave', socketId)
    })
})

async function addMessageHistory(senderId, recipientId, data) {
    if (historyMessage[senderId]) {
        if (historyMessage[senderId][recipientId]) {
            historyMessage[senderId][recipientId].push(data)
        } else {
            historyMessage[senderId][recipientId] = []
            historyMessage[senderId][recipientId].push(data)
        }
    } else {
        historyMessage[senderId] = {}
        historyMessage[senderId][recipientId] = []
        historyMessage[senderId][recipientId].push(data)
    }
}

