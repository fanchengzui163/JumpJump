var uiPanel = require("uiPanel");
cc.Class({
    extends: uiPanel,
    properties: {},

    onLoad() {
        this._super();
        cc.aimode = false;
        cc.ai = false;
    },

    start() {
        if (window.wx) {
            this.nodeDict["start"].active = false;
            wx.getSystemInfo({
                success: function(data) {
                    Game.GameManager.getUserInfoBtn = wx.createUserInfoButton({
                        type: 'text',
                        text: '开始多人游戏',
                        style: {
                            left: data.screenWidth * 0.2,
                            top: data.screenHeight * 0.73,
                            width: data.screenWidth * 0.65,
                            height: data.screenHeight * 0.07,
                            lineHeight: data.screenHeight * 0.07,
                            backgroundColor: '#fe714a',
                            color: '#ffffff',
                            textAlign: 'center',
                            fontSize: data.screenHeight * 0.025,
                            borderRadius: 8
                        }
                    });
                    Game.GameManager.getUserInfoBtn.onTap(function(res) {
                        if (Game.GameManager.isClickCd) {
                            return;
                        }
                        Game.GameManager.isClickCd = true;
                        setTimeout(function() {
                            Game.GameManager.isClickCd = false;
                        }, 1000);
                        Game.GameManager.nickName = res.userInfo.nickName;
                        Game.GameManager.avatarUrl = res.userInfo.avatarUrl;

                        this.startGame();

                        Game.GameManager.getUserInfoBtn.hide();
                    }.bind(this));
                }.bind(this)
            });
        } else {
            this.nodeDict["start"].on("click", this.startGame, this);
        }
    },

    startGame() {
        Game.GameManager.matchVsInit();
        Game.BulletManager.Init();
        Game.BattleManager.Init();
    },

    onEnable() {
        if (Game.GameManager.getUserInfoBtn) {
            Game.GameManager.getUserInfoBtn.show();
        }
    },

    onDisable() {
        if (Game.GameManager.getUserInfoBtn) {
            Game.GameManager.getUserInfoBtn.hide();
        }
    }
});
