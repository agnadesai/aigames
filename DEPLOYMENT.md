# How to Deploy AI Games Website

This is a static website (HTML, CSS, JavaScript) that can be deployed to many free hosting services. Here are the best options:

## Option 1: GitHub Pages (Free & Easy) ⭐ Recommended

### Steps:
1. **Create a GitHub account** (if you don't have one): https://github.com
2. **Create a new repository**:
   - Click the "+" icon → "New repository"
   - Name it (e.g., "ai-games")
   - Make it **Public** (required for free GitHub Pages)
   - Click "Create repository"

3. **Upload your files**:
   ```bash
   # In your games folder, initialize git (if not already done)
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ai-games.git
   git push -u origin main
   ```
   
   Or use GitHub Desktop/GitHub web interface to upload files.

4. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **main** branch
   - Click **Save**
   - Your site will be live at: `https://YOUR_USERNAME.github.io/ai-games/`

## Option 2: Netlify (Free & Very Easy)

### Steps:
1. **Create a Netlify account**: https://www.netlify.com (free)
2. **Drag and drop deployment**:
   - Go to https://app.netlify.com/drop
   - Drag your entire `games` folder onto the page
   - Your site is instantly live!
   - You'll get a URL like: `https://random-name-123.netlify.app`

3. **Or use Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify deploy
   netlify deploy --prod
   ```

## Option 3: Vercel (Free & Easy)

### Steps:
1. **Create a Vercel account**: https://vercel.com (free)
2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```
3. **Deploy**:
   ```bash
   cd C:\Users\agnad\OneDrive\Documents\games
   vercel
   ```
   - Follow the prompts
   - Your site will be live at: `https://your-project.vercel.app`

## Option 4: Cloudflare Pages (Free)

### Steps:
1. **Create a Cloudflare account**: https://pages.cloudflare.com
2. **Connect your GitHub repository** (if using GitHub)
3. **Or upload directly** via the dashboard

## Option 5: Traditional Web Hosting

If you have web hosting (like cPanel, shared hosting, etc.):
1. Upload all files via FTP or file manager
2. Make sure `index.html` is in the root directory
3. Your site will be live at your domain

## Important Notes:

⚠️ **For GitHub Pages**: If your games are in subfolders, make sure the paths in `index.html` are correct:
- Current paths: `catgame/index.html` ✅ (correct for GitHub Pages)
- If deploying to a subdirectory, you may need: `./catgame/index.html`

⚠️ **Testing Locally**: Before deploying, test locally:
- Open `index.html` in your browser
- Or use a local server:
  ```bash
  # Python
  python -m http.server 8000
  
  # Node.js
  npx http-server
  ```
  Then visit: `http://localhost:8000`

## Quick Start (Easiest Method):

**Netlify Drop** is the fastest:
1. Go to https://app.netlify.com/drop
2. Drag your `games` folder
3. Done! 🎉

---

**Need help?** Each platform has excellent documentation and support.

