import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import { ObjectId } from 'mongodb'; // Import ObjectId

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
    try {
        let post = {
            title: req.body.title,
            precio: req.body.precio,
            coleccion: req.body.coleccion,
            release_date: req.body.release_date,
            text: req.body.text,
            illustrator: req.body.illustrator,
            imageFilename: req.file?.filename
        };

        await board.addPost(post)
        
        res.render('confirmation', {
            message: 'Carta creada con éxito',
            returnUrl: '/'
        });

    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=Error%20al%20crear%20la%20carta: ${error.message}`);
    }
});

router.get('/post/:id', async (req, res) => {
    try {
        const post = await board.getPost(req.params.id);
        if (!post) {
            return res.redirect('/error?mensaje=Carta%20no%20encontrada');
        }

        const postReviews = await board.getReviewsForPost(req.params.id);

        const reviews = (postReviews || []).map(r => ({
            ...r,
            _id: r._id.toString(),
            postId: r.postId.toString()
        }));

        res.render('detail', {
            post: { ...post, _id: post._id.toString() },
            reviews: reviews
        });

    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=Error%20al%20cargar%20la%20carta: ${error.message}`);
    }
});

router.get('/post/:id/delete', async (req, res) => {
    try {
        let post = await board.deletePost(req.params.id);

        if (post && post.imageFilename) {
            await fs.rm(board.UPLOADS_FOLDER + '/' + post.imageFilename);
        }
        
        res.render('confirmation', {
            message: 'Carta eliminada con éxito',
            returnUrl: '/'
        });

    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=Error%20al%20borrar%20la%20carta: ${error.message}`);
    }
});

router.get('/post/:id/image', async (req, res) => {
    try {
        let post = await board.getPost(req.params.id);
        if (!post || !post.imageFilename) {
            return res.status(404).send('Imagen no encontrada');
        }
        res.download(board.UPLOADS_FOLDER + '/' + post.imageFilename);
    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=Error%20al%20descargar%20la%20imagen: ${error.message}`);
    }
});

router.post('/post/:id/crear_secundario', async (req, res) => {
    const postId = req.params.id;
    try {
        const review = {
            postId: new ObjectId(postId),
            nickname: req.body.nickname,
            date: req.body.date,
            text: req.body.text,
            rating: req.body.rating
        };

        await board.addReview(review);

        res.render('confirmation', {
            message: 'Reseña creada con éxito',
            returnUrl: `/post/${postId}`
        });

    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=${encodeURIComponent(error.message)}&returnUrl=/post/${postId}`);
    }
});

router.post('/post/:postId/borrar_secundario/:reviewId', async (req, res) => {
    const { postId, reviewId } = req.params;
    try {
        await board.deleteReview(reviewId);

        res.render('confirmation', {
            message: 'Reseña eliminada con éxito',
            returnUrl: `/post/${postId}`
        });
    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=Error%20al%20borrar%20la%20reseña&returnUrl=/post/${postId}`);
    }
});

router.get('/editar_secundario/:id', async (req, res) => {
    try {
        const review = await board.getReview(req.params.id);
        if (!review) {
            return res.redirect('/error?mensaje=Reseña%20no%20encontrada');
        }

        const reviewData = {
            ...review,
            _id: review._id.toString(),
            postId: review.postId.toString()
        };

        const currentRating = reviewData.rating ? reviewData.rating.toString() : '';
        reviewData.isRating1 = currentRating === '1';
        reviewData.isRating2 = currentRating === '2';
        reviewData.isRating3 = currentRating === '3';
        reviewData.isRating4 = currentRating === '4';
        reviewData.isRating5 = currentRating === '5';

        res.render('edit_review', { review: reviewData });

    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=Error%20al%20cargar%20la%20reseña`);
    }
});

router.post('/actualizar_secundario/:id', async (req, res) => {
    const reviewId = req.params.id;
    let postId;
    try {

        const originalReview = await board.getReview(reviewId);
        if (!originalReview) {
            return res.redirect('/error?mensaje=Reseña%20no%20encontrada');
        }
        postId = originalReview.postId.toString();

        const reviewData = {
            nickname: req.body.nickname,
            date: req.body.date,
            text: req.body.text,
            rating: req.body.rating
        };

        await board.updateReview(reviewId, reviewData);

        res.render('confirmation', {
            message: 'Reseña actualizada con éxito',
            returnUrl: `/post/${postId}`
        });

    } catch (error) {
        console.error(error);
        const returnUrl = postId ? `/post/${postId}` : '/';
        res.redirect(`/error?mensaje=${encodeURIComponent(error.message)}&returnUrl=${returnUrl}`);
    }
});

router.get('/error', (req, res) => {
    const mensaje = req.query.mensaje || 'Ha ocurrido un error inesperado.';
    const returnUrl = req.query.returnUrl || req.get('Referer') || '/';
    
    res.status(500).render('error', {
        mensaje: mensaje,
        returnUrl: returnUrl
    });
});