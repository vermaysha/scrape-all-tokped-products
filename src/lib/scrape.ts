import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import {
  Browser,
  Page,
  DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
} from "puppeteer";
import { resolve } from 'path'

puppeteer.use(stealthPlugin());
puppeteer.use(
  AdblockerPlugin({
    // Optionally enable Cooperative Mode for several request interceptors
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  })
);

export type WaitForCallback = (page: Page) => Promise<void>;

export class Scrape {
  public browser: Browser | null = null;
  public page: Page | null = null;

  constructor() {}

  /**
   * Initializes the function.
   *
   * @return {Promise<void>} - A promise that resolves when the function is initialized.
   */
 async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: 'new',
    });
  }

  /**
   * Crawls the specified URL and returns the content of the page.
   *
   * @param {string} url - The URL to crawl.
   * @param {WaitForCallback} [callback] - Optional callback function to execute after the page loads.
   * @returns {Promise<false|string>} - A Promise that resolves to the content of the page or false if the browser is not available.
   */
 async crawl(
    url: string,
    callback?: WaitForCallback
  ): Promise<false | string> {
    if (!this.browser) {
      return false;
    }

    this.page = await this.browser.newPage();

    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";

    await Promise.all([
      this.page.setViewport({
        width: 1920,
        height: 3000,
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
      }),
      this.page.setUserAgent(userAgent),
      this.page.setJavaScriptEnabled(true),
      this.page.setDefaultNavigationTimeout(0),
      this.page.setRequestInterception(true),
    ]);

    this.page.on("request", (req) => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() == "image" ||
        req.resourceType() == "media"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await this.page.goto(url, {
      waitUntil: "networkidle2",
    });
    await callback?.(this.page);

    const content = await this.page.content();

    await this.page.close();

    return content;
  }

  /**
   * Closes the browser asynchronously.
   *
   * @return {Promise<void>} A promise that resolves once the browser is closed.
   */
 async close(): Promise<void> {
    await this.browser?.close();
  }
}
