'use strict';
// var dl = require('datalib');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config');
var Medicine = require('../models/medicine');
// var readline = require('readline');
// var stream = require('stream');
// var request = require('request');
// var JSONStream = require('JSONStream');
// var es = require('event-stream');
var app = express();

var med = {};
// var file_json;

// server
app.use(bodyParser.json());
// app.use(express.static('build'));

var runServer = function(callback) {
  mongoose.connect(config.DATABASE_URL, function(err) {
    if (err && callback) {
      return callback(err);
    }

    app.listen(config.PORT, function() {
      console.log('Listening on localhost:' + config.PORT);
      if (callback) {
          callback();
      }
    });
  });
};

app.get('/all_medicines', function(req, res){ 
  console.log(req.query.limit);
  let limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  Medicine.find({})
  .limit(limit)
  .then(function(medicine){
    res.json(medicine);
  });
});

app.get('/all_medicines/:name', function(req, res){ 
  let limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  Medicine.find({
    'name': new RegExp(".*" + req.params.name.toUpperCase()+'.*', "i")
  })
  .limit(limit)
  .then(function(medicine){
    res.json(medicine);
  })
});

// exact medicine
app.get('/medicine/:name', function(req, res){ 
  Medicine.find({
    'name': req.params.name.toUpperCase()
  })
  .limit(1)
  .then(function(medicine){
    res.json(medicine);
  })
});

// server

var file_arr = [
          // './drug-event-0001-of-0016.json', 
          // './drug-event-0002-of-0016.json',
          // './drug-event-0003-of-0016.json',
          // './drug-event-0004-of-0016.json',
          // './drug-event-0005-of-0016.json',
          // './drug-event-0006-of-0016.json',
          // './drug-event-0007-of-0016.json',
          // './drug-event-0008-of-0016.json',
          // './drug-event-0009-of-0016.json',
          // './drug-event-0016-of-0016.json'
          ];
var obj;
var counter = 0;
var counter_lines = 0;
if (require.main === module) {
  runServer(function(err) {
    if (err) {
      console.error(err);
    }
  });
};


function process_files(){
  mongoose.connect(config.DATABASE_URL, function(err) {
    if (err) {
      //return callback(err);
    }
  fs.readdir(process.argv[1], function(err, items) {
    file_arr= items;
  
  for(var i = 0 ; i< file_arr.length; i++){
    console.log("progess: file ", i );

    fs.readFile(process.argv[1] + '/' + file_arr[i], 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      counter++;
      get_result(obj);
      console.log("progessing: file ", i );
      if(counter == file_arr.length){
        insert_medicine_into_db(med);
      }   
    });
  }});
});
}

function get_result(data){
  var count = 0;
  console.log("data length is ",data.results.length);
  for(let result in data.results){
    //console.log("patient: ",data.results[result].patient);
    var medicinalproduct = data.results[result].patient.drug[0].medicinalproduct;
    var reaction = data.results[result].patient.reaction;

    if (!med[medicinalproduct]){
      med[medicinalproduct] = {};
    }

    for(var i =0; i< reaction.length; i++){
      var reaction_name = reaction[i].reactionmeddrapt;
      if(med[medicinalproduct][reaction_name]){
        med[medicinalproduct][reaction_name]++;
      }
      else{
        med[medicinalproduct][reaction_name] = 1;
      }
    }
    count++;
    if(count % 10000 === 0){
      console.log(count);
    }
  }
}


function insert_medicine_into_db(med){
  var count = 0;
  console.log("med length: ", Object.keys(med).length);
  for(let med_result_name in med){
    let medicine_obj = {name: med_result_name, reaction: []};
    let reactions = med[med_result_name];
    count++;
    for(let reaction in reactions){
      medicine_obj.reaction.push({name: reaction, count: reactions[reaction]});
    }

    

    Medicine.findOneAndUpdate({name: med_result_name}, medicine_obj, {upsert: true, new: true}, function(err, medic) {
      console.log(med_result_name);
      if (err || !medic) {
        console.error("Could not create medicine", med_result_name);
        return;
      }
      return;
    });

    if(count % 1000 === 0){
      console.log("count now is ",count);
    }
  }
}

exports.app = app;
exports.runServer = runServer;
exports.processFiles = process_files;
