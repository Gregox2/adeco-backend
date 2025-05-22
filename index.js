const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { XMLParser } = require('fast-xml-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint: /fetch-adeco-text?url=https://adeco.shop/...
app.get('/fetch-adeco-text', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || !url.startsWith('https://adeco.shop')) {
      return res.status(400).send('Nieprawidłowy adres URL');
    }

    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    res.type('text/plain').send(bodyText);
  } catch (err) {
    res.status(500).send('Błąd pobierania zawartości strony');
  }
});

// Endpoint: /list-paths
app.get('/list-paths', async (req, res) => {
  try {
    const xmlUrl = 'https://adeco.shop/console/integration/execute/name/GoogleSitemap/list/products/locale/pl_PL/page/1';
    const xmlRes = await axios.get(xmlUrl);
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xmlRes.data);
    const urls = parsed.urlset.url || [];

    const paths = urls.map(entry => {
      const loc = entry.loc || '';
      const imageTitle = entry['image:image']?.['image:title'] || null;
      const title = imageTitle || entry.lastmod || 'Podstrona sklepu';
      const path = loc.replace(/^https:\/\/[^/]+\//, '');
      return { path, url: loc, title };
    });

    res.json(paths);
  } catch (err) {
    res.status(500).send('Błąd parsowania sitemap');
  }
});

// Uruchomienie aplikacji na zadanym porcie
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
