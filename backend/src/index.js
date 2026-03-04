import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';
const app = express();
const port = 3001;
app.use(cors());
app.use(express.json());
async function searchGoogle(query) {
    try {
        const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const links = [];
        $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href && href.startsWith('/url?q=')) {
                const urlPart = href.split('/url?q=')[1];
                if (urlPart) {
                    const url = urlPart.split('&')[0];
                    if (url) {
                        links.push(decodeURIComponent(url));
                    }
                }
            }
            else if (href && href.startsWith('http')) {
                links.push(href);
            }
        });
        return links;
    }
    catch (error) {
        console.error('Error searching Google:', error);
        return [];
    }
}
async function fetchSummary(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        let summary = '';
        if (url.includes('wikipedia.org')) {
            summary = $('#mw-content-text .mw-parser-output p').first().text();
            if (!summary || summary.trim().length < 50) {
                summary = $('#mw-content-text .mw-parser-output p').eq(1).text();
            }
        }
        else {
            // Generic summary fetcher
            summary = $('p').first().text();
            if (!summary || summary.trim().length < 50) {
                summary = $('p').eq(1).text();
            }
        }
        return summary.trim();
    }
    catch (error) {
        console.error(`Error fetching summary from ${url}:`, error);
        return 'Could not fetch summary.';
    }
}
app.get('/compare', async (req, res) => {
    const term = req.query.term;
    if (!term) {
        res.status(400).json({ error: 'Term is required' });
        return;
    }
    const links = await searchGoogle(term);
    const wikiLink = links.find(link => link.includes('wikipedia.org/wiki/'));
    const grockyLink = links.find(link => link.includes('grockypedia.com') || link.includes('grocky.com')); // Adjusting for likely grockypedia domains
    const results = {
        wikipedia: null,
        grockypedia: null
    };
    if (wikiLink) {
        results.wikipedia = {
            url: wikiLink,
            summary: await fetchSummary(wikiLink)
        };
    }
    if (grockyLink) {
        results.grockypedia = {
            url: grockyLink,
            summary: await fetchSummary(grockyLink)
        };
    }
    res.json(results);
});
app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map