# TempChat - Simple Chat Application

A modern, real-time chat application built with Next.js 14, TypeScript, and SQLite database. Perfect for temporary team chats, quick collaboration, or learning Next.js App Router patterns. Simple file-based SQLite database - no external database server required!

## 🚀 Features

- ✅ **Simple Authentication** - JWT-based session management with bcrypt password hashing
- ✅ **Real-time Messaging** - Server-Sent Events (SSE) for instant message delivery
- ✅ **Reply to Messages** - Reply to specific messages with inline preview (like Facebook Messenger)
- ✅ **File Attachments** - Upload and share any file type (up to 10MB)
- ✅ **Emoji Picker** - Rich emoji support with visual picker
- ✅ **Giphy Integration** - Search and share GIFs directly in chat
- ✅ **SQLite Database** - Simple file-based database, no external server needed
- ✅ **Admin Panel** - Full user management with admin account
- ✅ **Docker Support** - Easy deployment with Docker and Docker Compose
- ✅ **TypeScript** - Full type safety throughout the application
- ✅ **Responsive Design** - Modern UI with Tailwind CSS and subtle silhouette background pattern

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Development](#development)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🏃 Quick Start

### Prerequisites

- Node.js 20+ and npm
- (Optional) Docker and Docker Compose for containerized deployment
- (Optional) Giphy API key for GIF search functionality

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ialexies/tempchat.git
   cd tempchat
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the project root:

   ```env
   JWT_SECRET=your-strong-secret-key-here
   NEXT_PUBLIC_GIPHY_API_KEY=your-giphy-api-key
   ```

   **Generate a secure JWT_SECRET:**

   ```bash
   openssl rand -base64 32
   ```

   **Get a Giphy API key (optional):**

   - Visit [Giphy Developers](https://developers.giphy.com/)
   - Create a free account and generate an API key
   - The app works without it, but GIF search won't function

4. **Initialize users (optional):**

   Users are automatically created on first login, but you can pre-initialize them:

   ```bash
   npx tsx scripts/init-users.ts
   ```

5. **Run the development server:**

   ```bash
   npm run dev
   ```

6. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Users

The application comes with 4 pre-configured users:

| Username | Password    |
| -------- | ----------- |
| `user1`  | `user1pass` |
| `user2`  | `user2pass` |
| `user3`  | `user3pass` |
| `alex`   | `user1pass` |

### Admin Account

The application includes a fixed admin account for user management:

| Username   | Password    |
| ---------- | ----------- |
| `ialexies` | `*Luffy123` |

**Note:** The admin account is hardcoded and cannot be deleted. Use the admin panel (accessible from the chat page) to manage users.

**Note:** Default credentials are for development. Change them in production!

## 📁 Project Structure

```
tempchat/
├── app/                      # Next.js App Router directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   │   ├── check/       # Session validation
│   │   │   └── login/       # User login
│   │   ├── files/           # File serving
│   │   │   └── [filename]/  # Dynamic file route
│   │   ├── giphy/           # Giphy API proxy
│   │   │   ├── search/      # GIF search
│   │   │   └── trending/    # Trending GIFs
│   │   ├── messages/        # Message endpoints
│   │   │   ├── route.ts     # GET/POST messages
│   │   │   └── stream/      # SSE stream endpoint
│   │   ├── upload/          # File upload
│   │   └── logout/          # Logout endpoint
│   ├── chat/                # Chat page
│   │   └── page.tsx         # Main chat interface
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Login page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ChatInput.tsx        # Message input component
│   ├── EmojiPicker.tsx      # Emoji picker component
│   └── GifPicker.tsx        # GIF picker component
├── lib/                     # Utility functions
│   ├── auth.ts              # Authentication utilities
│   ├── db.ts                # SQLite database connection
│   ├── storage.ts           # Database operations
│   ├── messageBroadcast.ts  # SSE message broadcasting
│   └── giphy.ts             # Giphy API client
├── types/                   # TypeScript type definitions
│   └── index.ts             # Shared types and interfaces
├── scripts/                 # Utility scripts
│   ├── init-users.ts        # User initialization script
│   └── migrate-json-to-sqlite.ts  # JSON to SQLite migration
├── data/                    # Data storage (gitignored)
│   ├── tempchat.db          # SQLite database file
│   └── uploads/             # Uploaded files
├── .env.example             # Environment variables template
├── Dockerfile               # Docker image definition
├── docker-compose.yml       # Docker Compose configuration
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 📡 API Documentation

See [API.md](./API.md) for complete API documentation.

### Quick API Reference

| Endpoint                | Method | Description                      | Auth Required |
| ----------------------- | ------ | -------------------------------- | ------------- |
| `/api/auth/login`       | POST   | User login                       | No            |
| `/api/auth/check`       | GET    | Check session                    | No            |
| `/api/logout`           | POST   | Logout user                      | No            |
| `/api/messages`         | GET    | Get all messages                 | Yes           |
| `/api/messages`         | POST   | Send message                     | Yes           |
| `/api/messages/stream`  | GET    | SSE stream for real-time updates | Yes           |
| `/api/upload`           | POST   | Upload file                      | Yes           |
| `/api/files/[filename]` | GET    | Download file                    | Yes           |
| `/api/giphy/search`     | GET    | Search GIFs                      | No            |
| `/api/giphy/trending`   | GET    | Get trending GIFs                | No            |

## 🏗️ Architecture

### Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Authentication:** JWT with httpOnly cookies
- **Password Hashing:** bcryptjs
- **Real-time:** Server-Sent Events (SSE)
- **Database:** SQLite (better-sqlite3)
- **Storage:** File-based SQLite database

### Key Design Decisions

1. **SQLite Database:** Chosen for simplicity and reliability. Single file database, no external server needed. Perfect for temporary chats or small teams. Automatically migrates from JSON files if they exist.

2. **Server-Sent Events:** Used instead of WebSockets for simplicity. SSE is unidirectional (server → client) which fits chat applications well.

3. **JWT Sessions:** Stateless authentication using JWT tokens stored in httpOnly cookies for security.

4. **Admin System:** Hardcoded admin account for reliability, with support for additional admin users stored in database.

5. **Next.js App Router:** Modern Next.js architecture with Server Components by default, reducing client-side JavaScript.

6. **TypeScript:** Full type safety with strict mode enabled for better code quality and developer experience.

### Data Flow

```
User Action → API Route → Storage Layer → Broadcast System → SSE Clients
```

1. **User sends message:** Client POSTs to `/api/messages`
2. **Server validates:** Checks authentication and message content
3. **Storage:** Message inserted into SQLite database
4. **Broadcast:** All connected SSE clients notified
5. **Update:** Clients receive new messages via SSE stream

### Real-time Updates

The application uses Server-Sent Events (SSE) for real-time message delivery:

- Clients connect to `/api/messages/stream`
- Server polls SQLite database every second
- New messages are broadcast to all connected clients
- Keepalive messages sent to maintain connection

### Reply to Messages

The application supports replying to specific messages, similar to Facebook Messenger:

- **Desktop:** Hover over any message to see the reply button
- **Mobile:** Long press (hold for 500ms) on any message to see the reply menu
- **Reply Preview:** When replying, a preview of the original message appears above the input field
- **Message Display:** Replies show an inline preview of the original message with the sender's avatar and a truncated message text
- **Navigation:** Click on a reply preview to scroll to and highlight the original message

### Visual Design

The application features a modern, clean interface with attention to detail:

- **Silhouette Background:** Subtle chat bubble pattern in the background for visual interest without compromising readability
- **Responsive Layout:** Optimized for all screen sizes from mobile to desktop
- **Smooth Animations:** Message entry animations and smooth transitions throughout
- **Dark Mode Support:** Automatic dark mode detection with appropriate color schemes
- **Accessibility:** Proper ARIA labels, keyboard navigation, and touch-friendly targets

### Database Migration

If you have existing JSON files (`users.json`, `messages.json`), the application will automatically migrate them to SQLite on first run. The JSON files will be backed up with `.backup` extension.

## 💻 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Development Workflow

1. **Make changes** to the codebase
2. **Run linting:** `npm run lint` to check for errors
3. **Test locally:** `npm run dev` and test in browser
4. **Build test:** `npm run build` to ensure production build works

### Adding New Features

1. **Define types** in `types/index.ts` if needed
2. **Create utilities** in `lib/` for reusable logic
3. **Add API routes** in `app/api/` following REST conventions
4. **Create components** in `components/` for UI elements
5. **Update documentation** in README.md and API.md

### Code Style

- Follow TypeScript strict mode guidelines
- Use async/await over promise chains
- Prefer Server Components over Client Components
- Use Tailwind CSS for styling
- Follow Next.js App Router conventions
- See `.cursorrules` for detailed coding standards

## 🚢 Deployment

### Docker Deployment (Recommended)

The easiest way to deploy on Ubuntu, VPS, or any Docker-compatible server.

#### Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

#### Quick Start

1. **Clone the repository on your server:**

   ```bash
   git clone https://github.com/ialexies/tempchat.git
   cd tempchat
   ```

2. **Create environment file:**

   ```bash
   cp .env.example .env
   # Edit .env with your secrets
   nano .env
   ```

3. **Build and run:**

   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - Open `http://your-server-ip:3001` in your browser
   - The app runs in the background

#### Docker Commands

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build
```

#### Data Persistence

The `data/` directory is mounted as a volume, so your users, messages, and uploaded files persist even when containers are stopped or rebuilt.

### GitHub Actions CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated deployment.

#### Setup

1. **Add GitHub Secrets** (Repository Settings → Secrets and variables → Actions):

   - `SSH_HOST`: Your server IP address
   - `SSH_USERNAME`: SSH username (e.g., `ubuntu`, `root`)
   - `SSH_PRIVATE_KEY`: Your private SSH key
   - `SSH_PORT`: SSH port (default: 22, optional)
   - `DEPLOY_URL`: Your application URL (optional)

2. **Prepare your server:**

   ```bash
   mkdir -p /opt/tempchat
   cd /opt/tempchat
   git clone https://github.com/ialexies/tempchat.git .
   ```

3. **First-time setup:**

   ```bash
   cp .env.example .env
   nano .env  # Edit with your secrets
   docker-compose up -d
   ```

4. **Automatic deployment:** After pushing to `main` branch, GitHub Actions will:
   - Run tests and linting
   - Build Docker image
   - Deploy to your server automatically

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `JWT_SECRET`
   - `NEXT_PUBLIC_GIPHY_API_KEY`
4. Deploy!

**Note:** File storage works on Vercel, but files are stored in the serverless function's temporary filesystem. For production, consider using Vercel Blob or similar services.

### Other Platforms

The app can be deployed to any Node.js hosting platform:

- **Render:** Connect GitHub repo, add env vars, deploy
- **Railway:** Import repo, configure environment, deploy
- **DigitalOcean App Platform:** Connect repo, set build/run commands, deploy
- **AWS/GCP/Azure:** Use container services or App Service

## ⚙️ Configuration

### Environment Variables

| Variable                    | Required | Description                               | Default                                |
| --------------------------- | -------- | ----------------------------------------- | -------------------------------------- |
| `JWT_SECRET`                | Yes      | Secret key for JWT token signing          | `temp-secret-key-change-in-production` |
| `NEXT_PUBLIC_GIPHY_API_KEY` | No       | Giphy API key for GIF search              | -                                      |
| `NODE_ENV`                  | No       | Node environment (production/development) | `development`                          |
| `PORT`                      | No       | Server port (Docker)                      | `3000`                                 |

### File Storage Limits

- **Max file size:** 10MB (configurable in `app/api/upload/route.ts`)
- **Storage location:** `data/uploads/` directory
- **Supported types:** All file types

### Session Configuration

- **Session duration:** 7 days
- **Cookie name:** `chat-session`
- **Cookie settings:**
  - `httpOnly: true` - Prevents JavaScript access (XSS protection)
  - `secure: true` - HTTPS only in production
  - `sameSite: 'lax'` - CSRF protection
  - `path: '/'` - Available site-wide
  - `maxAge: 604800` - 7 days in seconds

## 🔒 Security

### Security Features

- ✅ **Password Hashing:** bcrypt with salt rounds (10)
- ✅ **JWT Tokens:** Secure token-based authentication
- ✅ **HttpOnly Cookies:** Prevents XSS attacks
- ✅ **File Validation:** Size and type checking
- ✅ **Input Sanitization:** Basic validation on user input
- ✅ **Secure Headers:** Next.js default security headers

### Security Considerations

⚠️ **This is a temporary chat application with basic security measures.**

**Not recommended for:**

- Production use with sensitive data
- Handling PII (Personally Identifiable Information)
- Compliance requirements (HIPAA, GDPR, etc.)
- High-security environments

**Recommended for:**

- Temporary team chats
- Development/testing environments
- Learning Next.js patterns
- Small internal teams

### Security Best Practices

1. **Change default passwords** in production
2. **Use strong JWT_SECRET** (generate with `openssl rand -base64 32`)
3. **Enable HTTPS** in production
4. **Regular backups** of `data/` directory
5. **Monitor file uploads** for malicious content
6. **Keep dependencies updated** (`npm audit`)

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Error: Port 3000 is already in use
# Solution: Use a different port
PORT=3001 npm run dev
```

#### Permission Denied (Docker)

```bash
# Error: Permission denied when accessing data directory
# Solution: Fix permissions
sudo chown -R $USER:$USER ./data
```

#### JWT Secret Not Set

```bash
# Error: JWT verification failed
# Solution: Set JWT_SECRET in .env.local
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
```

#### Giphy API Not Working

- Check that `NEXT_PUBLIC_GIPHY_API_KEY` is set correctly
- Verify API key is valid at [Giphy Developers](https://developers.giphy.com/)
- Check browser console for API errors

#### Messages Not Updating in Real-time

- Check browser console for SSE connection errors
- Verify `/api/messages/stream` endpoint is accessible
- Check network tab for SSE connection status
- Restart the development server

#### Login Not Working

- **Fields clearing on submit:** This was a bug that has been fixed. Ensure you're using the latest code.
- **No error messages:** Check browser console for detailed logs (prefixed with `[LoginPage]`)
- **Cookie not being set:**
  - Verify `credentials: 'include'` is in fetch requests
  - Check that cookies are enabled in your browser
  - Ensure you're accessing via `localhost` (not `127.0.0.1` or IP address)
  - Check browser DevTools → Application → Cookies to see if `chat-session` cookie exists
- **401 errors in console:** The `/api/auth/check` endpoint now returns 200 OK with `authenticated: false` to prevent console errors
- **Form not submitting:**
  - Check browser console for JavaScript errors
  - Verify React is loading correctly (check Network tab for `main-app.js` and `app-pages-internals.js`)
  - Try hard refresh (Ctrl+F5 or Cmd+Shift+R)
  - Clear browser cache

#### File Upload Fails

- Check file size (max 10MB)
- Verify `data/uploads/` directory exists and is writable
- Check server logs for detailed error messages

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

Check logs:

```bash
# Docker
docker-compose logs -f

# Local
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** following the code style guidelines
4. **Run linting:** `npm run lint`
5. **Test your changes** locally
6. **Commit your changes:** `git commit -m 'Add amazing feature'`
7. **Push to the branch:** `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript strict mode
- Write self-documenting code
- Add JSDoc comments for complex functions
- Update documentation for new features
- Test your changes thoroughly
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Giphy](https://giphy.com/) - GIF API
- [emoji-picker-react](https://github.com/ealush/emoji-picker-react) - Emoji picker component

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/ialexies/tempchat/issues)
- **Discussions:** [GitHub Discussions](https://github.com/ialexies/tempchat/discussions)

---

Made with ❤️ using Next.js 14
