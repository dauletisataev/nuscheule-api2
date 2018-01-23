var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var PDFParser = require("pdf2json");
var upload = require('express-fileupload');
var path    = require("path"),
    firebase = require('firebase');

var google = require('googleapis'),
    googleAuth = require('google-auth-library'),
    calendar= google.calendar("v3");

app.use(upload()); 
app.use(express.static(__dirname+'/public')); 

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
 


var config = {
    apiKey: "AIzaSyD2eu56B1z124GGhDXqAhedlD9T2fC9S34",
    authDomain: "nu-schedule.firebaseapp.com",
    databaseURL: "https://nu-schedule.firebaseio.com",
    projectId: "nu-schedule",
    storageBucket: "nu-schedule.appspot.com",
    messagingSenderId: "431984200808"
};

firebase.initializeApp(config);

var OAuth2 = google.auth.OAuth2;
var oauth2Client;



app.post('/upload', function(req, res) {
	console.log("Post request detected...");
	if(req.files){
		var file = req.files.file,
		filename = req.files.file.name,
		type = req.files.file.mimetype;
		var dir = './public/uploads/'+makeid()+"-"+filename;
		if(type.indexOf("pdf")>-1){
			file.mv(dir, function(err){
				if(err){
					console.log(err);
					res.send("error occured");
				}else{
					getLessons(dir, res);				
				}
			});
		}else{
			res.send("invalid file format");
		}
		
	}; 

});


// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
    'https://www.googleapis.com/auth/calendar'
];



app.get("/oAuthUrl", function(req, res) {
   res.send(url);
});

app.get("/callback", function(req, res) {
    oauth2Client.getToken(req.query.code, function (err, tokens) {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if (!err) {
        	console.log("callback request indicated");
            oauth2Client.setCredentials(tokens);
            console.log("current id= "+localStorage.getItem('id'));
            addToCalendar(localStorage.getItem('id'));
        }
    });
    res.sendFile(path.join(__dirname+'/public/thank.html'));
});

app.get("/getSchedule/:id", function(req, res){
	var id = req.params.id;
	var dataRef = firebase.database().ref().child("/").child(id);
	dataRef.once('value', function(snapshot){
		res.send(snapshot.val());
	});

});
function saveToDatabase(id, subjects, res){
    var dataRef = firebase.database().ref().child("/");



    for (var key in subjects){
        if (subjects.hasOwnProperty(key)) {
            subjects[key].forEach(function(child){
                var subject = {}
                if(child.length == 9){
                    subject = {
                        startTime: child[0],
                        endTime: child[1],
                        room: child[2],
                        title: child[3],
                        instructor: child[6]
                    };
                } else{
                    subject = {
                        startTime: child[0],
                        endTime: child[1],
                        room: child[2],
                        title: child[3]+" " +child[4],
                        instructor: child[7]
                    };
                }

                dataRef.child(id).child(key).child(child[0]).set(subject).then(function onSuccess(response){
                	oauth2Client = new OAuth2(
					    "254360189613-45ht6gm997e5lqk4dsqjpdme4egteugv.apps.googleusercontent.com",
					    "0yUUlzpngIlspfwLyUcwCmIU",
					    "https://nuschedule.herokuapp.com/callback"
					);
                	localStorage.setItem('id', id);
					var url = oauth2Client.generateAuthUrl({
					    // 'online' (default) or 'offline' (gets refresh_token)
					    access_type: 'offline',

					    // If you only need one scope you can pass it as a string
					    scope: scopes,
					});
                	res.writeHead(301,
					  {Location:url}
					);
					res.end();
                });
            });

        }
    }


};

