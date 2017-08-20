var config = {};

config.userName = 'pankaj@*************.com';
config.pwd = '123*********************';
config.accountQuery = 'SELECT Id, Name,(SELECT id ,CreatedDate , Name FROM Attachments) FROM Account';
config.contactQuery = 'SELECT Id, Name, AccountId, Account.Name,(SELECT id ,CreatedDate , Name FROM Attachments) FROM Contact where AccountId !=null';
config.folderDir = '/';
module.exports = config;
