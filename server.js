/*
Script: Node.JS Game Server - Core Server
Author: Huy Tran
Email: kingbazoka@gmail.com
Description:
 This project aim to create an easy to use multiplayer game server, programmers only
 have to implement gameplay logic which will be run in each game room and don't have
 to care much about the core server.
 The Core Server is a room-based multiplayer system that enable players connect, chat
 in Global Lobby, join/create room, chat in rooms.
 Room Logic will be implemented in run() method of the file: room.js
-------------------------------------------

CORE SERVER MESSAGES:

1) Player connected to server
	RECEIVE: 	[CONNECTED;<player-name>]		(Everyone except sender)

2) Player disconnected from server
	RECEIVE:	[DISCONNECTED;<player-name>] 	(Everyone except sender)

3) Player send a chat message in Global chat
	SEND: 		[CHAT;<message>]
	RECEIVE: 	[CHAT;<player-name>;<message>]	(Everyone in Global lobby)

4) Player created a Room
	SEND:		[CREATEROOM;<room-name>;<max-players>]

5) Player joined room
	SEND:		[JOINROOM;<room-name>]
	RECEIVE:	[JOINEDROOM;<room-name>]		(Sender)
				[JOINROOM;<player-name>]		(Players already in room)
				[NOROOM;<room-name>]			(Sender - when room not found)
				[ROOMFULL;<room-name>]			(Sender - when room is full)

6) Player left room
	SEND:		[LEAVEROOM]
	RECEIVE:	[LEFTROOM;<player-name>]		(Players already in room)

7) Player chat in a room
	SEND:		[CHATROOM;<message>]
	RECEIVE:	[CHATROOM;<player-name>;<message>] (Players already in room)

8) Get available room list:
	SEND:		[GETROOMLIST]
	RECEIVE:	[ROOMLIST;<list-of-room-name>]	(Sender)

9) Ready/Cancel in room:
	SEND:		[READY] / [CANCEL]
	RECEIVE:	[PLAYERREADY;<player-name>] / [PLAYERCANCEL;<player-name>] (Players already in room)
*/

/*

TODO:
	- Add realtime update for room

DEV DIARY:

7:00 - 13/10/2013: It's a beautiful sunday, have nothing to do. So, I decided to make something. I will learn node.js and make something fun today!

15:00 - 13/10/2013: Sorry guys, my girlfriend coming. Stop coding now >:)

22:45 - 13/10/2013: Weekend ended. Back to work now :D

14/10/2013: The first release with:
	- Connecting to server
	- Disconnecting from server
	- Player joining room
	- Player creating room
	- Chat in global lobby
	- Chat in room
	- Room.js module

15/10/2013: Today, the storm coming to the city, I got a day off so I spent all my day to coding =]]
	- Add Find functions for arrays (to find room/player by name)
	- Add Room Type (to create many types of room with different game logic - eg: deathmatch, capture the flags,...)
	- Add Room state switching functions and auto switch state when player connected
	- Add Player ready function (to switch ready/waiting when player is in room)
	- Add realtime update for room
	- Auto remove unused room (finished room, playing room with no players,...)
*/

var roomScript = require('./room.js');

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 5000 });
// Define Player class and player list
var playerList = [];
var autoList = [];
function Player(_x, _y, _name, _socket)
{
	this.x = _x;
	this.y = _y;
	this.name = _name;
	this.room = null;
	this.socket = _socket;
	this.is_ready = false;
	this.automatch = false;
	this.ans = null;

	this.Ready = function()
	{
		if (this.room != null)
		{
			this.is_ready = true;
			this.room.broadCast('{"code" : "PLAYERREADY", "name" : "'+ this.name +'"}', this); // Send ready message to all players
		}
	}

	this.Cancel = function()
	{
		if (this.room != null)
		{
			this.is_ready = false;
			this.room.broadCast('{"code" : "PLAYERCANCEL", "name" : "'+ this.name +'"}', this); // Send cancel message to all players
		}
	}

	this.joinRoom = function(roomName)
	{
		var cplayer = this;
		var roomExist = false;
		roomList.forEach(function(r){
			if (r.name == roomName)
			{
				roomExist = true;
				console.log("> ROOM EXIST! Count:" + r.playerCount + " / " + r.maxPlayer);
				if (r.playerCount < r.maxPlayer)
				{
					r.players.push(cplayer);
					r.playerCount++;
					// Switch room state
					if (r.playerCount < r.maxPlayer)
					{
						r.Wait(); // Still waiting for players
					}
					else
					{
						if (r.IsWaiting()) r.Ready(); // Switch to ready state
					}
					cplayer.room = r;
					console.log("[!] " + cplayer.name + " joined room " + r.name);
					r.broadCast('{ "code" : "JOINROOM", "name" : "'+ cplayer.name +'"}', cplayer);
					 try {
				         if (cplayer.socket != WebSocket.CLOSED) {
					cplayer.socket.send('{ "code" : "JOINEDROOM", "name" : "'+ r.name +'"}');
						 }
				        } catch(e) {
					console.log(e);
				        }
				}
				else
				{
					cplayer.socket.send('{ "code" : "ROOMFULL", "name" : "'+ r.name +'"}');
					console.log("[!] Room " + r.name + " is full");
				}
			}
		});
		if (roomExist == false)
		{
			cplayer.socket.send('{ "code" : "NOROOM", "name" : "'+ roomName +'"}');
			console.log("[!] Room " + roomName + " not found");
		}
	}

	this.leaveRoom = function()
	{
		if (this.room != null)
		{
			this.room.players.remove(this);
			this.room.playerCount--;
			if (this.room.playerCount < this.room.maxPlayer)
			{
				this.room.Wait();
			}
			this.room.broadCast('{ "code" : "LEFTROOM", "name" : "'+ this.name +'"}', this);
			console.log("[!] " + this.name + " left room " + this.room.name);
			this.room = null;
		}
	}
}

