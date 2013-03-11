
/**
 * GET tweets/:username
 */

// known error:
// /Users/patrickestabrook/Projects/Node.js Experiments/HaikuGen/routes/tweets.js:124
// 17:30:08 web.1  |         return line.map( function (word) {
// 17:30:08 web.1  |                     ^
// 17:30:08 web.1  | TypeError: Object false has no method 'map'

var Twit = require('twit');

var T = new Twit({
    consumer_key:         'DgTV2IDAvVZys3aVSh9DQ'
  , consumer_secret:      'acQKysBsLDvKzdtJDgx4V59RAQoP0I4zNfBctQpk'
  , access_token:         '529484960-PfJyxHD52OKQhOVthE0u3TIU2pwDW2zlUAYIaUuP'
  , access_token_secret:  '1NVtGdsqhuxWT3flSJtBLcHILWy5s9QwtLz5q0jEg' 
})

exports.haiku = function( req, res ) {

  var username = req.params.username;

  // use the twitter module to get the user's tweets
  T.get('statuses/user_timeline', { screen_name: username }, function( err, reply ) {

    try {

      var tweets    = []
        , wordArray = [];


      // test to see if user exists and has tweeted
      if ( !(reply && reply[0] )) {
        throw { name: "error", message: "something fuckin' happened!" + reply };
      }


      // fill `tweets` with the text from each tweet
      for ( var i = 0; i < reply.length; i++ ) {
        tweets.push( reply[i].text );
      }

      // fill `wordArray` with words from tweets
      tweets.forEach(function( tweet ) {

        // form an array of the words from a tweet
        tweet.split( /[ -]/ ).forEach(function( word ) { 

          // push each word onto the wordArray in lower case
          wordArray.push( word.toLowerCase() ); 
        }); 
      });

      // strip punctuation from beginning/end of word
      wordArray = wordArray.map(function( word ) {

        word = word.replace( /^[^a-zA-Z#@]+\b/, '' )  // beginning of word (preserve hashtags and usernames)
                   .replace( /\b[^a-zA-Z]+$/  , '' ); // end of word

        return word;
      });

      // filter out unwanted words: URLs, words of all consonants, etc.
      wordArray = wordArray.filter(function( word, index ) {
        
        return !(    word.match( /http/ )                     // URLs
                  || word.match( /\b[b-df-hj-np-tv-z]+\b/i )   // all consonants
                  || word.match( /#\b/ )                      // hash tags
                  || word.match( /@\b/ )                      // usernames
                  || word.match( /^[^a-zA-Z]+$/ )             // isn't all letters
                  || word === ''                              // empty string
                );
      });

      // remove duplicate words
      wordArray = wordArray.filter(function( elem, pos ) {
        return wordArray.indexOf(elem) === pos;
      });

      // shuffle the array to introduce randomness 
      wordArray = arrayShuffle( wordArray );

      // make wordArray into a 2D array of the form [ ["word1", numberOfSyllables], ["word2", numberOfSyllables] ]
      wordArray = wordArray.map(function( el ) {
        return [ el, numOfSyllables(el) ];
      });

      // this needs refactoring
      var haiku = [];

      haiku.push(makeHaikuLine( wordArray, 5 ));

      wordArray = arrayDifference ( wordArray, haiku[0] );

      haiku.push(makeHaikuLine( wordArray, 7 ));

      wordArray = arrayDifference ( wordArray, haiku[1] );

      haiku.push(makeHaikuLine( wordArray, 5 ));

      // `haiku` in its final form is an array of three strings representing the three lines
      // [ "line 1", "line 2", "line 3" ]
      haiku = haiku.map( function (line) {
        return line.map( function (word) {
          return word[0];
        }).join(' ');
      });

      // make the first character of each line upper case
      for (var i = 0; i < haiku.length; i++ ) {

        // make each word lower case unless it's "I"
        haiku[i] = haiku[i].replace( /\bi\b/g, "I" );

        // make the first character of each line upper case
        haiku[i] = haiku[i].charAt( 0 ).toUpperCase() + haiku[i].slice(1);
      }

      // render the view tweets.ejs
      res.render( "tweets.ejs", { title: 'TWITTER HAIKU', tweets: reply, name: username, haiku: haiku });
    }

    catch (e) {

        res.render( "error.ejs", { title: 'TWITTER HAIKU', error: e});
    }
  });
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

// returns the difference between two arrays
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

// A set up structures
// Easy dirty great was is
// Amazing functions
