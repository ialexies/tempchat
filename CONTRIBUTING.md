# Contributing to TempChat

Thank you for your interest in contributing to TempChat! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/tempchat.git
   cd tempchat
   ```
3. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```
5. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

## Development Guidelines

### Code Style

- Follow TypeScript strict mode guidelines
- Use async/await over promise chains
- Prefer Server Components over Client Components when possible
- Use Tailwind CSS for styling
- Follow Next.js App Router conventions
- See `.cursorrules` for detailed coding standards

### TypeScript

- Always use explicit types, avoid `any`
- Use interfaces from `@/types` for shared data structures
- Export types and interfaces from `types/index.ts`
- Handle errors explicitly with try-catch blocks

### File Organization

- Place reusable utilities in `lib/` directory
- Keep type definitions in `types/index.ts`
- API routes: `app/api/[route]/route.ts`
- Page components: `app/[page]/page.tsx`
- Shared components: `components/` directory

### Naming Conventions

- Components: PascalCase (e.g., `ChatMessage.tsx`)
- Files: kebab-case for pages/routes, camelCase for utilities
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

## Making Changes

### Before You Start

1. Check existing issues and pull requests to avoid duplicate work
2. For major changes, open an issue first to discuss the approach
3. Keep changes focused - one feature or fix per pull request

### Development Workflow

1. **Make your changes** following the code style guidelines
2. **Test locally:**
   ```bash
   npm run dev
   # Test your changes in the browser
   ```
3. **Run linting:**
   ```bash
   npm run lint
   ```
4. **Build test:**
   ```bash
   npm run build
   ```
5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

### Commit Messages

Write clear, descriptive commit messages:

- Use present tense ("Add feature" not "Added feature")
- Start with a capital letter
- Keep the first line under 72 characters
- Add more details in the body if needed

**Good examples:**
```
Add emoji picker component
Fix file upload size validation
Update API documentation
```

**Bad examples:**
```
fix
WIP
changes
```

## Pull Request Process

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Describe what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes

3. **Ensure your PR:**
   - Passes all linting checks
   - Builds successfully
   - Follows the code style guidelines
   - Includes documentation updates if needed
   - Has been tested locally

4. **Respond to feedback:**
   - Address review comments promptly
   - Make requested changes
   - Keep discussions constructive

## What to Contribute

### Bug Fixes

- Fix bugs you encounter
- Add tests if possible
- Document the fix in your PR description

### New Features

- Discuss major features in an issue first
- Keep features focused and well-documented
- Update README.md and API.md if needed
- Add examples or usage documentation

### Documentation

- Fix typos and grammar
- Improve clarity and examples
- Add missing documentation
- Update outdated information

### Testing

- Add tests for new features
- Improve test coverage
- Fix failing tests

### Code Quality

- Refactor complex code
- Improve performance
- Fix linting errors
- Improve type safety

## Code Review

All contributions go through code review. Reviewers will check:

- Code quality and style
- Functionality and correctness
- Documentation updates
- Test coverage
- Performance implications

## Questions?

- Open an issue for questions or discussions
- Check existing issues and discussions first
- Be respectful and constructive in all interactions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TempChat! 🎉

