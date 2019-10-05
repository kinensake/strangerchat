const socket = io.connect("/");
const btnConnect = document.querySelector(".btn-connect");
const sendMsgBtn = document.querySelector(".chat-form-send");
const newChatBtn = document.querySelector(".btn-new");
const headerScreen = document.querySelector(".start");
const loadingScreen = document.querySelector(".loading");
const msgText = document.querySelector(".chat-form-input");
const chatBox = document.querySelector(".chat-box");

//handle events
btnConnect.addEventListener("click", function(){
  headerScreen.style.display = "none";
	socket.emit("start");
});

sendMsgBtn.addEventListener("click", sendChatHandle);

msgText.addEventListener("keydown", function(e){
	if (e.keyCode === 13) sendChatHandle();
})

newChatBtn.addEventListener("click", function(){
	socket.emit("newChat");
	loadingScreen.style.display = "flex";
})

function sendChatHandle() {
	if (!msgText.value.trim()) return;
	chatBox.innerHTML += msgGenerator(msgText.value, "own");
	chatBox.scrollTop = chatBox.scrollHeight;
	socket.emit("messageToServer", msgText.value);
	msgText.value = "";
}

function msgGenerator(msg, own){
  return `<div class="msg">
            <div class="msg-${own}">${msg}</div>
          </div>`;
}

function hintGenerator(hint, isFirst) {
	return `<h5 class="hint${isFirst ? " hint-first" : ""}">${hint}</h5>`;
}

//--------socket-------------
socket.on("openChat", function(){
	socket.emit("getEvent");
	loadingScreen.style.display = "none";
	chatBox.innerHTML = hintGenerator(`Connected 
  with the stranger. Let say "hi" to him/her`, true);
});

socket.on("messageToClient", function(msg){
	chatBox.innerHTML += msgGenerator(msg, "friend");
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on("leaveRoom", function(){
	chatBox.innerHTML += hintGenerator("The stranger has left this chat");
	chatBox.scrollTop = chatBox.scrollHeight;
})