const express = require("express");
const redis = require("redis");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { promisify } = require("util");
let clientGetter, clientSetter;

server.listen(3000);

//setup redis
const client = redis.createClient();

client.on("ready", async function(){
	clientGetter = promisify(client.get).bind(client);
	clientSetter = promisify(client.set).bind(client);
	await clientSetter("listRoom", JSON.stringify([]));
})

app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", function(req, res){
	res.render("index");
});

//Socket.io
io.on("connection", function(socket){
	//handler
	function activeChat(){
		socket.on("messageToServer", function(msg){
			if (!msg.trim()) return;
			socket.to(socket.room).emit("messageToClient", msg);
		});
	}		
	
	function newChat() {
		socket.to(socket.room).emit("leaveRoom");
		socket.leave(socket.room);
		socket.removeAllListeners("messageToServer");
		startChat();
	}
	
	async function startChat(){
		const res = await clientGetter("listRoom");			
		const listRoom = JSON.parse(res);

		if(listRoom.length == 0){
			socket.join(socket.id);
			socket.room = socket.id;
			listRoom.push(socket.id);
			await	clientSetter("listRoom", JSON.stringify(listRoom));
		}
		else {
			let strangerId = listRoom.shift();
			await	clientSetter("listRoom", JSON.stringify(listRoom));
			socket.join(strangerId);
			socket.room = strangerId;
			io.in(strangerId).emit("openChat");
		}
	}
	
	async function deleteRoom(){
		const res = await clientGetter("listRoom");	
		const listRoom = JSON.parse(res);
			
		if (listRoom.includes(socket.room)) {
			listRoom.splice(listRoom.indexOf(socket.room), 1);
			await clientSetter("listRoom", JSON.stringify(listRoom));
		}
		else {
			socket.to(socket.room).emit("leaveRoom");
		}
	}
	
	//Event
	socket.on("getEvent", activeChat);	
	socket.on("start", startChat);
	socket.on("newChat", newChat);
	socket.on("disconnect", deleteRoom);
	
});