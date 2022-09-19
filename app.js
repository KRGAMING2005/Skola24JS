const axios = require('axios');
const fs = require('fs');
const apipath = 'https://web.skola24.se/api/'
const keypath = 'get/timetable/render/key'
const unitpath = 'services/skola24/get/timetable/viewer/units'
const tablepath = 'https://web.skola24.se/timetable/timetable-viewer/'
const selectionpath = 'get/timetable/selection'
const tablerenderpath = 'render/timetable'
const signaturepath = 'encrypt/signature'

class Scope {
    scope;
    /**
     * 
     * @param {string} domain ex: skelleftea.skola24.se
     * @param {string} school Name of school
     */
    constructor(domain, school){
        this.domain = domain;
        this.school = school;
    }

    async Setup(){
        var url = tablepath+`${this.domain}/${this.school}/`
        const response = await axios.get(url);
        var data = response.data;
        var nova = '{"'+data.split('nova-widget ')[1].split('             v-cloak')[0].replace(/\n/g, '').replace(/=/g, '":').replace(/             /g, ',"').replace('help-link', ',"help-link')+'}'
        var jsonData = JSON.parse(nova)
        this.scope = jsonData.scope;
    }
}

class Cookie {
    cookie;
    /**
     * 
     * @param {string} domain ex: skelleftea.skola24.se
     * @param {string} school Name of school
     */
    constructor(domain, school) {
        this.domain = domain;
        this.school = school;
    }

    async Setup() {
        var url = `${tablepath}${this.domain}/${this.school}/`;
        const response = await axios.get(url);
        this.cookie = response.headers['set-cookie'][0].split(';')[0];
    }
}

class Unit {
    unit;
    
    constructor(domain, school, cookie, scope) {
        this.domain = domain;
        this.school = school;
        this.cookie = cookie;
        this.scope = scope;
    }

    async Setup() {
        var url = `${apipath}${unitpath}`;       
        const response = await axios({
            method: 'post',
            url: url,
            data: `{"getTimetableViewerUnitsRequest":{"hostName":"${this.domain}"}}`,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookie,
                'X-Requested-With': 'XMLHttpRequest',
                'X-scope': this.scope
            }
        });
        this.units = response.data.data.getTimetableViewerUnitsResponse;
        for (var i of this.units.units) {
            if (i.unitId.toString().toLowerCase() == this.school.toLowerCase()) {
                break
            }
        }
        this.unit = i.unitGuid;
    }
}

class Key {
    key;
    constructor(scope) {
        this.scope = scope;
    }

    async Setup() {
        var url = `${apipath}${keypath}`;
        const response = await axios({
            method: 'post',
            url: url,
            data: 'null',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-scope': this.scope
            }
        });
        this.key = response.data.data.key;
    }
}

class Clazz {
    clazz;
    /**
     * @param {string} scope new Scope().scope
     * @param {string} cookie new Cookie().cookie
     * @param {string} unit new Units().unit
     * @param {string} domain ex: skelleftea.skola24.se
     * @param {string} user either class name or personnummer
     */
    constructor(scope, cookie, unit, domain, user) {
        this.scope = scope;
        this.cookie = cookie;
        this.domain = domain;
        this.unit = unit;
        this.user = user;
    }

    async Setup() {
        var url = `${apipath}${selectionpath}`;
        var data = `{"hostName":"${this.domain}","unitGuid":"${this.unit}","filters":{"class":true,"course":false,"group":false,"period":false,"room":false,"student":true,"subject":false,"teacher":false}}`
        const response = await axios({
            method: 'post',
            url: url,
            data: data,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookie,
                'X-Requested-With': 'XMLHttpRequest',
                'X-scope': this.scope
            }
        });
        
        var jsonData = response.data.data.classes;
        //fs.writeFileSync("Classes.json", JSON.stringify(response.data.data))
        for (var clazzz of jsonData) {
            if (clazzz.groupName == this.user) {
                break
            }
        }
        this.clazz = clazzz.groupGuid;
    }
}

class Signature {
    signature;

    constructor(cookie, scope, personnummer) {
        this.cookie = cookie;
        this.scope = scope;
        this.personnummer = personnummer;
    }

    async Setup() {
        var url = `${apipath}${signaturepath}`;
        const response = await axios({
            method: 'post',
            url: url,
            data: {
                signature: `${this.personnummer}`
            },
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookie,
                'X-Requested-With': 'XMLHttpRequest',
                'X-scope': this.scope
            }
        });
        this.signature = response.data.data.signature;
    }
}

class Schedule {
    schedule;
    
    /**
     * @param {string} domain ex: skelleftea.skola24.se
     * @param {string} key new Key().key
     * @param {string} cookie new Cookie().cookie
     * @param {string} scope new Scope().scope
     * @param {string} unit new Units().unit
     * @param {string} clazz new Clazz().clazz
     * @param {string} day realative day of the week 0 for whole week?
     * @param {number} week week number
     * @param {number} year year number
     */

    constructor(domain, key, cookie, scope, unit, clazz, day, week, year) {
        this.domain = domain;
        this.key = key;
        this.cookie = cookie;
        this.scope = scope;
        this.unit = unit;
        this.clazz = clazz;
        this.day = day;
        this.week = week;
        this.year = year;
    }

    async Setup() {
        var url = `${apipath}${tablerenderpath}`
        var data = `{"renderKey":"${this.key}","host":"${this.domain}","unitGuid":"${this.unit}","startDate":null,"endDate":null,"scheduleDay":"${this.day}","blackAndWhite":false,"width":"1","height":"1","selectionType":0,"selection":"${this.clazz}","showHeader":false,"periodText":"","week":"${this.week}","year":"${this.year}","privateFreeTextMode":null,"privateSelectionMode":false,"customerKey":""}`
        const response = await axios({
            method: 'post',
            url: url,
            data: data,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookie,
                'X-Requested-With': 'XMLHttpRequest',
                'X-scope': this.scope
            }
        });
        console.log(response.data.data.lessonInfo)
    }

}

var domainName = "skelleftea.skola24.se"
var school = "Baldergymnasiet"
var target = "TE2C"
var personal = false

var scope = new Scope(domainName, school);
scope.Setup().then(() => {
    var cookie = new Cookie(domainName, school);
    cookie.Setup().then(() => {
        var units = new Unit(domainName, school, cookie.cookie, scope.scope);
        units.Setup().then(() => {
            var key = new Key(scope.scope);
            key.Setup().then(() => {
                if (!personal) {
                    var clazz = new Clazz(scope.scope, cookie.cookie, units.unit, domainName , target);
                    clazz.Setup().then(() => {
                        var schedule = new Schedule(domainName, key.key, cookie.cookie, scope.scope, units.unit, clazz.clazz, 1, 38, 2022);
                        schedule.Setup().then(() => {
                            
                        });
                    });
                }else {
                    var signature = new Signature(cookie.cookie, scope.scope, target);
                    signature.Setup().then(() => {
                        var schedule = new Schedule(domainName, key.key, cookie.cookie, scope.scope, units.unit, signature.signature, 1, 38, 2022);
                        schedule.Setup().then(() => {
                            
                        });
                    });
                }
            });
        })
    })
})