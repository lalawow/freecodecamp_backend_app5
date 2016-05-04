'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var mongo = require('mongodb').MongoClient
var short_url_base = "https://freecodecamp-backend-app3-lalawow-1.c9users.io/"
var mongo_url = "mongodb://localhost:27017/clementinejs"
var count = 0

mongo.connect(mongo_url, function(err, db) {
	if (err) throw err
	var collection = db.collection('short_urls')
	collection.find({
		count: {
			$exists: true
		}
	}).toArray(function(err, data_count) {
		if (err) throw err
		if (data_count.length !== 0) {
			count = data_count[0].count
			console.log("data count is " + count + " now!")
			db.close()
		}
		else {

			collection.insert({
				dataname: "count",
				"count": 0
			}, function(err, data) {
				if (err) throw err
				db.close()
			})
		}
	})
})





module.exports = function(app, passport) {

	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		else {
			res.redirect('/login');
		}
	}

	var clickHandler = new ClickHandler();



	//for freecodecamp back end porject: URL Shortener Microservice
	/*
	User stories:

	I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.
	When I visit that shortened URL, it will redirect me to my original link.
	Example creation usage:
	https://little-url.herokuapp.com/new/https://www.google.com
	https://little-url.herokuapp.com/new/http://foo.com:80
	Example creation output
	{ "original_url":"http://foo.com:80", "short_url":"https://little-url.herokuapp.com/8170" }
	Usage:
	https://little-url.herokuapp.com/2871
	Will redirect to:
	https://www.google.com/
	*/
	app.route('/new/http://:_url').get(function(req, res) {
		var url = req.params._url
		console.log("address: http://" + url)
		insertUrl("http://" + url, req, res)
	})

	app.route('/new/https://:_url').get(function(req, res) {
		var url = req.params._url
		console.log("address: https://" + url)
		insertUrl("https://" + url, req, res)
	})

	app.route('/new/:_url').get(function(req, res) {
		var url = req.params._url
			res.writeHead(200, {
		'Content-Type': 'application/json'
	})
	res.end("Sorry, it's an invalid url.")

	})


	app.route('/:_id').get(function(req, res) {
		var short_url_id = req.params._id
		if (filterInt(short_url_id) > 0) {
			var original_url = ""

			mongo.connect(mongo_url, function(err, db) {
				if (err) throw err
				var collection = db.collection('short_urls')
				collection.find({
					short_url_id: {
						$eq: short_url_id
					}
				}).toArray(function(err, urls) {
					if (err) throw err
					original_url = urls[0]["original_url"]
					console.log("we'll redirect to " + original_url)
					res.redirect(original_url)
					db.close()
				})
			})
		}
		else {
			console.log("wrong route: " + short_url_id)
		}

	})
	
	app.route('/').get(function(req, res) {
		res.sendFile(path + '/public/index.html');
	})

};

var filterInt = function(value) {
	if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
		return Number(value);
	return NaN;
}

var insertUrl = function(original_url, req, res) {
	count++
	var short_num = count
	console.log("we got count " + short_num + " now!")
	var short_url = short_url_base + short_num
	var output = {
		"original_url": original_url,
		"short_url": short_url
	}

	var insert_info = {
		"original_url": original_url,
		"short_url_id": short_num.toString()
	}

	mongo.connect(mongo_url, function(err, db) {
		if (err) throw err
		var collection = db.collection('short_urls')
		collection.insert(insert_info, function(err, data) {
			if (err) throw err
			collection.update({
				dataname: 'count'
			}, {
				$set: {
					count: count
				}
			}, function(err) {
				if (err) throw err
				console.log("update count" + short_num + " on db")
				db.close()
			})
		})
	})
	res.writeHead(200, {
		'Content-Type': 'application/json'
	})
	res.end(JSON.stringify(output))
}

