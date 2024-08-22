var express = require('express');
const app = express();
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
mongoose.connect('mongodb+srv://khoibut09:0934134837khoi@extramixture.s58rz.mongodb.net/?retryWrites=true&w=majority&appName=Extramixture')
const setSchema = new mongoose.Schema({
  id: Number,
  name: String,
  questions: Array,
  author: Number,
  lastEdited: Date,
  playCount: Number,
})
const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  password: String,
  email: String,
})
const assignmentSchema = new mongoose.Schema({
  id: Number,
  author: Number,
  set: Number,
  goal: Number,
  point: Number,
  players: Array,
  playCount: Number,
  expireDate: Date,
})
const Assignment = mongoose.model('Assignment', assignmentSchema)
const User = mongoose.model('User', userSchema)
const Set = mongoose.model('Set', setSchema)

var router = express.Router();
router.post('/auth', function (req, res) {
  jwt.verify(req.body.token, 'secret', function (err, decoded) {
    if (err) {
      res.send({ error: "Invalid token", status: 400 })
    } else {
      res.send({ status: 200, username: decoded.username })
    }
  })
})
router.post('/auth/login', function (req, res) {
  User.find({ email: req.body.email, password: req.body.password }).exec().then((data) => {
    if (data.length > 0) {
      const token = jwt.sign({ email: data[0].email, password: data[0].password, username: data[0].username, id: data[0].id }, 'secret')
      res.send({ token: token, status: 200 })
    } else {
      res.send({ error: "Email or password is incorrect", status: 400 })
    }
  })
})
router.post('/auth/register', function (req, res) {
  User.find({}).exec().then((userID) => {
    User.find({ username: req.body.username }).exec().then((data) => {
      if (data.length > 0) {
        res.send({ error: "Username already exists", status: 400, type: "username" })
      } else {
        User.find({ email: req.body.email }).exec().then((data) => {
          if (data.length > 0) {
            res.send({ error: "Email already exists", status: 400 })
          } else {
            const user = new User({
              id: userID.length + 1,
              username: req.body.username,
              password: req.body.password,
              email: req.body.email,
            })
            User.create(user).then((data) => {
              res.sendStatus(200)
            }).catch((err) => {
              console.log(err)
              res.sendStatus(400)
            })
          }
        })
      }
    })
  })
})
router.post('/addset', function (req, res) {
  jwt.verify(req.body.author, 'secret', function (err, decoded) {
    Set.find({}).exec().then((data) => {
      const set = new Set({
        id: data.length + 1,
        name: req.body.name,
        questions: req.body.questions,
        author: decoded.id,
        lastEdited: new Date(req.body.lastEdited),
        playCount: 0,
      })
      Set.create(set).then((data) => {
        res.sendStatus(200)
      }).catch((err) => {
        console.log(err)
        res.sendStatus(400)
      })
    });
  })
})
router.patch('/editquestion/:id', function (req, res) {
  Set.find({ id: req.params.id }).exec().then((data) => {
    const questions = data[0].questions
    const question = {
      question: req.body.question,
      type: req.body.type,
      options: req.body.options,
      correct: req.body.correct,
    }
    questions[req.body.index] = question
    Set.updateOne({ id: req.params.id }, { questions: questions }).exec().then((data) => {
      res.sendStatus(200)
    }).catch((err) => {
      console.log(err)
      res.sendStatus(400)
    })
  })
})
router.post('/deletequestion/:id', function (req, res) {
  Set.find({ id: req.params.id }).exec().then((data) => {
    var questions = data[0].questions
    console.log(req.body)
    questions.splice(req.body.index,1)
    Set.updateOne({ id: req.params.id }, { questions: questions }).exec().then((data) => {
      res.sendStatus(200)
    }).catch((err) => {
      console.log(err)
      res.sendStatus(400)
    })
  })
})
router.get('/getquestions/:id', function (req, res) {
  Set.find({ id: req.params.id }).exec().then((data) => {
    res.send(data[0].questions)
  })
})
router.post('/addquestions/:id', function (req, res) {
  Set.find({ id: req.params.id }).exec().then((data) => {
    const questions = data[0].questions
    questions.push(req.body)
    Set.updateOne({ id: req.params.id }, { questions: questions }).exec().then((data) => {
      res.sendStatus(200)
    }).catch((err) => {
      console.log(err)
      res.sendStatus(400)
    })
  })
})
router.post('/addquestion/:id', function (req, res) {
  Set.find({ id: req.params.id }).exec().then((data) => {
    const newQuestions = data[0].questions.concat(req.body)
    Set.updateOne({ id: req.params.id }, { questions: newQuestions }).exec().then((data) => {
      res.sendStatus(200)
    }).catch((err) => {
      console.log(err)
      res.sendStatus(400)
    })
  })
})
router.get('/getset/:token', function (req, res) {
  jwt.verify(req.params.token, 'secret', function (err, decoded) {
    Set.find({ author: decoded.id }).exec().then((data) => {
      res.send(data)
    })
  })
})
router.get('/getassignment/:id', function (req, res) {
  Assignment.find({ id: req.params.id }).exec().then((data) => {
    Set.find({ id: data[0].set }).exec().then((data) => {
      res.send(data)
    })
  })
})
router.get('/checkgameexist/:id', function (req, res) {
  Assignment.find({ id: req.params.id }).exec().then((data) => {
    console.log(data)
    if (data.length > 0) {
      res.send({ status: 200, data: true })
    } else {
      res.send({ status: 200, data:false })
    }
  })
})
router.post('/newassignment', function (req, res) {
  jwt.verify(req.body.author, 'secret', function (err, decoded) {
    Assignment.find({}).exec().then((data) => {
      Assignment.create({
        id: data.length + 1,
        set: req.body.set,
        author: decoded.id,
        goal: req.body.goal,
        point: req.body.point,
        players: [],
        playCount: 0,
        expireDate:req.body.deadline,
      }).then((data) => {
        res.send(data)
      }
      ).catch((err) => {
        console.log(err)
        res.sendStatus(400)
      })
    })
  })
})
module.exports = router;
