# 🐱 Cat Runner - Endless Runner Game

A simple, beginner-friendly 2D endless runner game featuring adorable cats! Built with pure HTML, CSS, and vanilla JavaScript - no frameworks or external libraries required.

## 🎮 Game Features

- **Two Playable Cats**: Choose between Black Cat 🐈‍⬛ and White Cat 🤍🐱
- **Endless Runner Mechanics**: Cat runs continuously with increasing speed
- **Jump Physics**: Click or tap to make your cat jump over obstacles
- **Score System**: Score increases as you survive longer
- **Mobile & Desktop**: Fully responsive, works on all devices
- **Sound Effects**: Different jump sounds for each cat (optional)

## 🚀 How to Run Locally

### Option 1: Direct File Opening (Simplest)
1. Download or clone this repository
2. Simply double-click `index.html` to open it in your default browser
3. The game will load and you can start playing immediately!

### Option 2: Using a Local Web Server (Recommended)

#### Using Python (if installed):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open your browser and navigate to `http://localhost:8000`

#### Using Node.js (if installed):
```bash
# Install http-server globally (one-time setup)
npm install -g http-server

# Run the server
http-server -p 8000
```
Then open your browser and navigate to `http://localhost:8000`

#### Using PHP (if installed):
```bash
php -S localhost:8000
```
Then open your browser and navigate to `http://localhost:8000`

### Option 3: Using VS Code Live Server Extension
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. The game will open in your browser automatically

## 🌐 How to Deploy as a Website

### Option 1: GitHub Pages (Free & Easy)

1. **Create a GitHub repository**
   ```bash
   git init
   git add index.html README.md
   git commit -m "Initial commit: Cat Runner game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cat-runner.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Under "Source", select "main" branch
   - Click "Save"
   - Your game will be available at: `https://YOUR_USERNAME.github.io/cat-runner/`

### Option 2: Netlify (Free & Easy)

1. **Drag and Drop**
   - Go to [netlify.com](https://www.netlify.com)
   - Sign up for free account
   - Drag and drop the folder containing `index.html` onto the Netlify dashboard
   - Your game will be live instantly with a free URL!

2. **Using Netlify CLI**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Deploy
   netlify deploy --prod --dir .
   ```

### Option 3: Vercel (Free & Easy)

1. **Using Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy
   vercel --prod
   ```

2. **Using Vercel Website**
   - Go to [vercel.com](https://vercel.com)
   - Sign up for free account
   - Import your GitHub repository or upload files directly

### Option 4: Any Static Hosting Service

You can deploy `index.html` to any static hosting service such as:
- **Firebase Hosting**
- **Surge.sh**
- **Render**
- **Cloudflare Pages**
- Any web hosting service that supports static files

Simply upload `index.html` to the web root directory.

## 📱 How to Package for Android & iOS using Capacitor

Capacitor allows you to convert your web app into native mobile apps. Here's how:

### Prerequisites
- Node.js installed (v14 or higher)
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### Step 1: Initialize Your Project

```bash
# Create a package.json file
npm init -y

# Install Capacitor CLI
npm install @capacitor/core @capacitor/cli --save-dev

# Install Capacitor platform packages
npm install @capacitor/android @capacitor/ios

# Initialize Capacitor
npx cap init "Cat Runner" "com.yourname.catrunner"
```

### Step 2: Configure Capacitor

The initialization will create a `capacitor.config.json` file. Update it:

```json
{
  "appId": "com.yourname.catrunner",
  "appName": "Cat Runner",
  "webDir": ".",
  "bundledWebRuntime": false
}
```

### Step 3: Build Web Assets (Optional)

Since we have a single HTML file, you can skip this step, but you may want to minify or optimize:

```bash
# Create a dist folder and copy index.html
mkdir dist
cp index.html dist/
```

Update `capacitor.config.json`:
```json
{
  "webDir": "dist"
}
```

### Step 4: Add Platforms

```bash
# Add Android platform
npx cap add android

# Add iOS platform (macOS only)
npx cap add ios
```

### Step 5: Sync Files

```bash
# Copy web assets to native projects
npx cap sync
```

### Step 6: Build for Android

```bash
# Open Android Studio
npx cap open android

# In Android Studio:
# 1. Wait for Gradle sync to complete
# 2. Click "Run" or press Shift+F10
# 3. Select an emulator or connected device
# 4. Your app will build and run!
```

**To build APK for distribution:**
1. In Android Studio: Build → Generate Signed Bundle / APK
2. Follow the wizard to create a signed APK or AAB

### Step 7: Build for iOS (macOS only)

```bash
# Open Xcode
npx cap open ios

# In Xcode:
# 1. Select your development team in Signing & Capabilities
# 2. Select a simulator or connected device
# 3. Click the Play button or press Cmd+R
# 4. Your app will build and run!
```

**To build for App Store:**
1. In Xcode: Product → Archive
2. Follow the App Store submission process

### Step 8: Update Your App (After Changes)

Whenever you make changes to `index.html`:

```bash
# Sync changes to native projects
npx cap sync

# Or just copy files
npx cap copy
```

### Optional: Configure Capacitor Settings

You may want to add these configurations to `capacitor.config.json`:

```json
{
  "appId": "com.yourname.catrunner",
  "appName": "Cat Runner",
  "webDir": ".",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true
    }
  },
  "android": {
    "buildOptions": {
      "keystorePath": "",
      "keystorePassword": "",
      "keystoreAlias": "",
      "keystoreAliasPassword": ""
    }
  },
  "ios": {
    "contentInset": "automatic"
  }
}
```

### Important Notes for Mobile Apps

1. **Permissions**: This game doesn't require any special permissions, so no additional configuration needed.

2. **Orientation**: To lock orientation, you can add plugins or configure in platform-specific settings.

3. **Icons & Splash Screens**: Use Capacitor Assets plugin or manually add icons to platform folders.

4. **Testing**: Always test on real devices, not just emulators.

## 🎯 Controls

- **Desktop**: Click mouse button or press Spacebar to jump
- **Mobile**: Tap anywhere on the screen to jump

## 🛠️ Technical Details

- **No Dependencies**: Pure vanilla JavaScript, HTML5, and CSS3
- **Animation**: Uses `requestAnimationFrame` for smooth 60fps gameplay
- **Physics**: Simple gravity and jump mechanics
- **Collision Detection**: Bounding box collision detection
- **Audio**: Web Audio API for sound effects (optional)

## 📝 Code Structure

- **Single File**: Everything is in `index.html` for easy deployment
- **Well Commented**: Code is thoroughly commented for learning purposes
- **Mobile First**: Responsive design that works on all screen sizes
- **Beginner Friendly**: Simple, readable code structure

## 🐛 Troubleshooting

### Game doesn't start
- Make sure you're opening `index.html` in a modern browser
- Check browser console for errors (F12)

### Sounds don't work
- Some browsers require user interaction before allowing audio
- Sounds are optional and the game works without them

### Mobile issues
- Make sure you're using a modern mobile browser
- Try refreshing the page
- Check that touch events are enabled

### Capacitor build issues
- Make sure all prerequisites are installed
- Run `npx cap sync` after making changes
- Check platform-specific documentation on capacitorjs.com

## 📄 License

Feel free to use this code for learning, personal projects, or commercial use!

## 🙏 Credits

Created as a beginner-friendly game development example using pure web technologies.

---

Enjoy playing Cat Runner! 🐱💨

