import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

type Data = {
    data?: any;
    message?: string;
};

// Helper function for scraping
async function scrapeWebsite(url: string) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const scrapedData: string[] = [];

        $('h1').each((i, element) => {
            scrapedData.push($(element).text());
        });

        $('p').each((i, element) => {
            scrapedData.push($(element).text());
        });

        return scrapedData;
    } catch (error) {
        throw new Error('Error scraping website');
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    const { method } = req;
    
    switch (method) {
        // GET Request: Default scrape a hardcoded URL
        case 'GET':
            try {
                const url = 'https://kaiding.se/forsaljning/2024/duvan-bok-kontor-ab-i-konkurs';
                const data = await scrapeWebsite(url);
                res.status(200).json({ data });
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
                const data = await scrapeWebsite(url);
                res.status(200).json({ data });
            } catch (error: any) {
                res.status(500).json({ message: error.message });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
