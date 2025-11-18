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

// Serve the create page 
router.get('/create_new_card.html', (req, res) => {
    return res.render('create_new_card');
});

router.post('/post/new', upload.single('image'), async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const precio = String(req.body.precio || '').trim();
        const coleccion = String(req.body.coleccion || '').trim();
        const release_date = String(req.body.release_date || '').trim();
        // support both 'description' and legacy 'text' field names from the form
        const description = String(req.body.description || req.body.text || '').trim();
        const illustrator = String(req.body.illustrator || '').trim();

        const errors = [];

        // 1) None of the fields can be empty
        if (!title) errors.push('Title cannot be empty');
        if (!precio) errors.push('Price cannot be empty');
        if (!coleccion) errors.push('Collection cannot be empty');
        if (!release_date) errors.push('Release date cannot be empty');
        if (!description) errors.push('Description cannot be empty');
        if (!illustrator) errors.push('Illustrator cannot be empty');
        if (!req.file) errors.push('Image file is required');

        // 2) Title must start with an uppercase letter (Unicode aware)
        if (title && !/^[\p{Lu}]/u.test(title)) {
            errors.push('Title must start with an uppercase letter');
        }

        // 3) Title must be unique (case-insensitive)
        if (title) {
            const existing = await board.getPostByTitle(title);
            if (existing) errors.push('Title must be unique');
        }

        if (errors.length > 0) {
            // remove uploaded file if validation failed
            if (req.file) await fs.rm(board.UPLOADS_FOLDER + '/' + req.file.filename).catch(() => { });
            // render unified error page (project has error template)
            const mensaje = errors.join('; ');
            return res.status(400).render('error', { mensaje, returnUrl: '/create_new_card.html' });
        }

        const post = {
            title,
            precio,
            coleccion,
            release_date,
            description,
            illustrator,
            imageFilename: req.file?.filename
        };

        const result = await board.addPost(post);
        const insertedId = result.insertedId?.toString();

        // render confirmation page (project uses confirmation.html)
        return res.render('confirmation', {
            message: 'Card created successfully.',
            returnUrl: `/post/${insertedId}`
        });

    } catch (error) {
        console.error(error);
        if (req.file) await fs.rm(board.UPLOADS_FOLDER + '/' + req.file.filename).catch(() => { });
        return res.redirect(`/error?mensaje=${encodeURIComponent('Internal server error')}`);
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

router.get('/detalle/:id', async (req, res) => {
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

// Delete and redirect to a confirmation page
router.post('/borrar/:id', async (req, res) => {
    const id = req.params.id;
    try {
        if (!ObjectId.isValid(id)) {
            return res.redirect('/error?mensaje=Id%20no%20válido');
        }

        const result = await board.deletePost(id);
        // support both findOneAndDelete result (.value) and direct return
        const deleted = result && result.value ? result.value : result;

        if (deleted && deleted.imageFilename) {
            await fs.rm(board.UPLOADS_FOLDER + '/' + deleted.imageFilename).catch(() => { });
        }

        return res.redirect('/borrado_exito');

    } catch (error) {
        console.error(error);
        return res.redirect(`/error?mensaje=${encodeURIComponent('Error al borrar la carta: ' + error.message)}`);
    }
});

// Confirmation page after delete
router.get('/borrado_exito', (req, res) => {
    res.render('confirmation', {
        message: 'Elemento eliminado con éxito',
        returnUrl: '/'
    });
});

router.get('/editar/:id', async (req, res) => {
    const id = req.params.id;
    try {
        if (!ObjectId.isValid(id)) return res.redirect('/error?mensaje=Id%20no%20válido');

        const post = await board.getPost(id);
        if (!post) return res.redirect('/error?mensaje=Carta%20no%20encontrada');

        const postData = { ...post, _id: post._id.toString() };


        postData.description = postData.description || postData.text || '';
        postData.displayDescription = postData.description || '';


        postData.illustrator = postData.illustrator || '';
        postData.displayIllustrator = postData.illustrator || '';


        postData.release_date = postData.release_date || '';
        if (postData.release_date) {

            const d = new Date(postData.release_date);
            if (!isNaN(d.getTime())) {
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const yyyy = d.getFullYear();
                postData.release_date = `${yyyy}-${mm}-${dd}`;
            }
        }


        const col = String(postData.coleccion || '').toLowerCase();
        postData.isPlasma = /plasma/.test(col) || /plasmastorm/.test(col);
        postData.isLegendary = /legendary/.test(col) || /legendarytreasures/.test(col);
        postData.is151 = col === '151' || /151/.test(col);
        postData.isBlackBolt = /black/.test(col);
        postData.isParadox = /paradox/.test(col) || /paradoxrift/.test(col);
        postData.isCrown = /crown/.test(col) || /zenith/.test(col);

        res.render('edit_post', { post: postData });
    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=${encodeURIComponent('Error al cargar formulario de edición: ' + error.message)}`);
    }
});


router.post('/actualizar/:id', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    try {
        if (!ObjectId.isValid(id)) return res.redirect('/error?mensaje=Id%20no%20válido');

        const original = await board.getPost(id);
        if (!original) return res.redirect('/error?mensaje=Carta%20no%20encontrada');

        const title = String(req.body.title || '').trim();
        const precio = String(req.body.precio || '').trim();
        const coleccion = String(req.body.coleccion || '').trim();
        const release_date = String(req.body.release_date || '').trim();
        const description = String(req.body.description || req.body.text || '').trim();
        const illustrator = String(req.body.illustrator || '').trim();

        const errors = [];
        if (!title) errors.push('Title cannot be empty');
        if (!precio) errors.push('Price cannot be empty');
        if (!coleccion) errors.push('Collection cannot be empty');
        if (!release_date) errors.push('Release date cannot be empty');
        if (!description) errors.push('Description cannot be empty');
        if (!illustrator) errors.push('Illustrator cannot be empty');

        //Uppercase titles
        if (title && !/^[\p{Lu}]/u.test(title)) {
            errors.push('Title must start with an uppercase letter');
        }

        // Unique title excluding current post
        if (title) {
            const existing = await board.getPostByTitle(title);
            if (existing && existing._id.toString() !== id) errors.push('Title must be unique');
        }

        if (errors.length > 0) {
            // remove uploaded file if validation failed
            if (req.file) await fs.rm(board.UPLOADS_FOLDER + '/' + req.file.filename).catch(() => { });

            const postData = {
                _id: id,
                title,
                precio,
                coleccion,
                release_date,
                description,
                illustrator,
                imageFilename: original.imageFilename
            };

            return res.status(400).render('edit_post', { post: postData, errors });
        }

        const updateData = {
            title,
            precio,
            coleccion,
            release_date,
            description,
            illustrator,
            text: description
        };

        if (req.file) {
            updateData.imageFilename = req.file.filename;
            if (original.imageFilename) {
                await fs.rm(board.UPLOADS_FOLDER + '/' + original.imageFilename).catch(() => { });
            }
        }

        await board.updatePost(id, updateData);

        return res.redirect(`/actualizado_exito?id=${id}`);

    } catch (error) {
        console.error(error);
        if (req.file) await fs.rm(board.UPLOADS_FOLDER + '/' + req.file.filename).catch(() => { });
        return res.redirect(`/error?mensaje=${encodeURIComponent('Error al actualizar la carta: ' + error.message)}`);
    }
});

// Confirmation after update
router.get('/actualizado_exito', (req, res) => {
    const id = req.query.id;
    const returnUrl = id ? `/detalle/${id}` : '/';
    res.render('confirmation', {
        message: 'Elemento actualizado con éxito',
        returnUrl: returnUrl
    });
});