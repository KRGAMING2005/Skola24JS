const skola24 = require('./index');

skola24.setDomain('skelleftea.skola24.se').setSchool('Baldergymnaiset');
console.log(`${skola24.getDomain()} \n${skola24.getSchool()}`)