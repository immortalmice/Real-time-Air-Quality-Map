/*
	FileName : FetchServer.js
	Author : Immortalmice
*/

/* Require Modules */
var fs = require('fs');
var https = require('https');
var http = require('http');
var querystring = require('querystring');

/* Global Variable */
var SaveDir = __dirname + '/Web/Data/';
var WorkDir = __dirname + '/Fetch/';

var EPA_writeFileName = "EPA_last.json";
var EPA_RawData;
var EPA_LastData = [];
var EPA_isFinished = true;

var ProbeCube_writeFileName = "ProbeCube_last.json";
var ProbeCube_RawData;
var ProbeCube_LastData = [];
var ProbeCube_isFinished = true;

var LASS_writeFileName = "LASS_last.json";
var LASS_LastData = [];
var LASS_isFinished = true;

var LASS4U_writeFileName = "LASS4U_last.json";
var LASS4U_LastData = [];
var LASS4U_isFinished = true;

var Airbox_writeFileName = "Airbox_last.json";
var Airbox_LastData = [];
var Airbox_isFinished = true;

var Webduino_writeFileName = "Webduino_last.json";
var Webduino_LastData = [];
var Webduino_isFinished = true;

var Indie_writeFileName = "Indie_last.json";
var Indie_RawData;
var Indie_LastData = [];
var Indie_isFinished = true;
var lastData = {};

var counter = 0;


