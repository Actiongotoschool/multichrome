# GitHub Pages Deployment Guide

This document provides detailed instructions for deploying the Multichrome application to GitHub Pages.

## Overview

The project is configured to automatically deploy to GitHub Pages at `https://actiongotoschool.github.io/multichrome/` whenever changes are pushed to the `main` branch.

## Automatic Deployment

### Prerequisites

1. A GitHub repository with GitHub Pages enabled
2. GitHub Actions enabled for your repository

### Configuration

The deployment is handled by the GitHub Actions workflow located at `.github/workflows/deploy.yml`. This workflow:

1. **Triggers** on:
   - Push to `main` branch
   - Manual workflow dispatch

2. **Build Process**:
   - Checks out the code
   - Sets up Node.js v22
   - Installs dependencies with `npm ci`
   - Builds the project with `npm run build`
   - Outputs to `dist/` directory

3. **Deployment**:
   - Uploads the `dist/` folder as a GitHub Pages artifact
   - Deploys to GitHub Pages using the official `actions/deploy-pages@v4` action

### Enabling GitHub Pages

To enable GitHub Pages for your repository:

1. Navigate to your repository on GitHub
2. Click on **Settings** → **Pages**
3. Under **Build and deployment**:
   - **Source**: Select "GitHub Actions"
4. Save the changes

That's it! The next push to `main` will trigger an automatic deployment.

## Manual Deployment

You can manually trigger a deployment at any time:

1. Go to the **Actions** tab in your repository
2. Select the **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select the branch (usually `main`)
5. Click **Run workflow**

## Configuration Details

### Base Path Configuration

The application is configured to work with the GitHub Pages subdirectory structure. The base path is set in `vite.config.js`:

```javascript
base: '/multichrome/'
```

This ensures all asset URLs are correctly prefixed for the subdirectory deployment at `https://actiongotoschool.github.io/multichrome/`.

### Vite Build Configuration

Key build settings in `vite.config.js`:

- **base**: `/multichrome/` - Sets the public base path
- **outDir**: `dist` - Output directory for built files
- **PWA Support**: Configured with `vite-plugin-pwa` for offline functionality

## Troubleshooting

### Deployment Fails

1. **Check workflow logs**: Go to Actions tab and check the failed workflow run
2. **Common issues**:
   - Build errors: Check that the project builds locally with `npm run build`
   - Permission errors: Ensure GitHub Actions has the required permissions

### Site Not Loading

1. **Check GitHub Pages settings**: Ensure the source is set to "GitHub Actions"
2. **Check base path**: Verify that `vite.config.js` has the correct base path
3. **Clear cache**: Try clearing your browser cache or using incognito mode

### Assets Not Loading

If images, CSS, or JavaScript files are not loading:

1. Verify the base path in `vite.config.js` matches your repository name
2. Check browser console for 404 errors
3. Ensure all assets are included in the build output (`dist/` folder)

## Development vs Production

### Local Development

For local development, the site runs on `http://localhost:5173/` with the base path automatically handled by Vite:

```bash
npm run dev
```

### Production Build

To test the production build locally:

```bash
npm run build
npm run preview
```

The preview server will serve the built site with the correct base path.

## Custom Domain (Optional)

To use a custom domain with GitHub Pages:

1. Add a `CNAME` file to the `public/` directory with your domain name
2. Configure your DNS provider to point to GitHub Pages
3. Enable HTTPS in repository settings

For more information, see [GitHub's custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Monitoring Deployments

### GitHub Actions Status

You can monitor deployment status in several ways:

1. **Actions tab**: View all workflow runs and their status
2. **Commit status**: Each commit shows deployment status badges
3. **Deployments**: Check the "Environments" section in your repository

### Deployment URL

After successful deployment, the site will be available at:
```
https://actiongotoschool.github.io/multichrome/
```

Allow 1-2 minutes for changes to propagate after deployment completes.

## Security

The workflow uses the following permissions:

- `contents: read` - Read repository contents
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - Required for GitHub Pages deployment

These are the minimal permissions needed for deployment and follow security best practices.

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
