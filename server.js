'use strict';

if (process.env.NODE_ENV !== "production" ) {
	require("dotenv").config();
}
var express = require('express');
var cors = require('cors');
var bodyParser = require("body-parser");
var app = express();

// routes
const router = require("./server-router");
// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

router(app);

app.listen(port, function () {
  console.log('Node.js listening ...');
});