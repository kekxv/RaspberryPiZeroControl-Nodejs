let child_process = require("child_process");

let ws = require('nodejs-websocket');
let os = require('os');
let driveList = require('drivelist');
const i2c = require('i2c-bus');
const Ups_Addr = 0x36;
let i2c1 = null;


let Battery = {};
if (os.arch().toLocaleLowerCase() === "arm") {
    if (i2c1 == null) {
        i2c1 = i2c.openSync(1);
    }
    if (i2c1 == null) {
        console.log("获取电池状态失败;无法开启 I2C 设备");
    } else {
        function UpdateBattery() {
            let dataV = i2c1.readWordSync(Ups_Addr, 0x02);
            let v = (((dataV & 0xFF) << 8) + (dataV >> 8)) * 1.25 / 1000 / 16;
            v = v.toFixed(2);
            let dataP = i2c1.readWordSync(Ups_Addr, 0x04);
            let p = parseInt((((dataP & 0xFF) << 8) + (dataP >> 8)) / 256 - 5);
            Battery = {v: v, p: p};
            if (p < 2) {
                child_process.execSync("sudo shutdown -h now");
                return;
            }
            setTimeout(UpdateBattery, 1000);
        }

        UpdateBattery();
    }
}


let UserInfo = require("./userinfo");


let ErrCode = {
    Success: 0,
    Fail: -1,
    NoConnect: -3,
    LoginFail: -4,
    NoLogin: -5,
};
let Type = {
    Nothing: 0,
    GetSystemStatus: 1,
    GetDiskList: 2,
    GetBattery: 3,
    Heart: 90,
    Login: 91,
    Logout: 92,
    CheckLogout: 93,
    Fail: 1001
};


function sendText(message, callback) {
    callback = callback || null;
    let self = this;
    message.Time = new Date().getTime();
    try {
        if (self.readyState === self.OPEN)
            if (callback == null)
                self.sendText(JSON.stringify(message));
            else
                self.sendText(JSON.stringify(message), callback);
    } catch (e) {

    }
}


// on就是addListener，添加一个监听事件调用回调函数
let WsServer = ws.createServer(function (conn) {
    conn.$UserInfo = new UserInfo();
    let _sendText = sendText.bind(conn);

    function IsLogin() {
        return (conn.$UserInfo && conn.$UserInfo.IsLogin);
    }

    conn.on("text", function (str) {
        let callback_flag = true;
        let message = {
            ErrCode: ErrCode.Success,
            Type: 0,
            Message: ""
        };
        try {
            if (conn.$UserInfo && conn.$UserInfo.IsLogin) {
                conn.$UserInfo.UpdateTime();
            }
            let data = JSON.parse(str);
            if (!!data.$_callback_id) {
                message.CallbackID = data.$_callback_id
            }

            message.Type = data.Type || Type.Nothing;
            switch (data.Type) {

                case Type.CheckLogout: {
                    if (conn.$UserInfo && conn.$UserInfo.IsLogin) {
                        message.Message = conn.$UserInfo.Name;
                        message.ErrCode = ErrCode.Success;
                    } else {
                        message.Message = "未登录";
                        message.ErrCode = ErrCode.NoLogin;
                    }
                    message.Type = Type.CheckLogout;
                }
                    break;

                case Type.Login: {
                    if (conn.$UserInfo) {
                        callback_flag = false;
                        if (!data.Token) {
                            conn.$UserInfo.Login(data.data.name, data.data.password, function (flag, token) {
                                message.Message = "登录{status}".format({status: flag ? "成功" : "失败"});
                                message.Token = token;
                                message.ErrCode = flag ? ErrCode.Success : ErrCode.LoginFail;
                                _sendText(message);
                            });
                        } else {
                            conn.$UserInfo.LoginToken(data.Token, function (flag) {
                                message.Message = "登录{status}".format({status: flag ? "成功" : "失败"});
                                message.Token = data.Token;
                                message.ErrCode = flag ? ErrCode.Success : ErrCode.LoginFail;
                                _sendText(message);
                            });
                        }
                    } else {
                        message.Message = "出现错误";
                        message.Type = Type.Fail;
                        message.ErrCode = ErrCode.Fail;
                    }
                }
                    break;

                case Type.GetSystemStatus: {
                    if (!IsLogin()) {
                        message.ErrCode = ErrCode.NoLogin;
                        break;
                    } else {
                        message.Message = {
                            arch: os.arch(),
                            userInfo: os.userInfo(),
                            cpus: os.cpus(),
                            freemem: (os.freemem() / 1024 / 1024).toFixed(2) + "M",
                            totalmem: (os.totalmem() / 1024 / 1024).toFixed(2) + "M",
                            loadavg: os.loadavg(),
                            // networkInterfaces: os.networkInterfaces(),
                            platform: os.platform(),
                            release: os.release(),
                            uptime: os.uptime(),
                            hostname: os.hostname(),
                        };
                    }
                }
                    break;
                case Type.GetBattery: {
                    if (os.arch().toLocaleLowerCase() !== "arm") {
                        message.ErrCode = ErrCode.Fail;
                        message.Message = "非 ARM（树莓派） 设备";
                        break;
                    }
                    if (!IsLogin()) {
                        message.ErrCode = ErrCode.NoLogin;
                        break;
                    } else {
                        if (i2c1 == null) {
                            i2c1 = i2c.openSync(1);
                        }
                        if (i2c1 == null) {
                            message.ErrCode = ErrCode.Fail;
                            message.Message = "获取电池状态失败;无法开启 I2C 设备";
                        } else {
                            message.Message = {v: Battery.v, p: Battery.p};
                        }
                    }
                }
                    break;
                case Type.GetDiskList: {
                    if (!IsLogin()) {
                        message.ErrCode = ErrCode.NoLogin;
                        break;
                    } else {
                        callback_flag = false;
                        driveList.list(function (error, drives) {
                            message.Message = drives;
                            _sendText(message);
                        });
                    }
                }
                    break;

                case Type.Heart: {
                    message.Message = "";
                }
                    break;
                default:
                    break;
            }

        } catch (e) {
            message.ErrCode = ErrCode.Fail;
            message.Type = Type.Fail;
            message.Message = {
                message: e.message,
                stack: e.stack
            };
        }
        if (callback_flag)
            _sendText(message);
    });
    conn.on("close", function (code, reason) {
        console.log("connection closed");
        console.log(code, reason);
        conn.$Delete();
    });
    conn.on("error", function (err) {
        console.log(err);
    });
    conn.$Delete = function () {
        try {
            delete conn.$UserInfo;
            _sendText({
                ErrCode: ErrCode.Success,
                Message: "其他终端登录此帐号"
            }, function () {
                conn.close();
            });
        } catch (e) {

        }
    };
}).listen(3001);

module.exports = WsServer;
