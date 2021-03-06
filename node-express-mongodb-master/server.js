const express = require("express");
const app = express();




//DB URI이 연결되었는지 확인해줌
const config = require('./app/config/key');
const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err))



 /* 
//react을 빌드 해준 파일에 하나의 주소로 연결해줌
const path = __dirname + '/app/views/';
app.use(express.static(path));
*/




//cors 에러 방지 모듈 코드
const cors = require("cors");
var corsOptions = {
  origin: "http://localhost:8081"
};
app.use(cors(corsOptions));


//bodyParser 모듈 실행 코드
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const cookieParser = require('cookie-parser');
app.use(cookieParser());



/*
// 클라이언트인 react을 토대로 초기화면 /으로 설정해주어 활성화 해줌.
app.get('/', function (req,res) {
  res.sendFile(path + "index.html");
});
*/

app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});



//모듈화 되어 분리된 곳을 위해 express의 프로그램 변수 app을 보내줌
// CRUD을 제어하기 위한 모듈화된 코드들을 가져옴
require("./app/routes/turorial.routes")(app);








const { auth } = require('./app/middleware/auth');
const { User } = require("./app/models/User");



app.get('/', (req, res) => res.send('Hello World!~~ '))

app.get('/api/hello', (req, res) => res.send('Hello World!~~ '))

app.post('/api/users/register', (req, res) => {

  //회원 가입 할떄 필요한 정보들을  client에서 가져오면 
  //그것들을  데이터 베이스에 넣어준다. 
  const user = new User(req.body)

  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err })
    return res.status(200).json({
      success: true
    })
  })
})

app.post('/api/users/login', (req, res) => {

  // console.log('ping')
  //요청된 이메일을 데이터베이스에서 있는지 찾는다.
  User.findOne({ email: req.body.email }, (err, user) => {

    // console.log('user', user)
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다."
      })
    }

    //요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호 인지 확인.
    user.comparePassword(req.body.password, (err, isMatch) => {
      // console.log('err',err)

      // console.log('isMatch',isMatch)

      if (!isMatch)
        return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." })

      //비밀번호 까지 맞다면 토큰을 생성하기.
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        // 토큰을 저장한다.  어디에 ?  쿠키 , 로컳스토리지 
        res.cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id })
      })
    })
  })
})


// role 1 어드민    role 2 특정 부서 어드민 
// role 0 -> 일반유저   role 0이 아니면  관리자 
app.get('/api/users/auth', auth, (req, res) => {
  //여기 까지 미들웨어를 통과해 왔다는 얘기는  Authentication 이 True 라는 말.
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image
  })
})

app.get('/api/users/logout', auth, (req, res) => {
  // console.log('req.user', req.user)
  User.findOneAndUpdate({ _id: req.user._id },
    { token: "" }
    , (err, user) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({
        success: true
      })
    })
})


// 포트 설정
const PORT = 8080
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
