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
    minutesPassed: { type: GraphQLString }
  })
});

function getTimePassedInMinutes(date) {
  return (moment(moment().format()) - moment(date)) / (1000 * 60);
}

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    articles: {
      type: new GraphQLList(wordType),
      args: { offPhrases: { type: GraphQLList(GraphQLString) } },
      resolve(parent, args) {
        console.log(`${JSON.stringify(args)} 👈 Grapgql args`);
        console.log(args.offPhrases);
        let fullData = JSON.parse(
          fs.readFileSync(path.join(__dirname, "./fullWorld.json"))
        );
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
            w["minutesPassed"] = getTimePassedInMinutes(w.date);
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
