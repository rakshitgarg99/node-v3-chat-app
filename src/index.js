// Goal: Create an Express web server
const path = require('path') // in-built node module
const http = require('http') // in-built node module
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app) // refactoring done to run socket
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

// server (emit) -> client(receive) - countUpdated
// client (emit) -> server(receive) - increament
io.on('connection', (socket) => { // connection in-built by socket.io
    console.log('New WebSocket connection');
    
    // socket.emit('countUpdated', count) // sending event to client side, takes argument and callback function

    // socket.on('increament', () => {
    //     count++
    //     // socket.emit('countUpdated', count) // update a specific client who emit the request
    //     io.emit('countUpdated', count) // update a all clients who so ever emit request
    // })

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options }) // optons having username, room, id from socket

        if (error) {
            return callback(error)
        }

        socket.join(user.room) // join - activites prevailing in a room, user.room fetching data from addUser
        
        socket.emit('message', generateMessage('Admin', 'Welcome!')) // argument, text to show on screen
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) // broadcast to a specific room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter() // setting a filter to know bad words
 
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

         io.to(user.room).emit('message', generateMessage(user.username, message))
        callback() // event acknowledgment
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })    
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
})