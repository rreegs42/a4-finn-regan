require( 'dotenv' ).config()
const cookieSession = require('cookie-session')
const express = require('express')
const ViteExpress = require('vite-express')
const app = express()
const port = 3000


const {MongoClient, ObjectId} = require('mongodb')
//const { use } = require('react')
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@${process.env.HOST}`
const client = new MongoClient( uri )


let collection = null
let usersCollection = null

client.connect()
  .then(function() {
    collection = client.db('gametracker').collection('games')
    usersCollection = client.db('gametracker').collection('users')
    console.log('Connected to mongodb')
  })
  .catch(function(error){
    console.log('mongodb connection error:', error)
  })


app.use(express.json())

app.use(cookieSession({
  name: 'session',
  keys: ['a3-finn-regan-secret']
}))


const requireLogin = function(req, res, next) {
  console.log('Session user:', req.session.user)
  if (req.session.user) {
    next()
  } else {
    res.status(401).json({
      success: false,
      message: 'Must be logged in to view data'
    })
  }
}

app.get('/data', requireLogin, async function(req,res){

  const games = await collection.find({
    username: req.session.user
  }).toArray()
  res.json(games)

})



app.post('/login', async function (req, res) {
  const username = req.body.username
  const password = req.body.password

  const user = await usersCollection.findOne({
    username: username
  })

  //creating a new user
  if (user === null) {
    await usersCollection.insertOne({
      username: username,
      password: password
    })

    req.session.user = username
    
    res.json({
      success: true,
      newAccount: true
    })

    //successful lofin with an existing user
  } else if(user.password === password){
    req.session.user = username
    console.log('Logged in session:', req.session.user)

    res.json({
      success: true,
      newAccount: false
    })

    //failed login with an existing user
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    })
  }
})

app.post('/logout', function(req, res) {
  req.session = null

  res.json({
    success: true
  })
})

app.get('/session', function(req, res) {
  if(req.session.user){
    res.json({
      loggedIn: true,
      username: req.session.user
    })
  } else {
    res.json({
      loggedIn: false
    })
  }
})


app.post('/submit', requireLogin, async function(req, res) {

  const data = req.body

  const username = req.session.user

  console.log(data)

  let recommendation

  if( data.rating === 11){
    recommendation = 'Phenomenal, buy now'
  }else if( data.rating >= 9 ) {
    recommendation = 'Highly Recommended'
  }else if( data.rating >= 7 ) {
    recommendation = 'Recommended'
  }else if( data.rating >= 5 ) {
    recommendation = 'Mixed'
  }else {
    recommendation = 'IGN Approved (Not Recommended)'
  }
  const newGame = {
    name: data.name,
    genre: data.genre,
    hours: data.hours,
    rating: data.rating,
    recommendation: recommendation,
    username: username
  }

  await collection.insertOne(newGame)
  res.send('New game added')

})

app.delete('/delete/:id', async function(req, res){

  console.log('Delete request: ', req.params.id)

  const id = req.params.id


  await collection.deleteOne({
    _id: new ObjectId(id),
    username: req.session.user
  })

  res.send('Game deleted')
})

app.put('/edit/:id', async function(req, res) {

  const id = req.params.id
  console.log('Edit ID: ', id)


  const data = req.body

  let recommendation

  if(data.rating === 11) {
    recommendation = 'Phenomenal, buy now'
  }else if(data.rating >= 9) {
    recommendation = 'Highly Recommended'
  }else if(data.rating >= 7) {
    recommendation = 'Recommended'
  }else if(data.rating >= 5) {
    recommendation = 'Mixed'
  }else {
    recommendation = 'IGN Approved (Not Recommended)'
  }

  const result = await collection.updateOne(
    { _id: new ObjectId(id),
      username: req.session.user
    },
    {
      $set: {
        name: data.name,
        genre: data.genre,
        hours: data.hours,
        rating: data.rating,
        recommendation: recommendation
      }
    }
  )

  if(result.matchedCount === 1) {
    res.send('Game updated')
  } else {
    res.status(404).send('Game not found')
  }

})

ViteExpress.listen(app, process.env.PORT || port )
