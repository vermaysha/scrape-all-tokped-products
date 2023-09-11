import { Scrape } from "../lib/scrape";
import { Page } from "puppeteer";
import * as cheerio from "cheerio";
import { storage } from '../helpers/storage';
import { sha1 } from '../helpers/sha1'

export async function scrapeMainPage() {
  const scrape = new Scrape();
  await scrape.init();

  console.info('Scrawling halaman utama tokopedia...')
  const res = await scrape.crawl(
    "https://www.tokopedia.com/",
    async (page: Page) => {
      try {
        await page.waitForSelector('[data-testid="icnHeaderIcon"]', {
          timeout: 60_000
        })
      } catch (error) {
        // silent is gold
      }

      let totalHeight = 0;

      const scrollPage = async () => {
        await page.evaluate(async () => {
          const distance = 100;
          window.scrollBy(0, distance);
        });
      };

      let loadMore = true;
      do {
        await scrollPage();

        const scrollHeight = await page.evaluate(() => {
          return document.body.scrollHeight;
        });
        const innerHeight = await page.evaluate(() => {
          return window.innerHeight;
        });
        const loadMoreBtn = await page.$(".loadMore");

        if (totalHeight >= scrollHeight - innerHeight) {
          loadMore = false;
        } else if (loadMoreBtn) {
          await loadMoreBtn.scrollIntoView();
          await loadMoreBtn.focus();
          await loadMoreBtn.click();
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          totalHeight += 100;
          await new Promise((r) => setTimeout(r, 100));
        }
      } while (loadMore);
    }
  );

  if (!res) {
    console.error("Failed to crawl");
    return false;
  }

  const $ = cheerio.load(res);

  const links = $(".prd_container-card")
    .map((i, el) => {
      const link = $(el).find("a").attr("href");
      const title = $(el).find(".prd_link-product-name").text();
      if (!link) {
        return null;
      }

      return {
        key: sha1(link),
        value: {
          link,
          title,
        },
      };
    })
    .toArray();

  for (const link of links) {
    await storage.setItem(`queue-products/${link.key}`, JSON.stringify(link.value));
    const parsedURL = new URL(link.value.link, 'https://www.example.com/');

    // Mengambil bagian pathname dari URL
    const pathname = parsedURL.pathname;

    // Membagi pathaname menjadi potongan-potongan dengan '/' sebagai pemisah
    const pathSegments = pathname.split('/');

    // Mencari kata yang Anda cari (dalam hal ini, kata "grosirpacarkembang")
    const keyword = pathSegments[1]; // Kata pertama setelah domain

    await storage.setItem(`queue-shops/${keyword}`, JSON.stringify({
      name: keyword
    }));
  }

  console.info(`Scrawling selesai, menemukan ${links.length} produk`);

  await scrape.close();
}