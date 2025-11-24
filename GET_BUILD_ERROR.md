# How to Get the Actual Build Error

Portainer is only showing "exit code 1" but not the actual error message. Here's how to get it:

## Method 1: SSH into Your Server (RECOMMENDED)

This is the most reliable way to see the actual error:

```bash
# SSH into your Ubuntu server
ssh your-user@your-server-ip

# Navigate to your project directory
cd /path/to/tempchat

# Build with full output visible
docker build --no-cache --progress=plain -t tempchat-test . 2>&1 | tee build.log

# The error will appear in real-time. After it fails, check:
tail -100 build.log
```

**Look for lines that say:**
- `Error:`
- `TypeError:`
- `Module not found:`
- `Cannot find:`
- `SyntaxError:`
- Any red/highlighted text

## Method 2: Check Portainer Logs More Carefully

1. In Portainer, go to your stack
2. Click on the failed service/container
3. Click "Logs" tab
4. **Scroll UP** - the error is usually BEFORE the "exit code 1" message
5. Look for any red text or error messages
6. The error might be several lines above the failure message

## Method 3: Test Build Locally First

Before deploying, test the build on your local machine:

```bash
# On your local machine (Windows/Mac/Linux)
cd /path/to/tempchat

# Install dependencies
npm ci

# Try to build
npm run build
```

If this fails locally, fix those errors first. The same errors will occur in Docker.

## Method 4: Use Docker Compose Directly on Server

```bash
# SSH into server
ssh your-user@your-server-ip
cd /path/to/tempchat

# Build with docker-compose (shows more output)
docker-compose build --no-cache --progress=plain 2>&1 | tee compose-build.log

# Check the log
cat compose-build.log
```

## Common Build Errors and Fixes

### TypeScript Errors
If you see TypeScript errors:
- Check for syntax errors in `.ts` and `.tsx` files
- Run `npx tsc --noEmit` locally to see all TypeScript errors
- Fix any `any` types or missing imports

### Missing Dependencies
If you see "Module not found":
- Check that all imports are correct
- Verify `package.json` has all required dependencies
- Run `npm install` locally to ensure dependencies are correct

### Missing Files
If you see "Cannot find file":
- Ensure all source files are uploaded to Portainer
- Check that `.dockerignore` isn't excluding needed files
- Verify `app/`, `lib/`, `types/` directories exist

### Memory Issues
If build runs out of memory:
- Increase Docker memory limit in Portainer settings
- Or use a server with more RAM

## What to Share

Once you get the actual error, share:
1. The **exact error message** (not just "exit code 1")
2. Which step failed (npm ci, npm run build, etc.)
3. The last 20-30 lines of the build output

Then I can help fix the specific issue!

