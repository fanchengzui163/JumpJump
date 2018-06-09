cc.Class({
    extends: cc.Component,

    properties: {
        speed: 0,
        firePoint: cc.Node,
        hearts: [cc.Node],
        slatePoint: cc.Node,
        heart: 3,
        fireClip: {
            default: null,
            url: cc.AudioClip
        },
        hurtClip: {
            default: null,
            url: cc.AudioClip
        },
        deadClip: {
            default: null,
            url: cc.AudioClip
        }
    },

    init(playerId) {
        this.playerId = playerId;
        this.direction = DirectState.None;
        this.targetPosX = this.node.x;
    },

    fire() {
        var bulletNode = Game.BulletManager.getBullet();
        var worldPos = this.firePoint.convertToWorldSpaceAR(cc.v2(0, 0));
        var bulletPoint = Game.BulletManager.node.convertToNodeSpaceAR(worldPos);
        bulletNode.position = bulletPoint;
        if (GLB.userInfo.id === this.playerId) {
            bulletNode.rotation = 0;
        } else {
            bulletNode.rotation = 180;
        }
        var bullet = bulletNode.getComponent("bullet");
        if (this.playerId === GLB.userInfo.id) {
            bullet.init(this.playerId, GLB.NormalBulletSpeed);
        } else {
            bullet.init(this.playerId, -GLB.NormalBulletSpeed);
        }
        cc.audioEngine.play(this.fireClip, false, 1);
    },

    hurt() {
        this.heart--;
        if (this.heart <= 0) {
            this.dead();
        } else {
            // 受伤动画
            // todo
            cc.audioEngine.play(this.hurtClip, false, 1);
        }
        this.refreshHeartUI();
    },

    dead() {
        // 游戏结束--
        cc.audioEngine.play(this.deadClip, false, 1);
        if (GLB.isRoomOwner) {
            var msg = {
                action: GLB.GAME_OVER_EVENT
            };
            Game.GameManager.sendEventEx(msg);
        }
    },

    refreshHeartUI() {
        for (var i = 0; i < this.hearts.length; i++) {
            if (i > this.heart - 1) {
                this.hearts[i].active = false;
            } else {
                this.hearts[i].active = true;
            }
        }
    },

    move() {
        var dir = this.direction === DirectState.None ? 0 :
            this.direction === DirectState.Left ? -1 : 1;
        var deltaX = (1 / GLB.FRAME_RATE) * this.speed * dir;
        this.targetPosX += deltaX;
        if (this.targetPosX < -GLB.limitX) {
            this.targetPosX = GLB.limitX + deltaX;
            this.node.x = GLB.limitX;
        }
        if (this.targetPosX > GLB.limitX) {
            this.targetPosX = -GLB.limitX + deltaX;
            this.node.x = -GLB.limitX;
        }
    },

    setDirect(dir) {
        this.direction = dir;
    },

    update(dt) {
        this.node.x = cc.lerp(this.node.x, this.targetPosX, 4 * dt);
    }
});