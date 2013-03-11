
/**
 * GET tweets/:username
 */

// known error:
// /Users/patrickestabrook/Projects/Node.js Experiments/HaikuGen/routes/tweets.js:124
// 17:30:08 web.1  |         return line.map( function (word) {
// 17:30:08 web.1  |                     ^
// 17:30:08 web.1  | TypeError: Object false has no method 'map'

var Twit = require('twit');
var _    = require('underscore');
var Q    = require('q');

var T = new Twit({
    consumer_key:         'DgTV2IDAvVZys3aVSh9DQ'
  , consumer_secret:      'acQKysBsLDvKzdtJDgx4V59RAQoP0I4zNfBctQpk'
  , access_token:         '529484960-PfJyxHD52OKQhOVthE0u3TIU2pwDW2zlUAYIaUuP'
  , access_token_secret:  '1NVtGdsqhuxWT3flSJtBLcHILWy5s9QwtLz5q0jEg' 
});

var Twitter = {
  get_timeline: function(username) {
    var deferred = Q.defer();
    T.get('statuses/user_timeline', {screen_name: username}, function(err, reply) {
      if (err) {
        deferred.reject(err);
      }
      // What happens if there's no error, and yet no tweets?
      var tweets = reply.map(function(r) { return r.text });
      deferred.resolve(tweets);
    });
    return deferred.promise;
  }
};

function stripPunctuation(word) {
  // beginning of word (preserve hashtags and usernames)
  // end of word
  return word.replace(/^[^a-zA-Z#@]+\b/, '')  
             .replace(/\b[^a-zA-Z]+$/  , '');
}

function isInterestingWord(word) {
  return !(    word.match( /http/ )                     // URLs
            || word.match( /\b[b-df-hj-np-tv-z]+\b/i )   // all consonants
            || word.match( /#\b/ )                      // hash tags
            || word.match( /@\b/ )                      // usernames
            || word.match( /^[^a-zA-Z]+$/ )             // isn't all letters
            || word === ''                              // empty string
          );
}

function cleanupHaikuLine(wordsAndSyllables) {
  console.log(wordsAndSyllables);
  line = wordsAndSyllables.map(function(was) {
    return was[0];
  }).reduce(function(soFar, word) {
    return soFar + " " + word;
  });
  line = line.replace( /\bi\b/g, "I" );
  console.log("line --> ", line);
  return line.charAt(0).toUpperCase() + line.slice(1);
}

exports.haiku = function(req, res) {
  var username = req.params.username;

  var haiku = Twitter.get_timeline(username).then(function(tweets) {
    var wordsAndSyllables = _.chain(tweets).map(function(tweet) {
      return _(tweet.split(/[ -]/))
                    .map(function(s) { return s.toLowerCase(); })
                    .map(stripPunctuation)
    })
    .flatten()
    .uniq()
    .filter(isInterestingWord)
    .shuffle()
    .map(function(word) { return [word, numOfSyllables(word)] })
    .value();

    var firstLine = makeHaikuLine(wordsAndSyllables, 5);
    wordsAndSyllables = _.difference(wordsAndSyllables, firstLine);
    var secondLine = makeHaikuLine(wordsAndSyllables, 7);
    wordsAndSyllables = _.difference(wordsAndSyllables, secondLine);
    var thirdLine = makeHaikuLine(wordsAndSyllables, 5);
    return [firstLine, secondLine, thirdLine].map(cleanupHaikuLine);
  });

  haiku.then(function(lines) {
    console.log("We're trying to render something!");
    res.render("tweets.ejs", { 
      title: 'TWITTER HAIKU',
      haiku: lines
    });
  }).fail(function(err) {
    res.render("error.ejs", { 
      title: 'TWITTER HAIKU',
      error: err
    });
  });

  console.log("About to end the promise...");
};

/**
 * Helper functions
 */

// given a an array of words, make a Haiku line of the number of syllables provided
function makeHaikuLine( words, nSyllables ) {
  var line = _makeHaikuLine( words, nSyllables );
  return totalSyllables(line) === nSyllables ? line : false;
}

// helper function for makeHaikuLine()
function _makeHaikuLine( words, nSyllables ) {
  if ( nSyllables <= 0 || words.length === 0 ) return [];
  var word, attempt;
  for (var i = 0; i < words.length; i++) {
    word = words[i];
    attempt = [word].concat(_makeHaikuLine( words.slice( i + 1 ), nSyllables - word[1] ));
    if (totalSyllables(attempt) == nSyllables) {
      return attempt;
    }
  }
  return [];
}

// given an array of words like [ ["word",1], ["another",3] ] this returns the total number of syllables
function totalSyllables( words ) {
  var total = 0;
  for (var i=0; i < words.length; i++) {
    total += words[i][1];
  }
  return total;
}

// returns a guess of the number of syllables in a word
function numOfSyllables ( word ) {

  if (word.length <= 3) {
    return 1;
  }

  word = word.toLowerCase();

  word = word.replace(/(?:[^aeiouy]es|ed|[^aeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  var syllables = word.match(/[aeiouy]{1,2}/g);

  return syllables ? syllables.length : 0;
}
