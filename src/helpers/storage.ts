import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

/**
 * The storage constant that represents the storage module.
 */
export const storage = createStorage({
  driver: fsDriver({ base: "./data" }),
});