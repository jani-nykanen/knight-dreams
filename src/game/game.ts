import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/input.js";
import { Terrain } from "./terrain.js";
import { DEATH_TIME, Player } from "./player.js";
import { Camera } from "./camera.js";
import { updateSpeedAxis } from "./gameobject.js";


const scoreToString = (score : number, maxLength = 6) : string => {

    const s = String(score);
    return "0".repeat(Math.max(0, maxLength - s.length)) + s; 
}


const getHiscore = () : number => {

    try {

        return Number(window["localStorage"].getItem("__jnjs13k2023"));
    }
    catch (e) {}
    return 0;
}


const storeScore = (score : number) : void => {

    try {

        window["localStorage"].setItem("__jnjs13k2023", String(score));
    }
    catch (e) {}
}


export class Game implements Scene {


    private terrain : Terrain;
    private player : Player;
    private camera : Camera;

    private cloudPos : number = 0;

    private globalSpeed : number = 0.0;
    private targetSpeed : number = 2.0;

    private paused : boolean = false;
    private gameOverPhase : number = 0;

    private transitionTimer : number = 1.0;
    private fadeIn : boolean = false;

    private hiscore : number = 0;


    constructor(event : ProgramEvent) {

        this.terrain = new Terrain(event);
        this.player = new Player(64, event.screenHeight - 40);
        this.camera = new Camera();

        this.hiscore = getHiscore();
    }


    private drawBackground(canvas : Canvas, assets : AssetManager) : void {

        const CLOUD_Y = 64;
        const CLOUD_EXTRA_HEIGHT = 16;
        const CAMERA_SHIFT_FACTOR = 0.25;

        const bmpBase = assets.getBitmap("b");
        const bmpSky = assets.getBitmap("s");

        canvas.drawBitmap(bmpSky);

        canvas.move(0, -Math.round(this.camera.getPosition()*CAMERA_SHIFT_FACTOR));

        // Clouds
        canvas.fillColor("#ffffff");
        canvas.fillRect(0, CLOUD_Y + 16, canvas.width, CLOUD_EXTRA_HEIGHT);

        const shift = -Math.round(this.cloudPos);
        for (let i = 0; i < (canvas.width/48) + 2; ++ i) {

            canvas.drawBitmap(bmpBase, shift + i*48, CLOUD_Y, 0, 56, 48, 16)
        }

        // Water
        const waterY = (CLOUD_Y + CLOUD_EXTRA_HEIGHT + 32);

        canvas.fillColor("#0055aa");
        canvas.fillRect(0, waterY, canvas.width, canvas.height - waterY);

        for (let i = 0; i < canvas.width/8; ++ i) {

            canvas.drawBitmap(bmpBase, i*8, CLOUD_Y + 16 + CLOUD_EXTRA_HEIGHT, 48, 56, 8, 16);
        }

        canvas.moveTo();
    }


    private reset(event : ProgramEvent) : void {

        this.player = new Player(64, event.screenHeight - 40);
        this.terrain = new Terrain(event)
        this.camera.reset();

        this.globalSpeed = 0.0;
        this.targetSpeed = 2.0;

        this.gameOverPhase = 0;
    }


    private drawGameOver(canvas : Canvas, assets : AssetManager) : void {

        const bmpGameOver = assets.getBitmap("g");
        const fontYellow = assets.getBitmap("fy");

        const dx = canvas.width/2 - 60;
        const dy = 32;
        const cx = canvas.width/2;

        if (this.gameOverPhase == 2) {

            canvas.fillColor("#000000aa");
            canvas.fillRect();

            canvas.drawText(fontYellow, "SCORE: " + scoreToString(this.player.getScore()), cx, 80, -1, 0, TextAlign.Center);
            canvas.drawText(fontYellow, "HI-SCORE: " + scoreToString(this.hiscore), cx, 96, -1, 0, TextAlign.Center);
        }

        let t = this.player.getDeathTimer() / DEATH_TIME;
        if (this.gameOverPhase == 1 && t < 0.5) {

            t = (0.5 - t)*2;
            canvas.drawFunkyWaveEffectBitmap(bmpGameOver, dx, dy, t*t, 32, 4, 16);
            return;
        }
        canvas.drawBitmap(bmpGameOver, dx, dy);
    }


