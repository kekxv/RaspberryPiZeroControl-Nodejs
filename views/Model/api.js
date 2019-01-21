
let Token = null;

let api = new API({
    url: ("{ws}://{hostname}:{port}/{path}".format({
        ws: "ws",
        port: wsPort||3001,
        path: "ws",
        hostname: window.location.hostname
    })),
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
