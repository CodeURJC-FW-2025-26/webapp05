import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();
export default router;

const client = new MongoClient('mongodb://localhost:27017');

const db = client.db('board');
const posts = db.collection('posts');
const reviews = db.collection('reviews'); // New collection for reviews.

export const UPLOADS_FOLDER = './uploads';

export async function addPost(post) {
    return await posts.insertOne(post);
}

export async function deletePost(id) {
    await reviews.deleteMany({ postId: new ObjectId(id) });
    return await posts.findOneAndDelete({ _id: new ObjectId(id) });
}

export async function deletePosts() {
    await reviews.deleteMany();
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

// Find a post by title (case-insensitive exact match)
function escapeRegExp(string) {
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getPostByTitle(title) {
    if (!title) return null;
    const escaped = escapeRegExp(String(title).trim());
    const regex = new RegExp(`^${escaped}$`, 'i');
    return await posts.findOne({ title: { $regex: regex } });
}

// Review and validation.
export async function addReview(review) {
    if (!review.nickname || !review.text || !review.rating || !review.postId) {
        throw new Error('Faltan campos obligatorios en la reseña');
    }

    const existingReview = await reviews.findOne({
        postId: review.postId,
        nickname: review.nickname
    });

    if (existingReview) {
        throw new Error(`El usuario '${review.nickname}' ya ha enviado una reseña para esta carta.`);
    }

    return await reviews.insertOne(review);
}

export async function deleteReview(reviewId) {
    return await reviews.findOneAndDelete({ _id: new ObjectId(reviewId) });
}

export async function getReviewsForPost(postId) {
    return await reviews.find({ postId: new ObjectId(postId) }).toArray();
}

export async function getReview(reviewId) {
    return await reviews.findOne({ _id: new ObjectId(reviewId) });
}

export async function updateReview(reviewId, reviewData) {
    
    if (!reviewData.nickname || !reviewData.text || !reviewData.rating) {
        throw new Error('Faltan campos obligatorios');
    }

    const originalReview = await reviews.findOne({ _id: new ObjectId(reviewId) });
    if (!originalReview) {
        throw new Error('Reseña no encontrada');
    }
    const postId = originalReview.postId;

    const existingReview = await reviews.findOne({
        postId: postId,                          
        nickname: reviewData.nickname,            
        _id: { $ne: new ObjectId(reviewId) }       
    });

    if (existingReview) {
        throw new Error(`El usuario '${reviewData.nickname}' ya ha enviado una reseña para esta carta.`);
    }
   
    return await reviews.updateOne(
        { _id: new ObjectId(reviewId) },
        {
            $set: {
                nickname: reviewData.nickname,
                date: reviewData.date,
                text: reviewData.text,
                rating: reviewData.rating
            }
        }
    );
}