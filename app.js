const express = require('express');
const bodyParser = require('body-parser');
const ussdRoute = require('./index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', ussdRoute);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
