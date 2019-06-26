// --------------- dependencies ----------

const express = require("express");
const fs = require("fs");
const moment = require("moment");
const path = require("path");

const axios = require("axios");
const Parser = require("rss-parser");
const metafetch = require("metafetch");
const nanoid = require("nanoid");
//const graphql = require("graphql");
const graphqlHTTP = require("express-graphql");
const schema = require("./schema");
require("dotenv").config();
// --------------- initialisations ----------
const app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

let parser = new Parser();
const stopWords2 = [
  "a",
  "about",
  "above",
  "according",
  "across",
  "actually",
  "adj",
  "after",
  "afterwards",
  "again",
  "all",
  "almost",
  "along",
  "already",
  "also",
  "although",
  "always",
  "among",
  "amongst",
  "an",
  "am",
  "and",
  "another",
  "any",
  "anyhow",
  "anyone",
  "anything",
  "anywhere",
  "are",
  "aren",
  "aren't",
  "around",
  "as",
  "at",
  "be",
  "became",
  "because",
  "become",
  "becomes",
  "been",
  "beforehand",
  "begin",
  "being",
  "below",
  "beside",
  "besides",
  "between",
  "both",
  "but",
  "by",
  "can",
  "cannot",
  "can't",
  "caption",
  "co",
  "come",
  "could",
  "couldn",
  "couldn't",
  "did",
  "didn",
  "didn't",
  "do",
  "does",
  "doesn",
  "doesn't",
  "don",
  "don't",
  "down",
  "during",
  "each",
  "early",
  "eg",
  "either",
  "else",
  "elsewhere",
  "end",
  "ending",
  "enough",
  "etc",
  "even",
  "ever",
  "every",
  "everywhere",
  "except",
  "few",
  "for",
  "found",
  "from",
  "further",
  "had",
  "has",
  "hasn",
  "hasn't",
  "have",
  "haven",
  "haven't",
  "he",
  "hence",
  "her",
  "here",
  "hereafter",
  "hereby",
  "herein",
  "hereupon",
  "hers",
  "him",
  "his",
  "how",
  "however",
  "ie",
  "i.e.",
  "if",
  "in",
  "inc",
  "inc.",
  "indeed",
  "instead",
  "into",
  "is",
  "isn",
  "isn't",
  "it",
  "its",
  "itself",
  "last",
  "late",
  "later",
  "less",
  "let",
  "like",
  "likely",
  "ll",
  "ltd",
  "made",
  "make",
  "makes",
  "many",
  "may",
  "maybe",
  "me",
  "meantime",
  "meanwhile",
  "might",
  "miss",
  "more",
  "most",
  "mostly",
  "mr",
  "mrs",
  "much",
  "must",
  "my",
  "myself",
  "namely",
  "near",
  "neither",
  "never",
  "nevertheless",
  "new",
  "next",
  "no",
  "nobody",
  "non",
  "none",
  "nonetheless",
  "noone",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "often",
  "on",
  "once",
  "only",
  "onto",
  "or",
  "other",
  "others",
  "otherwise",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "per",
  "perhaps",
  "rather",
  "re",
  "said",
  "same",
  "say",
  "seem",
  "seemed",
  "seeming",
  "seems",
  "several",
  "she",
  "should",
  "shouldn",
  "shouldn't",
  "since",
  "so",
  "some",
  "still",
  "stop",
  "such",
  "taking",
  "ten",
  "than",
  "that",
  "the",
  "their",
  "them",
  "themselves",
  "then",
  "thence",
  "there",
  "thereafter",
  "thereby",
  "therefore",
  "therein",
  "thereupon",
  "these",
  "they",
  "this",
  "those",
  "though",
  "thousand",
  "through",
  "throughout",
  "thru",
  "thus",
  "to",
  "together",
  "too",
  "toward",
  "towards",
  "under",
  "unless",
  "unlike",
  "unlikely",
  "until",
  "up",
  "upon",
  "us",
  "use",
  "used",
  "using",
  "ve",
  "very",
  "via",
  "was",
  "wasn",
  "we",
  "well",
  "were",
  "weren",
  "weren't",
  "what",
  "whatever",
  "when",
  "whence",
  "whenever",
  "where",
  "whereafter",
  "whereas",
  "whereby",
  "wherein",
  "whereupon",
  "wherever",
  "whether",
  "which",
  "while",
  "whither",
  "who",
  "whoever",
  "whole",
  "whom",
  "whomever",
  "whose",
  "why",
  "will",
  "with",
  "within",
  "without",
  "won",
  "would",
  "wouldn",
  "wouldn't",
  "yes",
  "yet",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves"
];

