# Rails 8.0 Visual Explorer

An interactive visualization tool for exploring the Ruby on Rails 8.0 framework internals. Created for the conference talk **"Reading Rails: A Visual Walkthrough of the Source Code"**.

## 🚀 Live Demo

Visit [Rails Visual Explorer](https://betacraft.github.io/visual-rails/)

## 🎯 Purpose

This tool helps developers:
- **Understand Rails architecture** through visual exploration
- **See component relationships** and dependencies
- **Navigate the framework** structure interactively
- **Learn Rails internals** in an intuitive way

## ✨ Features

### Interactive Visualization
- **Force-directed graph** showing all Rails gems and their dependencies
- **Special visual treatment** for key components:
  - Railties (hexagon) - the coordinator
  - ActiveSupport (rectangle) - the foundation
  - Rails (large circle) - the umbrella gem
- **Click to explore** - drill down into components
- **Zoom and pan** for navigation
- **Drag nodes** to rearrange

### Information Panel
- Component descriptions and statistics
- Lines of code metrics
- Key modules and classes
- Dependencies and dependents
- Direct GitHub links

### Presentation Mode
- **Keyboard shortcuts**:
  - `1` - Overview of all gems
  - `2` - Focus on ActiveRecord
  - `3` - Focus on ActionPack
  - `4` - Focus on Railties
  - `F` - Toggle fullscreen
  - `P` - Presentation mode (hide UI)
  - `ESC` - Return to overview

### Search
- Quick search for Rails components
- Filter by name or description
- Click to jump to any component

## 🛠️ Technology Stack

- **React** - UI framework
- **D3.js** - Graph visualization
- **Vite** - Build tool
- **GitHub Pages** - Deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository (private repo - requires access):
```bash
git clone git@github.com:betacraft/visual-rails.git
cd visual-rails/app
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Building for Production

```bash
npm run build
```

### Deployment to GitHub Pages

The repository is configured with GitHub Actions for automatic deployment. 

#### Automatic Deployment (Recommended)
Every push to the `main` branch automatically triggers deployment to GitHub Pages.

#### Manual Deployment
If you need to deploy manually:
```bash
cd app
npm run build
npm run deploy
```

#### GitHub Repository Settings
Ensure the following settings in your GitHub repository:
1. Go to Settings → Pages
2. Source: Deploy from GitHub Actions
3. The site will be available at: https://betacraft.github.io/visual-rails/

## 📊 Data Structure

The visualization uses pre-processed Rails 8.0 data stored in `data/rails_structure.json`:

```json
{
  "version": "8.0.0",
  "gems": [...],
  "dependencies": [...]
}
```

## 🎨 Visual Language

- **Node Shapes**:
  - Hexagon: Railties (coordinator)
  - Rectangle: ActiveSupport (foundation)
  - Circles: Other gems
- **Colors**: Each gem has a unique color based on its role
- **Lines**: Dependency relationships with varying thickness

## 📝 Conference Talk

This tool was created for the talk:
- **Title**: Reading Rails: A Visual Walkthrough of the Source Code
- **Purpose**: Demystify Rails source code through visualization
- **Goal**: Help developers move from using Rails to understanding Rails

## 🤝 Contributing

Contributions are welcome! Please feel free to:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this in your own presentations and projects!

## 🙏 Acknowledgments

- Rails team for creating an amazing framework
- Conference organizers for the opportunity to share
- Community for feedback and contributions

## 📧 Contact

For questions or feedback about this visualization tool, please open an issue on GitHub.

---

Made with ❤️ for the Rails community