var fs = require("fs");
var crypto = require("crypto");
var file = "data.db";
var exists = fs.existsSync(file);

if (!exists) {
    fs.openSync(file, "w");
}

let sqlite3 = require('sqlite3-promise');
let db = new sqlite3.Database(file);
/**
 * @return {string}
 */
db.SHA256 = function (str) {
    return crypto.createHash('sha256').update(str).digest('hex')
};

db.Exec = function (sql, prepareData, callback, errCallback) {
    db.parallelize(async function () {
        {
            try {
                await db.runAsync(`BEGIN TRANSACTION`);
                let stmt = db.prepare(sql);
                for (let i = 0; i < prepareData.length; i++) {
                    if (prepareData.hasOwnProperty(i)) {
                        stmt.run(prepareData[i]);
                    }
                }

                await db.runAsync(`COMMIT TRANSACTION`);
            } catch (e) {
                console.error(e);
                // await db.runAsync(`Rollback Transaction`);
            }

            if (typeof callback === "function") {
                callback();
            }
        }
    });
};

db.Init = function (username, password) {
    if (!exists) {
        db.serialize(function () {
            db.run(`
            CREATE TABLE [UserList](
               [ID]             INTEGER     PRIMARY KEY AUTOINCREMENT    NOT NULL,
               [User]           CHAR(150)   NOT NULL UNIQUE,
               [Name]           TEXT        NOT NULL,
               [Password]       CHAR(255)    NOT NULL
            );`);

            db.Exec(`INSERT INTO [UserList]([User],[Name],[Password]) VALUES($User,$Name,$Password)`, [
                {
                    $User: username,
                    $Name: username,
                    $Password: db.SHA256(password),
                }
            ], function () {
            });
        });
    }
};

db.IsExists = exists;

module.exports = db;