/*
Script: Node.JS Game Server - Room Logic
Author: Huy Tran
Email: kingbazoka@gmail.com
*/
//var json = null;
//var score1 = 0;
//var score2 = 0;
//var i = 2;
//var m = 0;
//var both = 0;
//var d = 0;


function run(room, player, msg)
{
	// Implement your game room (server side) logic here
	
  if (msg.startsWith("[A;"))
  {
	  player.ans = msg.substring(3, msg.length - 1);
    room.broadCast('{ "code" : "OPCHOICE" , "data" : "'+player.ans+'" }',player);
	var p = room.m-1;  
	  console.log("Processing " + player.name + "@" + room.name + ": " + room.m-1);
    if (player.ans == room.json[room.m-1].correctans && player.y < room.m) {
      player.x = player.x+10;
      room.sendCommand('{"code":"SCORE", "name":"'+player.name+'", "data":"'+player.x+'"}');
      player.y = room.m;
	    room.d = room.d + 1;
	    player.ans = null;
    } else if (player.y < room.m && player.ans !== null) {
      player.x = player.x-5;
      room.sendCommand('{"code":"SCORE", "name":"'+player.name+'", "data":"'+player.x+'"}');
      player.y = room.m;
      room.d = room.d + 1;
	    player.ans = null;
    }
	  
   //if (room.players[0].y == p && room.players[1].y == p) {
   //  i = 1;
  // }
  }


}

function update(room)
{
	
	  if (room.d > 1){
		  room.i = 1;
		  room.d = 0;
	  }
  if (room.both <  1){
    room.both = room.both + 1;
    const https = require('https');

    https.get('https://pg.medgag.com/quiz/api/random.php?topic_id=2', (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        //console.log(JSON.parse(data).questions[1]);
        room.json = JSON.parse(data).questions;
        //var ques = JSON.stringify(room.json);
        //room.sendCommand('{"code":"QUESTIONS", "data":'+ques+'}');

        //var t = JSON.stringify(JSON.parse(data).questions[1]);
        //  BroadcastAll(t);
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  }
	// Update room
	if (room.IsPlaying())
	{
    if (room.i > 0) {
		console.log("Room " + room.name + " is playing");
    //room.sendCommand('{"code":"COUNT", "data" : "'+i+'"}');
    room.i = room.i -1
  } else if (room.i == 0) {
    room.sendCommand('{"code":"COUNT", "data" : "'+99+'"}');
    room.i = room.i -1
  } else {
    var t = JSON.stringify(room.json[room.m]);
    room.sendCommand('{"code":"QUESTION", "id":'+room.m+', "data":'+t+'}');
    room.m = room.m +1
    room.d = 0;	  
    room.i = 20
  }

  if (room.m == 7){
	  if (room.players[0].x > room.players[1].x ) {
		  room.sendCommand('{"code":"RESULT", "data" : "Winner", "name" : "'+room.players[0].name+'"}');
	  } else if (room.players[0].x < room.players[1].x ) {
		  room.sendCommand('{"code":"RESULT", "data" : "Winner", "name" : "'+room.players[1].name+'"}');
	  } else if (room.players[0].x == room.players[1].x ) {
		  room.sendCommand('{"code":"RESULT", "data" : "Draw"}');
	  } else {
                  room.sendCommand('{"code":"RESULT", "data" : "error"}');
	  }
    room.players.forEach(function(c){
      // Send disconnect notify - MSG: [DC;<player name>]
      c.Cancel();
      c.automatch = false;

    });
    room.Finish();
    room.json = null;
    room.i = 2;
     room.m = 0;
     room.both = 0;
     room.d = 0;	  
    //room.Finish();
  }
	}
}

module.exports.update = update;
module.exports.run = run;
