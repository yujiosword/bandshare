# 🎸 Band Share

A modern web application for band members to share files, links, and collaborate with rich URL previews and reactions system. Built with React and Firebase.

## 🌐 **Live Demo**
**🚀 [https://your-project-id.web.app](https://your-project-id.web.app)**

*Note: This is an invite-only app. Contact the admin for access.*

## ✨ Features

### 🔐 Authentication & Access Control
- **Google OAuth Authentication** - Secure sign-in with Google accounts
- **Invite-only Access** - Generate invitation links to control band membership
- **User Profiles** - Custom nicknames and profile management

### 📁 File & Content Sharing
- **File Upload** - Support for audio, video, images, and documents with size limits
- **Link Sharing** - Share URLs with rich Discord-like previews
- **URL Preview** - Automatic metadata fetching with images, titles, and descriptions
- **Content Management** - Delete your own shared content with confirmation

### 🎭 Interactive Features
- **Reactions System** - Express feedback with emoji reactions (👍, 🔥, ❤️, 🎵, 💩)
- **Real-time Updates** - Live synchronization across all users
- **Content Filtering** - Filter by file type and time periods
- **Responsive Design** - Works seamlessly on desktop and mobile

### 🌐 Internationalization
- **Bilingual Support** - Full English and Traditional Chinese (繁體中文) interface
- **Language Switching** - Toggle between languages instantly

## 🛠️ Tech Stack

- **Frontend**: React 18, CSS3, React Hooks
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Internationalization**: react-i18next
- **Icons & UI**: Custom CSS with modern design principles

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project with enabled services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bandlink
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Firebase**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Set up Firebase project**
   ```bash
   firebase login
   firebase use your-project-id
   ```

5. **Start development server**
   ```bash
   npm start
   ```
   
   The app will run on `http://localhost:3000`

### Firebase Setup

#### Authentication
1. Enable Google Authentication in Firebase Console
2. Add `localhost` to authorized domains (included by default)

#### Firestore Database
**IMPORTANT**: Set up these security rules for the app to function properly:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - required for nickname functionality
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /allowlist/{email} {
      allow read, write: if request.auth != null;
    }
    
    match /invites/{inviteId} {
      allow read, write: if request.auth != null;
    }
    
    match /uploads/{uploadId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      
      match /reactions/{reactionId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

#### Storage
Set up security rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

## 📱 Usage

### Getting Started
1. **Access Control**: Use the invite system to generate links for new band members
2. **File Sharing**: Upload audio files, videos, images, or documents
3. **Link Sharing**: Share URLs - the app will automatically generate rich previews
4. **Reactions**: Express your thoughts on shared content with emoji reactions
5. **Profile**: Set a custom nickname in your profile settings

### File Limits
- **Audio files**: 20MB max
- **Other files**: 10MB max
- **Supported formats**: MP3, WAV, M4A, FLAC, AAC, MP4, MOV, AVI, JPG, PNG, GIF, PDF, DOC, DOCX, TXT

### URL Preview
The app automatically fetches previews for shared links, with special handling for:
- YouTube videos
- Spotify tracks
- SoundCloud audio
- General web pages with Open Graph metadata

## 🏗️ Project Structure

### 📁 Essential Files for Deployment:
```
bandlink/                           # Project root
├── public/                         # Static files served by React
│   └── index.html                  # Main HTML template
├── src/                           # Source code
│   ├── components/                # React components
│   │   ├── DeleteConfirmDialog.js # Delete confirmation modal
│   │   ├── FileCard.js           # Individual file/link display with previews
│   │   ├── FileListOptimized.js  # Optimized file listing with pagination
│   │   ├── InviteSystem.js       # Invitation link generator
│   │   ├── LanguageSwitcher.js   # Language toggle component
│   │   ├── UploadForm.js         # File/link upload with URL preview
│   │   └── UserProfile.js        # Nickname and profile management
│   ├── hooks/                    # Custom React hooks
│   │   └── useUserProfileOptimized.js # Optimized user profile with caching
│   ├── i18n/                     # Internationalization setup
│   │   ├── locales/              # Translation files
│   │   │   ├── en.json           # English translations
│   │   │   └── zh-TW.json        # Traditional Chinese translations
│   │   └── index.js              # i18n configuration
│   ├── services/                 # Utility services
│   │   └── urlPreview.js         # URL metadata fetching with CORS proxy
│   ├── App.js                    # Main app component with routing
│   ├── App.css                   # Global styles and responsive design
│   ├── firebase.js               # Firebase config with offline persistence
│   ├── index.js                  # React app entry point
│   └── index.css                 # Base CSS styles
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Locked dependency versions
├── firebase.json                 # Firebase hosting configuration
└── README.md                     # This documentation
```

### 🚫 Auto-generated/Local Files (not in git):
```
├── .env                          # Your Firebase config (create from .env.example)
├── .firebaserc                   # Your Firebase project ID (create with firebase use)
├── node_modules/                 # Dependencies (npm install)
├── build/                        # Production build (npm run build)
├── .firebase/                    # Firebase cache
└── .git/                         # Git repository data
```

## 🎨 Features Deep Dive

### URL Preview System
- **Automatic Detection**: Previews are generated 1 second after typing a URL
- **Open Graph Support**: Extracts title, description, and images from web pages
- **Platform-Specific**: Special handling for YouTube, Spotify, and SoundCloud
- **Error Handling**: Graceful fallbacks for unsupported or private URLs

### Invite System
- **One-time Links**: Generate unique invitation URLs
- **Automatic Registration**: New users are added to allowlist upon first login
- **Security**: Prevents unauthorized access to the band space

### File Management
- **Type Classification**: Automatic file type detection and categorization
- **Preview Generation**: Audio players and image previews in the feed
- **Owner Controls**: Only uploaders can delete their own content

### User Profile System
- **Nickname Persistence**: Custom nicknames saved to Firestore and persist across sessions
- **Profile Management**: Dedicated profile page with nickname editing and preview
- **Display Name Override**: Nicknames override original Google display names throughout the app
- **Real-time Updates**: Profile changes reflect immediately in the interface

## 🔧 Development

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests (if configured)

### Environment Variables
All Firebase configuration should be stored in environment variables for security:
- Never commit `.env` files to version control
- Use `.env.example` as a template for required variables
- Ensure all variables start with `REACT_APP_` for React to recognize them
- **If you get Firebase errors, restart the development server** after creating/updating `.env`

### Troubleshooting

#### Common Issues

**1. Firebase: Error (auth/invalid-api-key)**
- Ensure `.env` file exists in project root
- Check all environment variables are properly set
- Restart development server: `npm start`
- Verify no extra spaces or quotes in `.env` values

**2. Nickname won't save / persist**
- **Most common cause**: Missing Firestore security rule for `userProfiles` collection
- Go to Firebase Console → Firestore → Rules and add the `userProfiles` rule
- Check browser console for permission errors

**3. URL previews not working**
- Check network connection
- Some URLs may be blocked by CORS policy
- Private/protected URLs won't generate previews

**4. Port 3000 already in use**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

**5. Blank page after Firebase deploy**
- **Most common cause**: `firebase.json` has wrong public directory
- Should be `"public": "build"` not `"public": "public"`
- Check browser console for "You need to enable JavaScript" message
- Rebuild and redeploy: `npm run build && firebase deploy`

**6. Firebase hosting shows "You need to enable JavaScript"**
- This means JavaScript files aren't loading
- Check `firebase.json` public directory setting
- Ensure you deployed the `build/` folder, not `public/` folder

**7. Compilation warnings about React Hooks**
- These are ESLint warnings and won't break the app
- The app functions normally despite these warnings

## 🚀 Deployment

### Production Build Requirements

**Essential Files for Production:**
```bash
# Required files (must exist)
package.json              # Dependencies and build scripts
package-lock.json         # Locked dependency versions
.env                      # Environment variables (create from .env.example)
.env.example              # Template for environment variables
firebase.json             # Firebase hosting configuration
public/                   # Static files including index.html
src/                      # All source code files
.gitignore                # Git ignore rules

# Generated during build process
.firebaserc               # Created by: firebase use your-project-id
node_modules/             # Created by: npm install
build/                    # Created by: npm run build
├── static/css/           # Minified stylesheets
├── static/js/            # Minified JavaScript bundles
├── asset-manifest.json   # Asset mapping
└── index.html           # Production HTML
```

**Not needed for production:**
- `.firebase/` (local Firebase cache - in .gitignore)
- `.git/` (version control - separate concern)
- `firebase-debug.log` (debug files - in .gitignore)

### Firebase Hosting (Recommended)

1. **Ensure environment variables are set**
   ```bash
   # Check .env file exists and has all Firebase config
   cat .env
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

4. **Login and initialize**
   ```bash
   firebase login
   firebase init hosting
   # Select your project
   # Public directory: build
   # Single-page app: Yes
   # Overwrite index.html: No
   ```

   **Important**: Ensure your `firebase.json` looks like this:
   ```json
   {
     "hosting": {
       "public": "build",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

5. **Deploy**
   ```bash
   firebase deploy
   ```

### Other Platforms
The app can be deployed to any static hosting service by uploading the `build/` folder:
- **Netlify**: Drag `build/` folder to Netlify dashboard
- **Vercel**: Connect GitHub repo or upload `build/` folder  
- **GitHub Pages**: Copy `build/` contents to gh-pages branch

## 🛡️ Security

- **Firebase Security Rules**: Enforce user authentication and ownership
- **Environment Variables**: Sensitive configuration stored securely
- **Input Validation**: URL validation and file type checking
- **CORS Protection**: Proxy service for external URL fetching

## 🌍 Internationalization

The app supports multiple languages through react-i18next:
- **English (en)**: Default language
- **Traditional Chinese (zh-TW)**: Complete translation
- **Adding Languages**: Add new JSON files in `src/i18n/locales/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend services
- React team for the excellent framework
- Open source community for various packages and inspirations

---

**Happy band sharing! 🎸🎵**