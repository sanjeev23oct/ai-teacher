# UI Constitution - StudyBuddy Design System

A comprehensive design system and UI guidelines for maintaining consistent look, feel, and structure across educational applications.

## 🎨 Design Philosophy

### Core Principles
- **Dark-First Design**: Professional dark theme optimized for extended study sessions
- **Educational Focus**: UI patterns designed specifically for learning and academic content
- **Accessibility**: WCAG-compliant with keyboard navigation and screen reader support
- **Mobile-First**: Responsive design with touch-friendly interactions
- **Performance**: Optimized components with efficient state management

### Visual Identity
- **Modern & Professional**: Clean, contemporary design suitable for students and educators
- **Warm & Approachable**: Friendly color palette that reduces eye strain
- **Structured Learning**: Clear information hierarchy supporting educational workflows

## 🎯 Color Palette

### Primary Colors
```css
:root {
  /* Background Colors */
  --color-background: #0f0f13;     /* Main dark background */
  --color-surface: #1a1a23;        /* Elevated surfaces, cards */
  
  /* Primary Brand */
  --color-primary: #2563eb;        /* Main blue accent */
  --color-primary-hover: #1d4ed8;  /* Primary hover state */
  
  /* Text Colors */
  --color-text: #f3f4f6;           /* Primary text (light) */
  --color-text-muted: #9ca3af;     /* Secondary text (muted) */
  
  /* Semantic Colors */
  --color-success: #10b981;        /* Success states */
  --color-warning: #f59e0b;        /* Warning states */
  --color-error: #ef4444;          /* Error states */
  --color-info: #3b82f6;           /* Info states */
}
```

### Extended Palette
```css
/* Subject-Specific Colors */
--color-math: #8b5cf6;           /* Purple for Math */
--color-science: #10b981;        /* Green for Science */
--color-english: #f59e0b;        /* Orange for English */
--color-social: #ef4444;         /* Red for Social Studies */

/* Interactive Colors */
--color-blue-400: #60a5fa;       /* Section headings */
--color-green-400: #4ade80;      /* Sub-headings */
--color-yellow-400: #facc15;     /* Highlights, bullets */
--color-cyan-400: #22d3ee;       /* Key-value pairs */
--color-purple-400: #a78bfa;     /* Time indicators */
--color-orange-400: #fb923c;     /* Dates, years */

/* Border Colors */
--color-border: #374151;         /* Default borders */
--color-border-light: #4b5563;   /* Lighter borders */
```

## 📐 Typography

### Font Stack
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Type Scale
```css
/* Headings */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* Page titles */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }     /* Section titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }   /* Card titles */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* Sub-headings */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }     /* Default body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* Small text */
.text-xs { font-size: 0.75rem; line-height: 1rem; }      /* Captions */

/* Font Weights */
.font-bold { font-weight: 700; }     /* Headings, emphasis */
.font-semibold { font-weight: 600; } /* Sub-headings */
.font-medium { font-weight: 500; }   /* Buttons, labels */
.font-normal { font-weight: 400; }   /* Body text */
```

## 🧩 Component Library

### 1. Buttons

#### Primary Button
```css
.btn-primary {
  @apply px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover 
         transition-colors font-medium shadow-lg hover:shadow-xl;
}
```

#### Secondary Button
```css
.btn-secondary {
  @apply px-4 py-2 bg-surface text-gray-300 border border-gray-700 
         rounded-md hover:bg-gray-800 hover:text-white transition-colors;
}
```

#### Icon Button
```css
.btn-icon {
  @apply p-2 bg-surface text-gray-300 border border-gray-700 
         rounded-md hover:bg-gray-800 hover:text-white transition-colors;
}
```

#### Audio/Voice Button
```css
.btn-audio {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
         disabled:bg-gray-600 text-white rounded-lg transition-colors;
}
```

### 2. Cards

#### Basic Card
```css
.card {
  @apply bg-surface p-6 rounded-lg shadow-lg border border-gray-800;
}
```

#### Interactive Card
```css
.card-interactive {
  @apply bg-surface border border-gray-800 rounded-lg p-4 
         hover:border-primary transition-all cursor-pointer group;
}
```

