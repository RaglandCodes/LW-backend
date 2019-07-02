require("dotenv").config();
let stopWords = require("./stopWords.js");
stopWords = stopWords.sw;
const path = require("path");
const fs = require("fs");
let request = require("request");

// ------------- constants -----------
const filePaths = {
  techData: `${path.join(__dirname, "./fullTech.json")}`,
  worldData: `${path.join(__dirname, "./fullWorld.json")}`
};

//------------------ functions-----------------------

function searchNews(message, sender_psid) {
  const keyWords = ["world", "tech", "news", "random", "top", "latest", "ok"];
  let lenResponse = 3;// send 3 mesages at most by default

  message = message.toLowerCase();
  message = message.split(/\s+/);
  message = message.filter(w => stopWords.indexOf(w) === -1);
  //console.log(message);
  let searchWords = [];
  let searchKeyWords = [];
  for (const w of message) {
    console.log(w, "<== message word");
    if (w == parseInt(w)) {
      let n = parseInt(w);
      if (n < 7) {
        // send 7 articles at most at a time
        lenResponse = n;
      }
      continue;
    }
    if (keyWords.indexOf(w) !== -1) {
      searchKeyWords.push(w);
      continue;
    }

    searchWords.push(w);
  } // end of const w loop
  console.log(searchWords, "sw");
  console.log(searchKeyWords, "skw");

  let responses = [];
  for (let [file, path] of Object.entries(filePaths)) {
    console.log(`${path} 👈path`);
    let data = JSON.parse(fs.readFileSync(path));
    for (const word of data) {
      let st = word['strongTitle'].split(/\s+/);
      let matches = st.filter(t => -1 !== searchWords.indexOf(t));
      if(matches.length > 0)
      {
        let newResponse = {
          title: word['title'],
          description:word['description'],
          url: word['url'],
          matchStrength: matches.length
        }
        
        responses.push(newResponse);
        if(responses.length > 150){
          // this means there is something wrong with someome/something
          break;
        }
      }
    }
  } // end of for ([file, path] of filePaths loop

  
  if(responses.length === 0)
    {
      callSendAPI(sender_psid, {text: "🤖Couldn't find anything for that"});
    }
  
  responses = responses.sort((a, b) => b['matchStrength'] - a['matchStrength']); // sorts responses based on number of matched words
  console.log(responses.length, "len found");
   
  
  if(responses.length > lenResponse)
    {
       responses.splice(lenResponse);
    }
  console.log(responses.length, "len new");
  console.log(JSON.stringify(responses), "rr splices");
  
  for(const message of responses)
    {
      let response = ` ${message['title']} 
\n${message['description']}\n\n${message['url']}`
      
      callSendAPI(sender_psid, {text: response});
    }
  
  return "responses";

  /*let responseText = "";
  for (const response of responses) {
    responseText = responseText.concat(
      ` ${response["title"]} \n ${response["url"]} \n\n`
    );
  }

  console.log(responseText);
  return responseText;*/
}

function handleMessage(sender_psid, received_message) {
  let response;
  console.log("handlemess");
  if (received_message.text) {
    
   
    
    let tempres ={
      text: "🤖"
    };
    callSendAPI(sender_psid, tempres);
    
    console.log("got text");
    response  = searchNews(received_message.text, sender_psid);   
    console.log(response, "rep");
  } else if (received_message.attachments) {
    
    response = {
      text: "I 🤖 can't handle messages with attachments 📎 yet"
    }; // end of response
    
    callSendAPI(sender_psid, response);
  } // end of attachment else

  
}

function handlePostback(sender_psid, received_postback) {
  console.log(received_postback, "recd pb");
  if (received_postback.payload === "first_contact") {
    console.log("in fc pb");
    let response = {
      text:
        "Welcome to LittleWord \n\nYou can search for news items by sending keywords."
    };
    callSendAPI(sender_psid, response);
  }
}

function callSendAPI(sender_psid, response) {
  let request_body = {
    recipient: { id: sender_psid },
    message: response
  };

  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log(response, "message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

module.exports = { handleMessage, handlePostback, callSendAPI };
