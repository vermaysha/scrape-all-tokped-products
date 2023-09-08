import { Scrape } from "../lib/scrape";
import { Page } from "puppeteer";
import * as cheerio from "cheerio";
import { storage } from "../helpers/storage";
import { sha1 } from "../helpers/sha1";

export async function scrapeProducts() {
  const scrape = new Scrape();

  await scrape.init();

  const productsKeys = await storage.getKeys("queue-products");
  const products = (await storage.getItems(productsKeys)).map((item) => {
    const val = item.value as {
      link: string;
      title: string;
    };
    return {
      link: val.link,
      title: val.title,
    };
  });

  for (const product of products) {
    const url = new URL(product.link, "https://www.tokopedia.com");
    const res = await scrape.crawl(url.toString(), async (page: Page) => {
      await page.waitForSelector('[data-testid="lblPDPDetailProductName"]', {
        timeout: 60_000
      });
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

      // await page.waitForNavigation({
      //   waitUntil: "networkidle2",
      // });
    });

    if (!res) {
      console.warn(`Failed to crawl ${url.toString()}`);
      continue;
    }

    const $ = cheerio.load(res);
    const currentUrl = scrape.page?.url() || url.toString();

    const productInfo = $('[data-testid="lblPDPInfoProduk"] span');

    const thumbnail = $('img[data-testid="PDPMainImage"]').attr("src");
    const title = $('h1[data-testid="lblPDPDetailProductName"]').text().trim();
    const sold = $('[data-testid="lblPDPDetailProductSoldCounter"]')
      .text()
      .replace("Terjual", "")
      .trim();
    const rating = parseInt(
      $('[data-testid="lblPDPDetailProductRatingNumber"]').text().trim() || "0"
    );
    const ratingCount =
      Number(
        $('[data-testid="lblPDPDetailProductRatingCounter"]').text().trim()
      ) || 0;
    const price = $('[data-testid="lblPDPDetailProductPrice"]').text().trim();
    const originalPrice = $('[data-testid="lblPDPDetailOriginalPrice"]')
      .text()
      .trim();
    const discountPercentage = $(
      '[data-testid="lblPDPDetailDiscountPercentage"]'
    )
      .text()
      .trim();
    const stock = parseInt(
      $('[data-testid="stock-label"] b').text().trim() || "0"
    );
    const maxPurchase =
      parseInt($('[data-testid="lblPDPMaxPurchase"]').text().trim() || "0") ||
      null;
    const condition = productInfo
      .filter((i, el) => {
        return $(el).text().trim().includes("Kondisi");
      })
      .next()
      .text();
    const minPurchase =
      Number(
        productInfo
          .filter((i, el) => {
            return $(el).text().trim().includes("Min. Pemesanan");
          })
          .next()
          .text()
          .trim()
      ) || 1;
    const etalase = productInfo
      .filter((i, el) => {
        return $(el).text().trim().includes("Etalase");
      })
      .next()
      .text();
    const description = $('[data-testid="lblPDPDescriptionProduk"]').text();

    const shopHref = $('[data-testid="llbPDPFooterShopName"]').attr("href");
    const shopUrl = shopHref
      ? new URL(shopHref, "https://www.tokopedia.com").toString()
      : null;
    const shopName = $('[data-testid="llbPDPFooterShopName"] h2').text().trim();
    const shopRatingAvg =
      parseFloat(
        $('[data-testid="lblPDPShopPackFirst"] .css-1h5fp8g')
          .text()
          .trim()
          .replace("rata-rata ulasan", "") || ""
      ) || null;
    const sendFrom = $(".css-1pv3cmv.pad-bottom h2").text().trim() || $('.css-1pv3cmv.pad-bottom .muted').text().trim();
    const reviewCount = parseInt(
      $(".css-jxzr5i .css-1bhobcm-unf-heading.e1qvo2ff8")
        .text()
        .trim()
        .match(/(\d+) ulasan/)?.[1] || "0"
    );
    const discussion = Number($('[data-testid="lblPDPDetailProductDiscussionNumber"]').text().trim() || '0')
    const shopStatus = $('[data-testid="pdpShopBadgeOS"]').attr('alt')

    const data = {
      url: currentUrl,
      thumbnail,
      title,
      sold,
      rating,
      ratingCount,
      price,
      originalPrice,
      discountPercentage,
      stock,
      maxPurchase,
      condition,
      minPurchase,
      etalase,
      description,
      shopUrl,
      shopName,
      shopRatingAvg,
      sendFrom,
      reviewCount,
      discussion,
      shopStatus
    };

    await storage.setItem(
      `scraped-products/${sha1(currentUrl)}`,
      JSON.stringify(data)
    );
    await storage.removeItem(`queue-products/${sha1(product.link)}`);
    console.info(`Produk ${currentUrl} telah berhasil discrawl`);
  }

  await scrape.close();
}
