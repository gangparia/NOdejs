var fs = require('fs');
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
		var AccountName = (res.records[i].Name).replace(',', '').replace('.', '_').replace(/ /g, '_');
		var dir = config.folderDir + AccountName;
		dirIndexMap.set(res.records[i].Id,dir);
        if (res.records[i].Attachments != null) { 
            //console.log(dir + ' ' + !fs.existsSync(dir));
            if (!fs.existsSync(dir)) {
                console.log('creating directory'+i);
				var index = i;
                fs.mkdir(dir,index, function(err,responseDir) {
                    if (err) {
                        console.log('error in mkdir: ' + err);
                    } 
                });
                console.log('This is dir --> ' + dir);
				
            }else{
				downloadFile(res,dir,i);
			}
        } //end if
    }
	downloadContactFiles(dirIndexMap);
	
}
function downloadFile(res,dir,i ){
	if(res.records[i] && res.records[i].Attachments){
		//console.log('This is res.records[i].Attachments.totalSize  --> ' + res.records[i].Attachments.totalSize);
		for (var j = res.records[i].Attachments.totalSize - 1; j >= 0; j--) {
			//console.log('This is res.records[i] --> ' + res.records[i]);
			var filepath = dir + '/' + res.records[i].Attachments.records[j].Name;
			var fileOut = fs.createWriteStream(filepath);
			//console.log('file path' + filepath);
			if (!fs.existsSync(filepath)) {
				conn.sobject('Attachment').record(res.records[i].Attachments.records[j].Id).blob('Body').pipe(fileOut)
				.on ("error", function(error) {
					console.log(error);
				})
			}			
		} //for
	}
}
function downloadContactFiles(dirIndexMap){
	var accountIds ='(';
	for (var key of dirIndexMap.keys()) {
		console.log(key);
		accountIds += "'"+key+"',";
	}
	accountIds = accountIds.substring(0, accountIds.length-1) + ')';
	console.log(accountIds);
	conn.query('SELECT Id, Name,Account.Name,(SELECT id ,CreatedDate , Name FROM Attachments) FROM Contact where accountId IN '+accountIds, function(err, res) {
        if (err) {
            return console.error(err);
        } else {
            records.push.apply(records, res.records);
            if (res.done) {
                //console.log(records);
				 callbackContact(null, {
                    result: res,
                    records: records,
                });
            } else {
                query = conn.queryMore(res.nextRecordsUrl, handleResult);
            }
        }
    });
}

var callbackContact = function(err, result) {
    if (err) {
        throw err;
    }
    var res = result;
    console.log(res.records.length);
    for (var i = res.records.length - 1; i >= 0; i--) {     
		for (var i = res.records.length - 1; i >= 0; i--) {
			if (res.records[i].Attachments != null) {
				var AccountName = (res.records[i].Account.Name).replace(',', '').replace('.', '_').replace(/ /g, '_');
				var dir = config.folderDir + AccountName;
				dirIndexMap.set(res.records[i].Id,dir);
				console.log(dir + ' ' + !fs.existsSync(dir));
				if (!fs.existsSync(dir)) {
					console.log('creating directory'+i);
					var index = i;
					fs.mkdir(dir,index, function(err,responseDir) {
						if (err) {
							console.log('error in mkdir: ' + err);
						} 
					});
					console.log('This is dir --> ' + dir);
					
				}else{
					downloadFile(res,dir,i);
				}
			} //end if
		}
    }	
}