#### Subject Card
```css
.card-subject {
  @apply bg-surface rounded-lg p-4 border border-gray-800 
         hover:border-primary transition-all;
}
```

### 3. Form Elements

#### Input Field
```css
.input-field {
  @apply w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md 
         focus:outline-none focus:ring-2 focus:ring-primary text-white 
         placeholder-gray-500;
}
```

#### Select Dropdown
```css
.select-field {
  @apply w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 
         text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary;
}
```

#### Textarea
```css
.textarea-field {
  @apply w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md 
         focus:outline-none focus:ring-2 focus:ring-primary text-white 
         placeholder-gray-500 resize-vertical min-h-[100px];
}
```

### 4. Navigation

#### Navigation Bar
```css
.navbar {
  @apply bg-surface border-b border-gray-800 sticky top-0 z-50;
}

.navbar-brand {
  @apply text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 
         bg-clip-text text-transparent;
}

.navbar-link {
  @apply text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm 
         font-medium transition-colors flex items-center space-x-1;
}
```

#### Mobile Menu
```css
.mobile-menu {
  @apply md:hidden border-t border-gray-800;
}

.mobile-menu-item {
  @apply text-gray-300 hover:text-white block px-3 py-2 rounded-md 
         text-base font-medium;
}
```

### 5. Badges & Labels

#### Subject Badge
```css
.badge-subject {
  @apply inline-block px-2 py-1 text-xs font-medium bg-primary/20 
         text-primary rounded;
}
```

#### Status Badge
```css
.badge-status {
  @apply px-2 py-0.5 text-xs font-medium rounded-full;
}

.badge-success { @apply bg-green-500/20 text-green-400; }
.badge-warning { @apply bg-yellow-500/20 text-yellow-400; }
.badge-error { @apply bg-red-500/20 text-red-400; }
```

#### Time Badge
```css
.badge-time {
  @apply inline-flex items-center gap-1 px-2 py-1 bg-purple-500 
         text-white text-xs font-medium rounded-full;
}
```

### 6. Content Formatting

#### Formatted Content Container
```css
.formatted-content {
  @apply space-y-4;
}

.formatted-content h3 {
  @apply text-lg font-bold text-blue-400 mb-2 flex items-center gap-2;
}

.formatted-content h4 {
  @apply text-md font-semibold text-green-400 mb-2;
}

.formatted-content p {
  @apply text-gray-300 leading-relaxed mb-2;
}
```

#### List Styles
```css
.list-numbered {
  @apply flex items-start gap-3 mb-2;
}

.list-numbered-marker {
  @apply flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs 
         font-bold rounded-full flex items-center justify-center mt-0.5;
}

.list-bullet {
  @apply flex items-start gap-3 mb-2;
}

.list-bullet-marker {
  @apply flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2;
}
```

### 7. Interactive Elements

#### Rating Widget
```css
.rating-star {
  @apply w-8 h-8 transition-colors cursor-pointer;
}

.rating-star-active {
  @apply fill-yellow-400 text-yellow-400;
}

.rating-star-inactive {
  @apply text-gray-600 hover:text-gray-500;
}
```

#### Audio Player
```css
.audio-player {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
         disabled:bg-gray-600 text-white rounded-lg transition-colors;
}
```

### 8. Layout Components

#### Page Container
```css
.page-container {
  @apply min-h-screen bg-background;
}

.page-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
```

#### Grid Layouts
```css
.grid-cards {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.grid-form {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}
```

## 🎭 Animation & Transitions

### Standard Transitions
```css
.transition-standard {
  @apply transition-all duration-200 ease-in-out;
}

.transition-colors {
  @apply transition-colors duration-200 ease-in-out;
}

.transition-transform {
  @apply transition-transform duration-200 ease-in-out;
}
```

### Hover Effects
```css
.hover-lift {
  @apply hover:transform hover:-translate-y-1 hover:shadow-lg;
}

.hover-scale {
  @apply hover:transform hover:scale-105;
}

.hover-glow {
  @apply hover:shadow-xl hover:shadow-primary/20;
}
```

