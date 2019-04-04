// --------------- dependencies ----------

const express = require("express");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const Parser = require("rss-parser");
const nanoid = require("nanoid");

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

let parser = new Parser();

// --------------- functions ----------
function stronger(weakTitle) {
  const removeRegex = / on | in | as | by | into | s | its | a | an | the | your | will | her | so | with | for | we | at | to | be | if | that | of | are | and | is |- BBC News|- video|:|’s|-|–|, |‘|\s+|'|’|“|”/gi;

  let strongTitle = weakTitle
    .replace(removeRegex, " ")
    .replace(removeRegex, " ")
    .replace(removeRegex, " ");
  return strongTitle.toLowerCase();
}

function liason(pages) {
  //Matches articles with 3 matching words
  let page = [];
  //let tryPage = [].concat(...pages.map(source => source['newsItems']));

  for (const source of pages) {
    page = page.concat(source["newsItems"]);
    console.log("in concat");
  }

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
        if (page[j].matchid != 0 && page[i].matchid == 0) {
          page[i].matchid = page[j].matchid;
        } else if (page[i].matchid == 0 && page[j].matchid == 0) {
          page[i].matchid = nanoid(5);
          page[j].matchid = page[i].matchid;
        } else if (page[i].matchid != 0 && page[j].matchid == 0) {
          page[j].matchid = page[i].matchid;
        } else {
          console.log("You have a propblem in mathcings");
        }
      }
    } // end of j loop
  } //end of i loop

  return page;
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

  console.log(`old page is this big => ${oldPage.length}`);
  console.log(`new page is this big => ${newPage.length}`);
  return oldPage;
}

function cleaner(page) {
  // function to remove news articles older than 40 hours

  for (const source of page) {
    let cleanPage = [];

    for (const word of source["newsItems"]) {
      //console.log(typeof(moment(word['date'])));
      let hoursPased =
        (moment(moment().format()) - moment(word["date"])) / (1000 * 60 * 60);

      if (hoursPased < 40) {
        cleanPage.push(word);
      } else {
        //console.log("cleaning");
      }
    }

    source["newsItems"] = cleanPage;
  }

  return page;
}

function selectData(fullData, offSting) {
  if (offSting == undefined) {
    return fullData;
  }

  let offArray = offSting.toLowerCase().split("andand");

  fullData = JSON.parse(fullData);

  let likedData = fullData.filter(word => {
    let splitTitle = word["strongTitle"].toLowerCase().split(" ");
    if (splitTitle.filter(v => -1 !== offArray.indexOf(v)).length == 0)
      return true;
  });

  return likedData;
}
async function refresh(data) {
  // function to add the new news stories to the database
  data = JSON.parse(data);
  console.log("Refreshing!!!");

  for (const source of data) {
    console.log(`Refreshing!!! ${source["name"]}`);

    let newPage = [];
    let feed = await parser.parseURL(source.rssLink);

    for (const word of feed.items) {
      let exists = source["newsItems"].filter(w => word.title == w.title);

      if (exists.length == 0) {
        //console.log("new news title is", word.title, " from ", source.name);
        let newWord = {
          title: word.title,
          strongTitle: stronger(word.title),
          url: word.link,
          date: word.pubDate,
          publisher: source.name,
          uid: nanoid(4),
          matchid: 0,
          type: "text"
        };

        newPage.push(newWord);
      } else {
      }
    } // end of for word of items
    source["newsItems"] = source["newsItems"].concat(newPage);
    //console.log("newPage.length = ", newPage.length);
  } // end of for source of data
  return data;
}

// --------------- get requests ----------
app.get("/", (q, a) => {
  a.send("HELLO!!!");
});

app.get("/update", (q, a) => {
  // This function gets called every 30 minutes by  https://cron-job.org
  a.send("K");
  let worldData = fs
    .readFileSync(path.join(__dirname, "./dataWorld.json"))
    .toString();

  refresh(worldData)
    //.then(dirty => cleaner(dirty))
    .then(seperate => {
      fs.writeFileSync(
        path.join(__dirname, "./dataWorld.json"),
        JSON.stringify(seperate)
      );

      return liason(seperate);
    })
    .then(old => removeOldItems(old))
    .then(finalData => {
      fs.writeFileSync(
        path.join(__dirname, "./fullWorld.json"),
        JSON.stringify(finalData)
      );
    })
    .then(d => {
      console.log("returned");
    })
    .catch(c => {
      console.log("this is the error", c);
    });
});

app.get("/show", (q, a) => {
  // This is called by the front end to get the data
  let fullData = fs
    .readFileSync(path.join(__dirname, "fullWorld.json"))
    .toString();

  a.send(selectData(fullData, q.query.off));
}); // end of GET show

app.listen(2345, () => {
  console.log("🏃‍ @ port 2345");
});

/*  
This exists for delpoying in glitch.com
Check it out @ glitch => https://glitch.com/~lw-back

const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  });
//*/
