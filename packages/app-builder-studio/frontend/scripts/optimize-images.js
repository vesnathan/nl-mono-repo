#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Optimizes all images in the public/images directory using sharp.
 * - Resizes large images to reasonable dimensions
 * - Compresses JPEGs and PNGs
 * - Generates WebP versions for modern browsers
 *
 * Usage:
 *   node scripts/optimize-images.js
 *
 * Note: This script will automatically install sharp if it's not already installed.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Check if sharp is installed, and install it if not
let sharp;
try {
  sharp = require("sharp");
  console.log("✓ sharp is already installed");
} catch (error) {
  console.log("Installing sharp (this may take a few minutes)...");
  try {
    execSync("yarn add -D sharp", { stdio: "inherit", cwd: __dirname + "/.." });
    sharp = require("sharp");
    console.log("✓ sharp installed successfully");
  } catch (installError) {
    console.error("ERROR: Failed to install sharp");
    console.error(installError.message);
    console.error("");
    console.error("Please try manually installing sharp:");
    console.error("  cd packages/lawn-order/frontend");
    console.error("  yarn add -D sharp");
    process.exit(1);
  }
}

// Configuration
const IMAGES_DIR = path.join(__dirname, "../public/images");
const OUTPUT_DIR = path.join(__dirname, "../public/images/optimized");
const MAX_WIDTH = 1920; // Max width for large images
const MAX_HEIGHT = 1080; // Max height for large images
const JPEG_QUALITY = 85;
const PNG_QUALITY = 85;
const WEBP_QUALITY = 85;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Get all image files recursively from a directory
 */
function getImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip optimized directory
      if (filePath !== OUTPUT_DIR) {
        getImageFiles(filePath, fileList);
      }
    } else if (/\.(jpe?g|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath) {
  const relativePath = path.relative(IMAGES_DIR, inputPath);
  const outputPath = path.join(OUTPUT_DIR, relativePath);
  const outputDir = path.dirname(outputPath);
  const ext = path.extname(inputPath).toLowerCase();
  const basename = path.basename(inputPath, ext);
  const webpPath = path.join(outputDir, `${basename}.webp`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`Processing: ${relativePath}`);
    console.log(
      `  Original: ${metadata.width}x${metadata.height} (${(fs.statSync(inputPath).size / 1024).toFixed(2)} KB)`,
    );

    // Resize if image is too large
    let resizeOptions = {};
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      resizeOptions = {
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: "inside",
        withoutEnlargement: true,
      };
    }

    // Optimize original format
    if (ext === ".jpg" || ext === ".jpeg") {
      await sharp(inputPath)
        .resize(resizeOptions)
        .jpeg({ quality: JPEG_QUALITY, progressive: true })
        .toFile(outputPath);
    } else if (ext === ".png") {
      await sharp(inputPath)
        .resize(resizeOptions)
        .png({ quality: PNG_QUALITY, compressionLevel: 9 })
        .toFile(outputPath);
    }

    // Generate WebP version
    await sharp(inputPath)
      .resize(resizeOptions)
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    const optimizedSize = fs.statSync(outputPath).size;
    const webpSize = fs.statSync(webpPath).size;
    const originalSize = fs.statSync(inputPath).size;
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    console.log(
      `  Optimized: ${(optimizedSize / 1024).toFixed(2)} KB (${savings}% smaller)`,
    );
    console.log(`  WebP: ${(webpSize / 1024).toFixed(2)} KB`);
    console.log("");
  } catch (error) {
    console.error(`  ERROR: Failed to optimize ${relativePath}`);
    console.error(`  ${error.message}`);
    console.log("");
  }
}

/**
 * Main function
 */
async function main() {
  console.log("==============================================");
  console.log("  Image Optimization Script");
  console.log("==============================================");
  console.log("");

  const imageFiles = getImageFiles(IMAGES_DIR);

  if (imageFiles.length === 0) {
    console.log("No images found in", IMAGES_DIR);
    return;
  }

  console.log(`Found ${imageFiles.length} images to optimize`);
  console.log("");

  for (const imagePath of imageFiles) {
    await optimizeImage(imagePath);
  }

  console.log("==============================================");
  console.log("  Optimization Complete!");
  console.log("==============================================");
  console.log("");
  console.log(`Optimized images are in: ${OUTPUT_DIR}`);
  console.log("");
  console.log("To use optimized images:");
  console.log("1. Review the optimized images to ensure quality is acceptable");
  console.log("2. Replace originals with optimized versions if satisfied");
  console.log("3. Update image paths in your code to use WebP when supported");
  console.log("");
}

main().catch((error) => {
  console.error("FATAL ERROR:", error);
  process.exit(1);
});
