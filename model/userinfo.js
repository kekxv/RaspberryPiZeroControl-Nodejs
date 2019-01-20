var crypto = require("crypto");
var DB = require("./SqliteTool");


let userinfo = function () {
    let name = null;
    let loginTime = 0;
    let self = this;

    Object.defineProperty(this, "Name", {
        configurable: false,
        enumerable: false,
        get() {
            if (loginTime < new Date().getTime()) {
                name = null;
            } else
                self.UpdateTime();
            return name;
        },
        set(v) {
            name = v;
            if (!name) {
                loginTime = 0;
                return;
            }
            self.UpdateTime();
        }
    });
    Object.defineProperty(this, "UpdateTime", {
        configurable: false,
        enumerable: false,
        get() {
            return function () {
                loginTime = new Date().getTime() + 20 * 60 * 1000;
            };
        }
    });
    Object.defineProperty(this, "IsLogin", {
        configurable: false,
        enumerable: false,
        get() {
            return name !== null;
        },
        set(v) {
            if(!v){
                self.Name = null;
            }
        }
    });
};
userinfo.prototype = {
    Login: function (name, password, callback) {
        let self = this;
        DB.all("SELECT [ID],[User],[Name] FROM [UserList] where [User] = $User And [Password] = $Password", {
            $User: name,
            $Password: DB.SHA256(password)
        }, function (err, rows) {
            if (err === null && rows.length === 1) {
                let row = rows[0];
                let keepToken = name + "\n" + DB.SHA256(name + "\n" + DB.SHA256(password));
                self.Name = name;
                callback(true, keepToken);
            } else {
                callback(false);
            }
        });
    },
    LoginToken:function (Token,callback) {
        let self = this;
        let da = Token.split("\n");
        DB.all("SELECT [ID],[User],[Name],[Password] FROM [UserList] where [User] = $User", {
            $User: da[0],
        }, function (err, rows) {
            if (err === null && rows.length === 1) {
                let row = rows[0];
                if (da[1] === (DB.SHA256(row.User + "\n" + row.Password))) {
                    self.Name = da[0];
                    callback(true);
                    return;
                }
            }
            callback(false);
        });
    }
};

module.exports = userinfo;