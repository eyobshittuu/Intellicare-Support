# Hamburger Sidebar Toggle Feature

## Overview
Added a collapsible sidebar with hamburger menu functionality that works on both desktop and mobile devices.

## Features

### Desktop (Large Screens)
- **Hamburger button** in the top-left of the header (next to logo)
- **Expanded state** (default): Full sidebar with icons + text labels (width: 256px)
- **Collapsed state**: Icon-only sidebar with tooltips (width: 80px)
- **Smooth animations**: 300ms transition between states
- **Content adjustment**: Main content area automatically adjusts when sidebar toggles
- **Persistent icons**: Icons remain visible in both states
- **Tooltips**: Hover over icons in collapsed state to see menu item names

### Mobile (Small/Medium Screens)
- **Separate hamburger button** for mobile devices
- **Overlay sidebar**: Slides in from the left with backdrop
- **Click outside to close**: Tap the dark overlay to close the menu
- **Full menu**: Always shows icons + text labels when open
- **Auto-close**: Menu closes automatically when a link is clicked

## Visual States

### Desktop - Expanded Sidebar
```
┌────────────────────┬──────────────────────────┐
│ [X] [Logo]        │    User Info   [Logout]  │ Header
├────────────────────┴──────────────────────────┤
│ Sidebar (256px)    │ Main Content Area        │
│                    │                          │
│ 📊 Dashboard       │ Dashboard content...     │
│ 🎫 Tickets         │                          │
│ 👥 Users           │                          │
│                    │                          │
└────────────────────┴──────────────────────────┘
```

### Desktop - Collapsed Sidebar
```
┌────────────────────┬──────────────────────────┐
│ [☰] [Logo]        │    User Info   [Logout]  │ Header
├────────────────────┴──────────────────────────┤
│ 📊│ Main Content Area (more space)            │
│ 🎫│                                           │
│ 👥│ Content takes advantage of extra space   │
│   │                                           │
└───┴───────────────────────────────────────────┘
```

### Mobile - Menu Closed
```
┌─────────────────────────────────────────────┐
│ [☰] [Logo]      User Info   [Logout]       │ Header
├─────────────────────────────────────────────┤
│                                             │
│ Full-width content area                     │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### Mobile - Menu Open
```
┌─────────────────────────────────────────────┐
│ [X] [Logo]      User Info   [Logout]       │ Header
├───────────────┬─────────────────────────────┤
│ Sidebar       │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│               │ ▓ Dark overlay (backdrop) ▓ │
│ 📊 Dashboard  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ 🎫 Tickets    │                             │
│ 👥 Users      │                             │
└───────────────┴─────────────────────────────┘
```

## Technical Implementation

### State Management
```javascript
const [sidebarOpen, setSidebarOpen] = useState(true);      // Desktop sidebar
const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu
```

### Components Added

#### 1. Desktop Hamburger Button
```jsx
<button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="hidden lg:block p-2 rounded-md text-white hover:bg-teal-700"
  title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
>
  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
</button>
```

#### 2. Mobile Hamburger Button
```jsx
<button
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  className="lg:hidden p-2 rounded-md text-white hover:bg-teal-700"
>
  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
</button>
```

#### 3. Collapsible Desktop Sidebar
```jsx
<aside className={`transition-all duration-300 ${
  sidebarOpen ? 'lg:w-64' : 'lg:w-20'
}`}>
  {/* Sidebar content */}
</aside>
```

#### 4. Responsive Main Content
```jsx
<main className={`transition-all duration-300 ${
  sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
}`}>
  {/* Page content */}
</main>
```

## CSS Transitions
All transitions use Tailwind CSS classes:
- `transition-all` - Smooth transition for all properties
- `duration-300` - 300ms animation duration
- `ease-in-out` - Smooth acceleration/deceleration curve

## User Experience Features

### Desktop
✅ **Icon persistence**: Icons always visible for quick navigation  
✅ **Smooth animation**: No jarring transitions  
✅ **Content reflow**: Content area grows/shrinks smoothly  
✅ **Visual feedback**: X icon when open, Menu icon when closed  
✅ **Hover tooltips**: See menu names when collapsed  
✅ **State persistence**: Stays in chosen state during navigation  

### Mobile
✅ **Overlay design**: Clear visual hierarchy  
✅ **Touch-friendly**: Easy to tap outside to close  
✅ **Auto-close**: Closes when selecting a menu item  
✅ **Smooth slide**: Animated entry/exit  
✅ **Full menu**: No confusion about available options  

## Browser Compatibility
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Responsive breakpoints: 1024px (Tailwind `lg:` breakpoint)

## File Modified
**File:** `client/src/layouts/MainLayout.jsx`

### Key Changes:
1. Split state into `sidebarOpen` (desktop) and `mobileMenuOpen` (mobile)
2. Added desktop hamburger button (visible on `lg:` screens)
3. Made sidebar width dynamic (264px expanded, 80px collapsed)
4. Added smooth transitions to sidebar and main content
5. Added icon-only view with tooltips in collapsed state
6. Made menu labels fade out when collapsed
7. Adjusted main content padding dynamically

## Icons Used
- **Menu Icon** (`<Menu />`): Shows when sidebar/menu is closed
- **X Icon** (`<X />`): Shows when sidebar/menu is open
- From: `lucide-react` package

## Color Scheme
- **Header**: Teal background (`bg-teal-600`)
- **Sidebar**: Dark gray/black (`bg-gray-900`)
- **Hover states**: Darker teal (`hover:bg-teal-700`) for header buttons
- **Active menu**: Teal highlight (`bg-teal-600`)
- **Inactive menu**: Gray text with gray hover (`hover:bg-gray-800`)

## Accessibility
✅ **Keyboard navigation**: All buttons and links are keyboard accessible  
✅ **Screen readers**: Proper ARIA labels and semantic HTML  
✅ **Focus states**: Visual focus indicators on all interactive elements  
✅ **Title attributes**: Tooltips for collapsed menu items  

## Testing Checklist
- [x] Desktop sidebar toggles between expanded/collapsed
- [x] Mobile menu opens/closes properly
- [x] Content area adjusts when sidebar toggles
- [x] Smooth animations on all transitions
- [x] Icons remain visible when collapsed
- [x] Tooltips show on hover when collapsed
- [x] Mobile menu closes when clicking outside
- [x] Mobile menu closes when selecting a link
- [x] No layout shift or jumps
- [x] Works across all breakpoints

## Usage
1. **Desktop**: Click the hamburger icon (☰) in the header to toggle sidebar
2. **Mobile**: Tap the hamburger icon to open menu overlay
3. **Close**: Click X icon, tap outside (mobile), or click a menu link (mobile)

## Future Enhancements
- [ ] Save sidebar state to localStorage
- [ ] Add keyboard shortcuts (e.g., Ctrl+B to toggle)
- [ ] Add animation preferences for reduced motion
- [ ] Add mini sidebar with icon + tooltip on hover
