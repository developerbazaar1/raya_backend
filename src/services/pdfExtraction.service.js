const fs = require('fs/promises');
const { PDFParse } = require('pdf-parse');

const extractPdfText = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return extractPdfTextFromBuffer(buffer);
};

const extractPdfTextFromBuffer = async (buffer) => {
  console.log(`[training:pdf] extracting text from pdf bytes=${buffer.length}`);
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    console.log(`[training:pdf] extraction complete chars=${(parsed.text || '').length}`);
    return parsed.text || '';
  } finally {
    await parser.destroy();
  }
};

module.exports = {
  extractPdfText,
  extractPdfTextFromBuffer
};
