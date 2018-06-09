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
app.use(bodyParser.urlencoded({
    extended: true
}));

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
    request("https://www.nytimes.com/section/sports", function (error, response, html) {
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
            //Creating a new article using the result object built from scraping
            db.Article.create(result)
            .then(function (dbArticle) {
                // console.log(dbArticle)
            }).catch(function (err) {
                return res.json(err);
            })
            
        });
        console.log("You Scraped it.")
        res.redirect("/");
        // res.send("It was Scraped")
    });
});

app.get("/", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({}).sort({created: 1})
        .then(function (data) {
            // If we were able to successfully find Articles, send them back to the client
            res.render("index", {articles: data})
            // res.json(data);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            // res.json(err);
        });
});

app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("notes")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

    // Route for saving/updating an Article's associated Note
    app.post("/articles/:id", function(req, res) {
        // Create a new note and pass the req.body to the entry
        db.Note.create(req.body)
          .then(function(dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
          })
          .then(function(dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });



app.get("/saved", function(req, res) {
    db.Article.find({saved: true}).sort({created:1})
    .then(function (data) {
        res.render("savedContent", {articles: data})
    })
    .catch(function (err) {
        throw err
    })
})

app.get("/save/:status/:id", function(req,res) {
    db.articles.findOneAndUpdate(
        {_id: req.params.id},
        {saved: req.params.status},
        {new: true}
    ).then(function(data) {
        res.json(data);
    })
})

app.get('/save/:status/:id', function(req, res){

    db.Article.findOneAndUpdate(

        {_id:req.params.id},
        {saved:req.params.status},
        {new:true}

    ).then(function(results){

        res.json(results);

    });

});





  





app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
});