/*
	FileName : Map_main.js
	Author : Immortalmice
*/

/* Global Variable */
var SiteGroups = ['ProbeCube', 'EPA', 'LASS', 'LASS4U', 'Indie', 'Airbox', 'Webduino'];
var SiteGroups_isFinishedLoading = 0;
var SitesData = [];

var MainMap;
var trafficLayer;
var firstLoad = true;
var showOptions = {
	showType : "dust2_5",
	displaySiteGroup : {
		ProbeCube : true,
		EPA : true,
		LASS : true,
		LASS4U : true,
		miaoski : true,
		Airbox : true,
		"CCU NEAT" : true,
		"CCU 100" :　true,
		"ES-AIR" : true,
		Webduino : true,
		"KS-001" : true
	},
	timeRange : 14400000,
	setTrafficLayer: false
};
var topInfoBubble = undefined;

var now = new Date();


var temp_gap = [0, 5, 10, 15, 20, 25, 30, 35, 40];
var humi_gap = [20, 40, 60, 80];
var dust2_5_gap = [11, 23, 35, 41, 47, 53, 58, 64, 70];
var dust2_5_NASA_gap = [0, 3, 5, 8, 10, 13, 15, 18, 20, 35, 50, 65];

var groupUrl = {
	LASS: "https://github.com/LinkItONEDevGroup/LASS",
	ProbeCube: "https://github.com/Lafudoci/ProbeCube",
	AirBox: undefined,
	EPA: "http://taqm.epa.gov.tw/taqm/tw/Pm25Index.aspx",
	Pilot: "https://github.com/miaoski/pm25"
};

