// --------------- dependencies ----------

const express = require("express");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const bodyParser = require('body-parser');
const axios = require("axios");
const Parser = require("rss-parser");
const metafetch = require("metafetch");
const nanoid = require("nanoid");
//const graphql = require("graphql");
const graphqlHTTP = require("express-graphql");
const schema = require("./schema");

let messengerFunctions = require('./messengerFunctions.js');
let stopWords2 = require("./stopWords.js")
stopWords2 = stopWords2.sw;
require("dotenv").config();
// --------------- initialisations ----------
const app = express().use(bodyParser.json());
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

// --------------- functions ----------

function stronger2(weakTitle, description, type, domain) {
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

  } // end of if (type == "video")
  const removeFirst = /’s|’s|\(|\)|'s|’t|\.|’t|\||'t|-/gi;
  const removeRegex = / year | sunday | monday | thursday | july | years | week | weeks | 2019 | 2020 | one | two | news | old | company | set | country | countries | anti | man | woman | want |tnw basics|:|-|–|—|, |‘|\s+|'|’|“|”/gi;
  const publishersNamesRegex = /BBC|Wall Street Journal/gi;
  const toSingleWord = [
    "prime minister",
    "donald trump",
    "ivanka trump",
    "us president",
    "russian president",
    "middle east",
    "north korea",
    "world cup",
    "world leaders",
    "scott morrison",
    "vladimir putin ",
    "security forces",
    "narendra modi",
    "jeremy hunt",
    "theresa may",
    "boris johnson",
    "sri lanka",
    "social media",
    "app store",
    "mac pro",
    "apple music",
    "apple watch",
    "chief executive",
    "tim cook"
  ];
  
 


  // remove days and months???
  //remove numbers??  TODO
  let strongTitle = " "
    .concat(weakTitle, " ", description, " ")
    .toLowerCase()
    .replace(removeFirst, " ")
    .replace(publishersNamesRegex, " ")
    .replace(removeRegex, " ")
    .replace(removeRegex, " ");

  for (const word of toSingleWord) {
    // if (strongTitle.indexOf(word) === -1) continue;
    // else
    strongTitle = strongTitle.replace(word, word.split(" ").join(""));
  }

  strongTitle = strongTitle
    .split(/\s+/)
    .filter(w => w.length > 1 && stopWords2.indexOf(w) === -1);
  strongTitle = [...new Set(strongTitle)].join(" ");

  return strongTitle;
}

console.log(
  stronger2(
    "Global gag rule linked to abortion rise in African countries that accept US aid",
    "Study finds Trump-backed policy weeks ago led to increase in pregnancies and reduction in use of modern contraceptives"
  )
);

function sanction(title, domain) {

  if(domain === 'tech')
  {
    if(title.indexOf("$") !== -1)
    {
      console.log(`${title} 👈 shall we delete`);
      
    }
  }
  const dangerPhrases = /– live|Dealmaster:|Deal:Deals:|CHEAP:|– podcast|– podcast|AppleInsider Podcast|Top stories of the day:|– live|- video|– video|Morning mail:|– in pictures|briefing:|in pictures|US briefing|US briefing:|– video|– politics live|– live updates|- live|Morning digest:|– politics live/gi;
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
          console.log(matches, "=>", page[i].title, "=", page[j].title);

        continue;
      } // end of testing bracket

      let t2 = page[j].strongTitle.split(/\s+/);

      let matches = t1.filter(v => -1 !== t2.indexOf(v));
      //console.log(`${t1} == ${t2} 👈 TT12`);

      if (matches.length > 2) {
        console.log(matches, "=>", page[i].title, "=", page[j].title);
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
    // TODO make to 72
    if (hoursPased > 35) return false;
    else if (word.matchid == 0 && hoursPased > 24) return false;
    else if (word.matchid != 1) return true;
    else if (hoursPased < 24) return true;
    else console.log(`!!!⚠!!${word.matchid}   ${hoursPased}   ${word.title}`);
  });
  // TODO remove unmatched video items
  console.log(`\n\nold page is this big => ${oldPage.length}`);
  console.log(`new page is this big => ${newPage.length}\n\n`);
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

function addVideos(textData, info, topic) {
  //const topic = "world"; // for now
  info = JSON.parse(info);

  return new Promise((resolve, reject) => {
    let axiosVideoqueries = info
      .filter(
        source => source["type"] === "video" && source["domain"] === topic
      )
      .map(source =>
        axios.get(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=9&playlistId=${
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

async function refresh(info, data, domain) {
  // function to add the new news stories to the database
  data = JSON.parse(data);
  info = JSON.parse(info).filter(word => word["type"] === "text");

  console.log(`${data.length} <== old data.length`);

  console.log("Refreshing!!!");

  for (const source of info) {
    if (source["domain"] !== domain) continue; // BOMB
    console.log(`Refreshing!!! ${source["name"]}`);

    //    let newPage = [];
    let feed = await parser.parseURL(source.rssLink);
    if (!feed) {
      console.log("undefined feed ⁉");
    }
    for (const word of feed.items) {
      let titleExists = data.filter(w => word.title == w.title);
      let urlExists = data.filter(w => word.link == w.url);
      //TODO use promises . all

      let sanctioned = sanction(word["title"], source['domain']);

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
          strongTitle: stronger2(
            word.title,
            metaData.description,
            "text",
            source["domain"]
          ),
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
// --------------- POST requests ----------

app.post('/webhook', (q, a) => {
  let body = q.body;
  const VERIFY_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  if(body.object === 'page'){
    body.entry.forEach((entry) => {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;
      console.log(`${sender_psid} 👈 sender psid`);
      console.log(`${JSON.stringify(webhook_event)} 👈 webhook_event`);

      if(webhook_event.message){
        messengerFunctions.handleMessage(sender_psid, webhook_event.message);
      }
      else if(webhook_event.postback){
        messengerFunctions.handlePostback(sender_psid, webhook_event.postback)
      }
    })

    a.status(200).send('EVENT_RECD');
  }else{
    a.sendStatus(404);
  }
})

// --------------- GET requests ----------
app.get("/", (q, a) => {
  a.send("HELLO!!!");
});

app.get('/webhook', (req, res) => {
// copyied from https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup
  let VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;
    
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);      
    }
  }
});

app.get("/update", (q, a) => {
  // This function gets called every 30 minutes by  https://cron-job.org
  a.send("K");
  console.time("Update");
  const sourceInfo = fs.readFileSync(path.join(__dirname, "./worldInfo.json"));
  // TODO make that ⬆ const
  //console.log(`${typeof(worldInfo)} 👈 winfo`);

  let worldData = fs.readFileSync(path.join(__dirname, "./fullWorld.json"));
  refresh(sourceInfo, worldData, "world")
    //.then(sparsePage => addInformation(sparsePage))
    .then(textData => addVideos(textData, sourceInfo, "world"))
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
    .then(() => {
      console.log("in tech then");
      let techData = fs.readFileSync(path.join(__dirname, "./fullTech.json"));
      return refresh(sourceInfo, techData, "tech");
    })
    .then(textData => addVideos(textData, sourceInfo, "tech"))
    .then(videoedData => liason(videoedData))
    .then(liasonedData => removeOldItems(liasonedData))
    .then(newItems => {
      console.log("tech returned");
      fs.writeFileSync(
        path.join(__dirname, "fullTech.json"),
        JSON.stringify(newItems)
      );
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
