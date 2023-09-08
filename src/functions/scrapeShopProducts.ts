import { Scrape } from "../lib/scrape";
import { Page } from "puppeteer";
import * as cheerio from "cheerio";
import { storage } from "../helpers/storage";
import { sha1 } from "../helpers/sha1";

export async function scrapeShopProducts() {
  const scrape = new Scrape();
  await scrape.init();

  const keys = await storage.getKeys("queue-shops");
  const shops = (await storage.getItems(keys)).map((item) => {
    if (!item.value) {
      return null;
    }

    const val = item.value as {
      name: string;
      lastPage: number;
    };

    return val;
  });

  for (const shop of shops) {
    if (!shop) {
      continue;
    }

    let page = shop.lastPage || 1;
    let next = true

    do {
      console.info(`Scrawling produk dari ${shop.name} halaman ${page}...`)
      const url = new URL(`${shop.name}/product/page/${page}?sort=8`, "https://www.tokopedia.com");
      const res = await scrape.crawl(url.toString(), async (page: Page) => {
        await page.waitForSelector('[data-testid="showCaseTitle"]', {
          timeout: 60_000
        })
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
  
              if (totalHeight >= scrollHeight - window.innerHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 500);
          });  
        });  
      });

      if (!res) {
        console.error("Failed to crawl");
        break;
      }

      const $ = cheerio.load(res);

      const products = $('[data-testid="master-product-card"]').map((i, el) => {
        const data = {
          link: $(el).find('a').attr('href'),
          title: $(el).find('a').text(),
        }

        if (!data.link) {
          return null
        }

        storage.setItem(`queue-products/${sha1(data.link)}`, JSON.stringify(data))
        storage.setItem(`queue-shops/${shop.name}`, JSON.stringify({
          name: shop.name,
          lastPage: page
        }))
        return data
      }).toArray()

      if (products.length < 1) {
        next = false
      } else {
      }
      page++
    } while (next)
    storage.removeItem(`queue-shops/${shop.name}`)
  }

  await scrape.close()
}
