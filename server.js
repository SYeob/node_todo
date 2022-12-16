

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
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

app.get("/", function (req, res) {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      res.render("index.ejs", { posts: result });
    });
});


// app.get("/", function (req, res) {
//   res.sendFile(__dirname + "./views/index.ejs");
// });
// app.get("/write", function (req, res) {
//   res.sendFile(__dirname + "/views/write.ejs");
// });

app.get("/list", function (req, res) {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      res.render("list.ejs", { posts: result });
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

app.get("/edit/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (err, result) {
      console.log(result);

      if (result == null) {
        res.render("error.ejs");
      } else {
        res.render("edit.ejs", { post: result });
      }
    }
  );
});

app.put("/edit", function (req, res) {
  //폼에 담긴 제목데이터, 날짜데이터를 가지고, db.collection에 업데이트 해라
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    function (err, result) {
      console.log("수정완료");
      res.redirect("/");
    }
  );
});
//로그인 작업
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function (req, res) {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    //로그인 실패시 fail 페이지로 가게 작성
    failureRedirect: "/fail",
  }),
  function (req, res) {
    res.redirect("/");
  }
);

//Strategy (인증방법)
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);

//작성
app.post("/add", function (req, res) {
  console.log(req.body);
  res.write("<script>alert('success')</script>");
  res.write('<script>window.location="/"</script>');

  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (err, result) {
      console.log(result.totalPost);
      let 총게시물갯수 = result.totalPost;
      var saveItem = {
        _id: 총게시물갯수 + 1,
        title: req.body.title,
        date: req.body.date,
        userId: req.user._id,
      };
      db.collection("post").insertOne(saveItem, function (err, result) {
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
      });
    }
  );
});

//아이디를 이용해서 세션을 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

//이 세션 데이터를 가진 사람을 DB에서 찾아달라(마이페이지 접속시 발동)
passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (err, result) {
    done(null, result);
  });
});
//register
app.post("/register", function (req, res) {
  db.collection("login").insertOne(
    { id: req.body.id, pw: req.body.pw },
    function (err, result) {
      res.redirect("/login");
    }
  );
});

//쓰기
app.get("/write" ,login, function (req, res) {
  res.render("write.ejs",{ user: req.user });
});

function login(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.render("nologin.ejs");
  }
}

//삭제
app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id);

  //req.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요~
  db.collection("post").deleteOne(
    { _id: req.body.Id, userId: req.user._id },
    function (err, result) {
      console.log("삭제완료");
      if (err) {
        console.log(err);
      }
      res.status(200).send({ message: "삭제완료" });
    }
  );
});

//마이페이지
app.get("/mypage", login, function (req, res) {
  console.log(req.user);
  res.render("mypage.ejs", { user: req.user });
});

function login(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.render("nologin.ejs");
  }
}

//회원가입 페이지

app.get("/signup", function (req, res) {
  res.render("signup.ejs");
});

// 검색기능
app.get("/search", (req, res) => {
  var searchCondition = [
    {
      $search: {
        index: "titleSearch", // mongodb search에 만든거
        text: {
          query: req.query.value,
          path: ["title"], // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
    // {$sort : {_id: 1}}
    {
      $project: { title: 1, _id: 1, date: 1, score: { $meta: "searchScore" } },
    },
  ];
  console.log(req.query.value);
  db.collection("post")
    // .find({ title: req.query.value })
    .aggregate(searchCondition) //검색조건 여러개 가능
    .toArray((err, result) => {
      console.log(result);
      res.render("search.ejs", { posts: result });
    });
});