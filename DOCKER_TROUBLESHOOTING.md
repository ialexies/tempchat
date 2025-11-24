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