### Loading States
```css
.loading-spinner {
  @apply animate-spin;
}

.loading-pulse {
  @apply animate-pulse;
}

.loading-fade {
  @apply animate-fade-in;
}
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
/* xs: 0px - 639px (default) */
/* sm: 640px+ */
/* md: 768px+ */
/* lg: 1024px+ */
/* xl: 1280px+ */
/* 2xl: 1536px+ */
```

### Responsive Patterns
```css
/* Mobile-first navigation */
.nav-desktop { @apply hidden md:block; }
.nav-mobile { @apply block md:hidden; }

/* Responsive grids */
.grid-responsive { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3; }

/* Responsive text */
.text-responsive { @apply text-sm md:text-base lg:text-lg; }

/* Responsive spacing */
.spacing-responsive { @apply p-4 md:p-6 lg:p-8; }
```

## 🎯 Component Patterns

### 1. Educational Card Pattern
```tsx
interface EducationalCardProps {
  title: string;
  subject: string;
  content: string;
  timestamp: string;
  rating?: number;
  isInteractive?: boolean;
  onClick?: () => void;
}

const EducationalCard: React.FC<EducationalCardProps> = ({
  title, subject, content, timestamp, rating, isInteractive, onClick
}) => (
  <div 
    className={`card ${isInteractive ? 'card-interactive' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="badge-subject mb-2">{subject}</div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-sm line-clamp-2 mb-2">{content}</p>
        <span className="text-xs text-gray-500">{timestamp}</span>
      </div>
      {rating && (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">{rating}</span>
        </div>
      )}
    </div>
  </div>
);
```

### 2. Form Layout Pattern
```tsx
const FormLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-surface rounded-lg p-8 shadow-lg">
        {children}
      </div>
    </div>
  </div>
);
```

### 3. Content Formatting Pattern
```tsx
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  // Intelligent content parsing with educational focus
  // Handles: headings, lists, time indicators, key-value pairs
  // Applies semantic styling for better learning experience
};
```

### 4. Audio Integration Pattern
```tsx
const AudioPlayer: React.FC<{ text: string; autoPlay?: boolean }> = ({ 
  text, autoPlay = false 
}) => {
  // Streaming TTS integration
  // Loading states, error handling
  // Accessible controls
};
```

## 🎨 Icon System

### Icon Library: Lucide React
```tsx
import { 
  // Navigation
  Menu, X, Home, User, LogOut,
  
  // Educational
  BookOpen, FileText, GraduationCap, Book,
  
  // Actions
  Upload, Download, Share, Save,
  
  // Communication
  MessageCircle, Mic, Volume2, VolumeX,
  
  // Status
  CheckCircle, AlertCircle, Info, Star,
  
  // Interface
  Search, Filter, Settings, MoreHorizontal
} from 'lucide-react';
```

### Icon Usage Guidelines
```css
/* Standard icon sizes */
.icon-sm { @apply w-4 h-4; }    /* 16px - inline text */
.icon-md { @apply w-5 h-5; }    /* 20px - buttons */
.icon-lg { @apply w-6 h-6; }    /* 24px - headers */
.icon-xl { @apply w-8 h-8; }    /* 32px - features */

/* Icon colors */
.icon-primary { @apply text-primary; }
.icon-success { @apply text-green-400; }
.icon-warning { @apply text-yellow-400; }
.icon-error { @apply text-red-400; }
.icon-muted { @apply text-gray-500; }
```

## 🔧 Utility Classes

### Spacing System
```css
/* Consistent spacing scale */
.space-xs { @apply gap-1; }      /* 4px */
.space-sm { @apply gap-2; }      /* 8px */
.space-md { @apply gap-4; }      /* 16px */
.space-lg { @apply gap-6; }      /* 24px */
.space-xl { @apply gap-8; }      /* 32px */
```

### Text Utilities
```css
.text-truncate { @apply truncate; }
.text-clamp-2 { @apply line-clamp-2; }
.text-clamp-3 { @apply line-clamp-3; }

.text-gradient {
  @apply bg-gradient-to-r from-blue-400 to-purple-500 
         bg-clip-text text-transparent;
}
```

### Layout Utilities
```css
.flex-center { @apply flex items-center justify-center; }
.flex-between { @apply flex items-center justify-between; }
.flex-start { @apply flex items-center justify-start; }

