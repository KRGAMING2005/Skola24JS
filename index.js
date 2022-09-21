const axios = require('axios');
const apipath = 'https://web.skola24.se/api/';
const keypath = 'get/timetable/render/key';
const unitpath = 'services/skola24/get/timetable/viewer/units';
const tablepath = 'https://web.skola24.se/timetable/timetable-viewer/';
const selectionpath = 'get/timetable/selection';
const tablerenderpath = 'render/timetable';
const signaturepath = 'encrypt/signature';

const domain = "skelleftea.skola24.se";
const school = "Baldergymnasiet";
const target = "TE2C";

const day = 2;
const week = 38;
const year = 2022;

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

async function getScheduleJSONPersonal(scope, cookie, unit, key, signature) {
    var url = `${apipath}${tablerenderpath}`
        var data = `{"renderKey":"${key}","host":"${domain}","unitGuid":"${unit}","startDate":null,"endDate":null,"scheduleDay":"${day}","blackAndWhite":false,"width":"1","height":"1","selectionType":0,"selection":"${signature}","showHeader":false,"periodText":"","week":"${week}","year":"${year}","privateFreeTextMode":null,"privateSelectionMode":false,"customerKey":""}`
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
        return response.data;
}

async function getSchedule() {
    let data = await initialRequest();
    let unit = await getUnit(data.scope, data.cookie);
    let key = await getKey(data.scope);
    let classes = await getClass(data.scope, data.cookie, unit);
    let signature = await getSignature(data.scope, data.cookie);
    let schedulePersonal = await getScheduleJSONPersonal(data.scope, data.cookie, unit, key, signature);
    return schedulePersonal;
  }
  
  getSchedule()
  .then(async (scheduleJSON) => {
    console.log(scheduleJSON)
  });