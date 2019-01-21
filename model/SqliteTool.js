let fs = require("fs");
let crypto = require("crypto");
let path = require('path');

let file = path.join(__dirname, "data.db");
let exists = fs.existsSync(file);

if (!exists) {
    fs.openSync(file, "w");
}
let fileBuffer = fs.readFileSync(file);
let SQL = require('sql.js');

let db = new SQL.Database(fileBuffer);
/**
 * @return {string}
 */
db.SHA256 = function (str) {
    return crypto.createHash('sha256').update(str).digest('hex')
};


db.Init = function (username, password) {
    if (!exists) {
        db.IsExists = exists = true;
        db.run(`
            CREATE TABLE [UserList](
               [ID]             INTEGER     PRIMARY KEY AUTOINCREMENT    NOT NULL,
               [User]           CHAR(150)   NOT NULL UNIQUE,
               [Name]           TEXT        NOT NULL,
               [Password]       CHAR(255)    NOT NULL
            );`,{});

        db.run(`INSERT INTO [UserList]([User],[Name],[Password]) VALUES($User,$Name,$Password)`,
            {
                $User: username,
                $Name: username,
                $Password: db.SHA256(password),
            });
        let data = db.export();
        let buffer = Buffer.from(data);
        fs.writeFileSync(file, buffer);
    }
};

db.IsExists = exists;

module.exports = db;