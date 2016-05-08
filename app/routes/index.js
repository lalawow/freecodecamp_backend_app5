'use strict';
var https = require('https');
var path = process.cwd();
var mongo = require('mongodb').MongoClient
var short_url_base = "https://freecodecamp-backend-app5-lalawow.c9users.io/"
var mongo_url = "mongodb://localhost:27017/clementinejs"


module.exports = function(app, passport) {
	
	//for freecodecamp back end porject: Image Search Abstraction Layer

	// https://cryptic-ridge-9197.herokuapp.com/api/imagesearch/lolcats%20funny?offset=10
	app.route('/api/imagesearch/:query*').get(function(request, result) {
		var searchTerm = request.params.query
		var searchVol = request.query.offset
		console.log(typeof(searchTerm) + ": " + searchTerm)
		console.log(typeof(searchVol) + ": " + searchVol)

		var options = {
			host: 'www.googleapis.com',
			path: '/customsearch/v1?q=' + searchTerm.replace(/\s/g, "+") + '&cx=012332868486854605030:dwqv03pslfi&num=' + searchVol + '&searchType=image&start=1&key=AIzaSyDnI807mGZ1juoUt8smEzDm8ErDb7rQ1KM'
		};


		var googleRequest = https.get(options, function(res) {
			console.log('STATUS: ' + googleRequest.statusCode);
			console.log('HEADERS: ' + JSON.stringify(googleRequest.headers));

			// Buffer the body entirely for processing as a whole.
			var bodyChunks = [];
			res.on('data', function(chunk) {
				// You can process streamed parts here...
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				//console.log('BODY: ' + body);
				// ...and/or process the entire body here.
				var bodyJSON = JSON.parse(body)
				var item = bodyJSON.items
				console.log(item.length)
				console.log(JSON.stringify(item[0]))
				var searchAnswer = []
				for (var i = 0; i < parseInt(searchVol); i++) {
					//					{"url":"http://www.wallpapersxl.com/wallpapers/1440x900/flamenco/169257/flamenco-lolcats-funny-169257.jpg","snippet":"Lolcats Funny 1440x900","thumbnail":"https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcStyjj01vszOWOaJvzp6bpgCeyeoKezI_AQ1jTZ-IiHkaQQIT-5WSnYgqg","context":"http://www.wallpapersxl.com/wallpaper/1440x900/flamenco-lolcats-funny-169257.html"}
					var oneAnswer = {
						"url": item[i].link,
						"snippet": item[i].snippet,
						"thumbnail": item[i].image.thumbnailLink,
						"context": item[i].image.contextLink
					}
					searchAnswer.push(oneAnswer)
				}
				result.send(JSON.stringify(searchAnswer))
			})
		});

		googleRequest.on('error', function(e) {
			console.log('ERROR: ' + e.message);
		});

		mongo.connect(mongo_url, function(err, db) {
				if (err) throw err
				var collection = db.collection('imageSearch')
				var insert_info = {
					term: searchTerm,
					when: new Date()
				}
				console.log("insert to mongoDB: " + JSON.stringify(insert_info))
				collection.insert(insert_info, function(err, data) {
					if (err) throw err
					db.close()
				})
			})
			//		result.send("ok")

	})

// https://cryptic-ridge-9197.herokuapp.com/api/latest/imagesearch/
	app.route('/api/latest/imagesearch').get(function(req, res) {
		mongo.connect(mongo_url, function(err, db) {
			if (err) throw err
			var collection = db.collection('imageSearch')
			collection.find({}, {
				term: 1,
				when: 1,
				_id: 0
			}).sort({
				$natural: -1
			}).limit(10).toArray(function(err, searches) {
				if (err) throw err
				res.send(JSON.stringify(searches))
				db.close()
			})
		})
	})

/*
	app.route('/').get(function(req, res) {
		res.sendFile(path + '/public/index.html');
	})
*/
};

