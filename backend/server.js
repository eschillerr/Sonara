const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('api/get/hola', (req, res) => {
    res.send('Hola Mundo');
})

app.listen(3000, () => {
    console.log('Server running on port 3000');
})
