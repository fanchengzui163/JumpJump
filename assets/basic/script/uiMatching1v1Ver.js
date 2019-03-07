var uiPanel = require("uiPanel");
var mvs = require("Matchvs");
cc.Class({
    extends: uiPanel,
    properties: {
        playerIcons: [cc.Node]
    },

    onLoad() {
        this._super();
        this.nodeDict["quit"].on("click", this.leaveRoom, this);

        clientEvent.on(clientEvent.eventType.joinRoomResponse, this.joinRoomResponse, this);
        clientEvent.on(clientEvent.eventType.joinRoomNotify, this.joinRoomNotify, this);
        clientEvent.on(clientEvent.eventType.leaveRoomResponse, this.leaveRoomResponse, this);
        clientEvent.on(clientEvent.eventType.leaveRoomNotify, this.leaveRoomNotify, this);
        clientEvent.on(clientEvent.eventType.joinOverResponse, this.joinOverResponse, this);
    },

    joinRandomRoom: function() {
        var result = null;
        if (GLB.matchType === GLB.RANDOM_MATCH) {
            result = mvs.engine.joinRandomRoom(GLB.MAX_PLAYER_COUNT, '');
            if (result !== 0) {
                console.log('进入房间失败,错误码:' + result);
            }
        } else if (GLB.matchType === GLB.PROPERTY_MATCH) {
            var matchinfo = new mvs.MatchInfo();
            matchinfo.maxPlayer = GLB.MAX_PLAYER_COUNT;
            matchinfo.mode = 0;
            matchinfo.canWatch = 0;
            matchinfo.tags = GLB.tagsInfo;
            result = mvs.engine.joinRoomWithProperties(matchinfo, "joinRoomWithProperties");
            if (result !== 0) {
                console.log('进入房间失败,错误码:' + result);
            }
        }
    },

    startGame: function() {
        console.log('游戏即将开始');
        cc.director.loadScene('game');
    },

    joinRoomResponse: function(data) {
        if (data.status !== 200) {
            console.log('进入房间失败,异步回调错误码: ' + data.status);
        } else {
            console.log('进入房间成功');
            console.log('房间号: ' + data.roomInfo.roomID);
        }
        GLB.roomId = data.roomInfo.roomID;
        var userIds = [GLB.userInfo.id]
        console.log('房间用户: ' + userIds);

        var playerIcon = null;
        for (var j = 0; j < data.roomUserInfoList.length; j++) {
            playerIcon = this.playerIcons[j].getComponent('playerIcon');
            if (playerIcon && !playerIcon.userInfo) {
                playerIcon.setData(data.roomUserInfoList[j]);
                if (GLB.userInfo.id !== data.roomUserInfoList[j].userId) {
                    userIds.push(data.roomUserInfoList[j].userId);
                }
            }
        }

        for (var i = 0; i < this.playerIcons.length; i++) {
            playerIcon = this.playerIcons[i].getComponent('playerIcon');
            if (playerIcon && !playerIcon.userInfo) {
                playerIcon.setData(GLB.userInfo);
                break;
            }
        }
        GLB.playerUserIds = userIds;
        if (userIds.length >= GLB.MAX_PLAYER_COUNT) {
            var result = mvs.engine.joinOver("");
            console.log("发出关闭房间的通知");
            if (result !== 0) {
                console.log("关闭房间失败，错误码：", result);
            }
            GLB.playerUserIds = userIds;
        }
        this.scheduleOnce(this.overTime,3);
    },

    joinRoomNotify: function(data) {
        console.log("joinRoomNotify, roomUserInfo:" + JSON.stringify(data.roomUserInfo));
        this.unschedule(this.overTime);
        var playerIcon = null;
        for (var j = 0; j < this.playerIcons.length; j++) {
            playerIcon = this.playerIcons[j].getComponent('playerIcon');
            if (playerIcon && !playerIcon.userInfo) {
                playerIcon.setData(data.roomUserInfo);
                break;
            }
        }
    },
    overTime(){
        var result = mvs.engine.joinOver("");
        console.log("发出关闭房间的通知");
        if (result !== 0) {
            console.log("关闭房间失败，错误码：", result);
        }
        cc.ai = true;

    },
    leaveRoom: function() {
        mvs.engine.leaveRoom("");
        uiFunc.closeUI(this.node.name);
        this.node.destroy();
    },

    leaveRoomNotify: function(data) {
        if (GLB.roomId === data.leaveRoomInfo.roomID) {
            for (var i = 0; i < this.playerIcons.length; i++) {
                var playerIcon = this.playerIcons[i].getComponent('playerIcon');
                if (playerIcon && playerIcon.userInfo && playerIcon.playerId === data.leaveRoomInfo.userId) {
                    playerIcon.init();
                    break;
                }
            }
        }
    },

    leaveRoomResponse: function(data) {
        if (data.leaveRoomRsp.status === 200) {
            console.log("离开房间成功");
            for (var i = 0; i < this.playerIcons.length; i++) {
                var playerIcon = this.playerIcons[i].getComponent('playerIcon');
                if (playerIcon) {
                    playerIcon.init();
                    break;
                }
            }
            uiFunc.closeUI(this.node.name);
        } else {
            console.log("离开房间失败");
        }
    },

    joinOverResponse: function(data) {
        if (data.joinOverRsp.status === 200) {
            console.log("关闭房间成功");
            if (cc.ai){
                this.vsMachineStart();
            } else{
                this.notifyGameStart();
            }
        } else {
            console.log("关闭房间失败，回调通知错误码：", data.joinOverRsp.status);
        }
    },

    notifyGameStart: function() {
        GLB.isRoomOwner = true;
        if (cc.ai) {
            Game.GameManager.startGame();
        }else {
            var msg = {
                action: GLB.GAME_START_EVENT,
                userIds: GLB.playerUserIds
            };
            Game.GameManager.sendEventEx(msg);
        }
    },
    vsMachineStart: function(){
        var userIds = [GLB.userInfo.id];
        var machine = 666666;
        userIds.push(machine);
        GLB.playerUserIds = userIds;

        setTimeout(function() {
            this.playerIcons[0].getComponent('playerIcon').setData({id:GLB.playerUserIds[0]});
            this.playerIcons[1].getComponent('playerIcon').setData({id:GLB.playerUserIds[1]});
        }.bind(this), 500);

        setTimeout(function() {
            this.notifyGameStart();
        }.bind(this), 1500);

    },
    onDestroy() {
        clientEvent.off(clientEvent.eventType.joinRoomResponse, this.joinRoomResponse, this);
        clientEvent.off(clientEvent.eventType.joinRoomNotify, this.joinRoomNotify, this);
        clientEvent.off(clientEvent.eventType.leaveRoomResponse, this.leaveRoomResponse, this);
        clientEvent.off(clientEvent.eventType.leaveRoomNotify, this.leaveRoomNotify, this);
        clientEvent.off(clientEvent.eventType.joinOverResponse, this.joinOverResponse, this);
    }
});
