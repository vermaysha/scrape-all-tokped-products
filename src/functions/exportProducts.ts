import { storage } from "../helpers/storage";
import { stringify } from "csv-stringify/sync";
import { writeFileSync } from "fs";

export async function exportProducts() {
    const filename = `export-${Date.now().toString()}.csv`
    const keys = await storage.getKeys("scraped-products");
    const data = (await storage.getItems(keys)).map((item) => {
      const val = item.value as any;
      return {
        url: val.url,
        thumbnail: val.thumbnail,
        title: val.title,
        sold: val.sold,
        rating: val.rating,
        ratingCount: val.ratingCount,
        price: val.price,
        originalPrice: val.originalPrice,
        discountPercentage: val.discountPercentage,
        stock: val.stock,
        maxPurchase: val.maxPurchase,
        condition: val.condition,
        minPurchase: val.minPurchase,
        etalase: val.etalase,
        description: val.description,
        shopUrl: val.shopUrl,
        shopName: val.shopName,
        shopRatingAvg: val.shopRatingAvg,
        shopLocation: val.shopLocation,
        reviewCount: val.reviewCount
      };
    });
    console.info(`${data.length} produk ditemukan !`)

    console.info('Mengexport ke file CSV ...')
    const csv = stringify(data, { header: true });
    writeFileSync( filename, csv, { flag: "w+" });
    console.info(`Export berhasil disimpan dengan nama ${filename}.csv`);
}