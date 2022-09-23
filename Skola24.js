const axios = require('axios');
const apipath = 'https://web.skola24.se/api/';
const keypath = 'get/timetable/render/key';
const unitpath = 'services/skola24/get/timetable/viewer/units';
const tablepath = 'https://web.skola24.se/timetable/timetable-viewer/';
const selectionpath = 'get/timetable/selection';
const tablerenderpath = 'render/timetable';
const signaturepath = 'encrypt/signature';

var domain = undefined;
var school = undefined;
var target = undefined;
var day = undefined;
var week = undefined;
var year = undefined;

function getDomain() {
    return domain;
}

function setDomain(newDomain) {
    domain = newDomain;
    return this;
}

function getSchool() {
    return school;
}

function setSchool(newSchool) {
    school = newSchool;
    return this;
}

function getTarget() {
    return target;
}

function setTarget(newTarget) {
    target = newTarget;
    return this;
}

function getDay() {
    return day;
}

function setDay(newDay) {
    day = newDay;
    return this;
}

function getWeek() {
    return week;
}

function setWeek(newWeek) {
    week = newWeek;
    return this;
}

function getYear() {
    return year;
}

function setYear(newYear) {
    year = newYear;
    return this;
}

async function initialRequest() {
    var url = `${tablepath}${domain}/${school}`;
    const response = await axios.get(url);
    var data = response.data;
    var nova = '{"'+data.split('nova-widget ')[1].split('             v-cloak')[0].replace(/\n/g, '').replace(/=/g, '":').replace(/             /g, ',"').replace('help-link', ',"help-link')+'}';
    var json = JSON.parse(`{"scope": "${JSON.parse(nova).scope}", "cookie": "${response.headers['set-cookie'][0].split(';')[0]}"}`);
    return json;
}
  
async function getUnit(scope, cookie) {
    var url = `${apipath}${unitpath}`;
    const response = await axios({
        method: 'post',
        url: url,
        data: `{"getTimetableViewerUnitsRequest":{"hostName":"${domain}"}}`,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'X-Requested-With': 'XMLHttpRequest',
            'X-scope': scope
        }
    });
    for (var unit of response.data.data.getTimetableViewerUnitsResponse.units) {
        if (unit.unitId.toString().toLowerCase() == school.toLowerCase()) {
            return unit.unitGuid;
        }
    }
    return null;
}

async function getKey(scope) {
    var url = `${apipath}${keypath}`;
    const response = await axios({
        method: 'post',
        url: url,
        data: 'null',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-scope': scope
        }
    });
    return response.data.data.key;
}

async function getClass(scope, cookie, unit) {
    var url = `${apipath}${selectionpath}`;
        var data = `{"hostName":"${domain}","unitGuid":"${unit}","filters":{"class":true,"course":false,"group":false,"period":false,"room":false,"student":true,"subject":false,"teacher":false}}`;
        const response = await axios({
            method: 'post',
            url: url,
            data: data,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie,
                'X-Requested-With': 'XMLHttpRequest',
                'X-scope': scope
            }
        });
        
        var jsonData = response.data.data.classes;
        for (var clazzz of jsonData) {
            if (clazzz.groupName == target) {
                return clazzz.groupGuid;
            }
        }
        return null;
}

async function getSignature(scope, cookie) {
    var url = `${apipath}${signaturepath}`;
    const response = await axios({
        method: 'post',
        url: url,
        data: {
            signature: `${target}`
        },
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'X-Requested-With': 'XMLHttpRequest',
            'X-scope': scope
        }
    });
    return response.data.data.signature;
}

async function getScheduleJSONClass(scope, cookie, unit, key, clazz) {
    var url = `${apipath}${tablerenderpath}`
    var data = `{"renderKey":"${key}","host":"${domain}","unitGuid":"${unit}","startDate":null,"endDate":null,"scheduleDay":"${day}","blackAndWhite":false,"width":"1223","height":"618","selectionType":0,"selection":"${clazz}","showHeader":false,"periodText":"","week":"${week}","year":"${year}","privateFreeTextMode":null,"privateSelectionMode":false,"customerKey":""}`
    const response = await axios({
        method: 'post',
        url: url,
        data: data,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'X-Requested-With': 'XMLHttpRequest',
            'X-scope': scope
        }
    });

    return response.data.data.lessonInfo;
}

async function getScheduleJSONPersonal(scope, cookie, unit, key, signature) {
    var url = `${apipath}${tablerenderpath}`
    var data = `{"renderKey":"${key}","host":"${domain}","unitGuid":"${unit}","startDate":null,"endDate":null,"scheduleDay":"${day}","blackAndWhite":false,"width":"1223","height":"618","selectionType":4,"selection":"${signature}","showHeader":false,"periodText":"","week":"${week}","year":"${year}","privateFreeTextMode":null,"privateSelectionMode":false,"customerKey":""}`
    const response = await axios({
        method: 'post',
        url: url,
        data: data,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'X-Requested-With': 'XMLHttpRequest',
            'X-scope': scope
        }
    });

    return response.data.data.lessonInfo;
}

function isPersonnummer() {
    return /^[0-9]+$/.test(target);
}

async function getSchedule() {
    let data = await initialRequest();
    let unit = await getUnit(data.scope, data.cookie);
    let key = await getKey(data.scope);
    if (isPersonnummer()) {
        let signature = await getSignature(data.scope, data.cookie);
        let schedulePersonal = await getScheduleJSONPersonal(data.scope, data.cookie, unit, key, signature);
        return schedulePersonal;
    }else {
        let classes = await getClass(data.scope, data.cookie, unit);
        let scheduleClass = await getScheduleJSONClass(data.scope, data.cookie, unit, key, classes);
        return scheduleClass;
    }
  }
/*  
getSchedule()
  .then(async (scheduleJSON) => {
    console.log(scheduleJSON)
  });
*/

module.exports = {
    getDomain: getDomain,
    setDomain: setDomain,
    getSchool: getSchool,
    setSchool: setSchool,
    getTarget: getTarget,
    setTarget: setTarget,
    getDay: getDay,
    setDay: setDay,
    getWeek: getWeek,
    setWeek: setWeek,
    getYear: getYear,
    setYear: setYear,
    getSchedule: getSchedule
}