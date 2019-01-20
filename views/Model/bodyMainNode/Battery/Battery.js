let BatteryBox = new Vue({
    el: "#BatteryBox",
    data: {
        title: "电池状态",
        isAlive: false,
        state: {
            v:null,
            p:null
        },


        timerIndex: 0,
    },

    methods: {
        UpdateState: function () {
            let self = this;
            this.$nextTick(function () {
                api.Send({
                    Type: Type.GetBattery,
                }, function (data) {
                    if (data.ErrCode === ErrCode.Success) {
                        self.state = data.Message;
                    }else if(data.ErrCode === ErrCode.Fail){
                        clearInterval(self.timerIndex);
                    }
                });
            });
        }
    },
    watch: {
        isAlive: function (newVal, oldVal) {
            clearInterval(this.timerIndex);
            if (newVal) {
                let self = this;
                self.UpdateState();
                this.timerIndex = setInterval(function () {
                    self.UpdateState();
                }, 1500);
            }
        }
    },
    mounted: function () {

    },
    distroyed: function () {
        clearInterval(this.timerIndex);
    }
});