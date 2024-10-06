import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { firestore } from '../../lib/firebaseAdmin';

type Post = {
    title: string;
    link: string;
    brief: string;
};

type Data = {
    posts?: Post[];
    message?: string;
};

// Helper function for scraping
async function scrapeWebsite(url: string) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const posts: Post[] = [];
        const scrapedData: string[] = [];

        $('.card-group .card a').each((i, element) => {
            const link = $(element).attr('href');
            if (link) {
                posts.push({ title: '', link, brief: '' });
            }

        });

        // $('p').each((i, element) => {
        //     scrapedData.push($(element).text());
        // });

        return posts;
    } catch (error) {
        throw new Error('Error scraping website');
    }
}

// Save scraped data to Firestore
async function savePostsToFirestore(posts: Post[]) {
    const batch = firestore.batch();
  
    posts.forEach(post => {
      const postRef = firestore.collection('posts').doc(); // Generate a new doc ID
      batch.set(postRef, post);
    });
  
    await batch.commit();
  }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    const { method } = req;

    switch (method) {
        // GET Request: Default scrape a hardcoded URL
        case 'GET':
            try {
                const url = 'https://kaiding.se/forsaljning';
                const posts = await scrapeWebsite(url);
                await savePostsToFirestore(posts);
                res.status(200).json({ posts });
            } catch (error: any) {
                res.status(500).json({ message: error.message });
            }
            break;

        // POST Request: Scrape based on user-provided URL
        case 'POST':
            try {
                const { url } = req.body;
                if (!url) {
                    res.status(400).json({ message: 'URL is required in the request body' });
                    return;
                }
                const posts = await scrapeWebsite(url);
                res.status(200).json({ posts });
            } catch (error: any) {
                res.status(500).json({ message: error.message });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
