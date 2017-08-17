var express = require('express')
var app = express();
var fs = require('fs');
const readline = require('readline');
var jsforce = require('jsforce');
var config = require('./config');

console.log(config.userName);
console.log(config.pwd);
var conn = new jsforce.Connection();
conn.login(config.userName, config.pwd, function(err, res) {
    if (err) {
        return console.error(err);
    }
	console.log(config.accountQuery);
    conn.query(config.accountQuery, function(err, res) {
        if (err) {
            return console.error(err);
        } else {
            records.push.apply(records, res.records);
            if (res.done) {
                callbackAccount(null, {
                    result: res,
                    records: records
                });
            } else {

                query = conn.queryMore(res.nextRecordsUrl, handleResult);
            }
        }
        console.log(res);
    });
});


var records = [];

var dirIndexMap = new Map();
var callbackAccount = function(err, result) {
    if (err) {
        throw err;
    }
    var res = result;
    console.log(res.records.length);
	
    for (var i = res.records.length - 1; i >= 0; i--) {
		
        if (res.records[i].Attachments != null) {
            console.log('is null ' + res.records[i].Attachments.totalSize);
            console.log(res.records[i].Name);
            console.log(res.records[i].Name + 'Have Attachments');
            var AccountName = (res.records[i].Name).replace(',', '').replace('.', '_').replace(/ /g, '_');
            var dir = config.folderDir + AccountName;
			
            console.log(dir + ' ' + !fs.existsSync(dir));
            if (!fs.existsSync(dir)) {
                console.log('creating directory'+i);
                //fs.mkdirSync(dir);
				console.log('i is --> '+i);
				var index = i;
                fs.mkdir(dir,index, function(err,responseDir) {
                    if (err) {
                        console.log('error in mkdir: ' + err);
                    } else {
						console.log('log in callback')
						console.log('index i --> '+i+'----> '+ dirIndexMap.get(dir)+'--index-->'+index );
						console.log(dirIndexMap.get('/pankaj'));
                    }
                });
                console.log('This is dir --> ' + dir);
				dirIndexMap.set(dir,i);
				console.log('index i --> '+i+'----> '+ dirIndexMap.get(dir)+'--index-->'+index );
            }else{
				downloadFile(res,dir,i);
			}
        } //end if
    }
}
function downloadFile(res,dir,i ){
	console.log('in download File');
	if(res.records[i] && res.records[i].Attachments){
		console.log('This is res.records[i].Attachments.totalSize  --> ' + res.records[i].Attachments.totalSize);
		for (var j = res.records[i].Attachments.totalSize - 1; j >= 0; j--) {
			console.log('This is res.records[i] --> ' + res.records[i]);
			var filepath = dir + '/' + res.records[i].Attachments.records[j].Name;
			var fileOut = fs.createWriteStream(filepath);
			console.log('file path' + filepath);
			if (!fs.existsSync(filepath)) {
				console.log('in existsSync');			
				conn.sobject('Attachment').record(res.records[i].Attachments.records[j].Id).blob('Body').pipe(fileOut)
				.on ("error", function(error) {
					console.log(error);
				})
				console.log('fter existsSync');
			}
			console.log('test firstr');
			
		} //for
	}
}

function downloadFiles(res,dirIndexMap ){
	console.log('in dowbloadFiles');
	console.log(dirIndexMap);
	for (var [key, value] of dirIndexMap) {
		console.log('--key--> '+key);
		console.log('--value--> '+value);
		i = value;
		var dir = key;
		if(res.records[i] && res.records[i].Attachments){
			console.log('This is res.records[i].Attachments.totalSize  --> ' + res.records[i].Attachments.totalSize);
			for (var j = res.records[i].Attachments.totalSize - 1; j >= 0; j--) {
				console.log('This is res.records[i] --> ' + res.records[i]);
				var filepath = dir + '/' + res.records[i].Attachments.records[j].Name;
				console.log('file path' + filepath);
				if (!fs.existsSync(filepath)) {
					console.log('in existsSync');
					conn.sobject('Attachment').record(res.records[i].Attachments.records[j].Id).blob('Body').pipe(fs.createWriteStream(filepath)).then(
						function(res){
							console.log('created : ' + res);
							console.log('**************************');
						}
					);
					console.log('fter existsSync');
				}
				console.log('test firstr');
				// 
			} //for
		}
	}
}
app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
    response.send('Hello World!')
})

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})
