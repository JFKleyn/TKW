import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputDir = "src/assets/images-original";
const outputDir = "src/assets/images";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const supportedExtensions = [".jpg", ".jpeg", ".png"];

const files = fs.readdirSync(inputDir);

for (const file of files) {
  const ext = path.extname(file).toLowerCase();

  if (!supportedExtensions.includes(ext)) {
    continue;
  }

  const inputPath = path.join(inputDir, file);
  const fileName = path.parse(file).name;
  const outputPath = path.join(outputDir, `${fileName}.webp`);

  try {
    await sharp(inputPath)
      .resize({
        width: 2560,
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
      })
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;

    const originalMB = (originalSize / 1024 / 1024).toFixed(2);
    const compressedMB = (compressedSize / 1024 / 1024).toFixed(2);

    console.log(
      `✓ ${file}: ${originalMB} MB → ${compressedMB} MB`
    );
  } catch (error) {
    console.error(`✗ Failed to compress ${file}:`, error);
  }
}

console.log("\nCompression complete.");