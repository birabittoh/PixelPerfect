# PixelPerfect

PixelPerfect is a simple, static web application that allows users to drag and drop multiple images and automatically upscale them using nearest neighbor interpolation. It is perfect for resizing pixel art without losing its crispness.

## Features

- **Nearest Neighbor Upscaling:** Keeps your pixel art perfectly sharp.
- **Batch Processing:** Drag and drop multiple images at once.
- **Automatic Downloads:** Processed images are downloaded automatically.
- **Customizable:** Choose whether to target a specific width or height, and set the target size in pixels.
- **Client-Side Processing:** All processing is done in your browser. No images are uploaded to any server.
- **Responsive Design:** Works great on desktop and mobile devices.

## Usage

1. Open the application in your browser.
2. Select whether you want to set the target **Width** or **Height**.
3. Enter the target size in pixels (default is 2000).
4. Drag and drop your images into the drop zone, or click to select files.
5. The upscaled images will be processed and downloaded automatically.

## Development

This project is built with Vite, React, TypeScript, and Tailwind CSS.

### Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Build

To build the project for production:
```bash
npm run build
```

## Deployment

This project includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages when changes are pushed to the `main` branch.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
