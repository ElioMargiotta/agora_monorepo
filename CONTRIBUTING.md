# Contributing to ZamaHub

Thank you for your interest in contributing to ZamaHub! We welcome contributions from the community to help improve and expand this platform showcasing Zama's Fully Homomorphic Encryption (FHE) innovations.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## 🤝 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Git** - Version control
- **PostgreSQL** - Database (for local development)
- **A Web3 wallet** - MetaMask, Coinbase Wallet, etc.

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ZamaHub-repo.git
   cd ZamaHub-repo/frontend
   ```

3. Set up the upstream remote:
   ```bash
   git remote add upstream https://github.com/ElioMargiotta/ZamaHub-repo.git
   ```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug Reports**: Report bugs and issues
- **✨ Feature Requests**: Suggest new features or improvements
- **💻 Code Contributions**: Submit pull requests with fixes or enhancements
- **📚 Documentation**: Improve documentation and guides
- **🎨 UI/UX**: Design improvements and user experience enhancements
- **🧪 Testing**: Add or improve tests

### Finding Issues to Work On

1. Check the [Issues](https://github.com/ElioMargiotta/ZamaHub-repo/issues) page
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on the issue to indicate you're working on it
4. Wait for maintainer confirmation before starting work

## 📝 Development Guidelines

### Code Style

This project uses ESLint and follows specific coding standards:

- Use functional components with React hooks
- Follow JavaScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Structure

```
frontend/src/
├── app/                    # Next.js app router pages
├── components/             # Reusable React components
│   ├── ui/                # Basic UI components (buttons, inputs, etc.)
│   ├── landing/           # Landing page specific components
│   └── wallet/            # Wallet-related components
├── lib/                   # Utility functions and configurations
└── styles/                # Global styles and themes
```

### Component Guidelines

- Follow JavaScript best practices and use ESLint for code quality
- Implement proper error boundaries
- Follow accessibility best practices (WCAG guidelines)
- Use semantic HTML elements
- Implement responsive design with Tailwind CSS

### Smart Contract Development

When working with Solidity smart contracts:

- Use Hardhat for compilation, testing, and deployment
- Follow Solidity best practices and security guidelines
- Add comprehensive NatSpec documentation
- Write thorough tests for all contract functions
- Consider gas optimization
- Implement proper access controls and error handling

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

### Testing Guidelines

- Write tests for all new features
- Maintain or improve code coverage
- Test both happy path and error scenarios
- Use descriptive test names
- Mock external dependencies appropriately

### Test Structure

```
__tests__/
├── components/            # Component tests
├── lib/                   # Utility function tests
├── pages/                 # Page component tests
└── contracts/             # Smart contract tests
```

## 📝 Commit Guidelines

We follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat: add privacy-preserving voting system
fix: resolve wallet connection issue on mobile
docs: update API documentation
test: add unit tests for voting factory contract
```

## 🔄 Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```

2. **Make Changes**
   - Write clear, focused commits
   - Test your changes thoroughly
   - Update documentation if needed
   - Add tests for new functionality

3. **Update Branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Create Pull Request**
   - Use a descriptive title
   - Provide detailed description of changes
   - Reference related issues
   - Add screenshots for UI changes

5. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Ensure CI checks pass

### PR Template

Please use the following template for pull requests:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested the changes.

## Screenshots (if applicable)
Add screenshots of UI changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, wallet type, etc.
- **Screenshots**: If applicable
- **Console Logs**: Any relevant error messages

### Feature Requests

For feature requests, please include:

- **Description**: What feature you'd like to see
- **Use Case**: Why this feature would be valuable
- **Implementation Ideas**: Any thoughts on how to implement it
- **Alternatives**: Other solutions you've considered

## 📞 Getting Help

If you need help or have questions:

1. Check the [documentation](./README.md)
2. Search existing [issues](https://github.com/ElioMargiotta/ZamaHub-repo/issues)
3. Create a new issue with the `question` label
4. Join our community discussions

## 🎉 Recognition

Contributors will be recognized in:
- Repository contributors list
- Release notes
- Project documentation

Thank you for contributing to ZamaHub and helping advance privacy-preserving blockchain technology! 🚀