    private drawHUD(canvas : Canvas, assets : AssetManager) : void {

        const BAR_COLOR_1 = [ "#aaff00", "#ffff55", "#ffaa00", "#aa0000", "#000000" ];
        const BAR_COLOR_2 = [ "#55aa00", "#aaaa00", "#aa5500", "#550000", "#000000" ];
        const BAR_OUTER_COLOR = [ "#000000", "#555555" ];
        const BAR_WIDTH = 40;
        const BAR_HEIGHT = 7;
        const BAR_X = 12;
        const BAR_Y = 5;

        const bmpBase = assets.getBitmap("b");
        const bmpFont = assets.getBitmap("fw");

        canvas.fillColor("#00000033");
        canvas.fillRect(0, 0, canvas.width, 16);

        // Score
        canvas.drawBitmap(bmpBase, canvas.width/2 - 8, 1, 48, 80, 16, 8);
        canvas.drawText(bmpFont, scoreToString(this.player.getScore()), canvas.width/2, 8, -1, 0, TextAlign.Center);
        
        // Orbs
        canvas.drawBitmap(bmpBase, canvas.width - 40, 4, 32, 88, 8, 8);
        canvas.drawText(bmpFont, "#" + String(this.player.getOrbs()), canvas.width - 31, 4, -1);

        // Fuel

        canvas.drawBitmap(bmpBase, 2, 4, 40, 88, 8, 8);

        for (let i = 0; i < 2; ++ i) {

            canvas.fillColor(BAR_OUTER_COLOR[i]);
            canvas.fillRect(BAR_X + i, BAR_Y + i, BAR_WIDTH - i*2, BAR_HEIGHT - i*2);
        }

        const fillLevel = (this.player.getFuel() * (BAR_WIDTH - 2)) | 0;
        const barIndex = 3 - Math.round(this.player.getFuel()*3);

        if (fillLevel > 1) {

            canvas.fillColor(BAR_COLOR_2[barIndex]);
            canvas.fillRect(BAR_X + 1, BAR_Y + 1, fillLevel, BAR_HEIGHT - 2);

            canvas.fillColor(BAR_COLOR_1[barIndex]);
            canvas.fillRect(BAR_X + 1, BAR_Y + 1, fillLevel - 1, BAR_HEIGHT - 3);
        }
    }


    private drawTransition(canvas : Canvas) : void {

        if (this.transitionTimer <= 0)
            return;

        let t = this.transitionTimer;
        if (!this.fadeIn)
            t = 1.0 - t;

        const radius = (Math.hypot(canvas.width/2, canvas.height/2)*t*t) | 0;

        canvas.fillColor("#000000");
        canvas.fillCircleOutside(radius);
    }


    // public init(param : SceneParameter, event : ProgramEvent) : void {}


    public update(event : ProgramEvent) : void {

        const CLOUD_BASE_SPEED = 0.25;
        const CLOUD_SPEED_FACTOR = 0.125;
        const TRANSITION_SPEED = 1.0/30.0;

        if (this.transitionTimer > 0.0) {

            this.transitionTimer -= TRANSITION_SPEED*event.tick;
            if (this.transitionTimer <= 0.0 &&
                this.gameOverPhase == 2) {

                this.transitionTimer = 1.0;
                this.fadeIn = false,
                this.reset(event);
            }
            return;
        }

        if (this.gameOverPhase == 2) {

            if (event.input.getAction("s") == InputState.Pressed) {

                this.transitionTimer = 1.0;
                this.fadeIn = true;
            }
            return;
        }

        if (this.gameOverPhase == 0 &&
            event.input.getAction("p") == InputState.Pressed) {

            this.paused = !this.paused;
        }
        if (this.paused)
            return;

        this.globalSpeed = updateSpeedAxis(
            this.globalSpeed, 
            this.targetSpeed, 
            1.0/60.0*(this.gameOverPhase*2 + 1));

        this.terrain.update(this.globalSpeed, event);

        this.player.update(this.globalSpeed, event);
        if (this.gameOverPhase == 0 && this.player.isDying()) {

            this.gameOverPhase = 1;
            this.targetSpeed = 0.0;
            
            storeScore(this.hiscore = Math.max(this.player.getScore(), this.hiscore));
        }

        if (!this.player.doesExist()) {
            
            this.gameOverPhase = 2;
            return;
        }

        this.terrain.objectCollision(this.player, this.globalSpeed, event);

        this.camera.followObject(this.player, event);

        this.cloudPos = (this.cloudPos + (CLOUD_BASE_SPEED + this.globalSpeed*CLOUD_SPEED_FACTOR)*event.tick) % 48;
    }
    
    
    public redraw(canvas : Canvas, assets : AssetManager) : void {

        const SHAKE_TIME = 30;

        const bmpBase = assets.getBitmap("b");

        canvas.moveTo();

        this.drawBackground(canvas, assets);

        // canvas.drawBitmap(assets.getBitmap("t"), 0, 0);

        this.camera.use(canvas);

        if (this.gameOverPhase == 1 &&
            this.player.getDeathTimer() < SHAKE_TIME) {

            canvas.move(
                ((Math.random()*2 - 1) * 4) | 0,
                ((Math.random()*2 - 1) * 4) | 0);
        }

        this.terrain.draw(canvas, assets);
        this.player.draw?.(canvas, bmpBase);

        canvas.moveTo();
        if (this.gameOverPhase > 0) {

            this.drawGameOver(canvas, assets);
        }
        else {

            this.drawHUD(canvas, assets);
            if (this.paused) {

                canvas.fillColor("#00000055");
                canvas.fillRect();

                canvas.drawText(assets.getBitmap("fy"), "PAUSED", 
                    canvas.width/2, canvas.height/2 - 4, 0, 0, TextAlign.Center);
            }
        }


        
        this.drawTransition(canvas);
    }


    public dispose() : SceneParameter {
        
        return undefined;
    } 
}

