
/**
 * GET tweets/:username
 */

var Twit = require('twit');

var T = new Twit( {
    consumer_key:         'DgTV2IDAvVZys3aVSh9DQ'
  , consumer_secret:      'acQKysBsLDvKzdtJDgx4V59RAQoP0I4zNfBctQpk'
  , access_token:         '529484960-PfJyxHD52OKQhOVthE0u3TIU2pwDW2zlUAYIaUuP'
  , access_token_secret:  '1NVtGdsqhuxWT3flSJtBLcHILWy5s9QwtLz5q0jEg'  
})

exports.haiku = function( req, res ) {
  
  var username = req.params.username;

  T.get('statuses/user_timeline', { screen_name: username }, function(err, reply) {

    var tweets = [];

    // array tweets contains the text of each tweet
    for ( var i = 0; i < reply.length; i++ ) {
      tweets.push( reply[i].text );
    }

    // this regexp matches strings of one or more characters [a-z],
    // effectively trimming off punctuation and hash tags and stuff
    var findWords = /([a-zA-Z']+)/g;
    var wordArray = [];

    // execute this for each tweet stored in `words`
    for ( var i = 0; i < tweets.length; i++ ) {

      thisTweetArray = tweets[i].match(findWords) 

      for (var j = 0; j < thisTweetArray.length; j++ ) {

        wordArray.push(thisTweetArray[j]);
      }
    }

    // remove duplicates
    wordArray = wordArray.filter(function(elem, pos) {
      return wordArray.indexOf(elem) === pos;
    });

    wordArray = arrayShuffle(wordArray);

    for ( var i = 0; i < wordArray.length; i++ ) {

      wordArray[i] = [ wordArray[i], numOfSyllables( wordArray[i]) ];
    }

    var haiku = [];

    haiku.push(makeHaikuLine( wordArray, 5 ));
    wordArray = arrayDifference ( wordArray, haiku[0] );
    haiku.push(makeHaikuLine( wordArray, 7 ));
    wordArray = arrayDifference ( wordArray, haiku[1] );
    haiku.push(makeHaikuLine( wordArray, 5 ));

    haiku = haiku.map( function (line) {
      return line.map( function (word) {
        return word[0];
      }).join(' ');
    });
    
    console.log( haiku );

    res.render( "tweets.ejs", { tweets: reply, name: username, haiku: haiku })
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