import { Bitmap } from "../renderer/bitmap.js";
import { Canvas } from "../renderer/canvas.js";


export const enum Decoration {

    None = 0,
    Palmtree = 1,
    SmallBush = 2,
    BigBush = 3,
};


export const drawDecoration = (canvas : Canvas, bmp : Bitmap | undefined,
    decoration : Decoration, dx : number, dy : number) : void => {

    switch (decoration) {

    case Decoration.Palmtree:

        canvas.drawBitmap(bmp, dx - 8, dy - 33, 160, 0, 32, 33);
        break;

    case Decoration.SmallBush:

        canvas.drawBitmap(bmp, dx, dy - 16, 24, 48, 16, 16);
        break;

    case Decoration.BigBush:

        canvas.drawBitmap(bmp, dx + 8, dy - 16, 0, 48, 24, 16);
        break;

    default:
        break;
    }
}
