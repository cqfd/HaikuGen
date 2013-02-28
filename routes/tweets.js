
/**
 * GET tweets/:username
 */

// initialize our twitter module
var Twit = require('twit');

var T = new Twit( {
    consumer_key:         'DgTV2IDAvVZys3aVSh9DQ'
  , consumer_secret:      'acQKysBsLDvKzdtJDgx4V59RAQoP0I4zNfBctQpk'
  , access_token:         '529484960-PfJyxHD52OKQhOVthE0u3TIU2pwDW2zlUAYIaUuP'
  , access_token_secret:  '1NVtGdsqhuxWT3flSJtBLcHILWy5s9QwtLz5q0jEg'  
})

// this runs when we call app.get('/tweets/:username', tweets.haiku); from app.js
exports.haiku = function( req, res ) {
  
  // get the username from the URL
  var username = req.params.username;

  // use the twitter module to get the user's tweets
  T.get('statuses/user_timeline', { screen_name: username }, function( err, reply ) {

    if (reply) {

      var tweets = [];

      // reply is a JSON object in the form on an array of tweets

      // tweets is an array containing the text of each tweet
      // [ "tweet 1 text", "tweet 2 text", ... ]
      for ( var i = 0; i < reply.length; i++ ) {
        tweets.push( reply[i].text );
      }

      // this regexp matches strings of one or more characters [a-z],
      // effectively trimming off punctuation and hash tags and stuff
      var removePunctuation = /([#@a-zA-Z']+)/g;
      var urlString = /http/;

      // thisTweetArray will store the words in a given tweet as words in an array
      // wordArray contains an array of the words found in all tweets
      var thisTweetArray = []
        , wordArray      = []
        , strippedDownWord;

      // execute this for each tweet stored in `words`
      for ( var i = 0; i < tweets.length; i++ ) {

        thisTweetArray = tweets[i].split(' ');

        for (var j = 0; j < thisTweetArray.length; j++ ) {

          // if the current word isn't a URL, strip off unwanted punctuation
          if (!thisTweetArray[j].match( urlString )) {

            // this operation can yield two words if they are separated by a "-" or
            // other unwanted punctuation
            strippedDownWord = thisTweetArray[j].match( removePunctuation );
          }

          // now strippedDownWord is either null or an array of one or more items
          if ( strippedDownWord ) {
            
            for (var k = 0; k < strippedDownWord.length; k++ ) {

              wordArray.push( strippedDownWord[k] );
            }
          }
        }
      }

      // remove duplicate words
      wordArray = wordArray.filter(function(elem, pos) {
        return wordArray.indexOf(elem) === pos;
      });

      // filter out words that have only consonants and hash tags and other usernames
      
      console.log(wordArray);

      wordArray = removeNonWords( wordArray );

      console.log(wordArray);

      // shuffle the array to introduce randomness 
      wordArray = arrayShuffle(wordArray);

      // make wordArray into a 2D array of the form 
      // [ ["word1", numberOfSyllables], ["word2", numberOfSyllables] ]
      for ( var i = 0; i < wordArray.length; i++ ) {

        wordArray[i] = [ wordArray[i], numOfSyllables( wordArray[i]) ];
      }

      // this needs refactoring
      var haiku = [];

      // form the first haiku line
      haiku.push(makeHaikuLine( wordArray, 5 ));

      // remove the words used to form that line from wordArray
      wordArray = arrayDifference ( wordArray, haiku[0] );

      // form the second haiku line
      haiku.push(makeHaikuLine( wordArray, 7 ));

      // remove the words used to form that line from wordArray
      wordArray = arrayDifference ( wordArray, haiku[1] );

      // form the third and last haiku line
      haiku.push(makeHaikuLine( wordArray, 5 ));

      // `haiku` in its final form is an array of three strings representing the three lines
      // [ "line 1", "line 2", "line 3" ]
      haiku = haiku.map( function (line) {
        return line.map( function (word) {
          return word[0];
        }).join(' ');
      });

      for (var i = 0; i < haiku.length; i++ ) {

        haiku[i] = haiku[i].toLowerCase();

        haiku[i] = haiku[i].charAt( 0 ).toUpperCase() + haiku[i].slice(1);

      }

      // render the view tweets.ejs
      res.render( "tweets.ejs", { title: 'TWITTER HAIKU', tweets: reply, name: username, haiku: haiku })
    }
    else {
      res.render( "error.ejs", { title: 'TWITTER HAIKU'});
    }
  });
}

/**
 * Helper functions
 */

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

// given an array of words like [ ["word",1], ["another",3] ] this returns the total number of syllables
function totalSyllables( words ) {
  var total = 0;
  for (var i=0; i < words.length; i++) {
    total += words[i][1];
  }
  return total;
}

// helper function for makeHaikuLine() 
function _makeHaikuLine( words, nSyllables ) {
  if (nSyllables <= 0 || words.length === 0) return [];
 
  var word, attempt;
 
  for (var i=0; i < words.length; i++) {

    word = words[i];

    attempt = [word].concat(_makeHaikuLine( words.slice( i + 1 ), nSyllables - word[1] ));

    if (totalSyllables(attempt) == nSyllables) {
      return attempt;
    }
  }
  return [];
}
 
// given a an array of words, make a Haiku line of the number of syllables provided
function makeHaikuLine( words, nSyllables ) {
  var line = _makeHaikuLine( words, nSyllables );
  return totalSyllables(line) === nSyllables ? line : false;
}

// attempts to remove non-words from an array of words
function removeNonWords( words ) {

  var allConsonants = /\b[b-df-hj-np-tv-z]+\b/
    , returnArr = [];

  for ( var i = 0; i < words.length; i++ ) {

    // if a word is all consonants, remove it
    if ( !words[i].toLowerCase().match( allConsonants ) 
      && !words[i].match( /^#/ )
      && !words[i].match( /^@/ )
      ) {
      
      returnArr.push( words[i] );
    }
  }

  return returnArr;
}

// returns the difference between two arrays
// e.g. arrayDifference( [1,2,3,4], [3,4] ) returns [1,2]
function arrayDifference ( arr1, arr2 ) {
  return arr1.filter(function( elArr1 ) {
    return !(arr2.indexOf( elArr1 ) > -1);
  });
}

// shuffles elements in an array
function arrayShuffle( arr ) {

    var j, x, i = arr.length

    for( ; i !== 0;) {

      // j is random between 0 and arr.length, and then arr.length-1 and so on
      j = parseInt( Math.random() * i );

      // x is element at arr[i-1]
      // then i--
      x = arr[--i];

      // set arr[i] to be random element
      arr[i] = arr[j];

      // 
      arr[j] = x;
    }
    return arr;
};