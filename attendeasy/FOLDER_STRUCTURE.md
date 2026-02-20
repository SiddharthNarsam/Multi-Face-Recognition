# Frontend Folder Structure

This document describes the organized folder structure for the AttendEasy frontend application.

## Directory Structure

```
attendeasy/
├── src/
│   ├── components/             # All React components organized by feature
│   │   ├── Attendance/
│   │   │   ├── attendence.jsx
│   │   │   ├── attendence.css
│   │   │   └── index.js
│   │   ├── CNN/
│   │   │   ├── CNN.jsx
│   │   │   ├── CNN.css
│   │   │   └── index.js
│   │   ├── Crowd/
│   │   │   ├── crowd.jsx
│   │   │   ├── crowd.css
│   │   │   └── index.js
│   │   ├── DisplayImages/
│   │   │   ├── DisplayImages.jsx
│   │   │   ├── DisplayImages.css
│   │   │   └── index.js
│   │   ├── Home/
│   │   │   ├── Home.jsx
│   │   │   ├── Home.css
│   │   │   └── index.js
│   │   ├── Login/
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   └── index.js
│   │   ├── ProtectedRoute/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── index.js
│   │   ├── QrCodeScanner/
│   │   │   ├── QrCodeScanner.jsx
│   │   │   └── index.js
│   │   ├── Register/
│   │   │   ├── Register.jsx
│   │   │   ├── Register.css
│   │   │   └── index.js
│   │   └── User/
│   │       ├── user.jsx
│   │       ├── user.css
│   │       └── index.js
│   ├── utils/                  # Utility files and configurations
│   │   └── config.js           # API configuration
│   ├── App.js                  # Main App component with routing
│   ├── App.css                 # Global app styles
│   ├── App.test.js             # App tests
│   ├── index.js                # Entry point
│   ├── index.css               # Global styles
│   └── reportWebVitals.js      # Performance monitoring
├── public/                     # Static files
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
└── package.json

```

## Component Organization

Each component follows a consistent structure:
- **Component file** (.jsx): Contains the React component logic and JSX
- **Stylesheet** (.css): Contains component-specific styles
- **Index file** (index.js): Re-exports the component for cleaner imports

## Import Patterns

### Importing Components
```javascript
// Clean imports using index.js
import Home from './components/Home';
import Login from './components/Login';
```

### Importing Configuration
```javascript
// From within components
import { config } from '../../utils/config';
```

## Benefits of This Structure

1. **Modularity**: Each component is self-contained with its own styles
2. **Scalability**: Easy to add new components or features
3. **Maintainability**: Clear organization makes code easier to navigate
4. **Clean Imports**: Index files allow cleaner import statements
5. **Separation of Concerns**: Utils and components are clearly separated

## Migration Notes

- All component files were moved from `src/` root to `src/components/<ComponentName>/`
- Configuration file moved from `src/config.js` to `src/utils/config.js`
- All import paths updated accordingly
- Index files added for cleaner component imports