.absolute-center { 
  @apply absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2; 
}
```

## 📋 Implementation Guidelines

### 1. Component Structure
```tsx
// Standard component template
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // State management
  // Event handlers
  // Effects
  
  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

### 2. Styling Approach
- **Tailwind-First**: Use Tailwind utility classes for all styling
- **Component Classes**: Create reusable component classes in CSS
- **No Inline Styles**: Avoid inline styles, use Tailwind utilities
- **Consistent Naming**: Follow BEM-like naming for custom classes

### 3. Accessibility Standards
```tsx
// Always include proper ARIA labels
<button 
  aria-label="Play audio explanation"
  className="btn-audio"
>
  <Volume2 className="icon-md" />
  Play
</button>

// Use semantic HTML
<main role="main">
  <section aria-labelledby="section-title">
    <h2 id="section-title">Section Title</h2>
  </section>
</main>
```

### 4. Performance Considerations
- **Lazy Loading**: Use React.lazy for route-level components
- **Memoization**: Use React.memo for expensive components
- **Efficient Re-renders**: Optimize state updates and dependencies
- **Bundle Splitting**: Code split by routes and features

## 🎓 Educational-Specific Patterns

### Subject Color Coding
```css
.subject-math { @apply border-l-4 border-purple-400 bg-purple-900/10; }
.subject-science { @apply border-l-4 border-green-400 bg-green-900/10; }
.subject-english { @apply border-l-4 border-orange-400 bg-orange-900/10; }
.subject-social { @apply border-l-4 border-red-400 bg-red-900/10; }
```

### Progress Indicators
```css
.progress-bar {
  @apply w-full bg-gray-700 rounded-full h-2;
}

.progress-fill {
  @apply bg-primary h-2 rounded-full transition-all duration-300;
}
```

### Learning Status Badges
```css
.status-completed { @apply bg-green-500/20 text-green-400; }
.status-in-progress { @apply bg-blue-500/20 text-blue-400; }
.status-pending { @apply bg-gray-500/20 text-gray-400; }
.status-revision { @apply bg-purple-500/20 text-purple-400; }
```

## 🚀 Getting Started

### 1. Setup Tailwind Config
```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#0f0f13',
        surface: '#1a1a23',
        primary: '#2563eb',
        'primary-hover': '#1d4ed8',
        text: '#f3f4f6',
        'text-muted': '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 2. Base CSS Setup
```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-text font-sans antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover 
           transition-colors font-medium shadow-lg hover:shadow-xl;
  }
  
  .card {
    @apply bg-surface p-6 rounded-lg shadow-lg border border-gray-800;
  }
  
  .input-field {
    @apply w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md 
           focus:outline-none focus:ring-2 focus:ring-primary text-white 
           placeholder-gray-500;
  }
}
```

### 3. Component Library Installation
```bash
npm install lucide-react
npm install @headlessui/react  # For accessible components
npm install clsx              # For conditional classes
```

## 📚 Best Practices

### 1. Consistency
- Use the defined color palette consistently
- Follow the established component patterns
- Maintain consistent spacing and typography
- Use the same icon library throughout

### 2. Accessibility
- Always include proper ARIA labels
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

### 3. Performance
- Optimize images and assets
- Use efficient state management
- Implement proper loading states
- Consider bundle size impact

### 4. Maintainability
- Document component props and usage
- Use TypeScript for type safety
- Follow consistent naming conventions
- Keep components focused and reusable

## 🎯 Migration Checklist

When implementing this design system in a new project:

- [ ] Setup Tailwind with custom color palette
- [ ] Install required dependencies (Lucide React, etc.)
- [ ] Implement base component classes
- [ ] Create reusable component library
- [ ] Setup responsive breakpoints
- [ ] Implement accessibility standards
- [ ] Test across different devices
- [ ] Document component usage
- [ ] Setup development workflow
- [ ] Optimize for production

---

This UI Constitution provides a complete foundation for building consistent, accessible, and professional educational applications with the same look and feel as StudyBuddy.