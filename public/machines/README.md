# Ore & Order machine animation assets

The app looks for these seven-frame WebP animation sheets in this folder:

- `miner-sheet.webp`
- `smelter-sheet.webp`
- `press-sheet.webp`
- `assembler-sheet.webp`
- `copperMiner-sheet.webp`
- `copperSmelter-sheet.webp`
- `wiremill-sheet.webp`
- `circuitpress-sheet.webp`
- `beamMill-sheet.webp`
- `coilWinder-sheet.webp`

These are prepared from the previously generated cartoon GIFs. Every sheet is 7 equal square frames laid out horizontally, with frame 7 repeating frame 1 for a seamless loop.

**To install:** Extract `ore-and-order-machine-art.zip` supplied in ChatGPT. Upload all 10 `.webp` files into this folder on GitHub, then commit them to the main branch. No code change is required afterward.

The game falls back to the existing React/SVG artwork if an image file is absent. Animation duration derives from the machine's in-game production cycle, with paused and stopped machinery frozen.
