console.log('Loading function.');

// Load config
var creds = require('./config.json');

// Load dependencies
var hasha = require('hasha');
var GoogleSpreadsheet = require('google-spreadsheet');

var spreadsheet = new GoogleSpreadsheet(creds.spreadsheet_key);

// Get Medium.com highlights
exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  var e = JSON.parse(event.Records[0].Sns.Message);
  var newHash = hasha([e.text, e.post.link, e.createdAt.toString()], {algorithm: 'sha256'});

  spreadsheet.useServiceAccountAuth(creds, function(err){
    if (err) {
      return context.fail(new Error(err));
    }

    // Get highlight IDs (hashes) in first column
    var opts = {'min-row': 2, 'min-col': 1, 'max-col': 1, 'return-empty': false};
    spreadsheet.getCells(1, opts, function(err, cells) {
      if (err) {
        console.log(err);
      }

      // Check if new highlight already exists in spreadsheet
      for (var i = 0; i < cells.length; i++) {
        if (newHash == cells[i].value) {
          console.log('Skipping highlight already in spreadsheet.')
          return context.succeed();
        }
      }

      // Add new highlight to spreadsheet
      var newRow = {
        quoteid: newHash,
        quotelink: e.link,
        quotetext: e.text,
        posttitle: e.post.title,
        postlink: e.post.link,
        postauthor: e.post.author.name,
        postauthorlink: e.post.author.link,
        postsitelink: e.post.siteLink,
        unixtimeutc: e.createdAt
      };
      spreadsheet.addRow(1, newRow, function(err) {
        if (err) {
          console.log(err);
          return context.fail(new Error('Error adding new row to spreadsheet'));
        }

        console.log('New highlight added to spreadsheet. Row ID ' + newHash);
        return context.succeed();
      });
    });
  });
};

// var snsObject = {
//   "text":"…the unexotic underclass can help address one of the biggest inefficiencies plaguing the startup scene right now: the flood of (ostensibly) smart, ambitious young people desperate to be entrepreneurs; and the embarrassingly idea-starved landscape where too many smart people are chasing too many dumb ideas…. The unexotic underclass has big problems, maybe not the Big Problems — capital B, capital P — that get ‘discussed’ at Davos. But they have problems nonetheless…",
//   "link":"http://medium.com/posts/3c07b307732d#2375",
//   "createdAt":1452633665205,
//   "post":{
//     "title":"The Reductive Seduction of Other People’s Problems",
//     "link":"http://medium.com/posts/3c07b307732d",
//     "author":{
//       "name":"Courtney Martin",
//       "link":"http://medium.com/@courtwrites"
//     },
//     "siteLink":"http://medium.com"
//   }
// };
//
// var context = {
//   fail: function(msg) {
//     console.log('Error: ' + msg);
//   },
//   succeed: function(msg) {
//     console.log(msg);
//   }
// };
//
// exports.handler(snsObject, context);
