import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { InputState } from "../core/input.js";
import { Scene, SceneParameter } from "../core/scene.js";
// import { TransitionType } from "../core/transition.js";
import { Canvas } from "../renderer/canvas.js";


const TEXT = 
`ENABLE AUDIO? PRESS
ENTER TO CONFIRM.

WARNING: AUDIO DOES
NOT WORK ON SAFARI!`;


export class AudioIntro implements Scene {


    // private menu : Menu;
    private cursorPos : number = 0;

    private readonly width : number;
    private readonly height : number;


    constructor() {

        const lines = TEXT.split("\n");

        this.width = Math.max(...lines.map(s => s.length));
        this.height = lines.length;
    }


    private drawBox (canvas : Canvas, 
        x : number, y : number, w : number, h : number) : void {

        const SHADOW_OFFSET = 4;
        const COLORS = ["#000000", "#ffffff", "#000000"];

        x -= w/2;
        y -= h/2;

        canvas.fillColor("#00000055");
        canvas.fillRect(x + SHADOW_OFFSET, y + SHADOW_OFFSET, w, h);
        
        for (let i = 0; i < COLORS.length; ++ i) {
    
            canvas.fillColor(COLORS[i]);
            canvas.fillRect(x + i, y + i, w - i*2, h - i*2);
        }
    }

    
    public update(event: ProgramEvent) : void {

        if (event.input.getAction("u") == InputState.Pressed ||
            event.input.getAction("d") == InputState.Pressed) {

            this.cursorPos = 1 - this.cursorPos;
        }

        if (event.input.getAction("s") == InputState.Pressed) {

            event.audio.toggle(this.cursorPos == 0);
            event.scenes.changeScene("g");

            // Playing the first sound here makes sure the next sound is
            // played with 100% probability...
            event.audio.playSample(event.assets.getSample("ac"), 0.60);
        }
    }


    public redraw(canvas: Canvas, assets : AssetManager) : void {

        const CENTER_Y = 48;
        const CONFIRM_BOX_CENTER_Y = 112;
        const MARGIN = 12;

        const fonts = [assets.getBitmap("fw"), assets.getBitmap("fy")];

        canvas.clear("#0055aa");

        const w = this.width*7;
        const h = this.height*10;

        this.drawBox(canvas, canvas.width/2, CENTER_Y, w + MARGIN, h + MARGIN);
        canvas.drawText(fonts[0], TEXT, canvas.width/2 - w/2, CENTER_Y - h/2, -1, 2);

        this.drawBox(canvas, canvas.width/2, CONFIRM_BOX_CENTER_Y, 40, 32);

        let text : string;
        let active : boolean;
        for (let i = 0; i < 2; ++ i) {

            active = i == this.cursorPos;
            text = (active ? "&" : " ") + ["YES", "NO"][i];
            canvas.drawText(fonts[Number(active)], text, canvas.width/2 - 18, CONFIRM_BOX_CENTER_Y - 10 + i*10, -1, 0);
        } 
    }

}
