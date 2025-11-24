# TempChat - Simple Chat Application

A simple, temporary chat application built with Next.js, TypeScript, and file-based storage. No database required!

## Features

- ✅ Simple authentication (3 fixed users)
- ✅ Real-time chat with Server-Sent Events (SSE)
- ✅ File attachments (all file types, up to 10MB)
- ✅ Emoji picker
- ✅ Giphy GIF search and sharing
- ✅ File-based storage (no database needed)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```env
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_GIPHY_API_KEY=your-giphy-api-key
```

**Note:** Get a free Giphy API key from [Giphy Developers](https://developers.giphy.com/). The app will work without it, but GIF search won't function.

### 3. Initialize Users

The users will be automatically created on first login, but you can also manually initialize them:

```bash
npx tsx scripts/init-users.ts
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Users

- **user1** / **user1pass**
- **user2** / **user2pass**
- **user3** / **user3pass**
- **alex** / **user1pass**

## Deployment

### Docker (Recommended for Ubuntu/VPS)

The easiest way to deploy on Ubuntu or any Docker-compatible server.

#### Prerequisites

- Docker and Docker Compose installed on your server
- Git (to clone the repository)

#### Quick Start with Docker

1. **Clone the repository** on your server:
   ```bash
   git clone <your-repo-url>
   cd tempchat
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env and set your JWT_SECRET and GIPHY_API_KEY
   nano .env
   ```

3. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**:
   - Open `http://your-server-ip:3000` in your browser
   - The app will be running in the background

#### Docker Commands

- **Start the container**: `docker-compose up -d`
- **Stop the container**: `docker-compose down`
- **View logs**: `docker-compose logs -f`
- **Restart**: `docker-compose restart`
- **Rebuild after code changes**: `docker-compose up -d --build`

#### Data Persistence

The `data/` directory is mounted as a volume, so your users, messages, and uploaded files persist even when the container is stopped or rebuilt.

#### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
JWT_SECRET=your-strong-secret-key-here
NEXT_PUBLIC_GIPHY_API_KEY=your-giphy-api-key
```

**Important**: Generate a strong JWT_SECRET for production:
```bash
openssl rand -base64 32
```

### GitHub Actions CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. **Lints and tests** on every push/PR
2. **Builds Docker image** and pushes to GitHub Container Registry
3. **Optionally deploys** to your Ubuntu server via SSH

#### Setting Up Automated Deployment

1. **Add GitHub Secrets** (Repository Settings → Secrets and variables → Actions):
   - `SSH_HOST`: Your server IP address
   - `SSH_USERNAME`: SSH username (e.g., `ubuntu`, `root`)
   - `SSH_PRIVATE_KEY`: Your private SSH key
   - `SSH_PORT`: SSH port (default: 22, optional)
   - `DEPLOY_URL`: Your application URL (optional, for status badges)

2. **Prepare your server**:
   ```bash
   # On your Ubuntu server
   mkdir -p /opt/tempchat  # or ~/tempchat
   cd /opt/tempchat
   git clone <your-repo-url> .
   ```

3. **First-time setup on server**:
   ```bash
   # Create .env file
   cp .env.example .env
   nano .env  # Edit with your secrets
   
   # Start the application
   docker-compose up -d
   ```

4. **Automatic deployment**: After pushing to `main` or `master` branch, GitHub Actions will:
   - Run tests and linting
   - Build the Docker image
   - Deploy to your server automatically

#### Manual Docker Build (without docker-compose)

```bash
# Build the image
docker build -t tempchat .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=your-secret \
  -e NEXT_PUBLIC_GIPHY_API_KEY=your-key \
  --name tempchat \
  --restart unless-stopped \
  tempchat
```

### Vercel (Alternative)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `JWT_SECRET`
   - `NEXT_PUBLIC_GIPHY_API_KEY`
4. Deploy!

**Note:** File storage works on Vercel, but files are stored in the serverless function's temporary filesystem. For production use, consider using Vercel Blob or similar services.

### Other Platforms

The app can be deployed to any Node.js hosting platform:
- Render
- Railway
- DigitalOcean App Platform
- etc.

## Project Structure

```
tempchat/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── chat/        # Chat page
│   └── page.tsx     # Login page
├── components/      # React components
├── lib/            # Utility functions
├── types/          # TypeScript types
└── data/           # File storage (gitignored)
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **bcryptjs** - Password hashing
- **emoji-picker-react** - Emoji picker
- **Giphy API** - GIF search

## Security Notes

This is a temporary chat application with basic security:
- Passwords are hashed with bcrypt
- Sessions use JWT tokens
- File uploads are validated (size, type)
- Basic input sanitization

**Not recommended for production use with sensitive data.**

## License

MIT

