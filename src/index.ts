import { scrapeMainPage } from "./functions/scrapeMainPage";
import { storage } from './helpers/storage'
import { scrapeProducts } from './functions/scrapeProducts'
import { scrapeShopProducts } from "./functions/scrapeShopProducts";

async function main() {

  const productsQueueTotals = await storage.getKeys('queue-products')

  if (productsQueueTotals.length > 0) {
    // Scrape product
    console.info(`${productsQueueTotals.length} produk ditemukan, memulai scrapping`)
  } else {
    await scrapeMainPage();
    await scrapeShopProducts();
  }
  await scrapeProducts();

  const shopsQueueTotals = await storage.getKeys('queue-shops')

  if (shopsQueueTotals.length > 0) {
    console.log(`${shopsQueueTotals.length} toko menunggu discrawl`)
    await scrapeShopProducts()
  }
}

main();
