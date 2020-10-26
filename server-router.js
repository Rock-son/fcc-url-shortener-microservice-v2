"use strict";

const DNS = require("dns");
const MONGO_CLIENT = require("mongodb").MongoClient;
const DB_URL = process.env.DB;
const COLLECTION = "url_shortener";
const ROOT_URL = "https://fcc-urlshortener-project.herokuapp.com";

let maxId = 1;
const options = {
	family: 4,
	hints: DNS.ADDRCONFIG | DNS.V4MAPPED,
  };

module.exports = function(app) {

	// NEW URL
	app.post('/api/shorturl/new', function(req, res) {
		const LOOKUP_URL = req.body.url.trim().replace(/http:\/\/|https:\/\//, "");
		const URL = req.body.url.trim();

		DNS.lookup(LOOKUP_URL, options, (err, address, family) => {
			if (!err) {
				MONGO_CLIENT.connect(DB_URL, function(err, db) {
				if (err) throw err;

				//FIND URL
				db.collection(COLLECTION).find(
					{url: {$eq: URL}},              // first parameter: find
					{url: 1, url_nr: 1, _id: 0}     // second parameter: return values

				).toArray(function(error, documents) {
					if (error) throw error;
					if (documents.length) {
						res.set({status: 200, 'content-type': 'text/html' });
						res.send(JSON.stringify({
							"original_url": documents[0].url,
							"short_url": `<a href='/api/shorturl/${documents[0].url_nr}' target='_blank'>` +
											`${ROOT_URL}/api/shorturl/${documents[0].url_nr}</a>`
						}));
						db.close();
					} else {
					//OR INSERT if not found
						db.collection(COLLECTION).find().sort({url_nr:-1}).limit(1).toArray(function(err, data) {
							if (error) throw error;

							maxId = data.length ? data[0].url_nr : 1000;
							maxId++;
							insertDB(db, COLLECTION, maxId, URL, res);
						});
					}
				});
			});
			} else {
				res.set({status: 200, 'content-type': 'application/json' });
				res.send(JSON.stringify({"error":"Wrong url format, make sure you have a valid protocol and real site."}));
			}
		});
	});

	// EXISTING SHORT URL
	app.get('/api/shorturl/:id', function(req, res) {

		var url_nr = 0;
		//IF PASSED STRING IS A NUMBER
		if (url_nr = parseInt(req.params.id)) {

			MONGO_CLIENT.connect(DB_URL, function(err, db) {
				if (err) throw err;
				//FIND url nr
				db.collection(COLLECTION).find(
						{url_nr: {$eq: url_nr}},       // first parameter: find
						{url: 1, url_nr: 1, _id: 0}     // second parameter: return values

					).toArray(function(error, documents) {
						if (error) throw error;
						if (documents.length) {
							res.redirect(documents[0].url);
							db.close();
						} else {
							res.set({status: 200, 'content-type': 'application/json' });
							res.end(JSON.stringify({"error":"This url is not in the database."}));
							db.close();
						}
					});
			});
		} else {
			res.set({status: 200, 'content-type': 'application/json' });
			res.send(JSON.stringify({"error":"Wrong path!"}));
		}
	});
};

function insertDB(db, collection, maxUrlNr, url, res) {

    //INSERT
    db.collection(collection).insert({
        url_nr: maxUrlNr < 1000 ? 1000 : +maxUrlNr,
        url: url,
        time: new Date()
    }, function(error, data) {
        if (error) throw error;
        res.set({status: 200, 'content-type': 'text/html' });
        res.send(JSON.stringify({
			"original_url": url,
			"short_url": `<a href='/api/shorturl/${maxUrlNr}' target='_blank'>${ROOT_URL}/api/shorturl/${maxUrlNr}</a>`
		}))
	});
    db.close();
}