const graphql = require("graphql");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  //  GraphQLBoolean,
  GraphQLList
} = graphql;

const filePaths = {
  world: `${path.join(__dirname, "fullWorld.json")}`,
  tech: `${path.join(__dirname, "fullTech.json")}`
}

console.log(filePaths["world"]);

const wordType = new GraphQLObjectType({
  name: "word",
  fields: () => ({
    title: { type: GraphQLString },
    strongTitle: { type: GraphQLString },
    url: { type: GraphQLString },
    ampURL: { type: GraphQLString },
    description: { type: GraphQLString },
    image: { type: GraphQLString },
    date: { type: GraphQLString },
    publisher: { type: GraphQLString },
    uid: { type: GraphQLString },
    matchid: { type: GraphQLString },
    type: { type: GraphQLString },
    minutesPassed: { type: GraphQLString },
    displayTime: { type: GraphQLString }
  })
});

//console.log((moment(moment().format()) - moment("Wed, 22 May 2019 11:36:19 GMT")) / (1000 * 60));

function getTimePassedInMinutes(date) {
  return (moment(moment().format()) - moment(date)) / (1000 * 60);
}

function getDisplayTime(minutesPassed) {
  let displayTime = "";
  minutesPassed = parseInt(minutesPassed);
  if (!(minutesPassed > 0)) {
  } else if (minutesPassed < 60) {
    displayTime = `${minutesPassed} minutes ago`;
  } else if (minutesPassed < 1440) {
    displayTime = `${Math.floor(minutesPassed / 60)} ${
      minutesPassed < 121 ? "hour" : "hours"
    } ago`;
  } else {
    displayTime = `${Math.floor(minutesPassed / 1440)} ${
      minutesPassed < 2881 ? "day" : "days"
    } ago`;
  }
  return displayTime;
}

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    articles: {
      type: new GraphQLList(wordType),
      args: {
        offPhrases: { type: GraphQLList(GraphQLString) },
        domain: { type: GraphQLString }
      },

      resolve(parent, args) {
        console.log(`${JSON.stringify(args.domain)} 👈 Grapgql args`);
        console.log(args.offPhrases);
        // let fullData = JSON.parse(
        //   fs.readFileSync(path.join(__dirname, "./fullWorld.json"))
        // );

        let fullData = JSON.parse(fs.readFileSync(filePaths[`${args.domain}`]))
        
        if (args.offPhrases !== undefined) {
          fullData = fullData.filter(word => {
            let splitTitle = word["strongTitle"].toLowerCase().split(" ");
            if (
              splitTitle.filter(v => -1 !== args.offPhrases.indexOf(v))
                .length == 0
            )
              return true;
            //TODO remove return true and if
          });
        } // end of if (args.offPhrases !== undefined)

        fullData = fullData
          .map(w => {
            let timesInMinutes = getTimePassedInMinutes(w.date);
            w["minutesPassed"] = timesInMinutes;
            w["displayTime"] = getDisplayTime(timesInMinutes);
            //TODO use spread operator
            return w;
          })
          .sort((a, b) => a["minutesPassed"] - b["minutesPassed"]);

        return fullData;
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery
});
