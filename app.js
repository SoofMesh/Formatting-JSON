const express = require('express')
const cors = require('cors')
const path = require('path')
const Test = require('./modules/test.controller')

const port = process.env.PORT || 3000

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, './public')));

app.get('/load', (req, res)=>{
  res.status(200).json(Test.solution())
})

app.listen(port, ()=>{
    console.log(`server started at port ${port}`);
});
