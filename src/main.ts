import { ProgramEvent } from "./core/event.js";
import { Program } from "./core/program.js";
import { Game } from "./game/game.js";
import { AssetGen } from "./game/assetgen.js";
import { AudioIntro } from "./game/audiointro.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.audio.setGlobalVolume(0.60);

    event.input.addAction("left", ["ArrowLeft"]);
    event.input.addAction("right", ["ArrowRight"]);
    event.input.addAction("up", ["ArrowUp"]);
    event.input.addAction("down", ["ArrowDown"]);
    event.input.addAction("select", ["Enter", "Space"]);
    event.input.addAction("jump", ["ArrowUp"]);
    event.input.addAction("pause", ["Enter"]);

    event.scenes.addScene("audiointro", new AudioIntro(event), true);
    event.scenes.addScene("game", new Game(event), false);

    event.assets.loadBitmap("_font", "font.png");
    event.assets.loadBitmap("_base", "base.png");
}


window.onload = () => (new Program(192, 144)).run(initialEvent, AssetGen.generate);

