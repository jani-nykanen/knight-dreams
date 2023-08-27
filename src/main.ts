import { ProgramEvent } from "./core/event.js";
import { Program } from "./core/program.js";
import { Game } from "./game/game.js";
import { AssetGen } from "./game/assetgen.js";
import { AudioIntro } from "./game/audiointro.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.audio.setGlobalVolume(0.60);

    // Yes, I had to manually shorten these names to save
    // some bytes. It's ugly, but necessary

    event.input.addAction("l", ["ArrowLeft"]);
    event.input.addAction("r", ["ArrowRight"]);
    event.input.addAction("u", ["ArrowUp"]);
    event.input.addAction("d", ["ArrowDown"]);
    event.input.addAction("s", ["Enter", "Space"]);
    event.input.addAction("j", ["ArrowUp"]);
    event.input.addAction("p", ["Enter"]);

    event.scenes.addScene("g", new Game(event));
    event.scenes.addScene("a", new AudioIntro(event));

    event.assets.loadBitmap("_f", "f.png");
    event.assets.loadBitmap("_b", "b.png");
}


window.onload = () => (new Program(192, 144)).run(initialEvent, AssetGen.generate);

