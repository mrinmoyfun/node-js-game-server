/*
Script: Node.JS Game Server - Room Logic
Author: Huy Tran
Email: kingbazoka@gmail.com
*/

function run(room, player, msg)
{
	// Implement your game room (server side) logic here
	console.log("Processing " + player.name + "@" + room.name + ": " + msg);
}
var i = 10;
var m = 1;
function update(room)
{
	// Update room
	if (room.IsPlaying())
	{
    if (i > 0) {
		console.log("Room " + room.name + " is playing");
    room.sendCommand(i);
    i = i -1
  } else if (i == 0) {
    room.sendCommand("READY!");
    i = i -1
  } else {
    room.sendCommand("Quiz QUESTION NO "+m);
    m = m +1
    i = 20
  }
	}
}

module.exports.update = update;
module.exports.run = run;
