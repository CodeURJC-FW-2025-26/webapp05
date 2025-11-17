import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';

import * as board from './board.js';

const router = express.Router();
export default router;

const upload = multer({ dest: board.UPLOADS_FOLDER })

router.get('/', async (req, res) => {

    const perPage = 6;
    const page = parseInt(req.query.page) || 1;
    const q = req.query.q || '';
    const collection = req.query.collection || '';
    const rawPrice = req.query.price || '';

    const { items, total } = await board.getPostsPaginated(page, perPage, q, collection, rawPrice);

    // convert ObjectId to string so templates can use _id in URLs
    const posts = (items || []).map(p => ({ ...p, _id: p._id.toString() }));

    const totalPages = Math.ceil(total / perPage);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({ num: i, current: i === page });
    }

    const hasPrev = page > 1;
    const hasNext = page < totalPages;
    const prevPage = hasPrev ? page - 1 : null;
    const nextPage = hasNext ? page + 1 : null;

    // get available collections for filter buttons
    const rawCollections = await board.getCollections();
    const collections = (rawCollections || []).map(c => ({ name: c, current: c === collection }));

    // prepare price object for template (used to set active class)
    let price = '';
    if (rawPrice) {
        price = {
            value: rawPrice,
            is_lt10: rawPrice === 'lt10',
            is_10_50: rawPrice === '10-50',
            is_gt50: rawPrice === 'gt50'
        };
    }

    res.render('index', { posts, pages, currentPage: page, totalPages, hasPrev, hasNext, prevPage, nextPage, q, collection, price, collections });
});

router.post('/post/new', upload.single('image'), async (req, res) => {

    let post = {
        user: req.body.user,
        title: req.body.title,
        text: req.body.text,
        imageFilename: req.file?.filename
    };

    await board.addPost(post);

    res.render('saved_post', { _id: post._id.toString() });

});

router.get('/post/:id', async (req, res) => {

    let post = await board.getPost(req.params.id);

    res.render('show_post', { post });
});

router.get('/post/:id/delete', async (req, res) => {

    let post = await board.deletePost(req.params.id);

    if (post && post.imageFilename) {
        await fs.rm(board.UPLOADS_FOLDER + '/' + post.imageFilename);
    }

    res.render('deleted_post');
});

router.get('/post/:id/image', async (req, res) => {

    let post = await board.getPost(req.params.id);

    res.download(board.UPLOADS_FOLDER + '/' + post.imageFilename);

});

