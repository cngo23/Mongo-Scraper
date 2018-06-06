var express = require("express");
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
var path = require("path");
var logger = require("morgan");
var mongoose = require("mongoose");

//scraping packages
var request = require("request");
var cheerio = require("cheerio");

//requiring all models
let db = require("./models/index")

let PORT = process.env.PORT || 3500;

//initializing express
let app = express();

//middleware configuration
// use morgan logger to log requests
app.use(logger("dev"));

//use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

//Use express.static to serve the public folder as a static directory
app.use(express.static(__dirname + "/public"));

//views configure
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

//connecting Mongo DB
// If deployed, use the deployed database. Otherwise use the local scraperhw database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/Scraper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


//routes

//GET route for scraping NYTimes Sports
app.get("/scrape", function (req, res) {
//grabbing body of html
    request("https://www.nytimes.com/section/sports", function(error, response, html) {
        var $ = cheerio.load(html);
//grabbing every div with the class story
        $("div.story-body").each(function (i, element) {
            //pushing it into an object
            var result = {};
        
            //adding the desired info

            var title = $(element).find("h2.headline").text().trim();
            var link = $(element).find("a").attr("href");
            var summary = $(element).find("p.summary").text().trim();
            var img = $(element).parent().find("figure.media").find("img").attr("src");

            result.title = title;
            result.link = link;

            if (summary) {
                result.summary = summary;
            };
            
            if (img) {
                result.img = img;
              } else {
                result.img = $(element).find('div.wide-thumb').find('img').attr('src');
              };

              console.log(result)
            //Creating a new article using the result object built from scraping

         test(result);
        });
        console.log("You Scraped it.")
        res.redirect("/");
        // res.send("It was Scraped")
    });
});
function test(result) {
    db.Article.create(result)
    .then(function(dbArticle) {
        console.log(`did something ${dbArticle}`)
    }).catch(function(err) {
        return res.json(err);
    })

}
app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });




app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
});