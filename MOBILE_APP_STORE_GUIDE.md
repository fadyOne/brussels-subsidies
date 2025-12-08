# 📱 Mobile App Store Guide - Brussels Subsidies

**Date:** 2025-01-27  
**Project:** Brussels Subsidies Mobile App for iOS App Store

---

## 🎯 Overview

This guide outlines everything you need to create and publish a mobile app version of Brussels Subsidies on the iOS App Store.

---

## 📋 Table of Contents

1. [Technical Approach Options](#1-technical-approach-options)
2. [App Store Requirements](#2-app-store-requirements)
3. [Code Adaptations Needed](#3-code-adaptations-needed)
4. [Design & UX Considerations](#4-design--ux-considerations)
5. [Data Handling & Storage](#5-data-handling--storage)
6. [Testing Requirements](#6-testing-requirements)
7. [Deployment Process](#7-deployment-process)
8. [Costs & Timeline](#8-costs--timeline)
9. [Maintenance & Updates](#9-maintenance--updates)

---

## 1. Technical Approach Options

### Option A: React Native (Recommended) ⭐

**Pros:**
- ✅ Share ~70-80% of codebase with web app
- ✅ Native performance
- ✅ Access to native APIs (camera, file system, push notifications)
- ✅ Can publish to both iOS and Android
- ✅ Large community and ecosystem
- ✅ TypeScript support

**Cons:**
- ❌ Requires learning React Native
- ❌ Some web-specific code needs rewriting
- ❌ Chart libraries may need replacement (Recharts → Victory Native or react-native-chart-kit)

**Best for:** Long-term solution, cross-platform needs

---

### Option B: Capacitor (Hybrid Web App)

**Pros:**
- ✅ Reuse 90%+ of existing Next.js code
- ✅ Minimal code changes
- ✅ Can use existing web components
- ✅ Fastest to market
- ✅ Easy updates (just deploy web version)

**Cons:**
- ❌ Slightly less native feel
- ❌ Larger app bundle size
- ❌ Some performance limitations
- ❌ May need native plugins for advanced features

**Best for:** Quick launch, maximum code reuse

---

### Option C: Native iOS (Swift/SwiftUI)

**Pros:**
- ✅ Best performance
- ✅ Full access to iOS features
- ✅ Best user experience
- ✅ Apple's preferred approach

**Cons:**
- ❌ Complete rewrite required
- ❌ No code sharing with web
- ❌ Longer development time
- ❌ Higher cost
- ❌ Android requires separate development

**Best for:** Maximum performance, iOS-only focus

---

### Option D: Progressive Web App (PWA)

**Pros:**
- ✅ No App Store approval needed
- ✅ Instant updates
- ✅ Works on all platforms
- ✅ No code changes needed

**Cons:**
- ❌ Limited App Store presence
- ❌ Some iOS limitations
- ❌ Less "native" feel
- ❌ Limited offline capabilities

**Best for:** Quick solution, web-first approach

---

## 🎯 Recommended Approach: **React Native with Expo**

**Why:**
- Best balance of code reuse and native features
- Expo simplifies development and deployment
- Can use TypeScript throughout
- Good chart libraries available
- Easy to add push notifications later

---

## 2. App Store Requirements

### 2.1 Apple Developer Account

**Required:**
- ✅ **Apple Developer Program membership**: $99/year
- ✅ **Apple ID** (personal or organization)
- ✅ **Tax and banking information** for payments
- ✅ **D-U-N-S Number** (if organization account)

**Steps:**
1. Go to [developer.apple.com](https://developer.apple.com)
2. Enroll in Apple Developer Program
3. Complete identity verification
4. Wait for approval (usually 24-48 hours)

---

### 2.2 App Store Connect Setup

**Required Information:**
- ✅ **App Name**: "Brussels Subsidies" (or your chosen name)
- ✅ **Bundle ID**: `com.yourcompany.brussels-subsidies` (unique identifier)
- ✅ **App Category**: News, Reference, or Finance
- ✅ **Age Rating**: 4+ (likely, depends on content)
- ✅ **Privacy Policy URL**: Required for all apps
- ✅ **Support URL**: Required
- ✅ **App Description**: Multi-language (FR, NL, EN, DE)
- ✅ **Screenshots**: Required for all device sizes
- ✅ **App Icon**: 1024x1024px PNG
- ✅ **Promotional Text**: Optional marketing text

---

### 2.3 Legal Requirements

**Required Documents:**
- ✅ **Privacy Policy**: Must explain data collection and usage
- ✅ **Terms of Service**: Optional but recommended
- ✅ **GDPR Compliance**: Since you're in Brussels, GDPR applies
- ✅ **Data Processing Agreement**: If using third-party services

**Privacy Policy Must Include:**
- What data is collected
- How data is used
- Data storage location
- User rights (access, deletion, etc.)
- Contact information

---

### 2.4 Technical Requirements

**iOS Version Support:**
- ✅ Minimum iOS version: iOS 13.0+ (recommended)
- ✅ Test on latest iOS version
- ✅ Support iPhone and iPad (if applicable)

**App Size:**
- ✅ Initial download: < 100MB recommended
- ✅ On-demand resources for large data files
- ✅ Consider data compression

**Performance:**
- ✅ App must launch in < 3 seconds
- ✅ No crashes on launch
- ✅ Smooth scrolling (60fps)
- ✅ Efficient memory usage

---

## 3. Code Adaptations Needed

### 3.1 Project Structure (React Native)

```
brussels-sub-mobile/
├── src/
│   ├── screens/          # Pages (Search, Analyse, Info)
│   ├── components/       # Reusable components
│   ├── navigation/      # React Navigation setup
│   ├── lib/             # Shared utilities (from web)
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript types
├── assets/              # Images, fonts
├── app.json             # Expo configuration
└── package.json
```

---

### 3.2 Components to Adapt

#### ✅ **Easy to Port (Minimal Changes):**
- `AppHeader.tsx` → React Native `View` + `Text`
- `AppFooter.tsx` → React Native `View`
- `Badge.tsx` → React Native `View` with styling
- `Button.tsx` → React Native `TouchableOpacity` or `Pressable`
- `Input.tsx` → React Native `TextInput`
- `Select.tsx` → React Native `Picker` or `@react-native-picker/picker`
- `Card.tsx` → React Native `View` with styling

#### ⚠️ **Needs Replacement:**
- `NivoBarChart.tsx` → `react-native-chart-kit` or `victory-native`
- `MiniEvolutionChart.tsx` → `react-native-chart-kit` LineChart
- `Top10ListChart.tsx` → Custom React Native `FlatList` with styling
- Recharts components → React Native chart libraries

#### 🔄 **Needs Rewriting:**
- `ExportDialog.tsx` → Use `react-native-share` for sharing
- PDF generation → `react-native-pdf` or `react-native-html-to-pdf`
- Excel export → May need native module or cloud service
- File downloads → React Native file system APIs

---

### 3.3 Navigation Changes

**Current (Next.js):**
```typescript
// Web routing
<Link href="/analyse">Analyse</Link>
```

**React Native:**
```typescript
// React Navigation
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()

<Tab.Navigator>
  <Tab.Screen name="Search" component={SearchScreen} />
  <Tab.Screen name="Analyse" component={AnalyseScreen} />
  <Tab.Screen name="Info" component={InfoScreen} />
</Tab.Navigator>
```

---

### 3.4 Data Loading

**Current (Web):**
```typescript
// Fetch from public folder
const data = await fetch('/data-2024.json')
```

**React Native:**
```typescript
// Option 1: Bundle with app
import data2024 from '../assets/data-2024.json'

// Option 2: Fetch from API/cloud
const data = await fetch('https://your-api.com/data-2024.json')

// Option 3: AsyncStorage for caching
import AsyncStorage from '@react-native-async-storage/async-storage'
```

**Recommendation:** 
- Bundle essential data with app
- Use cloud storage for updates
- Implement AsyncStorage caching

---

### 3.5 Styling Changes

**Current (Tailwind CSS):**
```typescript
className="bg-green-100 p-4 rounded-lg"
```

**React Native:**
```typescript
// Option 1: StyleSheet
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 8,
  }
})

// Option 2: NativeWind (Tailwind for React Native)
<View className="bg-green-100 p-4 rounded-lg">
```

**Recommendation:** Use **NativeWind** to keep Tailwind syntax

---

### 3.6 Chart Libraries Replacement

**Current:** Recharts, Nivo

**React Native Alternatives:**

1. **react-native-chart-kit** (Recommended)
   - Simple API
   - Good performance
   - Supports Line, Bar, Pie charts
   - Similar to Recharts

2. **victory-native**
   - More features
   - Better customization
   - Larger bundle size

3. **react-native-svg-charts**
   - Lightweight
   - Good for simple charts

**Migration Example:**
```typescript
// Before (Recharts)
<LineChart data={data}>
  <Line dataKey="amount" />
</LineChart>

// After (react-native-chart-kit)
<LineChart
  data={data}
  width={screenWidth}
  height={220}
  chartConfig={chartConfig}
/>
```

---

### 3.7 Export Functionality

**Current:** jsPDF, XLSX (browser APIs)

**React Native:**
```typescript
// PDF Generation
import RNHTMLtoPDF from 'react-native-html-to-pdf'

// Excel Export
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

// CSV Export
const csv = convertToCSV(data)
await FileSystem.writeAsStringAsync(fileUri, csv)
await Sharing.shareAsync(fileUri)
```

---

## 4. Design & UX Considerations

### 4.1 Mobile-First Design

**Key Changes:**
- ✅ **Bottom Navigation**: Replace header tabs with bottom tabs
- ✅ **Larger Touch Targets**: Minimum 44x44pt (Apple HIG)
- ✅ **Simplified Layouts**: Stack vertically, reduce horizontal scrolling
- ✅ **Swipe Gestures**: Add swipe-to-refresh, swipe-to-delete
- ✅ **Pull-to-Refresh**: For data updates
- ✅ **Infinite Scroll**: For long lists (instead of pagination)

---

### 4.2 Screen Adaptations

#### **Search Page (Home)**
- ✅ Full-screen search bar at top
- ✅ Filter chips below search
- ✅ Card-based list (instead of table)
- ✅ Swipe actions on cards
- ✅ Bottom sheet for filters

#### **Analyse Page**
- ✅ Tab navigation for different chart types
- ✅ Full-screen charts
- ✅ Pinch-to-zoom for charts
- ✅ Share button for charts
- ✅ Bottom sheet for organization search

#### **Info Page**
- ✅ Accordion sections
- ✅ Collapsible content
- ✅ In-app browser for external links

---

### 4.3 iOS Design Guidelines

**Follow Apple Human Interface Guidelines:**
- ✅ Use SF Symbols for icons
- ✅ Respect safe areas (notch, home indicator)
- ✅ Support Dark Mode
- ✅ Use system fonts (San Francisco)
- ✅ Proper spacing (8pt grid)
- ✅ Haptic feedback for interactions

---

### 4.4 Responsive Design

**Device Support:**
- ✅ iPhone SE (small screen)
- ✅ iPhone 14/15 (standard)
- ✅ iPhone 14/15 Pro Max (large screen)
- ✅ iPad (if supporting tablets)

**Breakpoints:**
```typescript
import { Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmallDevice = width < 375
```

---

## 5. Data Handling & Storage

### 5.1 Data Strategy

**Option 1: Bundle with App** (Recommended for initial version)
- ✅ Fast loading (no network needed)
- ✅ Works offline
- ❌ Larger app size (~5-10MB per year)
- ❌ Updates require app update

**Option 2: Cloud Storage**
- ✅ Smaller app size
- ✅ Easy updates
- ❌ Requires internet
- ❌ Slower initial load

**Option 3: Hybrid**
- ✅ Bundle last 2 years with app
- ✅ Fetch older years from cloud
- ✅ Best of both worlds

---

### 5.2 Caching Strategy

**Use AsyncStorage:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Cache data
await AsyncStorage.setItem('data-2024', JSON.stringify(data))

// Retrieve cached data
const cached = await AsyncStorage.getItem('data-2024')
const data = cached ? JSON.parse(cached) : null
```

**Cache Management:**
- ✅ Cache all loaded data
- ✅ Cache computed results (relationships, totals)
- ✅ Set expiration (24 hours)
- ✅ Clear old cache on app update

---

### 5.3 Offline Support

**Requirements:**
- ✅ App must work without internet
- ✅ Show cached data when offline
- ✅ Display offline indicator
- ✅ Queue actions for when online

**Implementation:**
```typescript
import NetInfo from '@react-native-community/netinfo'

const unsubscribe = NetInfo.addEventListener(state => {
  const isOffline = !state.isConnected
  // Update UI accordingly
})
```

---

## 6. Testing Requirements

### 6.1 Device Testing

**Required Devices:**
- ✅ iPhone SE (smallest screen)
- ✅ iPhone 14/15 (standard)
- ✅ iPhone 14/15 Pro Max (largest screen)
- ✅ iPad (if supporting)
- ✅ iOS 13, 14, 15, 16, 17 (latest)

**Testing Tools:**
- ✅ **Xcode Simulator**: For development
- ✅ **TestFlight**: For beta testing
- ✅ **Physical Devices**: For final testing

---

### 6.2 Test Scenarios

**Functional Testing:**
- ✅ App launches successfully
- ✅ All navigation works
- ✅ Search functionality
- ✅ Filter functionality
- ✅ Chart rendering
- ✅ Data export
- ✅ Offline mode
- ✅ Error handling

**Performance Testing:**
- ✅ App launch time (< 3 seconds)
- ✅ Search response time (< 500ms)
- ✅ Chart rendering (< 1 second)
- ✅ Memory usage (< 200MB)
- ✅ Battery usage

**UI/UX Testing:**
- ✅ All text readable
- ✅ All buttons tappable
- ✅ No layout issues
- ✅ Dark mode support
- ✅ Accessibility (VoiceOver)

---

### 6.3 Beta Testing (TestFlight)

**Process:**
1. Upload build to App Store Connect
2. Add beta testers (up to 10,000)
3. Testers receive email invitation
4. Collect feedback via TestFlight
5. Iterate based on feedback

**Benefits:**
- ✅ Real-world testing
- ✅ User feedback before launch
- ✅ Catch bugs early
- ✅ Validate UX

---

## 7. Deployment Process

### 7.1 Development Workflow

**Step 1: Setup Project**
```bash
# Create React Native app with Expo
npx create-expo-app brussels-subsidies-mobile
cd brussels-subsidies-mobile

# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-chart-kit
npm install @react-native-async-storage/async-storage
npm install nativewind tailwindcss
```

**Step 2: Port Code**
- Copy shared utilities from web app
- Adapt components to React Native
- Replace chart libraries
- Update navigation

**Step 3: Testing**
- Test on simulator
- Test on physical devices
- Fix bugs
- Optimize performance

**Step 4: Build**
```bash
# Build for iOS
eas build --platform ios

# Or use Expo CLI
expo build:ios
```

---

### 7.2 App Store Submission

**Step 1: Prepare Assets**
- ✅ App icon (1024x1024px)
- ✅ Screenshots (all required sizes)
- ✅ App preview video (optional but recommended)
- ✅ Privacy policy URL
- ✅ Support URL

**Step 2: Configure App Store Connect**
- ✅ Create new app
- ✅ Fill in metadata
- ✅ Upload screenshots
- ✅ Set pricing (Free)
- ✅ Configure in-app purchases (if any)

**Step 3: Submit for Review**
- ✅ Upload build via Xcode or EAS
- ✅ Fill in review information
- ✅ Submit for review
- ✅ Wait for approval (usually 24-48 hours)

**Step 4: Release**
- ✅ Once approved, release immediately or schedule
- ✅ Monitor for crashes/issues
- ✅ Respond to user reviews

---

### 7.3 Build Configuration

**app.json (Expo):**
```json
{
  "expo": {
    "name": "Brussels Subsidies",
    "slug": "brussels-subsidies",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.brussels-subsidies",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.brussels_subsidies",
      "versionCode": 1
    }
  }
}
```

---

## 8. Costs & Timeline

### 8.1 Development Costs

**Option A: DIY (You develop)**
- ✅ Apple Developer: $99/year
- ✅ Development tools: Free (Xcode, Expo)
- ✅ Time investment: 80-120 hours
- **Total: $99/year**

**Option B: Hire Developer**
- ✅ React Native developer: $50-150/hour
- ✅ Estimated hours: 80-120 hours
- ✅ Apple Developer: $99/year
- **Total: $4,000-$18,000 + $99/year**

**Option C: Development Agency**
- ✅ Full-service agency: $20,000-$50,000
- ✅ Includes design, development, testing
- ✅ Apple Developer: $99/year
- **Total: $20,000-$50,000 + $99/year**

---

### 8.2 Timeline Estimate

**React Native with Expo (Recommended):**
- Week 1-2: Project setup, navigation, basic screens
- Week 3-4: Port components, adapt styling
- Week 5-6: Replace charts, implement data loading
- Week 7-8: Export functionality, offline support
- Week 9-10: Testing, bug fixes, optimization
- Week 11-12: App Store submission, beta testing
- **Total: 12-16 weeks**

**Capacitor (Faster):**
- Week 1-2: Setup, basic configuration
- Week 3-4: Adapt for mobile, testing
- Week 5-6: App Store submission
- **Total: 6-8 weeks**

---

### 8.3 Ongoing Costs

**Annual:**
- ✅ Apple Developer Program: $99/year
- ✅ Hosting (if using cloud data): $5-20/month
- ✅ Updates/maintenance: Variable

---

## 9. Maintenance & Updates

### 9.1 Update Strategy

**Data Updates:**
- ✅ Push new data via cloud (if using cloud storage)
- ✅ Or release app update for bundled data

**Feature Updates:**
- ✅ Regular app updates (quarterly recommended)
- ✅ Bug fixes as needed
- ✅ Respond to user feedback

---

### 9.2 Monitoring

**Tools:**
- ✅ **Sentry**: Error tracking (already in web app)
- ✅ **Firebase Analytics**: User behavior
- ✅ **App Store Connect**: Download stats, reviews
- ✅ **TestFlight**: Beta feedback

---

### 9.3 Version Management

**Versioning:**
- ✅ Semantic versioning (1.0.0, 1.1.0, 2.0.0)
- ✅ iOS build number increments
- ✅ Changelog for each version

---

## 10. Action Items Checklist

### Phase 1: Planning (Week 1)
- [ ] Choose technical approach (React Native recommended)
- [ ] Set up Apple Developer account
- [ ] Create App Store Connect app
- [ ] Design app icon and screenshots
- [ ] Write privacy policy

### Phase 2: Development (Weeks 2-10)
- [ ] Set up React Native/Expo project
- [ ] Port shared utilities and types
- [ ] Create navigation structure
- [ ] Port Search screen
- [ ] Port Analyse screen
- [ ] Port Info screen
- [ ] Replace chart libraries
- [ ] Implement data loading and caching
- [ ] Add export functionality
- [ ] Implement offline support

### Phase 3: Testing (Weeks 11-12)
- [ ] Test on multiple devices
- [ ] Test on multiple iOS versions
- [ ] Performance testing
- [ ] Beta testing via TestFlight
- [ ] Fix bugs and issues

### Phase 4: Submission (Week 13)
- [ ] Prepare App Store assets
- [ ] Upload build to App Store Connect
- [ ] Fill in all metadata
- [ ] Submit for review
- [ ] Wait for approval

### Phase 5: Launch (Week 14)
- [ ] Release app
- [ ] Monitor for issues
- [ ] Respond to reviews
- [ ] Plan future updates

---

## 11. Recommended Resources

### Documentation
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Libraries
- [React Navigation](https://reactnavigation.org/)
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
- [NativeWind](https://www.nativewind.dev/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

### Tools
- [Expo](https://expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [TestFlight](https://developer.apple.com/testflight/)

---

## 12. Next Steps

1. **Decide on approach**: React Native (recommended) or Capacitor
2. **Set up Apple Developer account**: Start immediately (takes 24-48h)
3. **Create project structure**: Set up React Native/Expo project
4. **Start porting code**: Begin with shared utilities and simple components
5. **Iterate and test**: Regular testing on physical devices

---

## 📞 Questions?

If you need help with any specific part of this process, I can:
- Help set up the React Native project
- Port specific components
- Configure App Store Connect
- Write the privacy policy
- Create app icons and screenshots

Good luck with your mobile app! 🚀

