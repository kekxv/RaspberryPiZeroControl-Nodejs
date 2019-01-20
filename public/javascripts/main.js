if (!("WebSocket" in window)) {
    alert("WebSocket !!!!!!!!!!");
    throw Error("!!!");
}

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


// let webSocket = new WebSocket("ws://{hostname}:3001".format({hostname:window.location.hostname}));

var API = function (option) {
    option = option || {};
    let self = this;
    self.$webSocket = null;

    Object.defineProperty(this, "$option", {
        enumerable: true,
        configurable: false,
        get: function getter() {
            return option;
        }
    });
    /**
     * WebSocket
     */
    Object.defineProperty(this, "Server", {
        enumerable: true,
        configurable: false,
        get: function getter() {
            return self.$webSocket;
        }
    });
    /**
     * WebSocketIsOpen
     */
    Object.defineProperty(self, "isOpen", {
        enumerable: true,
        configurable: false,
        get: function getter() {
            if (self.$webSocket !== null) {
                switch (self.$webSocket.readyState) {
                    case WebSocket.CONNECTING:
                        return false;
                    case WebSocket.OPEN:
                        return true;
                    case WebSocket.CLOSING:
                        return false;
                    case WebSocket.CLOSED:
                        return false;
                    default:
                        // this never happens
                        break;
                }
            }
            return false;
        }
    });
    let $ready = [];
    Object.defineProperty(self, "$ready", {
        enumerable: false,
        configurable: false,
        get() {
            return $ready;
        }
    });

    Object.defineProperty(self, "ready", {
        enumerable: false,
        configurable: false,
        set: function setter(newVal) {
            if (typeof newVal !== "function") return;
            self.$ready.push(newVal);
            if (self.isOpen) {
                while (self.$ready.length > 0) {
                    self.$ready.pop().call(self);
                }
            }
        }
    });
    if (self.$option.OtherLogin) self.OtherLogin = self.$option.OtherLogin;
    if (self.$option.ReadMessage) self.ReadMessage = self.$option.ReadMessage;
    if (self.$option.ReConnect) self.ReConnect = self.$option.ReConnect;

    self.Init();
};

API.prototype = {
    timeout: 15000,
    timeoutObj: 0,
    callback: [],
    ErrData: {ErrCode: ErrCode.Fail, Message: ""},
    ErrTime: 20,
    callbackIndex: 1,
    MaxCallbackCount: 1000000000000,
    OtherLogin: null,
    ReadMessage: null,
    ReConnect: null,

    Init: function Init() {
        let self = this;
        let option = self.$option;
        if (self.isOpen) return;
        clearTimeout(self.timeoutObj);
        self.timeoutObj = 0;
        if (self.ErrTime < 0) {
            // JsAlert.ToastBox("无法连接上服务器");
            return;
        }

        self.$webSocket = new WebSocket(option.url || ("ws://{hostname}:3001/{path}".format({
            path: "ws",
            hostname: window.location.hostname
        })));
        self.$webSocket.onopen = function () {
            self.heartCheck();

            while (self.$ready.length > 0) {
                try {
                    self.$ready.pop().call(self);
                } catch (e) {

                }
            }
            if (self.ErrTime !== 20) {
                (self.ReConnect || console.log).call(self);
            }
            self.ErrTime = 20;
        };
        self.$webSocket.onerror = function () {
            self.SendHeart();
        };
        self.$webSocket.onclose = function () {
            if (self.isOpen) return;
            self.ErrTime--;
            setTimeout(function () {
                self.Init();
            }, 500);
        };
        self.$webSocket.onmessage = function (e) {
            try {
                let data = JSON.parse(e.data);
                self.Read(data);
            } catch (e) {

            }
        };
    }
    , Read(data) {
        let self = this;
        self.heartCheck();
        if (!!data.CallbackID) {
            let CallbackID = data.CallbackID;
            delete data.CallbackID;
            if (typeof self.callback[CallbackID] === "function") {
                self.callback[CallbackID].call(self, data);
            }
            delete self.callback[CallbackID];
        }
    }
    , Send: function (object, callback) {
        let self = this;
        if (self.isOpen) {
            try {
                if (typeof callback === "function") {
                    object.$_callback_id = self.callbackIndex;
                    self.callback[self.callbackIndex++] = callback;
                    if (self.callbackIndex > self.MaxCallbackCount) {
                        self.callbackIndex = 1;
                    }
                }
                self.heartCheck();
                self.Server.send(JSON.stringify(object));

            } catch (e) {
                if (typeof callback === "function") {
                    self.callback[object.$_callback_id] = null;
                    delete self.callback[object.$_callback_id];
                }
                throw e;
            }
        } else if (typeof callback === "function") {
            callback.call(self, {ErrCode: ErrCode.NoConnect, Message: "服务器断开"});
        }

    }
    , heartCheck: function () {
        let self = this;
        clearTimeout(self.timeoutObj);
        let timeoutObj = 0;
        this.timeoutObj = timeoutObj = setTimeout(function () {
            if (timeoutObj !== self.timeoutObj) return;
            if (self.isOpen)
                self.SendHeart();
        }, this.timeout);
    }
    , SendHeart: function () {
        this.Send({Type: Type.Heart});
    }
};


let Token = null;

var api = new API({
    OtherLogin: console.log,
    ReadMessage: console.log,
    ReConnect: function () {
        if (Token) {
            LoginToken(Token);
        }
    },
});

function Login(name, password, callback) {
    callback = callback || console.log;
    api.Send({
        Type: Type.Login,
        data: {name: name, password: password},
    }, function (data) {
        if (data.ErrCode === ErrCode.Success) {
            Token = data.Token;
            callback(true, Token)
        } else {
            callback(false);
        }
    });
}

let LoginTokenCount = 10;
function LoginToken(token, callback) {
    callback = callback || console.log;
    api.Send({
        Type: Type.Login,
        Token: token,
    }, function (data) {
        if (data.ErrCode === ErrCode.NoConnect) {
            LoginTokenCount--;
            if(LoginTokenCount<0){
                callback(false);
                return;
            }
            setTimeout(function () {
                LoginToken(token, callback);
            }, 500);
            return;
        }
        LoginTokenCount = 20;
        if (data.ErrCode === ErrCode.Success) {
            Token = data.Token;
            callback(true)
        } else {
            callback(false);
        }
    });
}
