let StatusBox = new Vue({
    el: "#StatusBox",
    data: {
        title: "系统状态",
        isAlive: false,
        state: {
            hostname: null,
            arch: null,
            cpus: null,
            CpuModel: null,
            freemem: null,
            totalmem: null,
            platform: null,
            release: null,
        },

        timerIndex: 0,
    },
    methods: {
        UpdateState: function () {
            let self = this;
            this.$nextTick(function () {
                api.Send({
                    Type: Type.GetSystemStatus,
                }, function (data) {
                    if (data.ErrCode === ErrCode.Success) {
                        self.state.arch = data.Message.arch;
                        if (data.Message.cpus.length > 0) {
                            self.state.cpus = data.Message.cpus.length;
                            self.state.CpuModel = data.Message.cpus[0].model;
                        }

                        self.state.freemem = data.Message.freemem;
                        self.state.totalmem = data.Message.totalmem;
                        self.state.platform = data.Message.platform;
                        self.state.release = data.Message.release;
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
                }, 2000);
            }
        }
    },
    mounted: function () {

    },
    distroyed: function () {
        clearInterval(this.timerIndex);
    }

});