// const stopWords = [
//   " a ",
//   " about ",
//   " above ",
//   " according ",
//   " across ",
//   "  actually ",
//   "  adj ",
//   " after ",
//   " afterwards ",
//   " again  ",
//   " all  ",
//   " almost ",
//   " along ",
//   " already ",
//   " also ",
//   " although ",
//   " always ",
//   " among ",
//   " amongst ",
//   " an ",
//   " am ",
//   " and ",
//   " another ",
//   " any ",
//   " anyhow ",
//   " anyone ",
//   " anything ",
//   " anywhere ",
//   " are ",
//   " aren ",
//   " aren't ",
//   " around ",
//   " as ",
//   " at ",
//   " be ",
//   " became ",
//   " because ",
//   " become ",
//   " becomes ",
//   " been ",
//   " beforehand ",
//   " begin ",
//   " being ",
//   " below ",
//   " beside ",
//   " besides ",
//   " between ",
//   " both ",
//   " but ",
//   " by ",
//   " can ",
//   " cannot ",
//   " can't ",
//   " caption ",
//   " co ",
//   " come ",
//   " could ",
//   " couldn ",
//   " couldn't ",
//   " did ",
//   " didn ",
//   " didn't ",
//   " do ",
//   " does ",
//   " doesn ",
//   " doesn't ",
//   " don ",
//   " don't ",
//   " down ",
//   " during ",
//   " each ",
//   " early ",
//   " eg ",
//   " either ",
//   " else ",
//   " elsewhere ",
//   " end ",
//   " ending ",
//   " enough ",
//   " etc ",
//   " even ",
//   " ever ",
//   " every ",
//   " everywhere ",
//   " except ",
//   " few ",
//   " for ",
//   " found ",
//   " from ",
//   " further ",
//   " had ",
//   " has ",
//   " hasn ",
//   " hasn't ",
//   " have ",
//   " haven ",
//   " haven't ",
//   " he ",
//   " hence ",
//   " her ",
//   " here ",
//   " hereafter ",
//   " hereby ",
//   " herein ",
//   " hereupon ",
//   " hers ",
//   " him ",
//   " his ",
//   " how ",
//   " however ",
//   " ie ",
//   " i.e. ",
//   " if ",
//   " in ",
//   " inc ",
//   " inc. ",
//   " indeed ",
//   " instead ",
//   " into ",
//   " is ",
//   " isn ",
//   " isn't ",
//   " it ",
//   " its ",
//   " itself ",
//   " last ",
//   " late ",
//   " later ",
//   " less ",
//   " let ",
//   " like ",
//   " likely ",
//   " ll ",
//   " ltd ",
//   " made ",
//   " make ",
//   " makes ",
//   " many ",
//   " may ",
//   " maybe ",
//   " me ",
//   " meantime ",
//   " meanwhile ",
//   " might ",
//   " miss ",
//   " more ",
//   " most ",
//   " mostly ",
//   " mr ",
//   " mrs ",
//   " much ",
//   " must ",
//   " my ",
//   " myself ",
//   " namely ",
//   " near ",
//   " neither ",
//   " never ",
//   " nevertheless ",
//   " new ",
//   " next ",
//   " no ",
//   " nobody ",
//   " non ",
//   " none ",
//   " nonetheless ",
//   " noone ",
//   " nor ",
//   " not ",
//   " now ",
//   " of ",
//   " off ",
//   " often ",
//   " on ",
//   " once ",
//   " only ",
//   " onto ",
//   " or ",
//   " other ",
//   " others ",
//   " otherwise ",
//   " our ",
//   " ours ",
//   " ourselves ",
//   " out ",
//   " over ",
//   " own ",
//   " per ",
//   " perhaps ",
//   " rather ",
//   " re ",
//   " said ",
//   " same ",
//   " say ",
//   " seem ",
//   " seemed ",
//   " seeming ",
//   " seems ",
//   " several ",
//   " she ",
//   " should ",
//   " shouldn ",
//   " shouldn't ",
//   " since ",
//   " so ",
//   " some ",
//   " still ",
//   " stop ",
//   " such ",
//   " taking ",
//   " ten ",
//   " than ",
//   " that ",
//   " the ",
//   " their ",
//   " them ",
//   " themselves ",
//   " then ",
//   " thence ",
//   " there ",
//   " thereafter ",
//   " thereby ",
//   " therefore ",
//   " therein ",
//   " thereupon ",
//   " these ",
//   " they ",
//   " this ",
//   " those ",
//   " though ",
//   " thousand ",
//   " through ",
//   " throughout ",
//   " thru ",
//   " thus ",
//   " to ",
//   " together ",
//   " too ",
//   " toward ",
//   " towards ",
//   " under ",
//   " unless ",
//   " unlike ",
//   " unlikely ",
//   " until ",
//   " up ",
//   " upon ",
//   " us ",
//   " use ",
//   " used ",
//   " using ",
//   " ve ",
//   " very ",
//   " via ",
//   " was ",
//   " wasn ",
//   " we ",
//   " well ",
//   " were ",
//   " weren ",
//   " weren't ",
//   " what ",
//   " whatever ",
//   " when ",
//   " whence ",
//   " whenever ",
//   " where ",
//   " whereafter ",
//   " whereas ",
//   " whereby ",
//   " wherein ",
//   " whereupon ",
//   " wherever ",
//   " whether ",
//   " which ",
//   " while ",
//   " whither ",
//   " who ",
//   " whoever ",
//   " whole ",
//   " whom ",
//   " whomever ",
//   " whose ",
//   " why ",
//   " will ",
//   " with ",
//   " within ",
//   " without ",
//   " won ",
//   " would ",
//   " wouldn ",
//   " wouldn't ",
//   " yes ",
//   " yet ",
//   " you ",
//   " your ",
//   " yours ",
//   " yourself ",
//   " yourselves"
// ];
// --------------- functions ----------

