import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import { ObjectId } from 'mongodb'; // Import ObjectId

import * as board from './board.js';

const router = express.Router();
export default router;

const upload = multer({ dest: board.UPLOADS_FOLDER })

// API endpoint for infinite scroll (returns JSON)
router.get('/api/posts', async (req, res) => {
    try {
        const perPage = 6;
        const page = parseInt(req.query.page) || 1;
        const q = req.query.q || '';
        const collection = req.query.collection || '';
        const rawPrice = req.query.price || '';

        const { items, total } = await board.getPostsPaginated(page, perPage, q, collection, rawPrice);

        // convert ObjectId to string so templates can use _id in URLs
        const posts = (items || []).map(p => ({ ...p, _id: p._id.toString() }));

        const totalPages = Math.ceil(total / perPage);

        res.json({
            posts,
            page,
            totalPages,
            hasMore: page < totalPages
        });
    } catch (error) {
        console.error('Error in /api/posts:', error);
        res.status(500).json({ error: 'Error loading posts' });
    }
});

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

// Get attributes from the form
router.post('/post/new', upload.single('image'), async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const precio = String(req.body.precio || '').trim();
        const coleccion = String(req.body.coleccion || '').trim();
        const release_date = String(req.body.release_date || '').trim();
        // support both 'description' and legacy 'text' field names from the form
        const description = String(req.body.description || req.body.text || req.body.descripcion || '').trim();
        // illustrator is optional in edit form (field removed); keep original if not provided
        const illustrator = String(req.body.illustrator || '').trim();

        const errors = [];

        // --------------Validation-----------------

        // 1) None of the fields can be empty
        if (!title) errors.push('Title cannot be empty');
        if (!precio) errors.push('Price cannot be empty');
        if (!coleccion) errors.push('Collection cannot be empty');
        // date_added: accept if provided, otherwise default to today's date
        let date_added = String(req.body.date_added || req.body.fecha_anadido || '').trim();

        if (!release_date) errors.push('Release date cannot be empty');
        if (!description) errors.push('Description cannot be empty');

        if (!date_added) {
            // set server-side default to today (YYYY-MM-DD)
            date_added = new Date().toISOString().split('T')[0];
        }
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

        // Price must be a valid number (Decimal is 0.01, positive, can't be zero)
        if (isNaN(precio) || parseFloat(precio) <= 0) {
            errors.push('Price must be a valid positive number greater than zero');
        }

        const isJsonRequest = req.headers.accept && req.headers.accept.includes('application/json');

        if (errors.length > 0) {
            // remove uploaded file if validation failed
            if (req.file) await fs.rm(board.UPLOADS_FOLDER + '/' + req.file.filename).catch(() => { });

            if (isJsonRequest) {
                return res.status(400).json({ success: false, errors, message: errors.join('; ') });
            }
            // render error page
            const mensaje = errors.join('; ');
            return res.status(400).render('error', { mensaje, returnUrl: '/create_new_card.html' });
        }

        const post = {
            title,
            precio,
            coleccion,
            release_date,
            description,
            date_added,
            illustrator,
            imageFilename: req.file?.filename
        };

        const result = await board.addPost(post);
        const insertedId = result.insertedId?.toString();

        if (isJsonRequest) {
            return res.json({
                success: true,
                message: 'Card created successfully.',
                postId: insertedId,
                createdPostUrl: `/post/${insertedId}`
            });
        }

        // render confirmation page (project uses confirmation.html)
        return res.render('confirmation', {
            message: 'Card created successfully.',
            returnUrl: `/post/${insertedId}`,
            createdPostUrl: `/post/${insertedId}`
        });

    } catch (error) {
        console.error(error);
        if (req.file) await fs.rm(board.UPLOADS_FOLDER + '/' + req.file.filename).catch(() => { });

        const isJsonRequest = req.headers.accept && req.headers.accept.includes('application/json');
        if (isJsonRequest) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
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

// API endpoint for deleting a post (returns JSON)
router.delete('/api/posts/:id', async (req, res) => {
    try {
        const post = await board.deletePost(req.params.id);

        // Delete image file if it exists
        if (post && post.imageFilename) {
            try {
                await fs.rm(board.UPLOADS_FOLDER + '/' + post.imageFilename);
            } catch (err) {
                console.error('Error deleting image file:', err);
                // Continue even if file deletion fails
            }
        }

        res.json({
            success: true,
            message: 'Post deleted successfully',
            id: req.params.id
        });
    } catch (error) {
        console.error('Error in DELETE /api/posts/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting post',
            message: error.message
        });
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

        const result = await board.addReview(review);
        const insertedId = result.insertedId.toString();

        const newReview = {
            _id: insertedId,
            postId: postId,
            nickname: review.nickname,
            date: review.date,
            text: review.text,
            rating: review.rating
        };

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ success: true, review: newReview });
        }

        res.render('confirmation', {
            message: 'Reseña creada con éxito',
            returnUrl: `/post/${postId}`
        });

    } catch (error) {
        console.error(error);
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.redirect(`/error?mensaje=${encodeURIComponent(error.message)}&returnUrl=/post/${postId}`);
    }
});

