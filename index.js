var fs = require('fs');
var jsforce = require('jsforce');
var config = require('./config');
var log4js = require('log4js');

// timestamp for unique fileName
var timestamp = new Date().getTime().toString();
var logFilePath = config.folderDir + 'site_' + timestamp + '.log';
log4js.configure({
    appenders: {
        out: {
            type: 'console'
        },
        app: {
            type: 'file',
            filename: logFilePath
        }
    },
    categories: {
        default: {
            appenders: ['out', 'app'],
            level: 'debug'
        }
    }
});
var logger = log4js.getLogger();


// connection to salesforce
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
var accountRecordCount = 0;
var contactRecordCount = 0;
var numberOfAttachmentCount = 0;
var numberOfFolderCreated = 0;
var isDownloadFiles = true;

//fetch all account attachments
var callbackAccount = function(err, result) {
    if (err) {
        logger.warn('error in account callback ' + err);
        throw err;
    }
    var res = result;
    logger.info('Number of Accounts: ' + res.records.length);
    for (var i = res.records.length - 1; i >= 0; i--) {
        var AccountName = (res.records[i].Name).replace(',', '').replace('.', '_').replace(/ /g, '_');
        var dir = config.folderDir + AccountName;
        dirIndexMap.set(res.records[i].Id, dir);
        if (res.records[i].Attachments != null) {
            accountRecordCount++;
            if (!fs.existsSync(dir)) {
                console.log('creating directory' + i);
                isDownloadFiles = false;
                var index = i;
                numberOfFolderCreated++;
                fs.mkdir(dir, index, function(err, responseDir) {
                    if (err) {
                        console.log('error in mkdir: ' + err);
                    }
                });
                logger.info('New Directory :' + dir);
            } else {
                downloadFile(res, dir, i, 'Account Attachment :');
            }
        } //end if
    }

    downloadContactFiles(dirIndexMap);

}

// download file either from Account attachment or contact attachment
function downloadFile(res, dir, i, msg) {
    if (res.records[i] && res.records[i].Attachments) {
        for (var j = res.records[i].Attachments.totalSize - 1; j >= 0; j--) {
            var filepath = dir + '/' + res.records[i].Attachments.records[j].Name;
            logger.info('is file exist already' + fs.existsSync(filepath));
            numberOfAttachmentCount++;
            if (!fs.existsSync(filepath) && res.records[i].Attachments.records[j]) {
                var fileOut = fs.createWriteStream(filepath);
                logger.info(msg + fileOut.path);
                conn.sobject('Attachment').record(res.records[i].Attachments.records[j].Id).blob('Body').pipe(fileOut)
                    .on("error", function(error) {
                        logger.warn('error in file :  ' + error);
                    })
            }
        } //for
    }
}

// fetch all contact attachment 
function downloadContactFiles(dirIndexMap) {
    var accountIds = '(';
    for (var key of dirIndexMap.keys()) {
        accountIds += "'" + key + "',";
    }
    accountIds = accountIds.substring(0, accountIds.length - 1) + ')';
    //console.log(accountIds);
    conn.query('SELECT Id, Name, AccountId, Account.Name,(SELECT id ,CreatedDate , Name FROM Attachments) FROM Contact where accountId IN ' + accountIds, function(err, res) {
        if (err) {
            logger.warn('error in contact attachment query :  ' + err);
            return console.error(err);
        } else {
            records.push.apply(records, res.records);
            if (res.done) {
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
        logger.warn('error in contact callback ' + err);
        throw err;
    }
    var res = result;
    logger.info('Number of Contacts: ' + res.records.length);
    var contactRecordCount = 0;
    for (var i = res.records.length - 1; i >= 0; i--) {
        if (res.records[i] && res.records[i].Attachments && res.records[i].AccountId) {
            contactRecordCount++;
            var AccountName = (res.records[i].Account.Name).replace(',', '').replace('.', '_').replace(/ /g, '_');
            var dir = config.folderDir + AccountName;
            dirIndexMap.set(res.records[i].Id, dir);
            if (!fs.existsSync(dir)) {
                numberOfFolderCreated++;
                var index = i;
                fs.mkdir(dir, index, function(err, responseDir) {
                    if (err) {
                        logger.warn('error in mkdir: ' + err);
                    }
                });
                logger.info('New Directory :' + dir);
            } else if (isDownloadFiles) {
                downloadFile(res, dir, i, 'Contact Attachment :');
            }
        } //end if
    }

    logger.info('Number of account record having attachments : ' + accountRecordCount);
    logger.info('Number of contact record having attachments : ' + contactRecordCount);
    logger.info('Number of folder created : ' + numberOfFolderCreated);
    logger.info('Number of  attachments downloaded : ' + numberOfAttachmentCount);
    console.log('outttttttttttttttttttttttttttttttttttttttttttttttt');
}
