import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();
export default router;

const client = new MongoClient('mongodb://localhost:27017');

const db = client.db('board');
const posts = db.collection('posts');

export const UPLOADS_FOLDER = './uploads';

export async function addPost(post) {

    return await posts.insertOne(post);
}

export async function deletePost(id) {

    return await posts.findOneAndDelete({ _id: new ObjectId(id) });
}

export async function deletePosts() {

    return await posts.deleteMany();
}

export async function getPosts() {

    return await posts.find().toArray();
}

export async function getPostsPaginated(page = 1, perPage = 6, q = '', collection = '', price = '') {

    const pageNum = Math.max(1, parseInt(page));
    const limit = parseInt(perPage);
    const skip = (pageNum - 1) * limit;

    let filters = [];

    if (q && String(q).trim().length > 0) {
        const term = String(q).trim();
        const regex = new RegExp(term, 'i');
        filters.push({ title: regex });
    }


    // collection filter
    if (collection && String(collection).trim().length > 0) {
        filters.push({ coleccion: String(collection).trim() });
    }

    // price filter: support tokens like lt10, 10-50, gt50
    if (price && String(price).trim().length > 0) {
        const p = String(price).trim();
        if (p === 'lt10') {
            filters.push({ $expr: { $lt: [{ $toDouble: "$precio" }, 10] } });
        } else if (p === 'gt50') {
            filters.push({ $expr: { $gt: [{ $toDouble: "$precio" }, 50] } });
        } else if (/^\d+-\d+$/.test(p)) {
            const [min, max] = p.split('-').map(v => parseFloat(v));
            filters.push({ $expr: { $and: [{ $gte: [{ $toDouble: "$precio" }, min] }, { $lte: [{ $toDouble: "$precio" }, max] }] } });
        }
    }

    let filter = {};
    if (filters.length > 0) filter = { $and: filters };

    const items = await posts.find(filter).skip(skip).limit(limit).toArray();
    const total = await posts.countDocuments(filter);

    return { items, total };
}

export async function getPost(id) {

    return await posts.findOne({ _id: new ObjectId(id) });
}

export async function getCollections() {
    return await posts.distinct('coleccion');
}

