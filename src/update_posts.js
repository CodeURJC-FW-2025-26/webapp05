import { MongoClient } from 'mongodb';

(async function () {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    try {
        const col = client.db('board').collection('posts');
        const posts = await col.find().toArray();

        const mapping = {
            'coleccion-151': '151',
            'coleccion-blackbolt': 'Black Bolt',
            'coleccion-legendarytreasures': 'Legendary Treasures',
            'coleccion-paradoxrift': 'Paradox Rift',
            'coleccion-plasmastorm': 'Plasma Storm',
            'coleccion.crownzenit': 'Crown Zenith'
        };

        const prices = ['45.99', '89.99', '32.99', '67.99', '55.99', '12.99', '78.99', '69.99', '35.99', '52.99', '95.99', '42.99'];

        for (let i = 0; i < posts.length; i++) {
            const p = posts[i];
            const image = p.imageFilename || '';
            const folder = (image.split('/')[0] || image.split('\\')[0] || '').trim();
            const colec = mapping[folder] || folder || 'Unknown';
            const precio = prices[i % prices.length];

            await col.updateOne({ _id: p._id }, {
                $set: { coleccion: colec, precio: precio },
                $unset: { user: "", text: "" }
            });

            console.log('updated', p._id.toString(), colec, precio);
        }

        console.log('Migration complete');
    } finally {
        await client.close();
    }
})().catch(err => { console.error('Error:', err); process.exit(1); });
