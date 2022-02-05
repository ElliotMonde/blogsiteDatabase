//jshint esversion:6

/*
 * @author : ElliotMonde | Elliot Phua 
 * @date : 06 Feb 2022
 * @description : A blog site made from ejs templates, able to store posts through mongodb atlas.
 * App deployed through Heroku app.
 * Requires node, ejs, express, mongoose, lodash
 * key.js stores server key
 * Thought-Process :
 * 1. Require modules.
 * 2. Connect to mongodb, specify database to use.
 * 3. app.listen to port.
 * 4. when get "/" --> homepage. (same as get "/home"). Render the home template
 * get the home posts content from collateModel (a collation of the posts made)
 * 5. when get request to "/compose", use compose ejs template, same with about, etc.
 * 6. when post request to "/post", create new postModel document, and push to collateModel
 * 7. redirect to successfully posted page, with buttons to click home
 * 8. in home page, when click on post summary, get request to the page which is the Title in kebabCase
 * 9. res.redirect to that page (create a get /:id where id is page url suffix) render the post to show
 * by getting the post based on the page title, from the page collation or from the postModel
 * 
 * 10. In heroku, create, copy remote git address, set up git, commit and push and debug
 */
//  In CLI,
//  mongosh "mongodb+srv://cluster0.qavpj.mongodb.net/blogDatabase" --username ElliotMonde
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
//let port = process.env.PORT;
let port = 3000;
if (port == null || port == " ") {
  port = 3000;
  return port;
}
const app = express();
const mongoose = require("mongoose");
const db = mongoose.connect("mongodb+srv://ElliotMonde:Z8UKLZqQpGw6XH7J@cluster0.qavpj.mongodb.net/blogDatabase"); // use connect url from mongodb atlas with password key from key.js

//  post document model
const postSchema = new mongoose.Schema({
  Title: {
    type: String,
    required: 1,
    default: "New Post"
  },
  Body: String
});
const postModel = mongoose.model("PostModel", postSchema);

//  home collation of post, collation document model
const collateModel = mongoose.model("CollateModel", new mongoose.Schema({
  Name: { default: "collateDoc", type: String },
  Pages: [postSchema]
}));
/*
const newCollateDoc = new collateModel({
  Name: "collateDoc",
  Pages: [{
    Title: "No post to show.",
    Body: "Type 'compose' after '/' in the url to create new post."

  }]
});
*/
//newCollateDoc.save();


app.set('view engine', 'ejs');
//  body-parser not needed; depreciated
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/" || "/home", function (req, res) {
  const id = "Home";
  collateModel.findOne({ Name: "collateDoc" }, function (err, collateDoc) {
    if (err) { console.log(err) };
    // if collateDoc does not exist, create one with one post;
    if (collateDoc == null || collateDoc == "") {
      const newCollateDoc = new collateModel({
        Name: "collateDoc",
        Pages: [{
          Title: "No post to show.",
          Body: "Type 'compose' after '/' in the url to create new post."
        }]
      });
      newCollateDoc.save(function () { return res.render("home", { id: id, homeTitle: newCollateDoc.Pages }); });
    } else { // if collateDoc exist;
      collateModel.findOneAndUpdate({ Pages: { $size: 0 } }, {
        Pages: [{ Title: "No post to show.", Body: "Type 'compose' after '/' in the url to create new post." }]
      }, function (err) {
        if (err) { console.log(err) };
      });
    };
    return res.render("home", { homeTitle: collateDoc.Pages, postTitle: id });
  });

  // get the collateDoc posts, return the array of postSchema documents. use <array>.forEach(function(arrayItem){...}) in home ejs

})

app.get("/about", function (req, res) {
  const id = "About";
  const body = "Hi! My name's Elliot, (@ElliotMonde on github). This project is a blog site with a database using Mongoose and EJS templating.";
  return res.render("about", { postTitle: id, postBody: body });
})

app.get("/contact", function (req, res) {
  const id = "Contact";
  const body = "Hi! Check out my github here!";
  return res.render("contact", { postTitle: id, postBody: body });
})

app.get("/compose" || "Compose", function (req, res) {
  const id = "Compose"
  res.render("compose", { id: id, postTitle: id });
});

app.get("/post/:id", function (req, res) {
  let id = req.params.id;
  if (id != req.params.id.replace(/ /g, "_")) {
    id = req.params.id.replace(/ /g, "_");
    return res.redirect("/post/" + id);
  } else {
    collateModel.findOne({ Name: "collateDoc" }, function (err, collateDoc) {
      collateDoc.Pages.forEach(function (post) {
        if (post.Title == id.replace(/_/g, " ")) {
          return res.render("post", { postTitle: post.Title, postBody: post.Body });
        }
      })
    })
  }
});


app.post("/compose" || "/Compose", function (req, res) {
  //  create new post document from post model.
  const id = req.body.postTitle;
  const body = req.body.postBody;
  //  push newPost document to collateDoc
  postModel.findOne({ Title: id }, function (err, pageFound) {
    if (err) { console.log(err) };
    //  have a small pop-up suggesting post created successfully / or redirect to a successfully-posted page
    if (pageFound == null || "") {
      pageFound = new postModel({
        Title: id,
        Body: body
      });
      pageFound.save();
      collateModel.findOne({ Name: "collateDoc" }, function (err, collateDoc) {
        if (err) { console.log(err) };
        collateDoc.Pages.push(pageFound);
        collateDoc.save(function (err) {
          if (err) { console.log(err) };
          return res.redirect("/");
        })
      })
    } else {
      // duplicate title
      pageFound = new postModel({
        Title: id + " | " + Date(),
        Body: body
      });
      pageFound.save();
      collateModel.findOne({ Name: "collateDoc" }, function (err, collateDoc) {
        if (err) { console.log(err) };
        collateDoc.Pages.push(pageFound);
        collateDoc.save(function (err) {
          if (err) { console.log(err) };
          return res.redirect("/");

        })
      });
    }
  })
})
app.listen(port, function () {
  console.log("Server started on port : " + port);
  console.log("navigate to /compose to create a new blog post!");
});


