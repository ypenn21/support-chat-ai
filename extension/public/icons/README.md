# Extension Icons

This directory contains the icons for the Chrome extension.

## Source Icon

- `icon.svg` - Master SVG icon (128x128)
  - Blue gradient background (#3B82F6)
  - White chat bubble with AI sparkle
  - Secondary suggestion bubble
  - Represents AI-powered support chat assistance

## Required Icon Sizes

Chrome extensions require the following icon sizes:

- **16x16** - Extension toolbar icon (small)
- **32x32** - Extension management page
- **48x48** - Extension management page
- **128x128** - Chrome Web Store and installation

## Generating PNG Icons

To generate PNG icons from the SVG source, you can use one of these methods:

### Method 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Generate all sizes
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 32x32 icon32.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Method 2: Using Inkscape

```bash
# Install Inkscape
brew install inkscape  # macOS

# Generate all sizes
inkscape icon.svg --export-type=png --export-width=16 --export-filename=icon16.png
inkscape icon.svg --export-type=png --export-width=32 --export-filename=icon32.png
inkscape icon.svg --export-type=png --export-width=48 --export-filename=icon48.png
inkscape icon.svg --export-type=png --export-width=128 --export-filename=icon128.png
```

### Method 3: Online Tools

Use online SVG to PNG converters:
- https://cloudconvert.com/svg-to-png
- https://www.svgtopng.com/

Upload `icon.svg` and generate the following sizes:
- 16x16 → `icon16.png`
- 32x32 → `icon32.png`
- 48x48 → `icon48.png`
- 128x128 → `icon128.png`

## Design Notes

The icon design represents:
- **Chat bubble**: Support chat interface
- **AI sparkle**: AI-powered assistance
- **Suggestion bubble**: Response suggestions in real-time
- **Blue color**: Trust, reliability, professionalism

The design is simple and recognizable even at small sizes (16x16).