function addToCalendar(id){
	console.log("what the fuck maaan", id);
    var dataRef = firebase.database().ref().child("/").child(id);
    console.log("wait bro starting to add...");
    dataRef.once('value', function(snapshot){
    	console.log("got the data mann");
        snapshot.forEach(function(childSnap){
           childSnap.forEach(function(snap){
           	console.log("looping through mann");
               var subject = snap.val();
               //console.log(getFormattedTime(subject.startTime, childSnap.key));
               console.log(subject.startTime, childSnap.key);
               var event = {
                   'summary': subject.title,
                   'location': subject.room,
                   'description': 'go hard or go home',
                   'start': {
                       'dateTime': getFormattedTime(subject.startTime, childSnap.key),
                       'timeZone': 'GMT+06:00'
                   },
                   'end': {
                       'dateTime': getFormattedTime(subject.endTime, childSnap.key),
                       'timeZone': 'UTC+06:00'
                   },
                   'recurrence': [
                       'RRULE:FREQ=WEEKLY;COUNT=12'
                   ],
                   'reminders': {
                       'useDefault': true
                   },
               };
               console.log(subject.startTime, subject.title, "-->", event.start.dateTime);
               calendar.events.insert({
                   auth: oauth2Client,
                   calendarId: 'primary',
                   resource: event,
               }, function(err, event) {
               		console.log('finished');
                   if (err) {
                       console.log('There was an error contacting the Calendar service: ' + err);
                       return;
                   }
                   console.log('Event created: %s', event.htmlLink);
               });
           });
        });

    });

}
function getFormattedTime(time, day){
    var matches = time.toLowerCase().match(/(\d{1,2}):(\d{2}) ([ap]m)/),
        output  = (parseInt(matches[1]) + (matches[3] == 'pm' ? 12 : 0)) + ':' + matches[2] + ':00',
        now = new Date();
    if (time.startsWith("12") && time.includes("PM")){
        output  = (parseInt(matches[1])) + ':' + matches[2] + ':00';
    }
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        year = now.getFullYear(),
        month = now.getMonth(),
        today = now.getDate(),
        todayIndex = now.getDay(),
        dayIndex = days.indexOf(day);

    var add = 0;

    if(todayIndex < dayIndex)  add = dayIndex-todayIndex;
    if(todayIndex > dayIndex) add = 7-(todayIndex-dayIndex);
    var newDate = new Date(year, month, today+add);
    var output = newDate.getFullYear()+'-'+(newDate.getMonth()+1)+'-'+newDate.getDate()+'T'+output;
    return output;
}
function getLessons(name, res) {
    var pdfParser = new PDFParser();


    pdfParser.on("pdfParser_dataError", function(errData) {console.error(errData.parserError); result = false;});
    pdfParser.on("pdfParser_dataReady", function(pdfData){
        var texts = pdfData["formImage"]["Pages"][0]["Texts"], text_length = texts.length,
            result = {Monday:[], Tuesday:[], Wednesday:[], Thursday:[], Friday:[]},
            dayIndex = -1,
            idIsNext = false, id = 0;
        var isValid = false;
        var prev= {x: 0, y: 0, day: -1};
        var row = [], iteration = 1;
        texts.forEach(function(child){
            var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                current = decodeURIComponent(child['R'][0]["T"]);

            if(days.indexOf(current) >-1) dayIndex = days.indexOf(current);

            if (dayIndex > -1){

                var i = (dayIndex == prev.day) ? dayIndex : (dayIndex -1);
                if (dayIndex == 0) i = dayIndex;

                if (Math.abs(prev.y-child.y) > 0.7){
                    if(row.length > 8) result[Object.keys(result)[i]].push(row);
                    row = [];
                    row.push(current);

                } else{
                    row.push(current);
                }
                if( iteration == text_length){
                    result[Object.keys(result)[i]].push(row);
                    row = [];
                    row.push(current);
                }

                //row.push(current);
                prev.x = child.x;
                prev.y= child.y;
                prev.day = dayIndex;
            };
            if (idIsNext) {id = current; idIsNext = false; console.log(id)};
            if (current == "StudentID:") idIsNext = true;
            if (current == 'Schedule by days') isValid = true;
            iteration++;
        });
        if(isValid) {
        	saveToDatabase(id, result, res);
        }else {
        	console.log('not valid');
        	res.send("invalid file");	
        }
    });

    pdfParser.loadPDF(name);

};

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
var port = process.env.PORT || 3000;
var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});