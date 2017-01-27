var request = require('superagent');
var moment = require('moment');

var final = [];
var centers;
var request_count = 0;
var generateArray = [];

const args = process.argv;
var dns = args[2];

if (dns == 'pt') {
    var dns = 'https://grability.elcorteingles.pt';

} else {
    var dns = 'https://grability.elcorteingles.es';
}

var generateDbsOneByOne = function(dbs) {

  var store = dbs[0].split('-')[0]
  var device = dbs[0].split('-')[1]
  store = (store.length < 6) ? '0' + store : store;
  console.log('Generating version for ' + store + ' device '+device)
  request
     .post(dns+'/api/versions/create')
     .set('Accept', 'application/json')
     .send({device: device, store: store, "club-gourmet": false})
     .end(function(err, res){
           if (err || !res.ok) {
              console.log('Oh errror: '+store+' device: '+device)
              console.log(res.body)
              dbs.shift()
              if ( dbs.length ) {
                generateDbsOneByOne(dbs)
              }
           } else {
                console.log('Db generated ' + store + ' device '+device)
                console.log(res.body)
                dbs.shift()
                if ( dbs.length ) {
//                  generateDbsOneByOne(dbs)
                }
           }
     })
}
var getDBversion = function(device, store) {
      request
         .get(dns+'/api/versions/published/' + device + '/' + store)
         .set('Accept', 'application/json')
         .end(function(err, res){
           request_count++;
           if (err || !res.ok) {
              console.log('Oh errror: '+store+' device: '+device)
           } else {

              final.push({ "store": store+"-"+device, "timestamp": res.body.timestamp })

              if (request_count == (centers.length * 2 )) {
                final.sort(function(a,b){
                  var momentA = moment(a.timestamp, 'YYYY-MM-DD HH:mm:ss')
                  var momentB = moment(b.timestamp, 'YYYY-MM-DD HH:mm:ss')
                  if (momentA > momentB) return 1;
                  else if (momentA < momentB) return -1;
                  else return 0;
                })
                var last = final[final.length - 1]
                var a = Date.parse(last.timestamp)
                final.forEach(function(item, key){
                    var b = Date.parse(item.timestamp)
                    var diff = Math.ceil( (a - b) / (1000 * 60 ) )
                    // 180 minutes
                    if (diff > 180) {
                        generateArray.push(item.store)
                    }
                })
                 console.log(generateArray)
                 console.log(final)
                 if (generateArray.length) {
                    generateDbsOneByOne(generateArray)
                 }
              }
           }
         });

};

request
   .get(dns+'/eci/centers')
   .set('Accept', 'application/json')
   .end(function(err, res){
     if (err || !res.ok) {
      console.log(res);
       console.log('Oh no! error');
     } else {
       centers = res.body;

       centers.map(function(center){
          getDBversion(1, center.id)
          getDBversion(2, center.id)
       })
     }
   });