/* Suport Functions */
function CreateMarker(element){
	var obj = element;
	obj.InfoBubble = new InfoBubble({
		map : MainMap,
		content : '<div id=\'infoBul\'></div>',
		padding : 0,
		borderRadius : 20
	});
	obj.Marker =  new google.maps.Marker({
      	position : new google.maps.LatLng(element.LatLng.lat, element.LatLng.lng), 
      	map : MainMap,
      	title : "ID: " + element.Channel_id,
      	icon : IconUrl(element),
      	clickable : true,
      	opacity : 0.8
    });
    google.maps.event.addListener(obj.Marker, 'click', function(){
    	console.log(obj);
    	if(topInfoBubble){
    		topInfoBubble.close();
    		$('#infoBul').remove();
    	}
    	obj.InfoBubble.setMinWidth(725);
    	obj.InfoBubble.setMinHeight(445);
    	google.maps.event.addListener(obj.InfoBubble, 'domready', function(){
    		setInfoBubbleContent(obj);
    	});
    	obj.InfoBubble.open(MainMap, obj.Marker);
    	topInfoBubble = obj.InfoBubble;
    });
	if(element.Channel_id == $("#order_channel").text())
		MainMap.setCenter(obj.Marker.getPosition());
	return obj;
}
function IconUrl(element){
	var str = 'Pic/dot/';
	if(element.SiteGroup !== "EPA"){
		str += 'c';
	}else{
		str += 'd';
	}
	var value, arrary;
	if(showOptions.showType === "dust2_5"){
		str += 'd';
		value = element.Data.Dust2_5;
		arrary = dust2_5_gap;
	}else if(showOptions.showType === "dust2_5_NASA"){
		str += 'dn';
		value = element.Data.Dust2_5;
		arrary = dust2_5_NASA_gap;
	}else if(showOptions.showType === "temp"){
		str += 't';
		value = element.Data.Temperature;
		arrary = temp_gap;
	}else if(showOptions.showType === "humi"){
		str += 'h';
		value = element.Data.Humidity;
		arrary = humi_gap;
	}
	if(!value && value !== 0){
		return str.substring(0, 9) + '-1.png';
	}
	for(var i = 0; i <= arrary.length-1; i ++){
		if(value <= arrary[i])
			return str + i + '.png';
	}
	return str + arrary.length + '.png';
}
function fixSiteGroup(str){
	for(var i = 0; i <= SiteGroups.length-1; i ++){
		if(str === 'LASS4U')
			return 'LASS'
		if(str === SiteGroups[i])
			return str;
	}
	return 'Indie';
}
function showRawData(SiteName){
	var Site = SitesData.find(function(element, index, arrary){
		return element.SiteName === SiteName;
	});
	var RawData = Site.RawData;
	var table_str = "";
	table_str += "<tr>";
	table_str += "<th>欄位</th>";
	table_str += "<th>值</th>";
	table_str += "</tr>";

	for(var prop in RawData){
		if(Site.SiteGroup === "Airbox" && prop === "device_id")
			continue;
		table_str += "<tr>";
		table_str += "<td>" + prop + "</td>";
		table_str += "<td>" + RawData[prop] + "</td>";
		table_str += "</tr>";
	}
	$("#RawDataTable").html(table_str);
	$("#RawDataModal").modal('show');
}
function setInfoBubbleContent(element){
    var closeButton = $("[src='http://maps.gstatic.com/intl/en_us/mapfiles/iw_close.gif']");
    closeButton.attr({src : "Pic/icons/close.png"});
    closeButton.css({width : "30px", height : "30px", right : "-10px", top : "-10px"});
    var infoBul = $('#infoBul');
    infoBul.html("<div class=\'row col-xs-12\'></div>");
    infoBul.children().append('<a id=\'thingspeakurl\'><p class=\'inline\' style=\'font-size: 32px; font-weight:500;\'>' + element.SiteName + '</p></a>');
    infoBul.children().append('<img style=\"cursor: pointer;\" src=\'Pic/icons/' + fixSiteGroup(element.SiteGroup) + '.png\' height=\'36\' class=\'pull-right\' onclick=\"location.href=\'' + groupUrl[element.SiteGroup] + '\'\">');
    if(element.SiteGroup !== 'LASS'){
    	$("#thingspeakurl").attr("href", "http://api.thingspeak.com/channels/" + element.Channel_id );
    }else{
    	$("#thingspeakurl").attr("href", 'http://nrl.iis.sinica.edu.tw/LASS/show.php?device_id=' + element.SiteName);
    }
    infoBul.append("<div class=\'row col-xs-12\' style=\'padding-right: 0px\'></div>");
    infoBul.children(':nth-child(2)').append("<div class=\'col-xs-4\' style=\'height: 370px;\'></div>");
    infoBul.children(':nth-child(2)').append("<div class=\'col-xs-8\' style=\'height: 370px;padding-right: 0px\'></div>");
    var infos = infoBul.children(':nth-child(2)').children(':nth-child(1)');
    infos.css({'padding-right' : '0px'});
    infos.append("<div class=\'row col-xs-12\'><p style=\'font-size: 24px; font-weight:500; color:gray;\'>" + element.Maker + "</p></div>");
    for(var i = 0; i <= 4; i ++)
    	infos.append("<div class=\'row col-xs-12\'></div>");
    infos.children(':nth-child(2)').append('<img src=\'Pic/icons/temp.png\' height=\'42\'>');
    infos.children(':nth-child(2)').append('<p  class=\'inline\' style=\'padding-left: 10px;font-size: 20px; font-weight:500;\'>空氣溫度&nbsp&nbsp&nbsp</p>');
    infos.children(':nth-child(2)').append('<p  class=\'pull-right\' style=\'font-size: 20px; font-weight:500;\'>' + ((element.Data.Temperature || element.Data.Temperature === 0) ? element.Data.Temperature.toFixed(1) : '--') + '&nbsp;°C</p>');
    infos.children(':nth-child(3)').append('<img src=\'Pic/icons/humi.png\' height=\'42\'>');
    infos.children(':nth-child(3)').append('<p  class=\'inline\' style=\'padding-left: 10px;font-size: 20px; font-weight:500;\'>相對濕度&nbsp&nbsp&nbsp</p>');
    infos.children(':nth-child(3)').append('<p  class=\'pull-right\' style=\'font-size: 20px; font-weight:500;\'>' + ((element.Data.Humidity || element.Data.Humidity === 0) ? element.Data.Humidity.toFixed(0) : '--') + '&nbsp;%</p>');
    infos.children(':nth-child(4)').append('<img src=\'Pic/icons/dust.png\' height=\'42\'>');
    infos.children(':nth-child(4)').append('<p  class=\'inline\' style=\'padding-left: 10px;font-size: 20px; font-weight:500;\'>PM2.5&nbsp&nbsp&nbsp</p>');
    infos.children(':nth-child(4)').append('<p  class=\'pull-right\' style=\'font-size: 20px; font-weight:500;\'>' + ((element.Data.Dust2_5 || element.Data.Dust2_5 === 0) ? element.Data.Dust2_5.toFixed(0) : '--') + '&nbsp;μg/m<sup>3</sup></p>');
    infos.children(':nth-child(5)').append('<button class=\'btn btn-link btn-sm\' onclick=\'showRawData(\"' + element.SiteName + '\");\'>原始資料</button>');
    infos.children(':nth-child(6)').css({'padding-top' : '20px', 'padding-right' : '0px'});
    infos.children(':nth-child(6)').append('<p style=\'font-size:12px\' class=\'inline\'>' + timegap(element.Data.Create_at) + '</p>');
    var chart = infoBul.children(':nth-child(2)').children(':nth-child(2)');
    $('#Chart').remove();
    chart.attr('id', 'Chart');
    if(element.SiteGroup !== "LASS" && element.SiteGroup !== "LASS4U" && element.SiteGroup !== "Airbox" && element.SiteGroup !== "Webduino"){
    	infos.children(':nth-child(6)').append('<button class=\"btn btn-info btn-sm pull-right\" onclick=\"location.href=\'/Data/History.html?chid=' + element.Channel_id + '&type=' + element.SiteGroup + '\'\">歷史資料</button>');
    	chart.html('<iframe height=\'360\' class=\'col-xs-12\' style=\'border:0px;margins:0px;padding: 0px;\' src=\'' + getChartUrl(element, "Dust2_5") + '\'></iframe>');
    }else{
    	var device_id = element.SiteGroup !== "Airbox" ? element.SiteName : element.RawData.device_id;
    	infos.children(':nth-child(6)').append('<button class=\"btn btn-info btn-sm pull-right\" onclick=\"location.href=\'http://nrl.iis.sinica.edu.tw/LASS/show.php?device_id=' + device_id  + '\'\">歷史資料</button>');
		chart.children("img").remove();
		chart.addClass('vertical-center');
		chart.html('<img class=\'center-block\' style=\'width: 36px;height: 36px;\' alt="Ajax loader" src="//thingspeak.com/assets/loader-transparent.gif"/>');
		addSeries(device_id, 2000, '#808080');
    }
}
function getChartUrl(element, type){
	var field;
	if(element.Option){
		field = element.Option[type].charAt(5);
	}else{
		field = '5';
	}
	if(type === "Dust2_5"){
		return "http://api.thingspeak.com/channels/" + element.Channel_id + "/charts/" + field + "?width=auto&height=auto&title=細懸浮微粒PM2.5&days=1&average=30&dynamic=true&type=spline&color=grey&yaxismin=0&yaxis=μg/m3";
	}
}
function timeOffset(time1, time2){
	if(!time1 || !time2)
		return undefined;
	return time1 - time2;
}
function timegap(time){
	var offset = timeOffset(now, new Date(time));
	offset /= 1000;
	var value = Math.floor(offset);

	if(offset <= 0)
		return "0秒前更新";

	offset /= 60;
	if(offset < 1)
		return (value + "秒前更新");
	value = Math.floor(offset);

	offset /= 60;
	if(offset < 1)
		return (value + "分鐘前更新");
	value = Math.floor(offset);

	offset /= 24;
	if(offset < 1)
		return (value + "小時前更新");
	value = Math.floor(offset);

	offset /= 30;
	if(offset < 1)
		return (value + "天前更新");
	value = Math.floor(offset);

	offset /= 12;
	if(offset < 1)
		return (value + "個月前更新");
	value =Math.floor(offset);

	return (value + "年前更新");
}
function applyShowOptions(Options){
	for(var prop in Options)
		showOptions[prop] = Options[prop];
	trafficLayer.setMap(showOptions.setTrafficLayer ? MainMap : undefined);
	$('#picbar').children('img').attr('src', 'Pic/icons/' + showOptions.showType + '_bar.png');
	SitesData.forEach(function(element, index, arrary){
		element.Marker.setIcon(IconUrl(element));
		var visible = showOptions.displaySiteGroup[element.SiteGroup];
		if(showOptions.timeRange != -1 && timeOffset(now, new Date(element.Data.Create_at)) > showOptions.timeRange)
			visible = false;
		element.Marker.setVisible(visible);
	});
	return;
}

	/* The following functions are not written by Immoratalmice */
	function addChart(data) {
	    // variable for the local date in milliseconds
	    var localDate;
	    var my_offset = new Date().getTimezoneOffset();
	    // specify the chart options
	    var chartOptions = {
	      chart: {
	        renderTo: 'Chart',
	        defaultSeriesType: 'spline',
	        backgroundColor: '#ffffff',
	        events: { }
	      },
	      title: { text: '<b>細懸浮微粒PM2.5</b>' , useHTML: true},
	      plotOptions: {
	        series: {
	          marker: { radius: 3 },
	          animation: true,
	          step: false,
	          borderWidth: 0,
	          turboThreshold: 0
	        }
	      },
	      tooltip: {
	        // reformat the tooltips so that local times are displayed
	        formatter: function() {
	          var d = new Date(this.x + (my_offset*60000));
	          var n = (this.point.name === undefined) ? '' : '<br>' + this.point.name;
	          return this.series.name + ':<b>' + this.y + '</b>' + n + '<br>' + d.toDateString() + '<br>' + d.toTimeString().replace(/\(.*\)/, "");
	        }
	      },
	      xAxis: {
	        type: 'datetime',
	        title: { text: '<b>Date</b>' , useHTML: true}
	      },
	      yAxis: { title: { text: '<b>μg/m3</b>' , useHTML: true} },
	      exporting: { enabled: false },
	      legend: { enabled: false },
	      credits: {
	        text: '',
	        href: '',
	        style: { color: '#808080' }
	      }
	    };
	    // draw the chart
	    var my_chart = new Highcharts.Chart(chartOptions);
	    return my_chart;
	}
	  // add a series to the chart
	function addSeries(device, results, color) {
	    //var field_name = 'field' + field_number;
	    var field_name = 'PM2_5';
	    // get the data with a webservice call
	    $.getJSON('http://nrl.iis.sinica.edu.tw/LASS/history-hourly.php', {device_id: escape(device)}, function(data) {
	      // blank array for holding chart data
		    var chart_data = [];
		    var sma_num = 5;
		    var sma = [];
		    var k = 0;
		    // iterate through each feed
		    $.each(data.feeds, function() {
		        var point = new Highcharts.Point();
		        var value = this[field_name];
		        point.x = getChartDate(this.timestamp);
		        point.y = parseFloat(value);
		        // if a numerical value exists add it
		        /*if (!isNaN(parseInt(value))) { 
					sma[k%sma_num] = point.y;
					k = k+1;
					if (k>sma_num){
						point.y = 0;
						for (var i=0;i<sma_num;i++){
							point.y = point.y + sma[i]; 
						}
						point.y = point.y / sma_num;
						chart_data.push(point); 
					}
				}*/
				chart_data.push(point); 
		    });
	      // add the chart data
	      //my_chart.addSeries({ data: chart_data, name: data.channel[field_name], color: color });
	  		var my_chart = addChart();
	        my_chart.addSeries({ data: chart_data, name: "PM2.5", color: color });
	    });
	}
	  // converts date format from JSON
	function getChartDate(d) {
	    var my_offset = new Date().getTimezoneOffset();
	    // offset in minutes is converted to milliseconds and subtracted so that chart's x-axis is correct
	    return Date.parse(d) - (my_offset * 60000);
	}
	/* The functions above are not written by Immoratalmice */

