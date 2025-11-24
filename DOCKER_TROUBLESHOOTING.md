# Docker Build Troubleshooting Guide

## Getting Detailed Build Logs in Portainer

Since Portainer may not show full build logs, here's how to get more details:

### Option 1: Check Build Logs in Portainer
1. Go to your stack in Portainer
2. Click on the failed container/service
3. Click on "Logs" tab
4. Look for the actual error message (not just "exit code 1")

### Option 2: Build Locally to See Errors
SSH into your Ubuntu server and run:
```bash
cd /path/to/your/tempchat
docker-compose build --no-cache 2>&1 | tee build.log
cat build.log
```

### Option 3: Build with Docker Directly
```bash
docker build --no-cache --progress=plain -t tempchat:test . 2>&1 | tee build.log
```

## Common Build Issues

### 1. Missing Build Dependencies
If you see errors about native module compilation:
- Ensure `python3`, `make`, `g++`, `sqlite-dev` are installed (already in Dockerfile)

### 2. TypeScript Errors
If TypeScript compilation fails:
- Check for syntax errors in `.ts` and `.tsx` files
- Ensure all imports are correct
- Run `npm run lint` locally first

### 3. Missing Environment Variables
If build fails due to missing env vars:
- Set `NEXT_PUBLIC_GIPHY_API_KEY` in Portainer stack environment variables
- Also set it as a build argument

### 4. File Permission Issues
If you see permission errors:
- Check that files are readable
- Ensure `.dockerignore` isn't excluding needed files

### 5. Memory Issues
If build runs out of memory:
- Increase Docker memory limit in Portainer
- Or use a larger server instance

## Quick Fixes to Try

1. **Clear Docker cache:**
   ```bash
   docker system prune -a
   ```

2. **Rebuild without cache:**
   In Portainer, when deploying the stack, check "Recreate containers" and "Pull latest image"

3. **Check file structure:**
   Ensure all these files exist:
   - `package.json`
   - `package-lock.json`
   - `next.config.js`
   - `tsconfig.json`
   - `postcss.config.js`
   - `tailwind.config.ts`
   - `app/` directory with pages
   - `lib/` directory
   - `types/` directory

4. **Verify .dockerignore:**
   Make sure it's not excluding important files like config files

## Alternative: Build Outside Docker First

To isolate the issue, try building locally:
```bash
npm ci
npm run build
```

If this works, the issue is Docker-specific. If it fails, fix the code first.

## Runtime Permission Errors

### Symptoms
- `SQLITE_CANTOPEN: unable to open database file`
- `EACCES: permission denied, mkdir '/app/data/uploads'`
- Login fails with "Internal server error"

### Root Cause
When using bind mounts (`./data:/app/data`), the host directory permissions override the container's directory permissions. The container runs as user `nextjs` (UID 1001), but the host directory may be owned by a different user.

### Solutions

#### Solution 1: Fix Host Directory Permissions (Recommended for Bind Mounts)
SSH into your Ubuntu server and run:
```bash
# Navigate to your project directory
cd /path/to/your/tempchat

# Fix ownership (UID 1001 = nextjs user in container)
sudo chown -R 1001:1001 ./data

# Fix permissions
sudo chmod -R 755 ./data

# Ensure uploads directory exists
sudo mkdir -p ./data/uploads
sudo chown -R 1001:1001 ./data/uploads
sudo chmod -R 755 ./data/uploads
```

#### Solution 2: Use Named Volume (Recommended for Production)
Update `docker-compose.yml` to use a named volume instead of a bind mount:

```yaml
volumes:
  # Comment out the bind mount:
  # - ./data:/app/data
  # Use named volume instead:
  - tempchat_data:/app/data

# Add at the bottom of the file:
volumes:
  tempchat_data:
```

Then recreate the stack in Portainer. Docker will automatically manage permissions for named volumes.

#### Solution 3: Run Container with User Mapping
If your host user ID is different, you can map it in `docker-compose.yml`:

```yaml
services:
  tempchat:
    # ... other config ...
    user: "${UID:-1001}:${GID:-1001}"
```

Then set environment variables:
```bash
export UID=$(id -u)
export GID=$(id -g)
docker-compose up -d
```

#### Solution 4: Entrypoint Script (Automatic Fix)
The Dockerfile includes an entrypoint script that attempts to fix permissions on startup. However, this only works if the container starts as root (which it does by default). If you're running with user restrictions, use Solution 1 or 2 instead.

### Verification
After applying a solution, check the logs:
```bash
docker logs tempchat
```

You should no longer see permission errors. The app should be able to:
- Create/access `tempchat.db` in `/app/data/`
- Create files in `/app/data/uploads/`

