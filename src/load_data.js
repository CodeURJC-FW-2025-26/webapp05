import fs from 'node:fs/promises';
import * as board from './board.js';

const UPLOADS_FOLDER = './uploads';
const DATA_FOLDER = './data';

let dataFile = 'data.json';
let reviewsFile = 'reviews.json';

const dataString = await fs.readFile(DATA_FOLDER + '/' + dataFile, 'utf8');
const reviewsString = await fs.readFile(DATA_FOLDER + '/' + reviewsFile, 'utf8');

const posts = JSON.parse(dataString);
const reviewsTemplate = JSON.parse(reviewsString);

await board.deletePosts();

for(let post of posts){
    const result = await board.addPost(post);
    const postId = result.insertedId;

    for (let review of reviewsTemplate) {
        await board.addReview({
            ...review, 
            date: new Date().toISOString().split('T')[0],
            postId: postId
        });
    }
}

await fs.rm(UPLOADS_FOLDER, { recursive: true, force: true });
await fs.mkdir(UPLOADS_FOLDER);
await fs.cp(DATA_FOLDER + '/images', UPLOADS_FOLDER, { recursive: true });

console.log('Demo data loaded with reviews from JSON');