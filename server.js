require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose=require("mongoose")
const bodyParser=require("body-parser")
const Schema=mongoose.Schema

//Using Middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
//DB Schema & Model
const urlSchema=new Schema({
  original:{
    type:String,
    required:true
    },
  short:Number
})
const Url=mongoose.model("Url",urlSchema)
//Mongodb
mongoose.connect(process.env.DB_URI,{useNewUrlParser:true})
.then(()=>console.log("Connected"))
.catch(err=>console.error(err))

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//Post Original Url
let responseObject={}
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }) , (request, response) => {
  let inputUrl = request.body['url']
  
  httpRegex = /^(http|https)(:\/\/)/; 
  if (!httpRegex.test(inputUrl)) {return response.json({ error: 'invalid url' })}
    
  responseObject['original_url'] = inputUrl
  
  let inputShort = 1
  
  Url.findOne({})
        .sort({short: 'desc'})
        .exec((error, result) => {
          if(!error && result != undefined){
            inputShort = result.short + 1
          }
          if(!error){
            Url.findOneAndUpdate(
              {original: inputUrl},
              {original: inputUrl, short: inputShort},
              {new: true, upsert: true },
              (error, savedUrl)=> {
                if(!error){
                  responseObject['short_url'] = savedUrl.short
                  response.json(responseObject)
                }
              }
            )
          }
  })
  
})

app.get('/api/shorturl/:input', (request, response) => {
  let input = request.params.input
  
  Url.findOne({short: input}, (error, result) => {
    if(!error && result != undefined){
      response.redirect(result.original)
    }else{
      response.json('URL not Found')
    }
  })
})
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
