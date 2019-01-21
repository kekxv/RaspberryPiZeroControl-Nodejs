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
        try {
            let stmt = DB.prepare("SELECT [ID],[User],[Name] FROM [UserList] where [User] = $User And [Password] = $Password");
            stmt.bind({$User: name,$Password: DB.SHA256(password)});
            let data = [];
            while(stmt.step()) { //
                data.push(stmt.getAsObject());
            }
            if(data.length === 1){
                let keepToken = name + "\n" + DB.SHA256(name + "\n" + DB.SHA256(password));
                self.Name = name;
                callback(true, keepToken);
                return ;
            }
        }catch (e) {
        }
        callback(false);
    },
    LoginToken:function (Token,callback) {
        let self = this;
        let da = Token.split("\n");
        try {
            let stmt = DB.prepare("SELECT [ID],[User],[Name],[Password] FROM [UserList] where [User] = $User");
            stmt.bind({$User: da[0]});
            let data = [];
            while(stmt.step()) { //
                data.push(stmt.getAsObject());
            }

            if (data.length === 1) {
                let row = data[0];
                if (da[1] === (DB.SHA256(row.Name + "\n" + row.Password))) {
                    self.Name = da[0];
                    callback(true);
                    return;
                }
            }
        }catch (e) {

        }
        callback(false);
    }
};

module.exports = userinfo;