var nodemailer = require('nodemailer');
var emailCodeModel = require('../models/emailCode');
var config = require('config-lite')(__dirname);
//获取用户IP
exports.getUserIp = function (req) {
    let ip =  req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    ip = ip.match(/\d+.\d+.\d+.\d+/);
    ip = ip ? ip.join('.') : 'No IP';
    return ip;
};
//检查邮箱地址格式
exports.emailCheck = function (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
//检查密码格式
exports.passwordCheck = function (password) {
    return /^\d{4,8}$/.test(password)//4-8位纯数字
}
//检查昵称格式
exports.nickNameCheck = function (nickName) {
    return /^[\u4E00-\u9FA5\u0800-\u4e00A-Za-z0-9_]{2,8}$/.test(nickName)//2-8位中文、日文、英文、数字包括下划线
}
//检查MD5
exports.md5Check = function (MD5) {
    return /^[A-Za-z0-9]{32}$/.test(MD5)//32位MD5
}
//区间内随机整数
exports.randomNum = function (n,m) {
    var random = Math.floor(Math.random()*(m-n+1)+n);
    return random;
}
//数组去重
exports.unique = function(arr){
    if (!Array.isArray(arr)) {
        return arr;
    }
    if (arr.length < 2) {
        return arr;
    }
    return Array.from(new Set(arr))
}
//数字补充0
exports.PrefixInteger = function(num, length) {
    if((num+'').length>length){
        return num+'';
    }
    return (Array(length).join('0') + num).slice(-length);
}
//随机抽卡
exports.wmCreatCardId = function($randomCardRate){
    $randomCardID = null;
    if($randomCardRate>=1&&$randomCardRate<=64){
        //N
        $randomCardN_ = this.randomNum(1, 97);
        $randomCardID = $randomCardN_+'';
    }else if($randomCardRate>=65&&$randomCardRate<=86){
        //R
        $randomCardR_ = this.randomNum(1, 81);
        $randomCardID = '1'+this.PrefixInteger($randomCardR_,3);
    }else if($randomCardRate>=87&&$randomCardRate<=97){
        //SR
        $randomCardSR_ = this.randomNum(1, 65);
        $randomCardID = '2'+this.PrefixInteger($randomCardSR_,3);
    }else if($randomCardRate>97){
        //SSR
        $randomCardSSR_ = this.randomNum(1, 34);
        $randomCardID = '3'+this.PrefixInteger( $randomCardSSR_,3);
    }
    return $randomCardID;
}
//发送邮箱
exports.sendMail = function(email, IP) {
    return new Promise((resolve, reject) => {
        var code = this.randomNum(100001, 999999);
        var time = Math.round(new Date().getTime()/1000);
        var mailTransport = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            auth: {
                user: config.smtpAuth.user,
                pass: config.smtpAuth.pass
            }
        });
        
        mailTransport.sendMail({
            from: config.smtpAuth.user, //你的邮箱
            to: email, //发给谁
            subject: '抽卡邮箱验证码',
            text: '您本次的邮箱验证码为：'+code+'。半小时内可重复使用！'
        }, function (err) {
            if (err) {
                reject('Unable to send email: ' + err);
            }else{
                console.log('给邮箱：'+email+'发送了验证码！');
                emailCodeModel.findOne({ email: email }, function(err, result) {
                    if (err) {
                        reject(err);
                        throw err;
                    }else{
                        //判断是否有该邮箱
                        if(result){
                            emailCodeModel.updateOne({email: email}, {code: code,time:time,ip:IP}, function(err, docs){
                                if(err) {
                                    throw err;
                                }else{
                                    resolve('ok');
                                }
                            })
                        }else{
                            // document作成
                            var emailCode = new emailCodeModel({
                                email:email,
                                code:code,
                                time:time,
                                ip:IP
                            });
        
                            // document保存
                            emailCode.save(function(err) {
                                if (err) {
                                    reject(err);
                                    throw err;
                                }else{
                                    resolve('ok');
                                };
                            });
                        }
                    }
                });
            }
        });
    })
}