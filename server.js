const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
app.set("view engine", "ejs");
app.use("/public", express.static("public"));

var db;

MongoClient.connect(
  "mongodb+srv://boom:qwer1234@cluster0.gd10uz8.mongodb.net/todoapp?retryWrites=true&w=majority",
  { useUnifiedTopology: true },
  function (err, client) {
    if (err) {
      return console.log(err);
    }

    db = client.db("todoapp");

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/pet", function (req, res) {
  res.send("pet 용품 쇼핑페이지입니다");
});
app.get("/", function (req, res) {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      res.render("index.ejs", { posts: result });
    });
});
app.get("/write", function (req, res) {
  res.render("write.ejs");
});

// app.get("/", function (req, res) {
//   res.sendFile(__dirname + "./views/index.ejs");
// });
// app.get("/write", function (req, res) {
//   res.sendFile(__dirname + "/views/write.ejs");
// });

app.post("/add", function (req, res) {
  console.log(req.body);
  res.write("<script>alert('success')</script>");
  res.write('<script>window.location="/"</script>');

  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (err, result) {
      console.log(result.totalPost);
      let 총게시물갯수 = result.totalPost;

      db.collection("post").insertOne(
        { _id: 총게시물갯수 + 1, title: req.body.title, date: req.body.date },
        function (err, result) {
          console.log("저장완료");

          //counter라는 콜렉션에 있는 totalPost라는 항목도 1 중가 시켜야함
          db.collection("counter").updateOne(
            { name: "게시물갯수" },
            { $inc: { totalPost: +1 } },
            function (err, result) {
              if (err) {
                return console.log(err);
              }
            }
          );
        }
      );
    }
  );
});

app.get("/list", function (req, res) {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      res.render("list.ejs", { posts: result });
    });
});

app.delete("/delete", function (req, res) {
  console.log(req.body);
  req.body._id = parseInt(req.body._id);
  //req.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요~
  db.collection("post").deleteOne(req.body, function (err, result) {
    console.log("삭제완료");
    res.status(200).send({ message: "삭제완료" });
  });
});

app.get("/detail/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (err, result) {
      console.log(result);
      res.render("detail.ejs", { data: result });
    }
  );
});
