# 🤝 Contributing Guide

Thank you for your interest in contributing to **Brussels Subsidies**! This guide will help you participate effectively in the project.

## 🎯 Project Objective

Our mission is to **make transparent the distribution of public subsidies** in the Brussels-Capital Region to **restore citizens' trust** in the use of public money.

## 🚀 Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/[your-username]/brussels-sub.git
cd brussels-sub
npm install
```

### 2. Run the Project
```bash
npm run dev
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature
```

## 🎨 Types of Contributions

### 🐛 Bug Fixes
- Fix existing errors
- Improve error handling
- Optimize performance

### ✨ New Features
- Improve user interface
- Add new visualizations
- Create new filters
- Enhance search functionality

### 📊 Data Improvements
- Refine subsidy categorization
- Add new metrics
- Improve data analysis

### 🎨 Design & UX
- Improve interface
- Optimize mobile experience
- Create new components

### 📝 Documentation
- Improve README
- Create user guides
- Document code

## 🛠️ Project Structure

```
src/
├── app/                 # Next.js pages
│   ├── page.tsx        # Main page
│   └── layout.tsx      # Global layout
├── components/         # Reusable components
│   └── ui/            # UI components (Shadcn)
└── lib/               # Utilities and configuration
public/
├── data-*.json        # Subsidy data
└── README-DATA.md     # Data documentation
```

## 📋 Code Standards

### TypeScript
- Use TypeScript for all code
- Type all functions and variables
- Avoid `any` as much as possible

### Style
- Use Prettier for formatting
- Follow ESLint conventions
- Comment complex code

### Components
- Use functional components
- Prefer React hooks
- Keep components small and focused

## 🧪 Testing

```bash
# Run tests
npm test

# Tests with coverage
npm run test:coverage
```

## 📝 Contribution Process

### 1. Issue
- Check if an issue already exists
- Create an issue if necessary
- Assign yourself to the issue

### 2. Development
- Create a branch from `main`
- Develop your feature
- Test your changes
- Document if necessary

### 3. Pull Request
- Create a clear and detailed PR
- Link the corresponding issue
- Add screenshots if relevant
- Wait for review

### 4. Review
- Respond to comments
- Make requested changes
- Test after each change

## 🎯 Current Priorities

### 🔥 Urgent
- [ ] Improve beneficiary categorization
- [ ] Optimize search performance
- [ ] Fix mobile display bugs

### 📈 Important
- [ ] Add unit tests
- [ ] Improve accessibility
- [ ] Create new visualizations

### 💡 Ideas
- [ ] PDF data export
- [ ] New subsidy notifications
- [ ] Public API
- [ ] Mobile application

## 🐛 Reporting a Bug

Use the issue template for bugs:

```markdown
**Bug Description**
A clear description of the problem.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Screenshots**
If applicable.

**Environment**
- OS: [ex: Windows, macOS, Linux]
- Browser: [ex: Chrome, Firefox, Safari]
- Version: [ex: 1.0.0]
```

## 💡 Proposing a Feature

```markdown
**Feature Description**
A clear description of what you want.

**Problem Solved**
What problem does this solve?

**Proposed Solution**
How do you imagine the solution?

**Alternatives Considered**
Other possible solutions?
```

## 📞 Communication

- **GitHub Issues** : For bugs and suggestions
- **Discussions** : For general questions
- **Pull Requests** : For code contributions

## 🙏 Code of Conduct

- Be respectful and kind
- Accept constructive criticism
- Help other contributors
- Respect different opinions

## 🎉 Recognition

All contributors will be mentioned in the README and releases. Thank you for participating in this public interest project!

---

**Together, let's make transparency accessible to everyone! 🏛️✨**