/* Suport Object */
var infoConsole = {
	div : 'info_console_div',
	data : [],
	MAXLENGTH : 5,
	write : function(str, html){
		var out;
		if(this.data.length > this.MAXLENGTH)
			out = this.data.shift();
		this.data.push('<p class=\'infoconsole text-right\'>' + str + '</p>');
		$('#' + this.div).html(this.data.join(''));
		return out;
	}
};
var updateTool = {
	gap : 10000,
	flag : true,
	btn : 'livebtn',
	start : function(){
		this.flag = true;
		$("#" + this.btn).removeClass("btn-info");
		$("#" + this.btn).addClass("btn-danger"); 
		$("#" + this.btn).text("關閉即時更新");
		$("#" + this.btn).attr("onclick", "updateTool.stop();"); 
		this.update();
		infoConsole.write('即時更新已開啟');
	},
	stop : function(){
		this.flag = false;
		$("#" + this.btn).removeClass("btn-danger");
		$("#" + this.btn).addClass("btn-warning"); 
		$("#" + this.btn).attr("disabled", "disabled"); 
		$("#" + this.btn).text("關閉中");
		infoConsole.write('關閉即時更新中');
	},
	update : function(){
		now = new Date();
		SiteGroups.forEach(function(sg_element, sg_index, sg_arrary){
			$.getJSON('/Data/' + sg_element + '_last.json').done(function(data){
				var updates = 0;
				data.forEach(function(d_element, d_index, d_arrary){
					var sdIndex = SitesData.findIndex(function(s_element, s_index, s_arrary){
						return s_element.SiteName === d_element.SiteName;
					});
					if(sdIndex && SitesData[sdIndex] && SitesData[sdIndex].Data.Create_at !== d_element.Data.Create_at){
						for(var prop in d_element)
							SitesData[sdIndex][prop] = d_element[prop];
						SitesData[sdIndex].Marker.setIcon(IconUrl(SitesData[sdIndex]));
						updates ++;
					}		
				});
				if(updates !== 0)
					infoConsole.write(sg_element + '站點已更新(' + updates + '/' + data.length + ')');
			});
		});
		if(this.flag){
			setTimeout("updateTool.update();", this.gap);
		}else{
			$("#livebtn").removeClass("btn-warning");
			$("#livebtn").addClass("btn-info"); 
			$("#livebtn").text("開啟即時更新");
			$("#livebtn").attr("onclick", "updateTool.start();"); 
			$("#livebtn").removeAttr("disabled");
			infoConsole.write('即時更新已關閉');
		}
	}
}

