// Import Dependencies
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcrypt')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const db = require('./config/db')
const userSeed = require('./userSeed')
const User = require('./models/user')


// Instantitate DB connection 
mongoose.connect(db, {useNewUrlParser : true})

// Log on first connection
mongoose.connection.once('open', () => console.log('Connected to MongoDB'))

//Require Passport Strategy and Options
const strategy = require('./lib/passportStrategy');
const jwtOptions = require('./lib/passportOptions');

const saltRounds = 10;

//Require Route Files
const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')

// Instantiate express server object 
const app = express()

// Define port
const port = process.env.Port || 5001
const reactPort = 3000;
   
// Middleware -
//  Converts JSON to Javacript Object
app.use(express.json())
app.use(express.static("."));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || `http://localhost:${reactPort}`}))

passport.use(strategy);
/** 
 * Routes
 * 
 * Mount imported Routers
*/
app.use(indexRouter);
app.use(usersRouter);

        
// Create user in register      
app.post('/api/register', (req, res) => {

    bcrypt.genSalt(saltRounds)
        .then((salt) => {
            console.log(salt);
            return bcrypt.hash(req.body.user.password, salt);
        })
        .then((hash) => {
            const user = new User({ ...req.body.user, password: hash });
            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'User created successfully' });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: error.message });
        });
});

app.post('/api/login', (req, res) => {
    if (req.body.user.userName && req.body.user.password) {
      User.findOne({userName: req.body.user.userName})
        .then((user) => {
          if (!user) {
            return res.status(401).json({ success: false, message: 'user not found' });
          }
  
          return bcrypt.compare(req.body.user.password, user.password)
            .then((isMatch) => {
              if (isMatch) {
                const payload = { id: user.id };
                const token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: 600 });
    
                return res.status(200).json({ success: true, token: token, message: 'User logged in successfully' });
              }
  
              return res.status(401).json({ success: false, message: 'passwords do not match' });
            })
            .catch((error) => {
              return res.status(500).json({ message: 'error' });
            });
        })
        .catch((error) => {
          return res.status(500).json({ message: 'error' });
        });
    } else {
      return res.status(400).json({ error: 'Username & Password Required' });
    }
  });
  
//   app.post('/api/login', (req, res) => {
//     if (req.body.loginDetails.userName && req.body.loginDetails.password) {
//     //   bcrypt.genSalt(saltRounds)
//     //     .then((salt) => {
//     //         console.log(salt);
//     //         return bcrypt.hash(req.body.loginDetails.password, salt);
//     //     })
//         // .then(() => {
//             User.findOne({userName: req.body.loginDetails.userName})
//         // })
//         .then((user) => {
//             console.log(user)
//             console.log(req.body)

//             bcrypt.compare(req.body.password, user.password, function(err, res) {
//                 if (err){
//                   // handle error
//                   res.status(500).json({ message: 'error' });
//                 }
//                 if (res) {
//                   // Send JWT
//                   const payload = {
//                     id: user.id
//                   };
            
//                   // Build a JSON Web Token using the payload
//                   const token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: 600 }); // 10 minutes
            
//                   // Send the JSON Web Token back to the user
//                   res.status(200).json({ success: true, token: token, message: 'User logged in successfully' });
//                 } else {
//                   // response is OutgoingMessage object that server response http request
//                   res.status(401).json({success: false, message: 'passwords do not match'});
//                 }
//               });

           
//         })
//         .catch((error) => {
//             console.error(error);
//             res.status(500).json({ error: error.message });
//         });
//     } else {
//       res.status(400).json({ error: 'Username & Password Required' });
//     }
//   });


   // this is the minimum needed to protect your route from users who aren't logged in
   app.get('/api/protected', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.status(200).json({
      message: 'Hey, you can only see this message with the JSON Web Token.',
      user: req.user
    });
  });

  app.get('/test', (req, res) => {
    bcrypt.hash('1234', saltRounds, (error, hash) =>{
        res.status(200).json({ password: hash});
    });
}) 

// User.insertMany(userSeed, (error, users) => {
//     if(error) {
//         console.log(error)
//     }else {
//         console.log(users)
//     }
    
// })


app.post('/api/register', (req, res) => {
    console.log(req.body.password);

    bcrypt.genSalt(saltRounds)
        .then((salt) => {
            console.log(salt);
            return bcrypt.hash(req.body.user.password, salt);
        })
        .then((hash) => {
            const user = new User({ ...req.body.user, password: hash });
            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'User created successfully' });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: error.message });
        });
});


app.post('/api/login', (req, res) => {
    User.findOne(req.body.userName)
    if (req.body.userName && req.body.password) {
        if (req.body.userName === User.userName && req.body.password === User.password) {
            const payload = {
                userName: User.userName,

            }

            const token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: 600 })

            res.status(200).json({ success: true, token: token })
        } else {
            res.status(401).json({ error: 'invalid username or password' })
        }
    } else {
        res.status(400).json({ error: 'Username & Password Required' })
    }
})


app.get('/api/protected', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.status(200).json({ message: 'hello you need a web token to see this', user: req.user })
})

// Ensuring the server is listening to the port
app.listen(port, () => console.log(`Backend listening on port:${port}`))