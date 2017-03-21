const express = require('express')
const path = require('path')

const app = express()

app.get('/bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.js'))
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})


app.listen(3000, '0.0.0.0', (err) => {
  if (err) {
    console.log(err)
    return
  }

  console.log('Listening at http://0.0.0.0:3000')
})
