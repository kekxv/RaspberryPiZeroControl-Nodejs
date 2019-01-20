let DiskList = new Vue({
    el: "#DiskList",
    data: {
        title: "磁盘状态",
        isAlive: false,
        state: null,

        timerIndex: 0,
    },
    methods: {
        UpdateState: function () {
            let self = this;
            this.$nextTick(function () {
                api.Send({
                    Type: Type.GetDiskList,
                }, function (data) {
                    if(data.ErrCode === ErrCode.Success) {
                        self.state = data.Message;
                    }
                });
            });
        }
    },
    watch: {
        isAlive: function (newVal, oldVal) {
            if (newVal) {
                let self = this;
                self.UpdateState();
            }
        }
    },
    mounted: function () {

    },

});