// Define Room class and room list
var roomList = [];
function Room(_name, _maxPlayer)
{
	console.log("[*] Creating room with params: {" + _name + ":" + _maxPlayer + "}");
	this.name = _name;
	this.maxPlayer = 2;
	this.playerCount = 0;
	this.players = [];
	this.roomState = 'WAITING'; // WAITING - READY - PLAYING - FINISHED
	this.roomType = 'Type01'; // Check this in room.js to create more game types
	this.json = null;
        this.i = 2;
        this.m = 0;
        this.both = 0;
        this.d = 0;

	this.broadCast = function(message, _except)
	{
		this.players.forEach(function(p){
			console.log("> Check " + p.name + " : " + _except.name);
			if (p.name != _except.name)
			{
				p.socket.send(message);
			}
		});
	}
	this.sendCommand = function(message)
	{
		this.players.forEach(function(p){
			console.log("> Check " + p.name);
				p.socket.send(message);
		});
	}

	// Switch state
	this.Wait = function()
	{
		this.roomState = "WAITING";
	}
	this.IsWaiting = function()
	{
		return (this.roomState == "WAITING");
	}

	this.Ready = function()
	{
		this.roomState = "READY";
	}
	this.IsReady = function()
	{
		return (this.roomState == "READY");
	}

	this.Play = function()
	{
		this.roomState = "PLAYING";
	}
	this.IsPlaying = function()
	{
		return (this.roomState == "PLAYING");
	}

	this.Finish = function()
	{
		this.roomState = "FINISHED";
	}
	this.IsFinished = function()
	{
		return (this.roomState == "FINISHED");
	}

}

// Add remove function for arrays
Array.prototype.remove = function(e) {
  for (var i = 0; i < this.length; i++) {
    if (e == this[i]) { return this.splice(i, 1); }
  }
};

// Add find by name function for arrays (to find player or room)
Array.prototype.find = function(name) {
	for (var i = 0; i < this.length; i++) {
		if (name == this[i].name) { return this[i]; }
	}
};

// Add trim feature
String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};
String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};
String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/,'');};

// Add startsWith and endsWidth function for strings
String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
}
String.prototype.endsWith = function(suffix) {
    return this.match(suffix+"$") == suffix;
};

// Global Broadcast Function
function BroadcastAll(message, except)
{
	playerList.forEach(function(p){
		if (p != except)
		{               try {
				if (p.socket != WebSocket.CLOSED) {
			        p.socket.send(message);
					}
				} catch(e) {
					console.log(e);
				}
		}
	});
}
function GlobalChat(message, except)
{
	if (except.room == null) // Only players in Global lobby can send message
	{
		playerList.forEach(function(p){
			if (p != except && p.room == null) // Only players in Global lobby can receive the message
			{
				try {
				if (p.socket != WebSocket.CLOSED) {
				p.socket.send(message);
				}
				} catch(e) {
					console.log(e);
				}
			}
		});
	}
}

// Update room
setInterval(function(){
	roomList.forEach(function(r){
		if (r.IsFinished() || (!r.IsWaiting() && r.playerCount <= 0))
		{
			roomList.remove(r);
		}
		if (!r.IsFinished() && r.playerCount > 0)
		{
			// Switch from READY to PLAYING mode
			if (r.IsReady())
			{
				var isAllReady = true;
				r.players.forEach(function(p){
					if (p.is_ready == false)
					{
						isAllReady = false;
					}
				});
				if (isAllReady)
				{
					r.Play();
				}
			}
			roomScript.update(r);
		}
	});

	playerList.forEach(function(r){
		if (r.automatch == true) {
			autoList.push(r);
			r.automatch = false;
		}
		if (autoList.length > 1){
		console.log("matched"+autoList[0].name+autoList[1].name);

			var room = new Room("room-" + roomList.length, 2);
			roomList.push(room);
			console.log("[+] Room " + room.name + " created by " + autoList[0].name);
			autoList[0].leaveRoom();
			autoList[0].joinRoom(room.name);
			autoList[1].leaveRoom();
			autoList[1].joinRoom(room.name);
			autoList.remove(autoList[0]);
				autoList.remove(autoList[0]);
		}

	});




}, 1000);

