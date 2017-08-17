var config = {};

config.userName = 'pankaj@*************.com';
config.pwd = '123*********************';
config.accountQuery = 'SELECT Id, Name,(SELECT id ,CreatedDate , Name FROM Attachments) FROM Account';
config.folderDir = '/';
module.exports = config;
