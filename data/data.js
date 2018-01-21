
const monk = require('monk');
const url = 'localhost:17709/xgllseo';
const db = monk(url);

module.exports = db;