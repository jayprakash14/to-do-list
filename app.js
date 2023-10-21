require('dotenv').config();
const express = require("express");
const bodyParser = require("body-Parser");
const app = express();
const mongoose = require("mongoose");
const req = require("express/lib/request");
const ejs = require("ejs");
const _ = require("lodash");
const { set } = require('lodash');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const username = process.env.DB_Username;
// const password = process.env.DB_Password;

const DB = process.env.MONGO_URL;

mongoose.connect(DB).then(() => {
  console.log("Connection Success");
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your To Do List",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "← Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

var today = new Date();

var options = {
  month: "long",
  year: "numeric",
  day: "numeric",
  weekday: "long",
};

var day = today.toLocaleDateString("en-US", options);

app.get("/", function (req, res) {
  Item.find(function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
        res.redirect("/");
      });
    } else {
      res.render("lists", {
        listTitle: day,
        newListItems: foundItems,
      });
    }
  });
});

app.get("/:newTitle", function (req, res) {
  const newListTtile = _.capitalize(req.params.newTitle);

  List.findOne({ name: newListTtile }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create new list
        const list = new List({
          name: newListTtile,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + newListTtile);
      } else {
        //show existing list
        res.render("lists", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.addItem;

  const itemToAdd = new Item({
    name: itemName,
  });

  if (listName === day) {
    itemToAdd.save();
    setTimeout(() => {
      res.redirect("/");  
    }, 25);
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(itemToAdd);
      foundList.save();
      setTimeout(() => {
        res.redirect("/" + listName);
      }, 25);
    });
  }
});

app.post("/delete", function (req, res) {
  const itemId = req.body.itemCompleted;
  const listName = req.body.listName;

  if (listName === day) {
    Item.deleteOne({ _id: itemId }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Success");
      }
    });
    setTimeout(() => {
      res.redirect("/");  
    }, 25);
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, function(err, foundList){
      if(!err){
        setTimeout(() => {
          res.redirect("/" + listName);
        }, 25);
      }
    })
  } 
});

app.listen(3000);

