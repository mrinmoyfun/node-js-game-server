/*
Script: Node.JS Game Server - Room Logic
Author: Huy Tran
Email: kingbazoka@gmail.com
*/
var json = null;
var score1 = 0;
var score2 = 0;
var i = 5;
var m = 0;
var both = 0;


function run(room, player, msg)
{
  const https = require('https');

  https.get('https://pg.medgag.com/quiz/api/questions.php?topic_id=2', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      console.log(JSON.parse(data).questions[1]);
      json = JSON.parse(data).questions;
      //var t = JSON.stringify(JSON.parse(data).questions[1]);
      //  BroadcastAll(t);
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
	// Implement your game room (server side) logic here
	console.log("Processing " + player.name + "@" + room.name + ": " + msg);
  if (msg.startsWith("[A]"))
  {
    room.broadCast("[1]",player);
    if ('option1' == json[m].correctans) {
      player.x = player.x+10;
      room.sendCommand("[SCORE;]"+player.name+player.x);
      player.y = m;
    }
   if (room.players[0].y == m && room.players[1].y == m) {
     i = 1;
   }
  }


}

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
    var t = JSON.stringify(json[m]);
    room.sendCommand(t);
    m = m +1
    i = 20
  }
  if (m == 6){
    room.sendCommand("Result "+m);
    room.Finish();
  }
	}
}

module.exports.update = update;
module.exports.run = run;
