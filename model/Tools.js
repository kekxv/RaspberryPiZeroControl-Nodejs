(function Tools() {
    /**
     * @return {string}
     */
    let StringToString = function (args) {
        if (arguments.length > 0) {
            let result = this;
            if (arguments.length === 1 && typeof (args) === "object") {
                for (let key in args) {
                    let reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
            else {
                for (let i = 0; i < arguments.length; i++) {
                    if (arguments[i] === undefined) {
                        return "";
                    }
                    else {
                        let reg = new RegExp("({[" + i + "]})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
            return result;
        }
        else {
            return this;
        }
    };
    Object.defineProperty(String.prototype,"format",{
        enumerable: false,
        configurable: false,
        get: function getter() {
            return StringToString.bind(this);
        }
    });


    /**
     * @return {string}
     */
    let DateToString = function (fmt) { //author: meizz
        if (!fmt) {
            return this.toString();
        }
        let o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (let k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };

    Object.defineProperty(Date.prototype,"format",{
        enumerable: false,
        configurable: false,
        get: function getter() {
            return DateToString.bind(this);
        }
    });


    let DateParse = Date.parse;
    let DateParseFmt = /[^\d]*(\d*)[^\d]*(\d*)[^\d]*(\d*)[^\d]*(\d*)[^\d]*(\d*)[^\d]*(\d*)[^\d]*/g;
    Date.parse = function (DateString) {
        let date = DateParse.bind(this)(DateString);
        if (!date) {
            let result = new RegExp(DateParseFmt).exec(DateString);
            if(result!=null) {
                for (let i = 1; i < result.length; i++) {
                    result[i] = parseInt(result[i]);
                    if (!result[i]) {
                        result[i] = 0;
                    }
                }
                date = new Date(result[1],result[2]-1,result[3],result[4],result[5],result[6]).getTime();
            }
        }
        return date;
    };
})();