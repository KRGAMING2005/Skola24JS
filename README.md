# Skola24WrapperJS
#### Usage:
```js
const skola24 = require('skola24');

skola24.setDomain('xxx.skola24.se'); // The skola24 subdomain that your school uses.
skola24.setSchool(''); // The name of your school.
skola24.setTarget(''); // You can use either a name of a class or a swedish personnummer YYYYMMDDXXXX.
skola24.setDay(5); // The day of the week 1 for monday 5 for friday.
skola24.setWeek(38); // The week of the year.
skola24.setYear(2022); // The year.
skola24.getSchedule().then((jsonData) => {  // The function getSchedule() is asynchronous an therefore need to be used with .then to extract the data.
    console.log(jsonData);
});

// Or

skola24.setDomain('xxx.skola24.se').setSchool('').setTarget('').setDay(5).setWeek(38).setYear(2022).getSchedule().then((jsonData) => {
    console.log(jsonData);
});
```