import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";


export const enum Decoration {

    None = 0,
    Palmtree = 1,
    SmallBush = 2,
    BigBush = 3,
};


export const drawDecoration = (canvas : Canvas, bmp : Bitmap,
    decoration : Decoration, dx : number, dy : number) : void => {

    const SX = [,160, 24, 0];
    const SY = [,0, 48, 48];
    const SW = [,32, 16, 24];
    const SH = [,33, 16, 16];

    const XOFF = [,-8, 0, 8];
    const YOFF = [,-33, -16, -16];

    canvas.drawBitmap(bmp, 
        dx + XOFF[decoration], dy + YOFF[decoration], 
        SX[decoration], SY[decoration], SW[decoration], SH[decoration]);
}
