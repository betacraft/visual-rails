# Deployment Guide

## GitHub Pages Deployment (Private Repository)

This guide explains how to deploy the Rails Visual Explorer from a private GitHub repository to GitHub Pages.

## Prerequisites

1. **GitHub Repository Access**: The repository is private at `git@github.com:betacraft/visual-rails.git`
2. **GitHub Pages**: Enabled in repository settings
3. **Node.js**: Version 16 or higher

## Automatic Deployment via GitHub Actions

### Setup (One-time)

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Under "Source", select "GitHub Actions"
   - Save the settings

2. **Verify Workflow Permissions**:
   - Go to Settings → Actions → General
   - Under "Workflow permissions", ensure "Read and write permissions" is selected
   - Enable "Allow GitHub Actions to create and approve pull requests" if needed

### How It Works

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Triggers on every push to the `main` branch
2. Builds the Vite application
3. Deploys to GitHub Pages automatically
4. Makes the site available at: https://betacraft.github.io/visual-rails/

### Deployment Process

Simply push your changes to the main branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

The GitHub Action will automatically:
- Install dependencies
- Build the production bundle
- Deploy to GitHub Pages
- Update the live site within minutes

## Manual Deployment (Alternative)

If you need to deploy manually using gh-pages:

1. **Install gh-pages** (if not already installed):
```bash
cd app
npm install --save-dev gh-pages
```

2. **Build and Deploy**:
```bash
npm run build
npm run deploy
```

## Configuration Details

### Vite Configuration
The `app/vite.config.js` file is configured with:
```javascript
base: '/visual-rails/'  // Matches repository name
```

### Package.json Scripts
- `build`: Creates production build in `app/dist`
- `deploy`: Pushes dist folder to gh-pages branch
- `predeploy`: Automatically runs build before deploy

## Troubleshooting

### Site Not Accessible
1. Check repository Settings → Pages
2. Ensure "GitHub Actions" is selected as source
3. Check Actions tab for deployment status
4. Wait 5-10 minutes for DNS propagation

### Build Failures
1. Check GitHub Actions tab for error logs
2. Ensure all dependencies are in package.json
3. Test build locally with `npm run build`

### 404 Errors on Assets
- Verify `base` in vite.config.js matches your repository name
- Ensure all paths in the app use relative URLs

## Local Testing

To test the production build locally:
```bash
cd app
npm run build
npm run preview
```

This will serve the production build locally for testing before deployment.

## Security Notes

- The repository is private but the GitHub Pages site is public
- No sensitive data should be included in the built files
- API keys or secrets should never be committed to the repository
- Use environment variables for any configuration that varies by environment

## Monitoring Deployments

1. **GitHub Actions Tab**: View deployment progress and logs
2. **Deployments Page**: See deployment history in repository insights
3. **Pages Settings**: Check current deployment status and URL

## Custom Domain (Optional)

To use a custom domain:
1. Add a CNAME file in `app/public` with your domain
2. Configure DNS settings with your domain provider
3. Update repository Pages settings with custom domain
4. Update `base` in vite.config.js accordingly