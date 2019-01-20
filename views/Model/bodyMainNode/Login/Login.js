let LoginBox = new Vue({
    el: "#LoginBox",
    data: {
        title: "请登录",
        isAlive: true,
        username: "",
        password: "",
        tip: ""
    },
    methods: {
        Login: function () {
            let self = this;
            Login(this.username, this.password, function (flag, Token) {
                if (flag) {
                    self.LoginOk(self.username);
                    localStorage.setItem("userTaken", Token);
                } else {
                    self.tip = "登录失败";
                }
            });
        },
        LoginOk: function (name) {
            this.isAlive = false;
            StatusBox.isAlive = true;
            DiskList.isAlive = true;
            BatteryBox.isAlive = true;
        }, LoginTaken: function () {
            let self = this;
            if (typeof (Storage) !== "undefined") {
                if (localStorage.getItem("userTaken") != null) {
                    LoginToken(localStorage.getItem("userTaken"), function (flag) {
                        if (flag) {
                            self.LoginOk(localStorage.getItem("userTaken").split("\n")[0]);
                        }else{
                            localStorage.removeItem("userTaken");
                        }
                    });
                }
            }
        }
    },
    watch: {
        isAlive: function (newVal, oldVal) {
            this.username = "";
            this.password = "";
            this.tip = "";
            let self = this;
            if (newVal) {
                self.LoginTaken();
            }
        }
    },
    mounted: function () {
        this.$nextTick(function () {
            let self = this;
            api.Send({
                Type: Type.CheckLogout,
            }, function (data) {
                if (data.ErrCode === 0) {
                    self.LoginOk(data.Message);
                } else {
                    self.LoginTaken();
                }
            });
        })
    }

});
