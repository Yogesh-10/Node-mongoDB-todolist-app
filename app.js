const express = require("express");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Hello",
});
// // const item2 = new Item({
//  //     name: 'Name 2'
// // })
// // const item3 = new Item({
// //     name: 'Name 3'
//  })

const defaultItems = [item1];

// list schema
const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

// const newItems = ['Buy food','Cook Food','Eat Food'];
// const workItems = [];

app.get("/", (req, res) => {
  // finding all items in the list or DB
  Item.find({}, (err, newItems) => {
    if (newItems.length === 0) {
      // Insert the values to the list..this is to not repeat the array
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log("error");
        } else {
          console.log("saved to db");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { day: "Today", newItem: newItems });
    }
  });
});
// create custom lists

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName }, (err, newItems) => {
    if (!err) {
      if (!newItems) {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show existing list
        res.render("list", { day: newItems.name, newItem: newItems.items });
      }
    }
  });
});

// To print in web page after pressing the plus button
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
// delete items in the list
app.post("/delete", (req, res) => {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, (err) => {
      if (!err) {
        console.log("Item deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// app.get('/work',(req,res)=>{
//     res.render('list',{day:'work list',newItem:workItems})
// })

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