function stronger2(weakTitle, description, type) {
  if (type == "video") {
    let testRegex = /https?:\//i;

    description = description
      .split("\n\n")
      .filter(paragraph => {
        return !testRegex.test(paragraph) && paragraph.length > 20;
      })
      .join(" ");

    if (description.split(" ").length > 17) {
      description = description.split(" ");
      description.splice(17);
      description = description.join(" ");
    }

    console.log("in strong video");
  } // end of if (type == "video")
  const removeFirst = /’s|’s|'s|’t|\.|’t|\||'t/gi;
  const removeRegex = / year | years | 2019 | 2020 | news |  country | want|:|-|–|—|, |‘|\s+|'|’|“|”| /gi;
  const publishersNamesRegex = /BBC/gi;
  const toSingleWord = [
    "prime minister",
    "donald trump",
    "us president",
    "middle east"
  ];

  let strongTitle = " "
    .concat(weakTitle, " ", description, " ")
    .toLowerCase()
    .replace(removeFirst, " ")
    .replace(publishersNamesRegex, " ")
    .replace(removeRegex, " ");

  strongTitle = strongTitle
    .split(/\s+/)
    .filter(w => w.length > 1 && stopWords2.indexOf(w) === -1)
    .join(" ");

  for (const word of toSingleWord) {
    // if (strongTitle.indexOf(word) === -1) continue;
    // else
    strongTitle = strongTitle.replace(word, word.split(" ").join(""));
  }

  // console.log(strongTitle, "\n\n");

  return strongTitle;
}

// function stronger(weakTitle, description, type) {
//   //const dangerPhrases = /- BBC News|– live|- video|– in pictures|– video|– as it happened|Morning digest:|What you need to know/gi;
//   if (type == "video") {
//     let testRegex = /https?:\//i;

//     description = description
//       .split("\n\n")
//       .filter(paragraph => {
//         return !testRegex.test(paragraph) && paragraph.length > 20;
//       })
//       .join(" ");

