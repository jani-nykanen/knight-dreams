import { AssetManager } from "../core/assets.js";
import { ProgramEvent } from "../core/event.js";
import { Scene, SceneParameter } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { Canvas } from "../renderer/canvas.js";
import { drawTextBox } from "../ui/box.js";
import { Menu } from "../ui/menu.js";
import { MenuButton } from "../ui/menubutton.js";


const TEXT = 
`WOULD YOU LIKE TO ENABLE
AUDIO? YOU CANNOT CHANGE
THIS LATER!

PRESS ENTER TO CONFIRM.`;


export class AudioIntro implements Scene {


    private menu : Menu;


    constructor(event : ProgramEvent) {

        this.menu = new Menu(
        [
            new MenuButton("YES", (event : ProgramEvent) => this.goToGame(true, event)),
            new MenuButton("NO", (event : ProgramEvent) => this.goToGame(false, event))

        ], true);
    }


    private goToGame(toggleAudio : boolean, event : ProgramEvent) : void {

        event.audio.toggle(toggleAudio);
        event.transition.activate(false, TransitionType.Circle, 1.0/30.0);

        event.scenes.changeScene("game", event);
    }


    public init(param : SceneParameter, event : ProgramEvent) : void { }

    
    public update(event: ProgramEvent) : void {

        this.menu.update(event);
    }


    public redraw(canvas: Canvas, assets : AssetManager) : void {

        const SHADOW_OFFSET = 4;
        const COLORS = ["#ffffff", "#000000", "#5555aa"];

        const font = assets.getBitmap("font_white");

        canvas.clear("#0055aa");

        drawTextBox(canvas, font,
            TEXT, canvas.width/2, 64, -1, 12, 
            COLORS, SHADOW_OFFSET);
        this.menu.draw(canvas, assets, 0, 48, 12, true, 
            COLORS, SHADOW_OFFSET);
    }


    public dispose = () : SceneParameter => undefined;

}
