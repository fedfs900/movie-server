//express 가져오기
const express = require('express');
//cors 가져오기
const cors = require('cors');
//mysql 가져오기
const mysql = require('mysql');
// mulrer 가져오기
const multer = require('multer');
//bcrypt가져오기
const bcrypt = require('bcrypt');
//암호화 글자수
const saltRounds = 10;


//서버생성
const app = express();
//프로세서의 주소 포트번호 지정
const port = 8080;

app.use(cors());

app.use(express.json());

// upload 폴더를 클라이언트에서 접근 가능하도록 설정
app.use('/upload', express.static('upload'));

// storage 생성
const storage = multer.diskStorage({
    destination: (req, file, cd) => {
        cd(null, 'upload/poster/');
    },
    filename: (req, file, cd) => {
        const newFilename = file.originalname;
        cd(null, newFilename);
    }
});
// upload 객체 생성
const upload = multer({storage: storage});
// upload 경로로 post 요청 했을 시 응답 구현 
app.post('/upload', upload.single('file'), (req, res) => {
    res.send({
        imgUrl: req.file.filename
    });
});

//mysql연결하기
const conn = mysql.createConnection({
    host: "hera-database.c6v9c00axeyk.ap-northeast-2.rds.amazonaws.com",
    user: "admin",
    password: "alstjq12$!!",
    port: "3306",
    database: "movies" 
})

//선연결
conn.connect();

// get 요청
app.get('/latest', (req, res) => {
    conn.query('select * from movie where mov_no limit 0, 15', 
    (err, result, fields) => {
        res.send(result);
    });
})
// 상세보기 페이지 데이터 전송
app.get('/detail/:no', (req, res) => {
    const {no} = req.params;
    conn.query(`select * from movie where mov_no=${no}`, 
    (err, result, fields) => {
        res.send(result);
    });
})

//추천 영화 페이지 데이터 전송
app.get('/recomend', (req, res) => {
    conn.query('select * from movie where mov_no limit 15, 15', 
    (err, result, fields) => {
        console.log(result);
        res.send(result);
    });
})

//개봉 예정 영화 페이지 데이터 전송 31~40번
app.get('/yetpos', (req, res) => {
    conn.query('select * from movie where mov_no limit 32, 10',
    (err, result, fields) => {
        console.log(result);
        res.send(result);
    })
})

//장르 영화 페이지 데이터 전송
app.get('/genrepage', (req, res) => {
    conn.query('select * from movie where mov_no', 
    (err, result, fields) => {
        console.log(result);
        res.send(result);
    });
})

//id 중복확인
app.post("/idch", async (req, res)=>{
    const {id} = req.body;
    console.log(id)
    conn.query(`select * from members where id ='${id}'`,
    (err, result, fields)=>{
        if(result){
            console.log(result)
            res.send(result[0])
        }
        console.log(err)
    })
})

//닉네임 중복확인
app.post("/nicname", async (req, res)=>{
    const {nicname} = req.body;
    console.log(nicname)
    conn.query(`select * from members where nicname ='${nicname}'`,
    (err, result, fields)=>{
        if(result){
            console.log(result)
            res.send(result[0])
        }
        console.log(err)
    })
})


//회원가입 요청
app.post("/join", async (req, res)=> {
    const mytextpass = req.body.password;
    let myPass = "";
    //console.log(res)
    const {id, username , nicname, password, year, month, day, email1, email2, gender} = req.body;
    console.log(req.body)
    if(mytextpass != '' && mytextpass != undefined) {
        bcrypt.genSalt(saltRounds, function(err, salt){
            bcrypt.hash(mytextpass, salt, function(err, hash){
                myPass = hash;
                conn.query(`insert into members(id,username, nicname, password, date, email1, gender) values('${id}','${username}','${nicname}','${myPass}','${year}${month}${day}','${email1}@${email2}','${gender}')`
                ,(err,result,fields)=>{
                    console.log(result)
                    if(result) {
                        console.log("성공")
                        res.send("등록되었습니다")
                    }
                    console.log(err)
                })
            })
        })
    }
    
})

//로그인 요청
app.post('/login', async (req, res)=>{
    //console.log(req.body)
    const {userid, userpassword} = req.body;
    conn.query(`select * from members where id = '${userid}'`,
    (err, result, fields)=> {
        console.log(result)
        if(result != undefined && result[0] != undefined) {
            bcrypt.compare(userpassword, result[0].password, function(err,newPassword){
                console.log(newPassword)
                console.log(userpassword)
                if(newPassword) {
                    console.log("로그인 성공")
                    //console.log(result)
                    res.send(result)
                }else {
                    //console.log(result)
                    console.log("로그인 실패")
                }
            })
        }else {
            console.log('데이터가 없습니다.')
        }
        
    })
})

//아이디찾기
app.post("/findid", async (req, res)=>{
    const {username, useremail} = req.body;
    conn.query(`select * from members where username= '${username}' and email1 = '${useremail}'`,
    (err, result, fields)=>{
        if(result){
            console.log("아이디찾기성공")
            res.send(result[0].id);
        }
        console.log(err)
    })
})

//비밀번호 찾기
app.post("/findpass", async (req, res)=>{
    const {username, userid, useremail} = req.body
    conn.query(`select * from members where username = '${username}' and email1 = '${useremail}' and id = '${userid}'`,
    (err, result, fields)=>{
        if(result) {
            console.log(result)
            res.send(result[0].email1);
        }
        console.log(err)
    })
})

//비밀번호 변경 요청
app.patch('/editpass', async (req, res) => {
    const {password, email} = req.body
    const mytextpass = password
    let myPass = ''
    if(mytextpass !='' && mytextpass != undefined) {
        bcrypt.genSalt(saltRounds, function(err, salt){
            bcrypt.hash(mytextpass, salt, function(err, hash){
                myPass = hash;
                conn.query(`update members set password = '${myPass}' where email1 = '${email}'`,
                (err, result,fields)=>{
                    if(result){
                        res.send("등록되었습니다")
                        console.log(result)
                    }
                    console.log(err)
                })
            })
        })
    }
})


app.listen(port, ()=>{
    console.log("서버가 동작하고 있습니다.")
})