/* Initialize */
function initialize(){
	/* Set Map */
	$("#map").css({"height" : $(window).height() - 170 + "px"});

	var stylesGray = [
	    {
	      stylers: [
	        { hue: "#00ffee" },
	        { saturation: -70 }
	      ]
	    },{
	      featureType: "road",
	      elementType: "geometry",
	      stylers: [
	        { lightness: 100 },
	        { visibility: "simplified" }
	      ]
	    },{
	      featureType: "road",
	      elementType: "labels",
	      stylers: [
	        { visibility: "off" }
	      ]
	  	}
    ];
	var mapOptions = {
		zoom: 8,
		center: new google.maps.LatLng(23.783832, 120.957181),
		styles: stylesGray,
		mapTypeControl: false
	};
	trafficLayer = new google.maps.TrafficLayer();
	trafficLayer.__proto__.set('opacity' , 0.1);
	/* Get Parameter */
	if($("#order_channel").text() != "ORDER_CHANNEL"){
		mapOptions.zoom = 14;
	}
	MainMap = new google.maps.Map(document.getElementById('map'), mapOptions);

	google.maps.event.addListener(MainMap, 'idle', function(){
		if(firstLoad){
			$("#Loading").hide();
			$("#picbardiv").css({"position" : "absolute",  "bottom" : "210px", "left" : "10px", "z-index": "2"});
			$("#picbardiv").attr("hidden", false);
			$("#info_console_div").css({"position" : "absolute",  "bottom" : "90px", "right" : "45px", "z-index": "2"});
			$("#info_console_div").attr("hidden", false);
			$("#picbar").html("<img class=\"bar\" style=\'height: 100%; margin: 0px;\' src=\"Pic/icons/dust2_5_bar.png\">");
			firstLoad = false;
		}
	});

	SiteGroups.forEach(function(sg_element, sg_index, sg_arrary){
		$.getJSON('/Data/' + sg_element + '_last.json').done(function(data){
			data.forEach(function(d_element, d_index, d_arrary){
				SitesData.push(CreateMarker(d_element));
			});
			infoConsole.write(data.length + '個' + sg_element + '站點已載入');
			SiteGroups_isFinishedLoading ++;
			if(SiteGroups_isFinishedLoading === SiteGroups.length){
				infoConsole.write('全數載入完成');
				applyShowOptions();
			}
		});
	});
	$("#FilterModal").submit(function(event){
		event.preventDefault();
		applyShowOptions(
		{
			displaySiteGroup : {
				ProbeCube : $("#PC").is(":checked"),
				EPA : $("#EPA").is(":checked"),
				LASS : $("#LA").is(":checked"),
				LASS4U : $("#LA4U").is(":checked"),
				Airbox : $("#AB").is(":checked"),
				miaoski : $("#miaoski").is(":checked"),
				"CCU NEAT" : $("#ccu").is(":checked"),
				"CCU 100" : $("#ccu100").is(":checked"),
				"ES-AIR" : $("#ES-AIR").is(":checked"),
				Webduino : $("#Webduino").is(":checked"),
				"KS-001" : $("#KS-001").is(":checked"),
			},
			timeRange : parseInt($("#timeRange").val()),
			setTrafficLayer : $("#trafficLayerView").is(":checked")
		});
		$('#FilterModal').modal('hide');
	});
	$("#showType").change(function(event){
		event.preventDefault();
		applyShowOptions({showType: $('#showType').val()});
	});
	$("#selectAll").click(function(event){
		for(var i = 1; i <= $("#selections").children().length; i ++){
			$("#selections").children("div:nth-child(" + i + ")").children("label:nth-child(1)").children("input:nth-child(1)").prop("checked", true);
		}
	});
	$("#reverseSelect").click(function(event){
		for(var i = 1; i <= $("#selections").children().length; i ++){
			var ele = $("#selections").children("div:nth-child(" + i + ")").children("label:nth-child(1)").children("input:nth-child(1)");
			ele.prop("checked", !ele.is(":checked"));
		}
	});
	setTimeout('updateTool.start();', updateTool.gap);
}