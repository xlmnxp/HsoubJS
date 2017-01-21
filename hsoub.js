"use strict";
var request = require("request");
var Document = require("jsdom").jsdom;
var io = (function () {
    function io(email, password) {
        this.email = email;
        this.password = password;
        if (email != null || password != null)
            this.login();
    }
    Object.defineProperty(io.prototype, "registerURL", {
        get: function () {
            return "https://accounts.hsoub.com/register";
        },
        enumerable: true,
        configurable: true
    });
    io.prototype.login = function () {
    };
    io.prototype.search = function (keywords, searchIn, callback) {
        var search = keywords.join(" "), options;
        if (searchIn == null)
            searchIn = "";
        if (searchIn.split("/")[0] == "comments") {
            options = "&in=comments";
            if (searchIn.split("/")[1]) {
                if (searchIn.split("/")[1] == "new") {
                    options += "&filter=new";
                }
                else if (searchIn.split("/")[1] == "top") {
                    options += "$filter=top";
                }
            }
        }
        else if (searchIn.split("/")[0] == "communities") {
            options = "&in=communities";
            if (searchIn.split("/")[1]) {
                if (searchIn.split("/")[1] == "new") {
                    options += "&filter=new";
                }
                else if (searchIn.split("/")[1] == "active") {
                    options += "$filter=active";
                }
            }
        }
        else if (searchIn.split("/")[0] == "posts") {
            options = "&in=posts";
            if (searchIn.split("/")[1]) {
                if (searchIn.split("/")[1] == "new") {
                    options += "&filter=new";
                }
                else if (searchIn.split("/")[1] == "best") {
                    options += "$filter=best";
                }
            }
        }
        else {
            options = "";
        }
        var req = request({
            url: "https://io.hsoub.com/search?utf8=" + encodeURIComponent("✓") + "&s=" + encodeURIComponent(search) + (options != null ? options : ""),
            method: "get",
        }, function (err, res) {
            if (err) {
                callback(err, null);
            }
            var document = Document(res.body);
            var elements = document.body.querySelector(".itemsList").querySelectorAll(".listItem"), result = [];
            for (var i = 0; i < elements.length; i++) {
                var item = elements[i], data;
                if (searchIn.split("/")[0] == "comments") {
                    data = {
                        post_title: item.querySelector(".comment_post").innerHTML.split("\n")[2].trim(),
                        post_url: item.querySelector(".comment_post")["href"].trim(),
                        comment: item.querySelector(".post-title a").innerHTML.trim(),
                        comment_id: parseInt(item.id.replace("comment-", "")),
                        comment_url: item.querySelector(".post-title a")["href"].trim(),
                        community: item.querySelector(".post_community")["href"].replace("/", "").trim(),
                        community_name: item.querySelector(".post_community")["innerHTML"].split(">")[2].trim(),
                        community_url: item.querySelector(".post_community")["href"].trim()
                    };
                }
                else if (searchIn.split("/")[0] == "communities") {
                }
                else {
                    var username = item.querySelector(".usr26 img")["alt"], commentsCounter = item.querySelector(".commentsCounter")["innerHTML"].split(">")[3]
                        .replace("تعليق واحد", "1")
                        .replace("تعليقان", "2")
                        .replace("تعليقات", "")
                        .replace("ناقِش", "0")
                        .replace("تعليق", "")
                        .replace("</a", "");
                    if (username.match(/\<br \>/g)) {
                        username = username.split("<br >")[1];
                    }
                    data = {
                        post_id: parseInt(item.id.replace("post-", "")),
                        post_vote: item.querySelector(".post_points").innerHTML.trim(),
                        post_title: item.querySelector(".postContent a").innerHTML.trim(),
                        post_url: item.querySelector(".postContent a")["href"].trim(),
                        user: item.querySelector(".usr26")["href"].replace("/u/", "").trim(),
                        user_name: username.trim(),
                        user_image: item.querySelector(".usr26 img")["src"].trim(),
                        user_url: item.querySelector(".usr26")["href"].trim(),
                        community: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["href"].replace("/", "").trim(),
                        community_name: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["innerHTML"].split(">")[2].trim(),
                        community_url: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["href"].trim(),
                        commants_count: parseInt((commentsCounter).trim()),
                    };
                    if (item.querySelector(".post_image img") != undefined && item.querySelector(".post_image img") != null) {
                        data["post_thumbnail"] = item.querySelector(".post_image img")["src"];
                    }
                }
                result.push(data);
                if (i + 1 == elements.length) {
                    callback(null, result);
                    req.abort();
                }
            }
        });
        return this;
    };
    io.prototype.community = function (communityId, searchIn, callback) {
        var req = request({
            url: "https://io.hsoub.com/" + communityId + (searchIn != null ? "/" + searchIn : ""),
            method: "get",
        }, function (err, res) {
            if (err) {
                callback(err, null);
            }
            var document = Document(res.body);
            var elements = document.body.querySelector(".itemsList").querySelectorAll(".listItem"), result = {
                communityId: communityId,
                community_name: document.body.querySelector(".communities .block h2").innerHTML.trim(),
                community_url: "/" + communityId,
                community_about_url: "/" + communityId + "/about",
                community_followers: document.body.querySelector(".communities .communityFollower span").innerHTML.trim(),
                community_image: document.body.querySelector(".communities .block img")["src"].trim(),
                community_description: document.body.querySelector(".communities .block p").innerHTML.split("<")[0].trim(),
                community_lastcomments: [],
                community_best_contributors: [],
                community_owners: [],
                communitySubjects: [],
            };
            var lastcomments = document.body.querySelectorAll(".latestComments")[0].querySelectorAll("li");
            var best_contributors = document.body.querySelectorAll(".latestComments")[1].querySelectorAll("li");
            var owners = document.body.querySelectorAll(".latestComments")[2].querySelectorAll("li");
            for (var i = 0; i < lastcomments.length; i++) {
                result.community_lastcomments.push({
                    commentId: parseInt(lastcomments[i].id.replace("latest_comment-", "").trim()),
                    user: decodeURIComponent(lastcomments[i].querySelector(".comTxt a")["href"].replace("/u/", "")).trim(),
                    user_avatar: lastcomments[i].querySelector("img")["src"],
                    user_name: lastcomments[i].querySelector(".comTxt a").innerHTML.trim(),
                    user_url: lastcomments[i].querySelector(".comTxt a")["href"],
                    comment: lastcomments[i].querySelector(".comTxt .commentTxt").innerHTML.trim(),
                    comment_url: lastcomments[i].querySelector(".comTxt .commentTxt")["href"].trim(),
                });
            }
            for (var i = 0; i < best_contributors.length; i++) {
                result.community_best_contributors.push({
                    user: decodeURIComponent(best_contributors[i].querySelector(".comTxt div a.username")["href"].replace("/u/", "").trim()),
                    user_avatar: best_contributors[i].querySelector("img")["src"],
                    user_url: best_contributors[i].querySelector(".comTxt div a.username")["href"].trim(),
                    user_name: best_contributors[i].querySelector(".comTxt div a.username").innerHTML.trim(),
                });
            }
            for (var i = 0; i < owners.length; i++) {
                result.community_owners.push({
                    user: decodeURIComponent(owners[i].querySelector(".userCardHeaderText a")["href"].replace("/u/", "")).trim(),
                    user_avatar: owners[i].querySelector("img")["src"],
                    user_name: owners[i].querySelector("span.full_name").innerHTML.trim(),
                });
            }
            for (var i = 0; i < elements.length; i++) {
                var item = elements[i], username = item.querySelector(".usr26 img")["alt"], data, commentsCounter = item.querySelector(".commentsCounter")["innerHTML"].split(">")[3]
                    .replace("تعليق واحد", "1")
                    .replace("تعليقان", "2")
                    .replace("تعليقات", "")
                    .replace("ناقِش", "0")
                    .replace("تعليق", "")
                    .replace("</a", "");
                if (username.match(/\<br \>/g)) {
                    username = username.split("<br >")[1];
                }
                data = {
                    post_id: parseInt(item.id.replace("post-", "")),
                    post_vote: parseInt(item.querySelector(".post_points").innerHTML.trim()),
                    post_title: item.querySelector(".postContent a").innerHTML.trim(),
                    post_url: item.querySelector(".postContent a")["href"].trim(),
                    user: decodeURIComponent(item.querySelector(".usr26")["href"].replace("/u/", "")).trim(),
                    user_avatar: item.querySelector(".usr26 img")["src"].trim(),
                    user_name: username.trim(),
                    user_url: item.querySelector(".usr26")["href"].trim(),
                    community: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["href"].replace("/", "").trim(),
                    community_name: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["innerHTML"].split(">")[2].trim(),
                    community_url: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["href"].trim(),
                    commants_count: parseInt((commentsCounter).trim()),
                };
                if (item.querySelector(".post_image img") != undefined && item.querySelector(".post_image img") != null) {
                    data["post_thumbnail"] = item.querySelector(".post_image img")["src"];
                }
                result.communitySubjects.push(data);
                if (i + 1 == elements.length) {
                    callback(null, result);
                    req.abort();
                }
            }
        });
        return this;
    };
    io.prototype.profile = function (userId, searchIn, callback) {
        var req = request({
            url: "https://io.hsoub.com/u/" + userId + (searchIn != null ? "/" + searchIn : ""),
            method: "get",
        }, function (err, res) {
            if (err) {
                callback(err, null);
            }
            var document = Document(res.body);
            var elements = document.body.querySelector(".itemsList").querySelectorAll(".listItem"), result = {
                userId: userId,
                user: document.querySelector(".username").innerHTML.trim(),
                username: document.querySelector(".full_name").innerHTML.trim(),
                user_avatar: document.querySelector(".pull-right img")["src"].trim(),
                points: parseInt(document.querySelectorAll(".pull-right b")[0].innerHTML.trim()),
                register_date: new Date((document.querySelectorAll(".pull-right b")[1].innerHTML.trim()).split("/").reverse().join("-")),
                last_enter: document.querySelectorAll(".pull-right b")[2].innerHTML.trim(),
                results: []
            };
            for (var i = 0; i < elements.length; i++) {
                var item = elements[i], data;
                if (searchIn == "comments") {
                    data = {
                        post: {
                            id: parseInt(decodeURIComponent(item.querySelector(".comment_post")["href"]).trim().match(/(\d+[0-9]\-)/g)[0].replace("-", "")),
                            title: item.querySelector(".comment_post").innerHTML.split("\n")[2].trim(),
                            url: item.querySelector(".comment_post")["href"].trim()
                        },
                        comment: {
                            id: parseInt(item.id.replace("comment-", "")),
                            comment: item.querySelector(".post-title a").innerHTML.trim(),
                            url: item.querySelector(".post-title a")["href"].trim()
                        },
                        user: {
                            id: userId,
                            user: document.querySelector(".username").innerHTML.trim(),
                            name: document.querySelector(".full_name").innerHTML.trim(),
                            avatar: document.querySelector(".pull-right img")["src"].trim(),
                            url: "/u/" + userId,
                        },
                        community: {
                            id: item.querySelector(".post_community")["href"].replace("/", "").trim(),
                            name: item.querySelector(".post_community")["innerHTML"].split(">")[2].trim(),
                            url: item.querySelector(".post_community")["href"].trim()
                        },
                    };
                }
                else {
                    var username = item.querySelector(".usr26 img")["alt"];
                    var commentsCounter = item.querySelector(".commentsCounter")["innerHTML"].split(">")[3]
                        .replace("تعليق واحد", "1")
                        .replace("تعليقان", "2")
                        .replace("تعليقات", "")
                        .replace("ناقِش", "0")
                        .replace("تعليق", "")
                        .replace("</a", "");
                    if (username.match(/\<br \>/g)) {
                        username = username.split("<br >");
                    }
                    data = {
                        post: {
                            id: parseInt(item.id.replace("post-", "")),
                            likes: item.querySelector(".post_points").innerHTML.trim(),
                            title: item.querySelector(".postContent a").innerHTML.trim(),
                            url: item.querySelector(".postContent a")["href"].trim()
                        },
                        user: {
                            id: decodeURIComponent(item.querySelector(".usr26")["href"].replace("/u/", "")).trim(),
                            user: username[0].trim(),
                            name: username[1].trim(),
                            avatar: item.querySelector(".usr26 img")["src"].trim(),
                            url: item.querySelector(".usr26")["href"].trim(),
                        },
                        community: {
                            id: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["href"].replace("/", "").trim(),
                            name: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["innerHTML"].split(">")[2].trim(),
                            url: item.querySelectorAll(".pull-right .lightBoxUserLnk")[1]["href"].trim(),
                        },
                        commants_count: parseInt((commentsCounter).trim()),
                    };
                    if (item.querySelector(".post_image img") != undefined && item.querySelector(".post_image img") != null) {
                        data["post_thumbnail"] = item.querySelector(".post_image img")["src"];
                    }
                }
                result.results.push(data);
                if (i + 1 == elements.length) {
                    callback(null, result);
                    req.abort();
                }
            }
        });
        return this;
    };
    io.prototype.post = function (postId, callback) {
        var req = request({
            url: "https://io.hsoub.com/go/" + postId,
            method: "get",
        }, function (err, res) {
            if (err) {
                callback(err, null);
            }
            var document = Document(res.body);
            var elements = document.body.querySelector(".itemsList").querySelectorAll(".listItem"), result = {
                post: {
                    id: parseInt(item.id.replace("post-", "")),
                    likes: item.querySelector(".post_points").innerHTML.trim(),
                    title: item.querySelector(".postContent a").innerHTML.trim(),
                    url: item.querySelector(".postContent a")["href"].trim()
                },
                user: {
                    id: decodeURIComponent(item.querySelector(".usr26")["href"].replace("/u/", "")).trim(),
                    user: ''.trim(),
                    name: ''.trim(),
                    avatar: item.querySelector(".usr26 img")["src"].trim(),
                    url: item.querySelector(".usr26")["href"].trim(),
                },
                comments: []
            };
            for (var i = 0; i < elements.length; i++) {
                var item = elements[i], data;
                if (i + 1 == elements.length) {
                    callback(null, result);
                    req.abort();
                }
            }
        });
        return this;
    };
    io.prototype.comment = function (commentId, callback) {
        return this;
    };
    return io;
}());
exports.io = io;
var s = new io();
s.profile("xlmnxp", "comments", function (err, res) {
    if (err) {
        console.log(err);
    }
    console.log(JSON.stringify(res, null, 4));
});
//# sourceMappingURL=hsoub.js.map
