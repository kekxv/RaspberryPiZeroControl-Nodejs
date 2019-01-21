let BatteryBox = new Vue({
    el: "#BatteryBox",
    data: {
        title: "电池状态",
        isAlive: false,
        state: {
            v: null,
            p: null
        },


        timerIndex: 0,
    },

    methods: {
        UpdateState: function () {
            let self = this;
            if (!self.isAlive) return;
            api.Send({
                Type: Type.GetBattery,
            }, function (data) {
                if (data.ErrCode === ErrCode.Success) {
                    self.state = data.Message;
                } else if (data.ErrCode === ErrCode.Fail) {
                    clearTimeout(self.timerIndex);
                    return;
                }
                this.timerIndex = setTimeout(function () {
                    self.UpdateState();
                }, 1500);
            });
        }
    },
    watch: {
        isAlive: function (newVal, oldVal) {
            clearTimeout(this.timerIndex);
            if (newVal) {
                let self = this;
                self.UpdateState();
            }
        }
    },
    mounted: function () {

    },
    distroyed: function () {
        clearTimeout(this.timerIndex);
    }
});