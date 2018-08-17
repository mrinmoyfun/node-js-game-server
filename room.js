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
var d = 0;


function run(room, player, msg)
{
	// Implement your game room (server side) logic here
	
  if (msg.startsWith("[A;"))
  {
	  var ans = msg.substring(3, msg.length - 1);
    room.broadCast('{ "code" : "OPCHOICE" , "data" : "'+ans+'" }',player);
	var p = m-1;  
	  console.log("Processing " + player.name + "@" + room.name + ": " + p);
    if (ans == json[p].correctans && player.y < m) {
      player.x = player.x+10;
      room.sendCommand('{"code":"SCORE", "name":"'+player.name+'", "data":"'+player.x+'"}');
      player.y = m;
	    d = d + 1;
    } else if (player.y < m) {
      player.x = player.x-5;
      room.sendCommand('{"code":"SCORE", "name":"'+player.name+'", "data":"'+player.x+'"}');
      player.y = m;
      d = d + 1;
    }
	  
   //if (room.players[0].y == p && room.players[1].y == p) {
   //  i = 1;
  // }
  }


}

function update(room)
{
	
	  if (d > 1){
		  i = 1;
		  d = 0;
	  }
  if (both <  1){
    both = both + 1;
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
        var ques = JSON.stringify(json);
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
    if (i > 0) {
		console.log("Room " + room.name + " is playing");
    //room.sendCommand('{"code":"COUNT", "data" : "'+i+'"}');
    i = i -1
  } else if (i == 0) {
    room.sendCommand('{"code":"COUNT", "data" : "'+99+'"}');
    i = i -1
  } else {
    var t = JSON.stringify(json[m]);
    room.sendCommand('{"code":"QUESTION", "id":'+m+', "data":'+t+'}');
    m = m +1
    i = 20
  }

  if (m == 7){
    room.sendCommand('{"code":"RESULT", "data" : "result"}');
    room.players.forEach(function(c){
      // Send disconnect notify - MSG: [DC;<player name>]
      c.Cancel();
      c.automatch = false;

    });
    room.Finish();
    json = null;
    score1 = 0;
   score2 = 0;
    i = 5;
     m = 0;
     both = 0;
     d = 0;	  
    //room.Finish();
  }
	}
}

module.exports.update = update;
module.exports.run = run;
