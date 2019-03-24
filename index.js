const express = require('express');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

var app = express();
let parser = new Parser();

async function refresh(data) {
    data = JSON.parse(data);

    for (const source of data) {
        let newPage = [];
        let feed = await parser.parseURL(source.rssLink);

        for (word of feed.items) {
            let exists = source['newsItems'].filter(w => word.title == w.title);

            if (exists.length == 0) {
                console.log("new news title is", word.title, " from ", source.name);
                
                
                let newWord = {
                    title: word.title,
                    //strongTitle: stronger(word.title),
                    url: word.link,
                    date: word.pubDate,
                    //diff: duration,
                    publisher: source.name,
                    //uid: nanoid(4),
                    //matchid: 0,
                    type: 'text'
                }
                
                newPage.push(newWord);
            } else {

            }

        } // end of for word of items
        source['newsItems'].push = newPage;
        console.log("newPage.length = ", newPage.length);
        
    } // end of for source of data
    return data;
}
app.get('/', (q, a) => {
    a.send("HELLO!!!");
});

app.get('/update', (q, a) => {
    let worldData = fs.readFileSync(path.join(__dirname, './dataWorld.json')).toString();

    refresh(worldData)
        .then(
            (d) => {
                console.log("returned");
                //fs.writeFileSync(path.join(__dirname, './dataWorld.json'), JSON.stringify(d));
                a.send(d)
            }
        ).catch((c) => {
            console.log("this is the error", c);

        });
});

app.get('/show', (q, a) => {
    a.send("in show GET");

});

app.listen(2345, () => {
    console.log("Running @ port 2345");
});