import express from 'express';
import mustacheExpress from 'mustache-express';
import bodyParser from 'body-parser';

import router from './router.js';
import './load_data.js';

const app = express();

app.use(express.static('./public'));
// Serve uploaded images so templates can reference /uploads/<path>
app.use('/uploads', express.static('./uploads'));
// Serve JavaScript files from src folder with correct MIME type for ES6 modules
app.use('/js', express.static('./src', {
    extensions: ['js'],
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.set('view engine', 'html');
app.engine('html', mustacheExpress(), ".html");
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);

app.listen(3000, () => console.log('Web ready in http://localhost:3000/'));