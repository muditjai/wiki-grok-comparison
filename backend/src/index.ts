import express from 'express';
import type { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

interface ComparisonResult {
    wikipedia: {
        url: string;
        summary: string;
    } | null;
    grockypedia: {
        url: string;
        summary: string;
    } | null;
}

// Helper to fetch Wikipedia summary directly
async function getWikipediaSummary(term: string): Promise<{ url: string, summary: string, title: string } | null> {
    try {
        // Search Wikipedia API for the term to get the correct title/URL
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=1&namespace=0&format=json`;
        console.log(`Searching Wikipedia API: ${searchUrl}`);
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        // Response format: [term, [titles], [descriptions], [urls]]
        if (searchResponse.data && searchResponse.data[3] && searchResponse.data[3].length > 0) {
            const title = searchResponse.data[1][0];
            const url = searchResponse.data[3][0];
            console.log(`Found Wikipedia URL: ${url}`);
            
            // Now fetch the summary from the page HTML
            const summary = await fetchSummary(url);
            return { url, summary, title };
        }
        return null;
    } catch (error: any) {
        console.error('Error fetching from Wikipedia:', error.message);
        return null;
    }
}

async function fetchSummary(url: string): Promise<string> {
    console.log(`Fetching summary from: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Wikipedia content selector
        let summary = $('#mw-content-text .mw-parser-output p').not('.mw-empty-elt').first().text();
        // If first p is empty or too short (e.g. coordinates), try next
        if (!summary || summary.trim().length < 50) {
             summary = $('#mw-content-text .mw-parser-output p').not('.mw-empty-elt').eq(1).text();
        }
        
        return summary.trim() || 'No summary content found.';
    } catch (error: any) {
        console.error(`Error fetching summary from ${url}:`, error.message);
        return 'Could not fetch summary.';
    }
}

app.get('/compare', async (req: Request, res: Response) => {
    const term = req.query.term as string;
    console.log(`Received comparison request for term: ${term}`);
    
    if (!term) {
        res.status(400).json({ error: 'Term is required' });
        return;
    }

    const wikiResult = await getWikipediaSummary(term);
    
    // Fetch Grokipedia summary directly from the page URL using the resolved title
    let grockyResult = null;
    const resolvedTitle = wikiResult?.title || term;

    try {
        const grokUrl = `https://grokipedia.com/page/${encodeURIComponent(resolvedTitle)}`;
        console.log(`Fetching Grokipedia summary from: ${grokUrl}`);
        const grokResponse = await axios.get(grokUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            validateStatus: () => true // Allow 404s to not throw so we can handle gracefully
        });

        if (grokResponse.status === 200) {
            const $grok = cheerio.load(grokResponse.data);
            let summary = $grok('article span[data-tts-block="true"]').first().text();
            
            // Remove citation brackets like [1]
            summary = summary.replace(/\[\d+\]/g, '').trim();

            if (summary) {
                grockyResult = {
                    url: grokUrl,
                    summary: summary
                };
            }
        }
    } catch (error: any) {
        console.error('Error fetching from Grokipedia:', error.message);
    }

    const results: ComparisonResult = {
        wikipedia: wikiResult ? { url: wikiResult.url, summary: wikiResult.summary } : null,
        grockypedia: grockyResult
    };

    console.log('Returning results to frontend.');
    res.json(results);
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
