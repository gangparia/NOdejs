var config = {};

config.userName = 'pankaj@sharepoint.com';
config.pwd = '123topcoder54iMFCJsvAwHHWpUhAob6hunF';
config.accountQuery = 'SELECT Id, Name,(SELECT id ,CreatedDate , Name FROM Attachments) FROM Account';
config.folderDir = '/';
module.exports = config;
