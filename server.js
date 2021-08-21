const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;
const bodyParser = require("body-parser");

// =================================================================
// Schemas, Models

const UserSchema = new Schema({
  username: String
});

const User = mongoose.model('User', UserSchema);

const ExerciseSchema = new Schema({
  user: UserSchema,
  description: String,
  duration: Number,
  date: Date
})

const Exercise = mongoose.model('Exercise', ExerciseSchema);


// =================================================================
//

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))

app.use((req, res, next) => {
  console.log(req.method, req.path, ' - ', req.ip);
  console.log(`req`, req); // DEBUG
  next();
})

// =================================================================
// 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// =================================================================
// GET, POST '/api/users'

app.route('/api/users')
   .post((req, res) => {
     if (/^[a-zA-Z]+[\w]*$/.test(req.body.username)) {
       // Use User.findOne() for no duplicate username.
       const newUser = new User({ username: req.body.username });
       newUser.save((error, data) => {
         if (error) throw error;
         res.json(data);
       });
     }
   })
   .get((req, res) => {
     User.find({}, (error, data) => {
       if (error) throw error;
       res.json(data);
     })
   });


// =================================================================
// POST '/api/users/:_id/exercises'

const getDateString = date => {
  return date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDay().toString().padStart(2, '0');
}

app.post('/api/users/:_id/exercises', (req, res) => {
    User.findById(req.params._id, (error, user) => {
      if (error) throw error;
      if (user && req.body.description && req.body.duration) {
        const exercise = new Exercise({
          user,
          description: req.body.description,
          duration: req.body.duration,
          date: req.body.date ? new Date(req.body.date) : new Date()
        })
        exercise.save((error, savedExercise) => {
          if (error) throw error;
          res.json({
            _id: user._id,
            username: user.username,
            description: savedExercise.description,
            duration: savedExercise.duration,
            date: savedExercise.date.toDateString()
          })
        })
      }
    })  
})


// =================================================================
// GET '/api/users/:_id/logs'

app.get('/api/users/:_id/logs', (req, res) => {
  User.findById(req.params._id, (error, user) => {
    if (error) throw error;
    if (user) {
      const done = (error, exercises = []) => {
        res.json({
          _id: user._id,
          username: user.username,
          log: exercises,
          count: exercises.length
        })
      };

      // LINK https://stackoverflow.com/a/16002726/16194414
      const query = Exercise.find({
        'user._id': user._id
      });
      if (req.query.from) {
        query.where('date').gte(new Date(req.query.from));
      }
      if (req.query.to) {
        query.where('date').lte(new Date(req.query.to));
      }
      if (!isNaN(req.query.limit)) {
        query.limit(parseInt(req.query.limit));
      }
      
      query.exec(done);
    }
  })
});

// =================================================================
//

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