//     if (description.split(" ").length > 17) {
//       description = description.split(" ");
//       description.splice(17);
//       description = description.join(" ");
//     }

//     console.log("in strong video");
//     const toSingleWord = [
//       "prime minister",
//       "donald trump",
//       "us president",
//       "middle east"
//     ];
//   } // end of if (type == "video")

//   const removeFirst = /’s|’s|'s|’t|\.|’t|\||'t/gi;
//   // TODO check for alphabets . don't allow number or symbol
//   // don't allow single word
//   const toSingleWord = [
//     "prime minister",
//     "donald trump",
//     "us president",
//     "middle east"
//   ];
//   const removeRegex = / on | his | him | while | or | you | were | year | years | 2019 | 2020 | very | what | can | news | over | country | more | want| about | was | in | this | as | by | after | into | there | how | they | say | says | said | its | from | who | but | it | would | which | a | an | the | why | your | our | will | her | he | have | has | so | with | for | we | at | to | be | if | that | than | of | are | and | is |:|-|–|—|, |‘|\s+|'|’|“|”| /gi;
//   const stopWordsRe = new RegExp(stopWords.join("|"), "ig");

//   // console.log(removeRegex);
//   // console.log(stopWordsRe);

//   const publishersNamesRegex = /BBC/gi;

//   let strongTitle = " "
//     .concat(weakTitle)
//     .concat(" ", description, " ")
//     .toLowerCase()
//     .replace(removeFirst, " ")
//     .replace(removeFirst, " ")
//     .replace(publishersNamesRegex, " ")
//     .replace(stopWordsRe, " ")
//     .replace(stopWordsRe, " ")
//     .replace(removeRegex, " ")
//     .replace(removeRegex, " ")
//     .replace(removeRegex, " ")
//     .replace(removeRegex, " ")
//     .replace(removeRegex, " ")
//     .replace(stopWordsRe, " ")
//     .replace(stopWordsRe, " ")
//     .replace(stopWordsRe, " ")
//     .replace(stopWordsRe, " ")
//     .replace(stopWordsRe, " ")
//     .replace(stopWordsRe, " ")
//     .split(/\s+/);

//   strongTitle = [...new Set(strongTitle)].join(" ").trim();

//   for (const word of toSingleWord) {
//     // if (strongTitle.indexOf(word) === -1) continue;
//     // else
//     strongTitle = strongTitle.replace(word, word.split(" ").join(""));
//   }

//   return strongTitle;
// }

function sanction(title) {
  const dangerPhrases = /– live|Top stories of the day:|– live|- video|– video|Morning mail:|– in pictures|in pictures|US briefing|US briefing:|– video|– politics live|– live updates|- live|Morning digest:|– politics live/gi;
  if (title.search(dangerPhrases) !== -1) {
    console.log(`${title} 👈 will not be published`);

    return false;
  }
  return true;
}

function getMeta(linkURL) {
  return new Promise((resolve, reject) => {
    metafetch.fetch(
      linkURL,
      {
        flags: {
          images: false,
          language: false,
          title: false,
          links: false,
          charset: false,
          headers: false,
          siteName: false,
          type: false,
          meta: false,
          uri: false
        }
      },
      (err, meta) => {
        //fs.writeFileSync(path.join(__dirname, "./try.json"), JSON.stringify(meta))
        if (err == null) {
          resolve({
            ampURL: meta.ampURL,
            description: meta.description,
            image: meta.image
          });
        } else {
          resolve({
            ampURL: undefined,
            description: undefined,
            image: undefined
          });
          console.log(`${err} 👈 error in meta. Resolved undefined`);
        }
      }
    ); // end of fetch
  }); // end of return new promise
} // end of function getMeta