// Main Server
wss.on('connection', function connection(ws) {
    // Create new player on connected


   //response.writeHead(200);
    var player = new Player(0, 0, "player-" + playerList.length, ws);
    // Add to PlayerList
    playerList.push(player);

    console.log("[!] " + player.name + " connected!");
		ws.send('{"code" : "SELFCONNECTED", "name" : "'+player.name+'"}')

    // Tell everybody the newcomer
   // BroadcastAll('{"code" : "CONNECTED", "name" : "'+player.name+'"}', player);

    // Process received data
    var receivedData = "";
   console.log(receivedData);
    ws.on('message', function incoming(data) {
        receivedData = data + "";

    	console.log("[i] Data received: " + player.name + " said: " + receivedData);

    	// ==================SERVER PROCESSING============================
    	// Implement chat in lobby feature
    	if (receivedData.startsWith("[CHAT;"))
    	{
    		// Broadcast
    		var chat = receivedData.substring(6, receivedData.length - 1);
    		GlobalChat('{"code" : "CHAT", "name" : "'+ player.name +'","chat" : "' + chat + '"}', player);
    	}

    	// Basic Room function: Get list, create, join, leave, chat in room
    	if (receivedData.startsWith("[GETROOMLIST]"))
    	{
    		var list = "";
    		// Get room list
    		roomList.forEach(function(r){
    			list += r.name;
    		});
    		ws.send("[ROOMLIST;" + list + "]");
    	}
			if (receivedData.startsWith("[PLAYERS]"))
    	{
    		var list = "";
    		// Get room list
    		playerList.forEach(function(r){
    			list += r.name;
    		});
    		ws.send("[PLAYERS;" + list + "]");
    	}
    	if (receivedData.startsWith("[CREATEROOM;"))
    	{
    		var roomData = receivedData.substring(12, receivedData.length - 1); // RoomName;MaxPlayer
    		var roomDataArr = roomData.split(';');
    		if (roomDataArr.length >= 2)
    		{
    			var room = new Room(roomDataArr[0], parseInt(roomDataArr[1]));
    			roomList.push(room);
    			console.log("[+] Room " + room.name + " created by " + player.name);
    			player.leaveRoom();
    			player.joinRoom(room.name);
    		}
    	}
    	if (receivedData.startsWith("[JOINROOM;"))
    	{
    		var roomName = receivedData.substring(10, receivedData.fulltrim().length - 1);
    		console.log("> SELECTED ROOM: " + roomName);
			player.joinRoom(roomName);
    	}
    	if (receivedData.startsWith("[LEAVEROOM]"))
    	{
    		player.leaveRoom();
    	}
    	if (receivedData.startsWith("[CHATROOM;"))
    	{
    		// Broadcast
    		var chat = receivedData.substring(10, receivedData.length - 1);
    		player.room.broadCast('{"code" : "CHATROOM", "name" : "'+ player.name +'","chat" : "' + chat + '"}', player);
    	}
    	if (receivedData.startsWith("[READY]"))
    	{
			player.Ready();
    	}
    	if (receivedData.startsWith("[CANCEL]"))
    	{
	    	player.Cancel();
    	}
			if (receivedData.startsWith("[AUTOMATCH]"))
    	{
	    	player.automatch = true;

    	}
    	// ===================== EACH ROOM ================================
    	roomList.forEach(function(r){
				var isAllReady = true;
				r.players.forEach(function(p){
					if (p.is_ready == false)
					{
						isAllReady = false;
					}
				});

				if (isAllReady)
				{
					roomScript.run(r, player, receivedData);
				}

    	});
    	// ================================================================

    	receivedData = "";
    });

    // Handle player disconnect event
      ws.on('close', function close() {
    	player.leaveRoom(); // Leave all room before disconnected
     
    	playerList.remove(player);
        autoList.remove(player)
    	console.log("[!] " + player.name + " disconnected!");

    	// Tell everyone Player disconnected
    	playerList.forEach(function(c){
    		// Send disconnect notify - MSG: [DC;<player name>]
    		//c.socket.send('{"code" : "DISCONNECTED", "name" : "'+ player.name +'"}');
    	});
    	// Close connection
    	ws.terminate();
    });

})

//console.log("Server is running at port " + serverPort);
