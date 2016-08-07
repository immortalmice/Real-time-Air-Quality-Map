/*
	FileName : WebServer.js
	Author : Immortalmice
*/

/* Require Modules */
var express = require('express');
var fs = require('fs');
var https = require('https');
var app = express();

/* Global Variable */
var WorkDir = __dirname + '/Web/';
var DataDir = __dirname + '/Fetch/Data/';
var counter = 0;
var AllData = {};
var jsonFinished = true;
var SiteGroups = ["ProbeCube", "LASS", "EPA", "Indie", "Airbox", "Webduino"];

/* Callback Functions */
var to_index = function(request, response){
	response.redirect('/map.html');
};

var to_history_page = function(request, response){
	var chid;
	var type;
	if(request.query){
		chid = parseInt(request.query.chid);
		type = request.query.type;
	}else{
		sendresponse(response, '無法辨認的參數');
		return;
	}

	var route = datadir_bytype(type);

	fs.readFile(route, function(err, data){
		if(err){
			console.log(err);
			sendresponse(response, '伺服器出現問題，請稍後在試，或連繫我們');
			return;
		}
		try{
			var chdata = JSON.parse(data);
		}
		catch(e){
			console.log(e);
			sendresponse(response, '伺服器出現問題，請稍後在試，或連繫我們');
			return;
		}
		var select = chdata.find(function(element, index, arrary){
			return element.Channel_id == chid;
		});
		if(select){
			fs.readFile( WorkDir + '/Data/History.html', function(err, data){
				if(err){
					console.log(err);
					sendresponse(response, '伺服器出現問題，請稍後在試，或連繫我們');
					return;
				}
				var strdata = data.toString();
				strdata = strdata.replace(/CHID/g, select.Channel_id.toString());
				strdata = strdata.replace(/_TYPE/g, select.SiteGroup.toString());
				sendresponse(response, strdata);
			});
			return;
		}	
		sendresponse(response, '查找的頻道ID未被登錄，或類型參數有誤');
		return;
	});
};

var to_map = function(request, response){
	fs.readFile(WorkDir + '/map.html', function(err, data){
		if(err){
			console.log(err);
			sendresponse(response, '伺服器出現問題，請稍後在試，或連繫我們');
			return;
		}
		var strdata = data.toString();
		if(request.query){
			var chid = parseInt(request.query.chid);
			var type = request.query.type;

			var route = datadir_bytype(type);
			if(!route){
				sendresponse(response, strdata);
				return;
			}

			fs.readFile(route, function(err, data){
				if(err){
					console.log(err);
					sendresponse(response, '伺服器出現問題，請稍後在試，或連繫我們');
					return;
				}
				try{
					var chdata = JSON.parse(data);
				}
				catch(e){
					console.log(e);
					sendresponse(response, '伺服器出現問題，請稍後在試，或連繫我們');
					return;
				}
				var select = chdata.find(function(element, index, arrary){
					return element.Channel_id === chid;
				});
				if(select){
					strdata = strdata.replace(/ORDER_CHANNEL/g, chid);
				}
				sendresponse(response, strdata);
				return;
			});
		}else{
			sendresponse(response, strdata);
			return;
		}
	});
};

var getAllJson = function(request, response){
	if(jsonFinished){
		jsonFinished = false;
		SiteGroups.forEach(function(element, index, arrary){
			counter = 0;
			AllData = {};
			fs.readFile( WorkDir + "Data/" + element + "_last.json", function(err, data){
				if(err){
					console.log(err);
					sendresponse(response, "伺服器出現問題，請稍後再試。");
					return;
				}
				try{
					AllData[element] = JSON.parse(data);
				}
				catch(e){
					console.log(e);
					sendresponse(response, "伺服器出現問題，請稍後再試。");
					return;
				}
				counter ++;
				if(counter === SiteGroups.length){
					sendresponse(response, JSON.stringify(AllData));
					jsonFinished = true;
					return;
				}
			});
		});
	}else{
		sendresponse(response, "伺服器忙碌中，請稍後再試。");
		return;
	}
}


/* Other Functions */
var sendresponse = function(response, info){
	response.writeHead(200);
	response.write(info);
	response.end();
};
var datadir_bytype = function(str){
	var route;
	if(str === "ProbeCube"){
		route = WorkDir + '/Data/ProbeCube_last.json';
	}else if(str === "EPA"){
		route = WorkDir + '/Data/EPA_last.json';
	}else{
		route = WorkDir + '/Data/Indie_last.json';
	}
	return route;
}

/* Set Server */
app.get('/map.html', to_map);
app.get('/Data/History.html', to_history_page);
app.get('/Data/All_last.json', getAllJson);

app.use(express.static(WorkDir));

app.get('/', to_index);


/* Start Server */
app.listen(80, function(){
 	console.log("HTTP server listening on port 80.");
});