function liason(page) {
  console.log("in liason");

  // //Matches articles with 3 matching words
  for (var i = 0; i < page.length; i++) {
    let t1 = page[i].strongTitle.split(/\s+/);

    for (let j = i + 1; j < page.length; j++) {
      if (
        (page[i].matchid == page[j].matchid &&
          page[i].matchid != 0 &&
          page[j].matchid != 0) ||
        (page[i].type == "video" && page[j].type == "video")
      ) {
        // testing bracket
        let t2 = page[j].strongTitle.split(/\s+/);
        let matches = t1.filter(v => -1 !== t2.indexOf(v));

        if (
          page[i].matchid == page[j].matchid &&
          page[i].matchid != 0 &&
          matches.length > 2
        )
          console.log(matches);

        continue;
      } // end of testing bracket

      let t2 = page[j].strongTitle.split(/\s+/);

      let matches = t1.filter(v => -1 !== t2.indexOf(v));
      //console.log(`${t1} == ${t2} 👈 TT12`);

      if (matches.length > 2) {
        // console.log(
        //   page[i].title,
        //   "===",
        //   page[i].strongTitle,
        //   "= \n =",
        //   page[j].title,
        //   "===",
        //   page[j].strongTitle,
        //   "===",
        //   matches,
        //   " \n\n"
        // );

        console.log(matches);
        if (page[j].matchid != 0 && page[i].matchid == 0) {
          page[i].matchid = page[j].matchid;
        } else if (page[i].matchid == 0 && page[j].matchid == 0) {
          page[i].matchid = nanoid(5);
          page[j].matchid = page[i].matchid;
        } else if (page[i].matchid != 0 && page[j].matchid == 0) {
          page[j].matchid = page[i].matchid;
        } else {
        }
      }
    } // end of j loop
  } //end of i loop

  return page;
}

function getTimePassedInMinutes(date) {
  return (moment(moment().format()) - moment(date)) / (1000 * 60);
}
function removeOldItems(oldPage) {
  let newPage = oldPage.filter(word => {
    let hoursPased =
      (moment(moment().format()) - moment(word["date"])) / (1000 * 60 * 60);

    if (hoursPased > 50) return false;
    else if (word.matchid == 0 && hoursPased > 24) return false;
    else if (word.matchid != 1) return true;
    else if (hoursPased < 24) return true;
    else console.log(`!!!⚠!!${word.matchid}   ${hoursPased}   ${word.title}`);
  });
  // TODO remove unmatched video items
  console.log(`old page is this big => ${oldPage.length}`);
  console.log(`new page is this big => ${newPage.length}`);
  return newPage;
}

//function addInformation(page) {} // end of function addInformation

function selectData(fullData, offString) {
  if (offString == undefined) {
    return fullData;
  }

  let offArray = offString.toLowerCase().split("andand");

  fullData = JSON.parse(fullData);

  let likedData = fullData
    .filter(word => {
      let splitTitle = word["strongTitle"].toLowerCase().split(" ");
      if (splitTitle.filter(v => -1 !== offArray.indexOf(v)).length == 0)
        return true;
    })
    .map(w => {
      w["minutesPassed"] = getTimePassedInMinutes(w.date);
      return w;
    })
    .sort((a, b) => a["minutesPassed"] - b["minutesPassed"]);

  return likedData;
}

