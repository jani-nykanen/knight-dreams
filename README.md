## Knight Dreams

Knights Dreams (yes I know the title is dumb, I just couldn't come up with a better title that was short enough to fit the space I had reserved for it) is a tiny arcade endless runner action game that was made for [js13k competition (2023)](/https://js13kgames.com/). You can play it here: https://js13kgames.com/entries/knight-dreams (I'm guessing the url, it might be incorrect, in that case look for the game manually).

------

### ⚠️ Warning ⚠️

The code is bad. Like, really bad in some places. This was, however, intentional (well, there is also unintentional spaghetti, but let's ignore it for now), since I needed to find ways to save bytes, so I applied some... questionable programming practices. So, whatever you are going to do this with this code, please don't take any inspiration...

------

### Building

Typescript installation is mandatory. If you just want to make changes to the code, running `tsc` on the root is sufficient. If you want to make a zipped and "optimized" package that should fit 13kB (provided that you have up-to-date versions of all the tools), you need the following tools:
- Closure compiler
- advzip

Let us assume that you have the Closure compiler's `jar` file in the root and you have renamed it to `closure.jar`. Then you can run `CLOSURE_PATH=closure.jar make dist`. This should compile the Typescript, optimized the Javascript, embed the output script file to an index file and finally pack everything to a single zip file, of which size is then reduced using `advzip`. **Note that for some reason this might fail the first time you run the command, so try running it twice.**

-------

### License

The game has "I made my own license and saved money v. 0.1" license, which states the following:

```
SOURCE CODE (includes .ts, .html, .json and makefile files):

+ You are allowed to:
> Use the source code in your own personal, non-commercial projects. Giving credit to the original author of the code is not mandatory, but is recommended.
> Modify the source code in any way you want, and share the modified code. Again, giving credit to the original author is optional.

- You may not:
> Use the source code in a commercial product of any kind. This includes applications that cannot be accessed without a payment, but also applications that show ads when the application is running (for example, mobile games with ads). 
> Use the source code to train an AI. Not for any particular reason, I just want to see if the AI people actually read the source code licenses - or care about them.


ASSETS (includes .png files):

+ You are allowed to:
> Use the asset files in your own non-commercial projects, but in this case you have to give a credit to the original author.
> Modify the asset files as you like. If the modified assets are no longer recognizable (that is, they are heavily modified), then there is not need to give a credit to the original author.

- You are not allowed to:
> Do anything else with them, obviously.


BOTH:

- You may not:
> Do anything related to blockchains, NFTs or this weird term "web3" that seems to mean nothing at all.

```

------

(c) 2023 Jani Nykänen