// API endpoint for deleting a review (returns JSON)
router.delete('/api/reviews/:id', async (req, res) => {
    try {
        const review = await board.deleteReview(req.params.id);

        res.json({
            success: true,
            message: 'Review deleted successfully',
            id: req.params.id
        });
    } catch (error) {
        console.error('Error in DELETE /api/reviews/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting review',
            message: error.message
        });
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
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
            }
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

        const updatedReview = {
            _id: reviewId,
            postId: postId,
            nickname: reviewData.nickname,
            date: reviewData.date,
            text: reviewData.text,
            rating: reviewData.rating
        };

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ success: true, review: updatedReview });
        }

        res.render('confirmation', {
            message: 'Reseña actualizada con éxito',
            returnUrl: `/post/${postId}`
        });

    } catch (error) {
        console.error(error);
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(400).json({ success: false, message: error.message });
        }
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
        // prepare date_added for edit form
        postData.date_added = postData.date_added || postData.fecha_anadido || '';
        if (postData.date_added) {
            const d2 = new Date(postData.date_added);
            if (!isNaN(d2.getTime())) {
                const mm2 = String(d2.getMonth() + 1).padStart(2, '0');
                const dd2 = String(d2.getDate()).padStart(2, '0');
                const yyyy2 = d2.getFullYear();
                postData.date_added = `${yyyy2}-${mm2}-${dd2}`;
            }
        }


        const col = String(postData.coleccion || '').toLowerCase();
        postData.isPlasma = /plasma/.test(col) || /plasmastorm/.test(col);
        postData.isLegendary = /legendary/.test(col) || /legendarytreasures/.test(col);
        postData.is151 = col === '151' || /151/.test(col);
        postData.isBlackBolt = /black/.test(col);
        postData.isParadox = /paradox/.test(col) || /paradoxrift/.test(col);
        postData.isCrown = /crown/.test(col) || /zenith/.test(col);

        // Flag for existing image
        postData.hasImage = !!postData.imageFilename;

        res.render('edit_post', { post: postData });
    } catch (error) {
        console.error(error);
        res.redirect(`/error?mensaje=${encodeURIComponent('Error al cargar formulario de edición: ' + error.message)}`);
    }
});


router.post('/actualizar/:id', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    const isJsonRequest = req.headers.accept && req.headers.accept.includes('application/json');

    try {
        if (!ObjectId.isValid(id)) {
            if (isJsonRequest) {
                return res.status(400).json({ success: false, message: 'Id no válido' });
            }
            return res.redirect('/error?mensaje=Id%20no%20válido');
        }

        const original = await board.getPost(id);
        if (!original) {
            if (isJsonRequest) {
                return res.status(404).json({ success: false, message: 'Carta no encontrada' });
            }
            return res.redirect('/error?mensaje=Carta%20no%20encontrada');
        }

        const title = String(req.body.title || '').trim();
        const precio = String(req.body.precio || '').trim();
        const coleccion = String(req.body.coleccion || '').trim();
        const release_date = String(req.body.release_date || '').trim();
        const description = String(req.body.description || req.body.text || req.body.descripcion || '').trim();
        const illustrator = String(req.body.illustrator || '').trim();
        const removeImage = String(req.body.removeImage || '').trim();

        const errors = [];
        if (!title) errors.push('Title cannot be empty');
        if (!precio) errors.push('Price cannot be empty');
        if (!coleccion) errors.push('Collection cannot be empty');

        // date_added is optional in edit form now; if not provided, use original's value later
        const date_added = String(req.body.date_added || req.body.fecha_anadido || '').trim();

        if (!release_date) errors.push('Release date cannot be empty');
        if (!description) errors.push('Description cannot be empty');

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

            if (isJsonRequest) {
                return res.status(400).json({ success: false, errors, message: errors.join('; ') });
            }
            // aggregate message and render the generic error page (same UX as create)
            const mensaje = errors.join('; ');
            return res.status(400).render('error', { mensaje, returnUrl: `/editar/${id}` });
        }

        const updateData = {
            title,
            precio,
            coleccion,
            release_date,
            // if date_added not provided, preserve original
            date_added: date_added || original.date_added,
            // illustrator optional: preserve original if empty
            illustrator: illustrator || original.illustrator,
            description,
            text: description
        };

        if (req.file) {
            // New image uploaded - replace old one
            updateData.imageFilename = req.file.filename;
            if (original.imageFilename) {
                await fs.rm(board.UPLOADS_FOLDER + '/' + original.imageFilename).catch(() => { });
            }
        } else if (removeImage === 'true') {
            // User wants to remove the image without replacement
            updateData.imageFilename = null;
            if (original.imageFilename) {
                await fs.rm(board.UPLOADS_FOLDER + '/' + original.imageFilename).catch(() => { });
            }
        }

        await board.updatePost(id, updateData);

        if (isJsonRequest) {
            return res.json({
                success: true,
                message: 'Card updated successfully.',
                postId: id
            });
        }

        return res.redirect(`/actualizado_exito?id=${id}`);

    } catch (error) {
        console.error(error);
        if (req.file) await fs.rm(board.UPLOADS_FOLDER + '/' + req.file.filename).catch(() => { });

        if (isJsonRequest) {
            return res.status(500).json({ success: false, message: 'Error al actualizar la carta: ' + error.message });
        }
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

// AJAX validation: check if title is unique 
router.get('/api/validate/title', async (req, res) => {
    try {
        const rawTitle = String(req.query.title || '').trim();
        if (!rawTitle) {
            return res.status(400).json({ ok: false, message: 'Title is required', available: false });
        }

        const existing = await board.getPostByTitle(rawTitle);
        const available = !existing;
        return res.json({ ok: true, available });
    } catch (err) {
        console.error('Error in /api/validate/title:', err);
        return res.status(500).json({ ok: false, message: 'Server error', available: false });
    }
});