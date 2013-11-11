define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/string",
    "dojo/node!util",
    "dojo/node!crypto",
    "dojo/node!connect",
    "dojo/node!xml2js"
], function (declare, lang, array, string, util, crypto, connect, xml2js) {
    return declare("app.util.WechatHelper", null, {
        token: null,
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        parseBody: function (req, res, next) {
            if (req.method.toUpperCase() != "POST") {
                return next();
            }

            if (connect.utils.mime(req) != "" && connect.utils.mime(req).toLowerCase() != "text/xml") {
                return next();
            }

            if (req._body) {
                return next();
            }

            req.body = req.body || {};
            req._body = true;

            var requestDataXml = "";

            req.setEncoding("utf8");

            req.on("data", function (data) {
                requestDataXml += data;
            });

            req.on("end", function () {
                xml2js.parseString(requestDataXml, { trim: true }, function (error, requestDataJson) {
                    if (error) {
                        error.status = 400;
                        next(error);
                    } else {
                        req.body = requestDataJson;
                        next();
                    }
                });
            });
        },
        checkSignature: function (req) {
            //console.log(this.token);
            //console.log(req.query.timestamp);
            //console.log(req.query.nonce);
            //console.log(req.query.signature);
            if (crypto.createHash("sha1").update([
                this.token,
                req.query.timestamp,
                req.query.nonce
            ].sort().join("")).digest("hex") == req.query.signature) {
                //console.log("true");
                return true;
            }
            else {
                //console.log("false");
                return false;
            }
        },
        handleGet: function (req, res) {
            if (this.checkSignature(req) == true) {
                res.writeHead(200);
                res.end(req.query.echostr);
            }
            else {
                res.writeHead(401);
                res.end("Signature is invalid");
            }
        },
        handlePost: function (req, res) {
            if (this.checkSignature(req) == true) {
                var now = this.nowaday();

                res.type("xml");

                switch (req.body.xml.MsgType[0].toLowerCase()) {
                    case "text":
                        this.handleText(now, req, res);

                        break;

                    case "image":
                        this.handleImage(now, req, res);

                        break;

                    case "voice":
                        this.handleVoice(now, req, res);

                        break;

                    case "video":
                        this.handleVideo(now, req, res);

                        break;

                    case "location":
                        this.handleLocation(now, req, res);

                        break;

                    case "link":
                        this.handleLink(now, req, res);

                        break;

                    case "event":
                        this.handleEvent(now, req, res);

                        break;

                    default:
                        this.handleOther(now, req, res);

                        break;
                }

                if (typeof req.io != "undefined" && req.io != null) {
                    req.data = {
                        who: req.body.xml.FromUserName[0],
                        what: util.inspect(req.body, false, null),
                        when: new Date((parseInt(req.body.xml.CreateTime[0]) * 1000)).yyyyMMddHHmmss()
                    };

                    req.io.route("resource:tell.other");
                }
            }
            else {
                res.writeHead(401);
                res.end("Signature is invalid");
            }
        },
        handleText: function (now, req, res) {
            res.send(this.renderArticle({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: req.body.xml.Content[0],
                Articles: [{
                    Title: "Text",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute(
                        "Current Time: ${CurrentTime}\n\n" +
                        "Current Time Zone: ${CurrentTimeZone}\n\n" +
                        "HK Time: ${HkTime}\n\n" +
                        "Message Id: ${MsgId}\n\n" +
                        "Message type: ${MsgType}\n\n" +
                        "Create Time: ${CreateTime}\n\n" +
                        "From User: ${FromUserName}\n\n" +
                        "To User: ${ToUserName}", {
                            CurrentTime: now.time.dateFormat(),
                            CurrentTimeZone: now.timeZone,
                            HkTime: now.hkDate.getTime().dateFormat(),
                            MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                            MsgType: req.body.xml.MsgType[0],
                            CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                            FromUserName: req.body.xml.FromUserName[0],
                            ToUserName: req.body.xml.ToUserName[0]
                        }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Content: ${Content}", { Content: req.body.xml.Content[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: string.substitute("${GoogleUrl}/#q=${Content}", { GoogleUrl: "https://www.google.com.hk", Content: req.body.xml.Content[0] })
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        handleImage: function (now, req, res) {
            res.send(this.renderImage({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                MediaId: req.body.xml.MediaId[0],
                Articles: [{
                    Title: "Image",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute(
                        "Current Time: ${CurrentTime}\n\n" +
                        "Current Time Zone: ${CurrentTimeZone}\n\n" +
                        "HK Time: ${HkTime}\n\n" +
                        "Message Id: ${MsgId}\n\n" +
                        "Message type: ${MsgType}\n\n" +
                        "Create Time: ${CreateTime}\n\n" +
                        "From User: ${FromUserName}\n\n" +
                        "To User: ${ToUserName}", {
                            CurrentTime: now.time.dateFormat(),
                            CurrentTimeZone: now.timeZone,
                            HkTime: now.hkDate.getTime().dateFormat(),
                            MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                            MsgType: req.body.xml.MsgType[0],
                            CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                            FromUserName: req.body.xml.FromUserName[0],
                            ToUserName: req.body.xml.ToUserName[0]
                        }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Picture Url: ${PicUrl}", { PicUrl: req.body.xml.PicUrl[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Media Id: ${MediaId}", { MediaId: req.body.xml.MediaId[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        handleVoice: function (now, req, res) {
            res.send(this.renderVoice({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                MediaId: req.body.xml.MediaId[0],
                Articles: [{
                    Title: "Voice",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute(
                        "Current Time: ${CurrentTime}\n\n" +
                        "Current Time Zone: ${CurrentTimeZone}\n\n" +
                        "HK Time: ${HkTime}\n\n" +
                        "Message Id: ${MsgId}\n\n" +
                        "Message type: ${MsgType}\n\n" +
                        "Create Time: ${CreateTime}\n\n" +
                        "From User: ${FromUserName}\n\n" +
                        "To User: ${ToUserName}", {
                            CurrentTime: now.time.dateFormat(),
                            CurrentTimeZone: now.timeZone,
                            HkTime: now.hkDate.getTime().dateFormat(),
                            MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                            MsgType: req.body.xml.MsgType[0],
                            CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                            FromUserName: req.body.xml.FromUserName[0],
                            ToUserName: req.body.xml.ToUserName[0]
                        }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Media Id: ${MediaId}", { MediaId: req.body.xml.MediaId[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Format: ${Format}", { Format: req.body.xml.Format[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Recognition: ${Recognition}", { Recognition: req.body.xml.Recognition[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        handleVideo: function (now, req, res) {
            res.send(this.renderVideo({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                MediaId: req.body.xml.MediaId[0],
                ThumbMediaId: req.body.xml.ThumbMediaId[0],
                Articles: [{
                    Title: "Video",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute(
                        "Current Time: ${CurrentTime}\n\n" +
                        "Current Time Zone: ${CurrentTimeZone}\n\n" +
                        "HK Time: ${HkTime}\n\n" +
                        "Message Id: ${MsgId}\n\n" +
                        "Message type: ${MsgType}\n\n" +
                        "Create Time: ${CreateTime}\n\n" +
                        "From User: ${FromUserName}\n\n" +
                        "To User: ${ToUserName}", {
                            CurrentTime: now.time.dateFormat(),
                            CurrentTimeZone: now.timeZone,
                            HkTime: now.hkDate.getTime().dateFormat(),
                            MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                            MsgType: req.body.xml.MsgType[0],
                            CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                            FromUserName: req.body.xml.FromUserName[0],
                            ToUserName: req.body.xml.ToUserName[0]
                        }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Media Id: ${MediaId}", { MediaId: req.body.xml.MediaId[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("ThumbMediaId: ${ThumbMediaId}", { ThumbMediaId: req.body.xml.ThumbMediaId[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        handleLocation: function (now, req, res) {
            res.send(this.renderArticle({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Articles: [{
                    Title: "Location",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute(
                        "Current Time: ${CurrentTime}\n\n" +
                        "Current Time Zone: ${CurrentTimeZone}\n\n" +
                        "HK Time: ${HkTime}\n\n" +
                        "Message Id: ${MsgId}\n\n" +
                        "Message type: ${MsgType}\n\n" +
                        "Create Time: ${CreateTime}\n\n" +
                        "From User: ${FromUserName}\n\n" +
                        "To User: ${ToUserName}", {
                            CurrentTime: now.time.dateFormat(),
                            CurrentTimeZone: now.timeZone,
                            HkTime: now.hkDate.getTime().dateFormat(),
                            MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                            MsgType: req.body.xml.MsgType[0],
                            CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                            FromUserName: req.body.xml.FromUserName[0],
                            ToUserName: req.body.xml.ToUserName[0]
                        }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Location X: ${Location_X}", { Location_X: req.body.xml.Location_X[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Location Y: ${Location_Y}", { Location_Y: req.body.xml.Location_Y[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Scale: ${Scale}", { Scale: req.body.xml.Scale[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Label: ${Label}", { Label: req.body.xml.Label[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        handleLink: function (now, req, res) {
            res.send(this.renderArticle({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Articles: [{
                    Title: "Link",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute(
                        "Current Time: ${CurrentTime}\n\n" +
                        "Current Time Zone: ${CurrentTimeZone}\n\n" +
                        "HK Time: ${HkTime}\n\n" +
                        "Message Id: ${MsgId}\n\n" +
                        "Message type: ${MsgType}\n\n" +
                        "Create Time: ${CreateTime}\n\n" +
                        "From User: ${FromUserName}\n\n" +
                        "To User: ${ToUserName}", {
                            CurrentTime: now.time.dateFormat(),
                            CurrentTimeZone: now.timeZone,
                            HkTime: now.hkDate.getTime().dateFormat(),
                            MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                            MsgType: req.body.xml.MsgType[0],
                            CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                            FromUserName: req.body.xml.FromUserName[0],
                            ToUserName: req.body.xml.ToUserName[0]
                        }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Url: ${Url}", { Url: req.body.xml.Url[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Title: ${Title}", { Title: req.body.xml.Title[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Description: ${Description}", { Description: req.body.xml.Description[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        handleEvent: function (now, req, res) {
            res.send(this.renderArticle({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Articles: [{
                    Title: "Event",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute(
                        "Current Time: ${CurrentTime}\n\n" +
                        "Current Time Zone: ${CurrentTimeZone}\n\n" +
                        "HK Time: ${HkTime}\n\n" +
                        "Message Id: ${MsgId}\n\n" +
                        "Message type: ${MsgType}\n\n" +
                        "Create Time: ${CreateTime}\n\n" +
                        "From User: ${FromUserName}\n\n" +
                        "To User: ${ToUserName}", {
                            CurrentTime: now.time.dateFormat(),
                            CurrentTimeZone: now.timeZone,
                            HkTime: now.hkDate.getTime().dateFormat(),
                            MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                            MsgType: req.body.xml.MsgType[0],
                            CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                            FromUserName: req.body.xml.FromUserName[0],
                            ToUserName: req.body.xml.ToUserName[0]
                        }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Event: ${Event}", { Event: req.body.xml.Event[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: string.substitute("Event Key: ${EventKey}", { EventKey: req.body.xml.EventKey[0] }),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        handleOther: function (now, req, res) {
            res.send(this.renderArticle({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        RawData: util.inspect(req.body, false, null)
                    }),
                Title: "最炫民族风",
                Description: "Song: 最炫民族风",
                MusicUrl: "http://stream10.qqmusic.qq.com/31432174.mp3",
                HQMusicUrl: "http://stream10.qqmusic.qq.com/31432174.mp3",
                Articles: [{
                    Title: "Apple",
                    Description: "To see an apple in a dream is a favorable sign. Red apples in green leave lead to good luck and prosperity. Ripe apples on a tree mean that it is the time of living activities. But if you see one apple at the top of a tree, think if your plans are real. Dropped apples on earth symbolize flattery of false friends. A rotten apple is a symbol of useless attempts. If you see rotten and wormy apples, then it leads to failures.",
                    PicUrl: "http://eofdreams.com/data_images/dreams/apple/apple-05.jpg",
                    Url: "http://eofdreams.com/apple.html"
                }, {
                    Title: "To see an apple in a dream is a favorable sign. Red apples in green leave lead to good luck and prosperity. Ripe apples on a tree mean that it is the time of living activities. But if you see one apple at the top of a tree, think if your plans are real. Dropped apples on earth symbolize flattery of false friends. A rotten apple is a symbol of useless attempts. If you see rotten and wormy apples, then it leads to failures.",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: "Bananas",
                    Description: "If you see the dream with bananas, in reality you should work with colleagues who cause in you negative emotions. To eat the bananas in a dream - to stagnation in affairs. Also additional burdensome duties will fall down you. To trade the bananas - to the unprofitable transaction.",
                    PicUrl: "http://eofdreams.com/data_images/dreams/bananas/bananas-04.jpg",
                    Url: "http://eofdreams.com/bananas.html"
                }, {
                    Title: "If you see the dream with bananas, in reality you should work with colleagues who cause in you negative emotions. To eat the bananas in a dream - to stagnation in affairs. Also additional burdensome duties will fall down you. To trade the bananas - to the unprofitable transaction.",
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }, {
                    Title: util.inspect(req.body, false, null),
                    Description: "",
                    PicUrl: "",
                    Url: ""
                }]
            }));
        },
        nowaday: function () {
            var currentDate = new Date();
            var currentTime = currentDate.getTime();
            var currentTimeZone = 0 - currentDate.getTimezoneOffset() / 60;

            var hkDate = currentDate;
            hkDate.setHours(hkDate.getHours() - currentTimeZone + 8);

            return {
                date: currentDate,
                time: currentTime,
                timeZone: currentTimeZone,
                hkDate: hkDate
            };
        },
        renderText: function (data) {
            return string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[text]]></MsgType>" +
                    "<Content><![CDATA[${Content}]]></Content>" +
                "</xml>", data);
        },
        renderImage: function (data) {
            return string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[image]]></MsgType>" +
                    "<Image>" +
                    "<MediaId><![CDATA[${MediaId}]]></MediaId>" +
                    "</Image>" +
                "</xml>", data);
        },
        renderVoice: function (data) {
            return string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[voice]]></MsgType>" +
                    "<Voice>" +
                    "<MediaId><![CDATA[${MediaId}]]></MediaId>" +
                    "</Voice>" +
                "</xml>", data);
        },
        renderVideo: function (data) {
            return string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[video]]></MsgType>" +
                    "<Video>" +
                    "<MediaId><![CDATA[${MediaId}]]></MediaId>" +
                    "<ThumbMediaId><![CDATA[${ThumbMediaId}]]></ThumbMediaId>" +
                    "</Video>" +
                "</xml>", data);
        },
        renderMusic: function (data) {
            return string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[music]]></MsgType>" +
                    "<Music>" +
                    "<Title><![CDATA[${Title}]]></Title>" +
                    "<Description><![CDATA[${Description}]]></Description>" +
                    "<MusicUrl><![CDATA[${MusicUrl}]]></MusicUrl>" +
                    "<HQMusicUrl><![CDATA[${HQMusicUrl}]]></HQMusicUrl>" +
                    "</Music>" +
                "</xml>", data);
        },
        renderArticle: function (data) {
            var result = string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[news]]></MsgType>" +
                    "<ArticleCount>" + data.Articles.length + "</ArticleCount>" +
                    "<Articles>", data);

            array.forEach(data.Articles, function (item, index) {
                result += string.substitute(
                    "<item>" +
                    "<Title><![CDATA[${Title}]]></Title>" +
                    "<Description><![CDATA[${Description}]]></Description>" +
                    "<PicUrl><![CDATA[${PicUrl}]]></PicUrl>" +
                    "<Url><![CDATA[${Url}]]></Url>" +
                    "</item>", item);
            });

            result += string.substitute(
                    "</Articles>" +
                "</xml>", data);

            return result;
        }
    });
});
