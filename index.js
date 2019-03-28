// --------------- dependencies ----------

const express = require('express');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const Parser = require('rss-parser');
const nanoid = require('nanoid');

// --------------- initialisations ----------
const app = express();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let parser = new Parser();

// --------------- functions ----------
function stronger(weakTitle) {
    const removeRegex = / on | in | as | by | into | s | its | a | an | the | your | will | her | so | with | for | we | at | to | be | if | that | of | are | and | is |- BBC News|- video|:|’s|-|–|, |‘|\s+|'|’|“|”/ig;

    let strongTitle = weakTitle.replace(removeRegex, ' ').replace(removeRegex, ' ').replace(removeRegex, ' ');
    return strongTitle.toLowerCase();
}

function timePast(then)
{
    
    var timeNow = new Date;
    console.log(moment(then).fromNow());
    //console.log(timeNow - then);
    
}

function liason(pages) {
    let   page = []

    for (const source of pages) {
        page = page.concat(source['newsItems']);
    }

    for (var i = 0; i < page.length; i++) {

        let t1 = page[i].strongTitle.split(/\s+/);
        for (let j = i + 1; j < page.length; j++) {
            if (page[j].matchid != 0) continue;
            let t2 = page[j].strongTitle.split(/\s+/);
            let matches = t1.filter(v => -1 !== t2.indexOf(v));
            if (matches.length > 2) {
                if (page[i].matchid == 0)
                    page[i].matchid = nanoid(5)
                page[j].matchid = page[i].matchid;
            }
        } // end of j loop
    } //end of i loop

    fs.writeFileSync(path.join(__dirname, './fullWorld.json'), JSON.stringify(page))
    return pages;
}

function cleaner(dirtyPage) {


    for (const source of dirtyPage) {

        let cleanPage = [];
        for (const word of source['newsItems']) {

            if (timePast(word['date']) < 25) {
                cleanPage.push(word)
            }
        }

        source['newsItems'] = cleanPage;
    }
    return dirtyPage;

}

async function refresh(data) {
    data = JSON.parse(data);

    for (const source of data) {
        let newPage = [];
        let feed = await parser.parseURL(source.rssLink);

        for (const word of feed.items) {
            let exists = source['newsItems'].filter(w => word.title == w.title);

            if (exists.length == 0) {
                console.log("new news title is", word.title, " from ", source.name);
                let publishedDate = new Date(word.pubDate);
                //let timePastInHours = (timeNow - publishedDate) / 3600000;
                let newWord = {
                    title: word.title,
                    strongTitle: stronger(word.title),
                    url: word.link,
                    date: word.pubDate,
                    //timePast: (timeNow - publishedDate) / 3600000,
                    publisher: source.name,
                    uid: nanoid(4),
                    matchid: 0,
                    type: 'text'
                }

                newPage.push(newWord);
            } else {

            }

        } // end of for word of items
        source['newsItems'] = source['newsItems'].concat(newPage);
        console.log("newPage.length = ", newPage.length);
        //if(newPage.length > 0) console.log(newPage);
    } // end of for source of data
    return data;
}
app.get('/', (q, a) => {
    a.send("HELLO!!!");
});

app.get('/update', (q, a) => {
    a.send("K")
    let worldData = fs.readFileSync(path.join(__dirname, './dataWorld.json')).toString();

    refresh(worldData)
        .then(raw => liason(raw))
        .then(dirty => cleaner(dirty))
        .then(
            (d) => {
                console.log("returned");
                fs.writeFileSync(path.join(__dirname, './dataWorld.json'), JSON.stringify(d));

            }
        ).catch((c) => {
            console.log("this is the error", c);

        });
});

// --------------- get requests ----------
app.get('/show', (q, a) => {
    let response = fs.readFileSync(path.join(__dirname, 'fullWorld.json')).toString();
    a.send(JSON.parse(response));

});

app.listen(2345, () => {
    console.log("Running @ port 2345");
});

/*
const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  });
*/