/* Function Packages */
var httpTools = {
	https_get : function (host, path, header, callback, onerror){
		return https.get({
	        host: host,
	        path: path,
	        headers: header
	    }, function(response) {
	        // Continuously update stream with data
	        var body = '';
	        response.on('data', function(d) {
	            body += d;
	        });
	        response.on('end', function() {
	        	if(callback)
	            	callback(body);
	        });
	    }).on('error', function(err){
	    	console.log(err);
	    	if(onerror)
	    		onerror();
	    });
	},
	https_get_json : function (host, path, callback, onerror){
		this.https_get(host, path, {}, function(data){
			try{
	        	var parsed = JSON.parse(data);
			}catch(e){
				console.log(e);
				if(callback)
					callback(undefined);
			}
	        if(callback)
	        	callback(parsed);
		}, onerror);
	},

	http_get : function (host, path, header, callback, onerror){
		return http.get({
	        host: host,
	        path: path,
	        headers: header
	    }, function(response) {
	        // Continuously update stream with data
	        var body = '';
	        response.on('data', function(d) {
	            body += d;
	        });
	        response.on('end', function() {
	        	if(callback)
	            	callback(body);
	        });
	    }).on('error', function(err){
	    	console.log(err);
	    	if(onerror)
	    		onerror();
	    });
	},
	http_get_json : function (host, path, callback, onerror){
		this.http_get(host, path, {}, function(data){
			try{
	        	var parsed = JSON.parse(data);
			}catch(e){
				console.log(e);
				if(callback)
					callback(undefined);
			}
	        if(callback)
	        	callback(parsed);
		}, onerror);
	}
};
var updateTools = {
	load_EPA : function(callback){
		fs.readFile( WorkDir + 'Data/EPA_RawData.json', 'utf8', function(err, data){
			if(err){
				console.log(err);
				return;
			}
			EPA_RawData = JSON.parse(data);
			callback();
		});
	},
	update_EPA : function(){
		if(EPA_isFinished){
			EPA_LastData = [];
			EPA_isFinished = false;
			httpTools.https_get_json("raw.githubusercontent.com", "/g0v-data/mirror/master/epa/aqx.json", function(data){
				if(data){
					EPA_Updates = 0;
					EPA_RawData.forEach(function(element, index, array){
						httpTools.https_get_json('api.thingspeak.com', '/channels/' + element.Channel_id + '/feeds.json?results=1', function(response){
							var obj = {};
							for(var prop in element){
								obj[prop] = element[prop];
							}
							obj.SiteGroup = "EPA";
							obj.Maker = 'EPA';
							if(response){
								obj.RawData = data.find(function(element, index, array){
									return element.SiteName === obj.SiteName;
								});
								obj.SiteName += "監測站";
								if(obj.RawData){
									obj.Data = {
										Dust2_5 : parseFloat(obj.RawData["PM2.5"]),
										Create_at : parse_time(obj.RawData.PublishTime)
									};
								}else{
									obj.RawData = {};
								}
								if(response && response !== -1 && response.feeds && response.feeds[0]){
									if(!obj.Data){
										obj.Data = {
											Dust2_5 : parseFloat(response.feeds[0].field5),
											Create_at : response.feeds[0].created_at
										};
									}
								}else if(!obj.Data){
									obj.Data = {};
								}
								if(obj.Data.Create_at && !(response.feeds && response.feeds[0] && (obj.Data.Create_at === response.feeds[0].created_at))){
									var params_str = 'api_key=' + element.api_key;
									params_str += '&field5=' + obj.Data.Dust2_5;
									params_str += '&created_at=' + obj.Data.Create_at;
									console.log("No." + obj.SiteName + " params_str: " + params_str);
									httpTools.https_get_json('api.thingspeak.com', '/update?' +  params_str, function(response_data){
										console.log("No." + obj.SiteName + " Response: " + response_data + "params_str: " + params_str);
									});
								}
							}else{
								obj.RawData = {};
								obj.Data = {};
								console.log("[EPA] At request \"api.thingspeak.com/channels/" + element.Channel_id + "/feeds.json?results=1\" failed.");
							}
							delete obj.api_key;
							EPA_LastData.push(obj);
							updateTools.check_write_EPA();
						}, function(){
							var obj = {};
							for(var prop in element){
								obj[prop] = element[prop];
							}
							obj.SiteGroup = "EPA";
							obj.Maker = 'EPA';
							obj.RawData = data.find(function(element, index, array){
								return element.SiteName === obj.SiteName;
							});
							obj.SiteName += "監測站";
							if(obj.RawData){
								obj.Data = {
									Dust2_5 : parseFloat(obj.RawData["PM2.5"]),
									Create_at : parse_time(obj.RawData.PublishTime)
								};
							}else{
								obj.Data = {};
							}
							delete obj.api_key;
							EPA_LastData.push(obj);
							updateTools.check_write_EPA();
						});
					});
				}else{
					EPA_isFinished = true;
					console.log("[EPA] At request \"raw.githubusercontent.com/g0v-data/mirror/master/epa/aqx.json\" failed.");
				}
			});
		}else{
			console.log("[EPA] Does not finish update, wait for next run.");
		}
	},
	check_write_EPA : function(){
		if(EPA_LastData.length === EPA_RawData.length){
			fs.writeFile(SaveDir + EPA_writeFileName, JSON.stringify(EPA_LastData), function(err){
				if(err){
					console.log(err);
					return;
				}
				console.log("[EPA] Finished Writing.");
				EPA_isFinished = true;
			});
		}
	},
	load_ProbeCube : function(callback){
		fs.readFile( WorkDir + '/Data/ProbeCube_RawData.json', function(err, data){
			if(err){
				console.log(err);
				return;
			}
			ProbeCube_RawData = JSON.parse(data);
			callback();
		});
	},
	update_ProbeCube : function(){
		if(ProbeCube_isFinished){
			ProbeCube_LastData = [];
			ProbeCube_isFinished = false;
			ProbeCube_RawData.forEach(function(element, index, array){
				httpTools.https_get_json('thingspeak.com', '/channels/' + element.Channel_id + '/feeds.json?results=1', function(response){
					if(response){
						var obj = {};
						obj.SiteGroup = "ProbeCube";
						obj.Channel_id = element.Channel_id;
						obj.Maker = element.maker;
						if(response.channel){
							obj.SiteName = response.channel.name;
							obj.LatLng = {
								lat : parseFloat(response.channel.latitude),
								lng : parseFloat(response.channel.longitude)
							};
						}else{
							obj.SiteName = undefined;
							obj.LatLng = {
								lat : undefined,
								lng : undefined
							};
						}
						if(response && response != -1 && response.feeds && response.feeds[0]){
							obj.RawData = response.feeds[0];
							obj.Data = {
								Temperature : parseFloat(obj.RawData.field1),
								Humidity : parseFloat(obj.RawData.field2),
								Dust2_5 : parseFloat(obj.RawData.field5),
								Create_at : obj.RawData.created_at
							}
						}else{
							obj.RawData = {};
							obj.Data = {
								Temperature : undefined,
								Humidity : undefined,
								Dust2_5 : undefined,
								Create_at : undefined
							};
						}
					}else{
						var obj = {};
						obj.SiteGroup = "ProbeCube";
						obj.Channel_id = element.Channel_id;
						obj.Maker = element.maker;
						obj.SiteName = undefined;
						obj.LatLng = {
							lat : undefined,
							lng : undefined
						};
						obj.RawData = {};
						obj.Data = {
							Temperature : undefined,
							Humidity : undefined,
							Dust2_5 : undefined,
							Create_at : undefined
						};
						console.log("[ProbeCube] At request \"api.thingspeak.com/channels/" + element.Channel_id + "/feeds.json?results=1\" failed.");
					}
					ProbeCube_LastData.push(obj);
					updateTools.check_write_ProbeCube();
				}, function(){
					var obj = {};
					obj.SiteGroup = "ProbeCube";
					obj.Channel_id = element.Channel_id;
					obj.Maker = element.maker;
					obj.RawData = {};
					obj.Data = {
						Temperature : undefined,
						Humidity : undefined,
						Dust2_5 : undefined,
						Create_at : undefined
					}
					obj.SiteName = undefined;
					obj.LatLng = {
						lat : undefined,
						lng : undefined
					};
					ProbeCube_LastData.push(obj);
					updateTools.check_write_ProbeCube();
				});
			});
		}else{
			console.log("[ProbeCube] Does not finish update, wait for next run.");
		}
		return;
	},
	check_write_ProbeCube : function(){
		if(ProbeCube_LastData.length === ProbeCube_RawData.length){
			fs.writeFile(SaveDir + ProbeCube_writeFileName, JSON.stringify(ProbeCube_LastData), function(err){
				if(err){
					console.log(err);
					return;
				}
				console.log("[ProbeCube] Finished Writing.");
				ProbeCube_isFinished = true;
			});
		}
	},
	update_LASS : function(){
		if(LASS_isFinished){
			LASS_isFinished = false;
			LASS_LastData = [];
			httpTools.http_get_json('nrl.iis.sinica.edu.tw', '/LASS/last-all-lass.json', function(response){
				if(response){
					response.feeds.forEach(function(element, index, arrary){
						var obj = {};
						obj.SiteName = element.device_id;
						obj.SiteGroup = 'LASS';
						obj.Maker = 'LASS';
						obj.Data = {
							Temperature : element.s_t0,
							Humidity : element.s_h0,
							Dust2_5 : element.s_d0,
							Create_at : element.timestamp
						};
						obj.LatLng = {
							lat : element.gps_lat,
							lng : element.gps_lon
						};
						obj.RawData = element;
						LASS_LastData.push(obj);
					});
					fs.writeFile(SaveDir + LASS_writeFileName, JSON.stringify(LASS_LastData), function(err){
						if(err){
							console.log(err);
							return;
						}
						console.log("[LASS] Finished Writing.");
						LASS_isFinished = true;
					});
				}else{
					LASS_isFinished = true;
					console.log("[LASS] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-lass.json\" failed.");
				}
			}, function(err){
				console.log(err);
				LASS_isFinished = true;
				console.log("[LASS] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-lass.json\" failed.");
			});
		}else{
			console.log("[LASS] Does not finish update, wait for next run.");
		}
	},
	update_LASS4U : function(){
		if(LASS4U_isFinished){
			LASS4U_isFinished = false;
			LASS4U_LastData = [];
			httpTools.http_get_json('nrl.iis.sinica.edu.tw', '/LASS/last-all-lass4u.json', function(response){
				if(response){
					response.feeds.forEach(function(element, index, arrary){
						var obj = {};
						obj.SiteName = element.device_id;
						obj.SiteGroup = 'LASS4U';
						obj.Maker = 'LASS4U';
						obj.Data = {
							Temperature : element.s_t0,
							Humidity : element.s_h0,
							Dust2_5 : element.s_d0,
							Create_at : element.timestamp
						};
						obj.LatLng = {
							lat : element.gps_lat,
							lng : element.gps_lon
						};
						obj.RawData = element;
						LASS4U_LastData.push(obj);
					});
					fs.writeFile(SaveDir + LASS4U_writeFileName, JSON.stringify(LASS4U_LastData), function(err){
						if(err){
							console.log(err);
							return;
						}
						console.log("[LASS4U] Finished Writing.");
						LASS4U_isFinished = true;
					});
				}else{
					LASS4U_isFinished = true;
					console.log("[LASS4U] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-lass4u.json\" failed.");
				}
			}, function(err){
				console.log(err);
				LASS4U_isFinished = true;
				console.log("[LASS4U] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-lass4u.json\" failed.");
			});
		}else{
			console.log("[LASS4U] Does not finish update, wait for next run.");
		}
	},
	update_Webduino : function(){
		if(Webduino_isFinished){
			Webduino_isFinished = false;
			Webduino_LastData = [];
			httpTools.http_get_json('nrl.iis.sinica.edu.tw', '/LASS/last-all-webduino.json', function(response){
				if(response){
					response.feeds.forEach(function(element, index, arrary){
						var obj = {};
						obj.SiteName = element.SiteName;
						obj.SiteGroup = 'Webduino';
						obj.Maker = 'Webduino';
						obj.Data = {
							Temperature : undefined,
							Humidity : undefined,
							Dust2_5 : element.PM2_5,
							Create_at : element.timestamp
						};
						obj.LatLng = {
							lat : element.gps_lat,
							lng : element.gps_lon
						};
						obj.RawData = element;
						Webduino_LastData.push(obj);
					});
					fs.writeFile(SaveDir + Webduino_writeFileName, JSON.stringify(Webduino_LastData), function(err){
						if(err){
							console.log(err);
							return;
						}
						console.log("[Webduino] Finished Writing.");
						Webduino_isFinished = true;
					});
				}else{
					Webduino_isFinished = true;
					console.log("[Webduino] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-webduino.json\" failed.");
				}
			}, function(err){
				console.log(err);
				Webduino_isFinished = true;
				console.log("[Webduino] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-webduino.json\" failed.");
			});
		}else{
			console.log("[Webduino] Does not finish update, wait for next run.");
		}
	},
	update_Airbox : function(){
		if(Airbox_isFinished){
			Airbox_isFinished = false;
			Airbox_LastData = [];
			httpTools.http_get_json('nrl.iis.sinica.edu.tw', '/LASS/last-all-airbox.json', function(response){
				if(response){
					response.feeds.forEach(function(element, index, arrary){
						var obj = {};
						obj.SiteName = element.SiteName;
						obj.SiteGroup = 'Airbox';
						obj.Maker = 'Airbox';
						obj.Data = {
							Temperature : element.s_t0,
							Humidity : element.s_h0,
							Dust2_5 : element.s_d0,
							Create_at : element.timestamp
						};
						obj.LatLng = {
							lat : element.gps_lat,
							lng : element.gps_lon
						};
						obj.RawData = element;
						Airbox_LastData.push(obj);
					});
					fs.writeFile(SaveDir + Airbox_writeFileName, JSON.stringify(Airbox_LastData), function(err){
						if(err){
							console.log(err);
							return;
						}
						console.log("[Airbox] Finished Writing.");
						Airbox_isFinished = true;
					});
				}else{
					Airbox_isFinished = true;
					console.log("[Airbox] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-airbox.json\" failed.");
				}
			}, function(err){
				console.log(err);
				Airbox_isFinished = true;
				console.log("[Airbox] At request \"nrl.iis.sinica.edu.tw/LASS/last-all-airbox.json\" failed.");
			});
		}else{
			console.log("[Airbox] Does not finish update, wait for next run.");
		}
	},
	load_Indie : function(callback){
		fs.readFile( WorkDir + '/Data/Indie_RawData.json', function(err, data){
			if(err){
				console.log(err);
				return;
			}
			Indie_RawData = JSON.parse(data);
			callback();
		});
	},
	update_Indie : function(){
		if(Indie_isFinished){
			Indie_LastData = [];
			Indie_isFinished = false;
			Indie_RawData.forEach(function(element, index, arrary){
				httpTools.https_get_json('thingspeak.com', '/channels/' + element.Channel_id + '/feeds.json?results=1', function(response){
					if (response) {
						var obj = element;
						if(response.channel){
							obj.SiteName = response.channel.name;
							obj.LatLng = {
								lat : parseFloat(response.channel.latitude),
								lng : parseFloat(response.channel.longitude)
							};
						}else{
							obj.SiteName = undefined;
							obj.LatLng = {
								lat : undefined,
								lng : undefined
							};
						}
						if(response && response != -1 && response.feeds && response.feeds[0]){
							obj.RawData = response.feeds[0];
							obj.Data = {
								Temperature : (element.Option.Temperature ? parseFloat(obj.RawData[element.Option.Temperature]) : undefined),
								Humidity : (element.Option.Humidity ? parseFloat(obj.RawData[element.Option.Humidity]) : undefined),
								Dust2_5 : (element.Option.Dust2_5 ? parseFloat(obj.RawData[element.Option.Dust2_5]) : undefined),
								Create_at : obj.RawData.created_at
							}
						}else{
							obj.RawData = {};
							obj.Data = {
								Temperature : undefined,
								Humidity : undefined,
								Dust2_5 : undefined,
								Create_at : undefined
							}
						}
					}else{
						var obj = element;
						obj.SiteName = undefined;
						obj.LatLng = {
							lat : undefined,
							lng : undefined
						};
						obj.RawData = {};
						obj.Data = {
							Temperature : undefined,
							Humidity : undefined,
							Dust2_5 : undefined,
							Create_at : undefined
						};
						console.log("[Indie] At request \"api.thingspeak.com/channels/" + element.Channel_id + "/feeds.json?results=1\" failed.");
					}
					Indie_LastData.push(obj);
					updateTools.check_write_Indie();
				}, function(){
					var obj = element;
					obj.RawData = {};
					obj.Data = {
						Temperature : undefined,
						Humidity : undefined,
						Dust2_5 : undefined,
						Create_at : undefined
					}
					obj.SiteName = undefined;
					obj.LatLng = {
						lat : undefined,
						lng : undefined
					};
					Indie_LastData.push(obj);
					updateTools.check_write_Indie();
				});
			});
		}else{
			console.log("[Indie] Does not finish update, wait for next run.");
		}
	},
	check_write_Indie : function(){
		if(Indie_LastData.length === Indie_RawData.length){
			fs.writeFile(SaveDir + Indie_writeFileName, JSON.stringify(Indie_LastData), function(err){
				if(err){
					console.log(err);
					return;
				}
				console.log("[Indie] Finished Writing.");
				Indie_isFinished = true;
			});
		}
	}
};

/* Other Functions */
function parse_time(str, is_airbox){
	var time = str.substring(0, 10) + " " + str.substring(11, 16) + ":00:00+08:00";
	var return_obj = (new Date((new Date(time)).getTime() - (is_airbox ? 0 : 3600000))).toISOString();
	return_obj = return_obj.substring(0, 19);
	return_obj += "Z";
	return return_obj;
}
function Timerhandler(){
	counter ++;
	updateTools.update_ProbeCube();
	updateTools.update_LASS();
	updateTools.update_LASS4U();
	updateTools.update_Airbox();
	updateTools.update_Indie();
	updateTools.update_Webduino();
	if(counter % 12 === 0){
		updateTools.update_EPA();
	}
	if(counter === 360){
		counter = 0;
	}
	setTimeout(Timerhandler, 10000);
}

/* Process */
updateTools.load_EPA(updateTools.update_EPA);
updateTools.load_ProbeCube(updateTools.update_ProbeCube);
updateTools.load_Indie(updateTools.update_Indie);
updateTools.update_LASS();
updateTools.update_LASS4U();
updateTools.update_Airbox();
updateTools.update_Webduino();
setTimeout(Timerhandler, 10000);