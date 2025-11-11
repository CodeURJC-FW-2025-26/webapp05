import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';

import * as board from './board.js';

const router = express.Router();
export default router;

const upload = multer({ dest: board.UPLOADS_FOLDER })

router.get('/', async (req, res) => {

    console.log("¡Ruta '/' alcanzada! Buscando posts en MongoDB..."); // <-- AÑADE ESTO

    let posts = await board.getPosts();

    // Prepare posts for the view: convert _id to string and build image URL
    const viewPosts = posts.map(p => {
        const id = p._id?.toString?.() || '';
        let imagePath = p.imageFilename || '';

        // If imageFilename is a simple filename (no slash) it's an uploaded file in uploads
        if (imagePath && !imagePath.includes('/')) {
            imagePath = `/post/${id}/image`;
        }

        return { ...p, _id: id, imageFilename: imagePath };
    });

    res.render('index', { posts: viewPosts });
});


router.post('/post/new', upload.single('image'), async (req, res) => {
    
    // Mapea los campos del formulario (req.body) a los nombres de la BBDD
    let post = {
        user: "admin", // El formulario no tiene campo 'user', lo ponemos por defecto
        title: req.body.Name,
        text: req.body.Description,
        price: req.body.Price,
        illustrator: req.body.Illustrator,
        collection: req.body.Colection,
        release_date: req.body.Release_date,
        imageFilename: req.file?.filename // Nombre del archivo subido
    };

    const result = await board.addPost(post);

    // Redirige al usuario a la página de detalle de la carta recién creada
    res.redirect('/post/' + result.insertedId.toString());
});

router.get('/post/:id', async (req, res) => {

    let post = await board.getPost(req.params.id);

    res.render('detail', { post });
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

    if (!post || !post.imageFilename) {
        return res.status(404).send('Image not found');
    }

    try {
        let filePath;
        // If imageFilename seems to be a public path (contains a '/'), serve from public
        if (post.imageFilename.includes('/')) {
            filePath = path.resolve('./public', post.imageFilename);
        } else {
            filePath = path.resolve(board.UPLOADS_FOLDER, post.imageFilename);
        }

        res.sendFile(filePath, err => {
            if (err) {
                console.error('Error sending image file:', err);
                res.status(404).send('Image not found');
            }
        });
    } catch (err) {
        console.error('Error serving image:', err);
        res.status(500).send('Server error');
    }

});

