import { ProgramEvent } from "../core/event.js";
import { Bitmap, BitmapGenerator } from "../renderer/bitmap.js";


const PALETTE = [

    "00000000", // 0 Alpha
    "000000ff", // 1 Black
    "ffffffff", // 2 White
    "ffff00ff", // 3 Yellow
    "aaff00ff", // 4 Bright green
    "55aa00ff", // 5 Green
    "aa5555ff", // 6 Reddish brown
    "ffaa55ff", // 7 Brownish brown (what)
    "ffffaaff", // 8 Bright yellow
    "aa0000ff", // 9 Red
    "ff5500ff", // A Orange
    "aaaa55ff", // B Ugly yellow
    "aaaaaaff", // C Bright gray
    "555555ff", // D Dark gray

];


const COLOR_MAP = [

    "1540", "1540", "6670", "1220", "1670", "19A0", "19A0", "19A0",
    "1670", "1670", "1B80", "1B80", "1670", "19A0", "19A0", "19A0",
    "1670", "1670", "1540", "1540", "1670", "1B80", "1B80", "1B80",
    "6660", "6660", "1540", "1540", "1670", "1670", "1C20", undefined,
];



const generateFonts = (font : Bitmap | undefined, event : ProgramEvent) : void => {

    const fontWhite = BitmapGenerator.applyPalette(font,
        (new Array<string>(16*4)).fill("0002"),
        PALETTE);
    const fontYellow= BitmapGenerator.applyPalette(font,
        (new Array<string>(16*4)).fill("0003"),
        PALETTE);
    event.assets.addBitmap("font_white", fontWhite);
    event.assets.addBitmap("font_yellow", fontYellow);
}


const generateTerrainTileset = (c : CanvasRenderingContext2D, 
    width : number, height : number, bmp : (Bitmap | undefined) []) : void => {

    const base = bmp[0];

    const put = (sx : number, sy : number, dx : number, dy : number, xoff = 0, yoff = 0) : void => {

        c.drawImage(base, sx*8, sy*8, 8, 8, dx*8 + xoff, dy*8 + yoff, 8, 8);
    }

    c.fillStyle = "#000000";

    //
    // Grass & soil (ground & sky)
    //

    // Grass edges
    for (let j = 0; j < 2; ++ j) {
        
        c.drawImage(base, 12, 0, 4, 8, 4, j*32, 4, 8);
        c.drawImage(base, 8, 0, 4, 8, 4*16 - 8, j*32, 4, 8);
    
        for (let i = 0; i < 6; ++ i) {

            if (j == 1) {

                if (i == 0)
                    put(0, 2, i + 1, 5);
                else if (i == 5)
                    put(1, 2, i + 1, 5);
                else
                    put(5, 3, i + 1, 5);
            }

            put(0, 0, i + 1, j*4);
            put(2, 0, i + 1, j*4 + 1, 0, -2);

            if (j == 0) {

                for (let k = 0; k < 3; ++ k) {

                    put(0, 1, i + 1, k + 1);
                }
            }
        }
    }

    // Soil edges
    for (let i = 1; i < 4; ++ i) {

        c.drawImage(base, 8, 8, 4, 8, 8, i*8, 4, 8);
        c.drawImage(base, 12, 8, 4, 8, 52, i*8, 4, 8);
    }

    // Correction pixels
    c.fillRect(8, 6, 1, 2);
    c.fillRect(55, 6, 1, 2);
    c.fillRect(8, 6 + 32, 1, 2);
    c.fillRect(55, 6 + 32, 1, 2);

    // Slopes
    let shift : number;
    for (let j = 0; j < 2; ++ j) {

        for (let i = 0; i < 4; ++ i) {

            put(0, 1, 8 + i, 2 + j);
        }

        for (let i = 0; i < 2; ++ i) {

            shift = i*j*2 - (j + i);

            put(4, 2 + j, 8 + i + j*2, 2 + shift);
            put(2 + j, 2, 8 + i + j*2, 1 + shift);
            put(2 + j, 3, 8 + i + j*2, 2 + shift);
            put(j, 3, 8 + i + j*2, 2 + shift, 0, -1);
        }
    }
    
}



const generate = (event : ProgramEvent) : void => {

    const bmpBase = event.assets.getBitmap("_base");
    const bmpFont = event.assets.getBitmap("_font");

    generateFonts(bmpFont, event);    

    const coloredBase = BitmapGenerator.applyPalette(bmpBase, COLOR_MAP, PALETTE);

    event.assets.addBitmap("base", coloredBase);
    event.assets.addBitmap("terrain", 
        BitmapGenerator.createCustom(256, 128, [coloredBase], generateTerrainTileset));
}


export const AssetGen = { generate: generate };
