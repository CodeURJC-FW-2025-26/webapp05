import fs from 'node:fs/promises';
import * as board from './board.js';

const UPLOADS_FOLDER = './uploads';
const DATA_FOLDER = './data';

let dataFile = 'data.json';

const dataString = await fs.readFile(DATA_FOLDER + '/' + dataFile, 'utf8');

const posts = JSON.parse(dataString);

await board.deletePosts();
for(let post of posts){
    await board.addPost(post);
}

await fs.rm(UPLOADS_FOLDER, { recursive: true, force: true });
await fs.mkdir(UPLOADS_FOLDER);
// Copy demo images to uploads only if data/images exists.
try {
    const stats = await fs.stat(DATA_FOLDER + '/images');
    if (stats && stats.isDirectory()) {
        await fs.cp(DATA_FOLDER + '/images', UPLOADS_FOLDER, { recursive: true });
    }
} catch (err) {
    // If the folder doesn't exist, skip copying images. The project also serves images from /public/imagenes.
    console.log('No demo images directory found in data/images — skipping copy.');
}

console.log('Demo data loaded');