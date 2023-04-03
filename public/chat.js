const now = new Date();
const currentTimeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const chatForm = document.getElementById('chat-form');

const socket = io();

//message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);
});

//Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //getting the input message
    const messageInput = e.target.elements.messageInput.value;
    //emit the message to the server
    socket.emit('chatMessage', messageInput);
    //clear input
    e.target.elements.messageInput.value = '';
})

// get the message display element
const messageDisplay = document.querySelector('.message-display');

// function to scroll the element to the bottom
function scrollToBottom() {
    messageDisplay.scrollTop = messageDisplay.scrollHeight;
}

// call the function whenever new input is added
messageDisplay.addEventListener('DOMNodeInserted', scrollToBottom);

//output
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('user-message');
    div.innerHTML = `<div class="message-text">${message}</div>
                        <div class="message-info">Sent at ${currentTimeString}</div>`;
    document.querySelector('.message-display').appendChild(div);
}