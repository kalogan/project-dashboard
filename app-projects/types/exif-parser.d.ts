declare module "exif-parser" {
  interface ExifResult {
    tags?: Record<string, number | string | undefined>;
  }
  interface ExifParserInstance {
    parse(): ExifResult;
  }
  interface ExifParserFactory {
    create(buffer: Buffer): ExifParserInstance;
  }
  const ExifParser: ExifParserFactory;
  export default ExifParser;
}
