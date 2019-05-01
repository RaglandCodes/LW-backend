// --------------- dependencies ----------

const express = require("express");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const request = require("request");
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

//getMeta("https://www.bbc.co.uk/news/world-africa-47913338");

let parser = new Parser();

function tryRegexMeta() {
  let URL =
    "https://www.thehindu.com/news/national/other-states/pragya-says-pendency-of-trial-does-not-bar-her-from-contesting-election/article26920453.ece?homepage=true";
  request(URL, function(error, response, body) {
    let tt = body;
    getAmpRegex
    let getAmpRegex = /<link[\s+]+rel=['"]amphtml['"][\s+]href=["'](.*)">/gi;
    tt = body.match(getAmpRegex);
    console.log(tt);

    tt = tt[0].replace(getAmpRegex, "$1");
    console.log(tt);

    fs.writeFileSync(path.join(__dirname, "./reg.txt"), body);
    if (error) {
      console.log(`${error} 👈 error in requestt`);
    }
    //console.log(body);
  });
} // end of tryRegexMeta

//tryRegexMeta();
// --------------- functions ----------
function stronger(weakTitle, description) {
  //const dangerPhrases = /- BBC News|– live|- video|– in pictures|– video|– as it happened|Morning digest:|What you need to know/gi;
  const removeFirst = /’s|’s|'s|’t|’t|'t/gi;
  //throught???
  const removeRegex = / on | his | you | very | what | can | news | over | country | about | was | in | this | as | by | after | into | how | they | say | says | said | its | from | but | it | would | which | a | an | the | why | your | will | her | he | have | has | so | with | for | we | at | to | be | if | that | than | of | are | and | is |:|-|–|—|, |‘|\s+|'|’|“|”/gi;
  const publishersNamesRegex = /BBC/gi;
  let strongTitle = weakTitle
    .concat(" ", description)
    .toLowerCase()
    .replace(removeFirst, " ")
    .replace(removeFirst, " ")
    .replace(publishersNamesRegex, " ")
    .replace(removeRegex, " ")
    .replace(removeRegex, " ")
    .replace(removeRegex, " ")
    .replace(removeRegex, " ")
    .replace(removeRegex, " ")
    .split(/\s+/);

  return [...new Set(strongTitle)].join(" ").trim();
}

function sanction(title) {
  const dangerPhrases = /– live|- video|– video|– in pictures|in pictures|– video|Morning digest:/gi;
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
        page[i].matchid == page[j].matchid &&
        page[i].matchid != 0 &&
        page[j].matchid != 0
      )
        continue;

      let t2 = page[j].strongTitle.split(/\s+/);

      let matches = t1.filter(v => -1 !== t2.indexOf(v));

      if (matches.length > 2) {
        console.log(
          page[i].title,
          "===",
          page[i].strongTitle,
          "= \n =",
          page[j].title,
          "===",
          page[j].strongTitle,
          "===",
          matches,
          " \n\n"
        );

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

    if (hoursPased > 72) return false;
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
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${
            source.id
          }&key=${process.env.YOUTUBE_API_KEY}`
        )
      );
    //console.log(`${JSON.stringify(videoSources)} 👈 videoSources`);
    axios
      .all(axiosVideoqueries)
      .then(
        axios.spread((...results) => {
          for (const result of results) {
            for (const item of result.data.items) {
              if (
                textData.filter(
                  word => word["videoID"] == item.snippet.resourceId.videoId
                ).length !== 0
              )
                continue;

              let newWord = {
                title: item.snippet.title,
                strongTitle: stronger(
                  item.snippet.title,
                  item.snippet.description
                ),
                videoID: item.snippet.resourceId.videoId,
                type: "video",
                publisher: item.snippet.channelTitle,
                date: item.snippet.publishedAt,
                uid: nanoid(4),
                matchid: 0
              };
              console.log(JSON.stringify(newWord));

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
      let exists = data.filter(w => word.title == w.title);
      //TODO use promises . all

      let sanctioned = sanction(word["title"]);

      if (
        exists.length == 0 &&
        sanctioned == true &&
        getTimePassedInMinutes(word.pubDate) < 4321
      ) {
        //console.log("new news title is", word.title, " from ", source.name);
        let metaData = await getMeta(word["link"]);

        let newWord = {
          title: word.title,
          strongTitle: stronger(word.title, metaData.description),
          url: word.link,
          ampURL: metaData.ampURL,
          description: metaData.description,
          image: metaData.image,
          date: word.pubDate,
          publisher: source.name,
          uid: nanoid(4),
          matchid: 0,
          type: "text"
        };
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
      console.log(`${error} <= This is the error`);
    });
}); // end of update

app.get("/show", (q, a) => {
  // This is called by the front end to get the data
  let fullData = fs
    .readFileSync(path.join(__dirname, "fullWorld.json"))
    .toString();
  a.send(selectData(fullData, q.query.off));
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
