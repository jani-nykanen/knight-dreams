import { Canvas } from "../renderer/canvas.js";
import { InputManager } from "./input.js";
// import { TransitionManager } from "./transition.js";
import { AudioPlayer } from "../audio/audioplayer.js";
import { SceneManager } from "./scenemanager.js";
import { AssetManager } from "./assets.js";


export class ProgramEvent {


    private readonly canvas : Canvas;

    public readonly input : InputManager;
    // public readonly transition : TransitionManager;
    public readonly audio : AudioPlayer;
    public readonly assets : AssetManager;
    public readonly scenes : SceneManager;

    public readonly tick = 1.0;


    public get screenWidth() : number {

        return this.canvas.width;
    }


    public get screenHeight() : number {

        return this.canvas.height;
    }


    constructor(canvas : Canvas, scenes : SceneManager,
        input : InputManager, audio : AudioPlayer, 
        // transition : TransitionManager, 
        assets : AssetManager) {

        this.canvas = canvas;
        this.scenes = scenes;

        this.input = input;
        this.audio = audio;
        // this.transition = transition;
        this.assets = assets;
    }
}
