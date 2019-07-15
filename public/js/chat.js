const socket = io() // io -> function from socket.io on client side

// socket.on('countUpdated', (count) => { // receving events from server side, takes same argument from server and any callback function name
//     console.log('The count has been updated!', count);
// })

// document.querySelector('#increament').addEventListener('click', () => {
//     console.log('Clicked');
//     socket.emit('increament')
// })

// Elements
const $messageForm = document.querySelector('#message-form') // $ - used for just personal convention no technicalities
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML // innerHTML - to grab html elements in script
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }) // qs library for query string


const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild // grabbing latest message

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage) // in-built function to style information
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) // getting margin bottom info and make it a number
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin // offsetHeight gives message height

    // Visible height
    const visibleHeight = $messages.offsetHeight // scroller height

    // Height of messages container
    const containerHeight = $messages.scrollHeight // total container height

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight // tells how much we scroll from top via a number
    // total scrolled + scroller height

    if (containerHeight - newMessageHeight <= scrollOffset) { // the container do not include new meassge height initially
        $messages.scrollTop = $messages.scrollHeight // scroll to bottom
    }
}
// templating message from client
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text, // it is an object take dynamic value from same above meassge and render to the html script 
        createdAt: moment(message.createdAt).format('h:mm a') // using moment.js
    }) // mustache library for templates rendering, data key-values accessing in templates
    $messages.insertAdjacentHTML('beforeend', html) // where to insert html
    autoscroll()
})

// templating location from client
socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username, 
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    // console.log(room);
    // console.log(users);
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html // inserting elements in the sidebar in chat.html 
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() // browser go for fullpage refresh

    $messageFormButton.setAttribute('disabled', 'disabled') // atrribute, value, disable the button till messge not shown
    // const message = document.querySelector('input').value // value -> to get the feild value
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => { // argument, message from above line, event acknowledgment from server
       $messageFormButton.removeAttribute('disabled')
       $messageFormInput.value = ''
       $messageFormInput.focus()

        if (error) {
            return console.log(error);
        }
        
        console.log('Message delivered!');
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geoloaction is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
       // console.log(position);
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!');  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})