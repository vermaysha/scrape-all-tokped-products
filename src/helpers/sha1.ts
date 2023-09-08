import { createHash } from "crypto";

/**
 * Calculates the SHA-1 hash of the given text.
 *
 * @param {string} text - The text to be hashed.
 * @return {string} The SHA-1 hash of the text.
 */
export const sha1 = (text: string) => {
  return createHash("sha1").update(text).digest("hex");
};
