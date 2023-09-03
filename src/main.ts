import { ProgramEvent } from "./core/event.js";
import { Program } from "./core/program.js";
import { Game } from "./game/game.js";
import { generateAssets } from "./game/assetgen.js";
import { AudioIntro } from "./game/audiointro.js";


const initialEvent = (event : ProgramEvent) : void => {

    event.audio.setGlobalVolume(0.40);

    // Yes, I had to manually shorten these names to save
    // some bytes. It's ugly, but necessary

    event.input.addAction("l", ["ArrowLeft", "KeyA"])
    event.input.addAction("r", ["ArrowRight", "KeyD"])
    event.input.addAction("u", ["ArrowUp", "KeyW"])
    event.input.addAction("d", ["ArrowDown", "KeyS"])
    event.input.addAction("s", ["Enter", "Space"])
    event.input.addAction("j", ["ArrowUp", "KeyW"])
    event.input.addAction("t", ["Space"])
    event.input.addAction("p", ["Enter"])

    event.scenes.addScene("g", new Game(event));
    event.scenes.addScene("a", new AudioIntro());

    event.assets.loadBitmap("_f", "f.png");
    event.assets.loadBitmap("_b", "b.png");
}


window.onload = () => (new Program(192, 144)).run(initialEvent, generateAssets);

