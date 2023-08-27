import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/input.js";
import { Terrain } from "./terrain.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";
import { Bitmap } from "../renderer/bitmap.js";
import { updateSpeedAxis } from "./gameobject.js";


export class Game implements Scene {


    private terrain : Terrain;
    private player : Player;
    private camera : Camera;

    private cloudPos : number = 0;

    private globalSpeed : number = 0.0;
    private targetSpeed : number = 2.0;

    private paused : boolean = false;


    constructor(event : ProgramEvent) {

        this.terrain = new Terrain(event);
        this.player = new Player(64, event.screenHeight - 40);
        this.camera = new Camera();
    }


    private drawBackground(canvas : Canvas, assets : AssetManager) : void {

        const CLOUD_Y = 64;
        const CLOUD_EXTRA_HEIGHT = 16;
        const CAMERA_SHIFT_FACTOR = 0.25;

        const bmpBase = assets.getBitmap("base");
        const bmpSky = assets.getBitmap("sky");

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


    private reset() : void {

        this.player.recreate();
        this.terrain.reset();

        this.globalSpeed = 0.0;
        this.targetSpeed = 2.0;
    }


    public init(param : SceneParameter, event : ProgramEvent) : void {

        // TODO: (Re)set terrain
    }


    public update(event : ProgramEvent) : void {

        const CLOUD_BASE_SPEED = 0.25;
        const CLOUD_SPEED_FACTOR = 0.125;

        if (event.input.getAction("pause") == InputState.Pressed) {

            this.paused = !this.paused;
        }
        if (this.paused)
            return;

        this.globalSpeed = updateSpeedAxis(this.globalSpeed, this.targetSpeed, 1.0/60.0);

        this.terrain.update(this.globalSpeed, event);

        this.player.update(this.globalSpeed, event);
        if (this.player.isDying()) {
            
            this.reset();
            return;
        }

        this.terrain.objectCollision(this.player, this.globalSpeed, event);

        this.camera.followObject(this.player, event);

        this.cloudPos = (this.cloudPos + (CLOUD_BASE_SPEED + this.globalSpeed*CLOUD_SPEED_FACTOR)*event.tick) % 48;
    }
    
    
    public redraw(canvas : Canvas, assets : AssetManager) : void {

        const bmpBase = assets.getBitmap("base");

        canvas.moveTo();

        this.drawBackground(canvas, assets);

        // canvas.drawBitmap(assets.getBitmap("terrain"), 0, 0);

        this.camera.use(canvas);

        this.terrain.draw(canvas, assets);
        this.player.draw?.(canvas, bmpBase);

        canvas.moveTo();
        if (this.paused) {

            canvas.fillColor("rgba(0,0,0,0.33)");
            canvas.fillRect();

            canvas.drawText(assets.getBitmap("font_yellow"), "PAUSED", 
                canvas.width/2, canvas.height/2 - 4, 0, 0, TextAlign.Center);
        }
    }


    public dispose() : SceneParameter {
        
        return undefined;
    } 
}