function addVideos(textData, info) {
  const topic = "world"; // for now
  info = JSON.parse(info);

  return new Promise((resolve, reject) => {
    let axiosVideoqueries = info
      .filter(
        source => source["type"] === "video" && source["domain"] === topic
      )
      .map(source =>
        axios.get(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=3&playlistId=${
            source.id
          }&key=${process.env.YOUTUBE_API_KEY}`
        )
      );

    axios
      .all(axiosVideoqueries)
      .then(
        axios.spread((...results) => {
          for (const result of results) {
            for (const item of result.data.items) {
              if (
                textData.filter(
                  word => word["uid"] == item.snippet.resourceId.videoId
                ).length !== 0
              )
                continue;

              let newWord = {
                title: item.snippet.title,
                strongTitle: stronger2(
                  item.snippet.title,
                  item.snippet.description,
                  "video"
                ),
                uid: item.snippet.resourceId.videoId,
                type: "video",
                publisher: item.snippet.channelTitle,
                date: item.snippet.publishedAt,
                description: item.snippet.description,
                //uid: nanoid(4),
                matchid: 0
              };
              //console.log(JSON.stringify(newWord));

              textData.push(newWord);
            } // end of for item loop
          }
        })
      )
      .then(a => {
        resolve(textData);
      })

      .catch(error => console.log(`axios YouTube API error ${error}`));
  }); // end of return new Promise
} // end of function addVideos

async function refresh(info, data) {
  // function to add the new news stories to the database
  data = JSON.parse(data);
  info = JSON.parse(info).filter(word => word["type"] === "text");

  console.log(`${data.length} <== old data.length`);

  console.log("Refreshing!!!");

  for (const source of info) {
    console.log(`Refreshing!!! ${source["name"]}`);

    //    let newPage = [];
    let feed = await parser.parseURL(source.rssLink);

    for (const word of feed.items) {
      let titleExists = data.filter(w => word.title == w.title);
      let urlExists = data.filter(w => word.url == w.url);
      //TODO use promises . all

      let sanctioned = sanction(word["title"]);

      if (
        titleExists.length == 0 &&
        urlExists.length == 0 &&
        sanctioned == true &&
        getTimePassedInMinutes(word.pubDate) < 4321
      ) {
        //console.log("new news title is", word.title, " from ", source.name);
        let metaData = await getMeta(word["link"]);
        let newWord = {
          title: word.title,
          strongTitle: stronger2(word.title, metaData.description),
          url: word.link,
          ampURL: metaData.ampURL == undefined ? word.link : metaData.ampURL,
          description:
            metaData.description == undefined ? "" : metaData.description,
          image: metaData.image,
          date: word.pubDate,
          publisher: source.name,
          uid: nanoid(4),
          matchid: 0,
          type: "text"
        };

        if (metaData.ampURL == undefined) {
          console.log("found undefined AMP link", " ", word.title);
        }
        data.push(newWord);
      } else {
      }
    } // end of for word of items
    //source["newsItems"] = source["newsItems"].concat(newPage);
    //console.log("newPage.length = ", newPage.length);
  } // end of for source of data
  console.log(`${data.length} <== new data.length`);
  return data;
}

// --------------- get requests ----------
app.get("/", (q, a) => {
  a.send("HELLO!!!");
});

//app.get();
app.get("/update", (q, a) => {
  // This function gets called every 30 minutes by  https://cron-job.org
  a.send("K");
  console.time("Update");
  const worldInfo = fs.readFileSync(path.join(__dirname, "./worldInfo.json"));
  // TODO make that ⬆ const
  //console.log(`${typeof(worldInfo)} 👈 winfo`);

  let worldData = fs.readFileSync(path.join(__dirname, "./fullWorld.json"));

  refresh(worldInfo, worldData)
    //.then(sparsePage => addInformation(sparsePage))
    .then(textData => addVideos(textData, worldInfo))
    .then(newData => liason(newData))
    .then(liasonedData => removeOldItems(liasonedData))

    .then(newData => {
      fs.writeFileSync(
        path.join(__dirname, "./fullWorld.json"),
        JSON.stringify(newData)
      );
      console.log("returned");
      console.timeEnd("Update");
    })
    .catch(error => {
      console.log(`${error} <= This is the refresh error`);
    });
}); // end of update

app.get("/show", (q, a) => {
  // This can be used by developers to look at all the available data
  //The front-end uses graphql
  let fullData = fs
    .readFileSync(path.join(__dirname, "fullWorld.json"))
    .toString();

  a.send(fullData);
  //a.send(selectData(fullData, q.query.off));
}); // end of GET show

app.get("/show_matches", (q, a) => {
  let fullData = fs.readFileSync(path.join(__dirname, "fullWorld.json"));

  fullData = JSON.parse(fullData);
  let matchids = fullData.map(word => word["matchid"]);
  matchids = [...new Set(matchids)];
  console.log(`${matchids} 👈 matchids`);

  let response = [];

  for (const id of matchids) {
    if (id == 0) continue;
    response = response.concat(fullData.filter(word => word["matchid"] == id));
  }

  a.send(response);
  console.log(`${response.length} 👈`);
}); // end of GET show

app.listen(2345, () => {
  console.log("👂 @ port 2345");
});

/*  
This exists for delpoying in glitch.com
Check it out @ glitch => https://glitch.com/~lw-back
-✂----------

const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  });
//*/
