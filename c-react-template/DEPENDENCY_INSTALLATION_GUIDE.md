# Dependency Installation Guide

This document explains the dependency installation fixes implemented to ensure `pnpm install` works reliably.

## Problem Identified

The original project had three main issues preventing reliable installation:

### 1. **React 19 Compatibility**
- `react-helmet-async@2.0.5` had a peer dependency constraint: `react@^16.6.0 || ^17.0.0 || ^18.0.0`
- Project uses React `^19.1.1`, which is incompatible
- **Solution**: Updated to `react-helmet-async@^2.1.0` which supports React 19

### 2. **Lock File Corruption**
- `pnpm-lock.yaml` had unresolved package references (`shallowequal@1.1.0`, `loose-envify@1.4.0`)
- Causes packages to be skipped during installation
- **Solution**: Regenerated lock file with proper settings

### 3. **No pnpm Configuration**
- Missing `.npmrc` file to configure peer dependency and installation behavior
- pnpm was silently skipping problematic packages instead of failing
- **Solution**: Added `.npmrc` with strict settings

## Implemented Fixes

### `.npmrc` File
```ini
auto-install-peers=true           # Automatically install peer dependencies
strict-peer-dependencies=false    # Warn but don't fail on peer dependency issues
shamefully-hoist=true             # Hoist packages to avoid conflicts
```

**Why these settings?**
- `auto-install-peers=true`: Ensures all required dependencies are installed
- `strict-peer-dependencies=false`: Allows React 19 packages that haven't yet declared React 19 support
- `shamefully-hoist=true`: Prevents "phantom" dependencies issues in UI folder

### Updated Dependencies
- **react-helmet-async**: `^2.0.5` → `^2.1.0` (React 19 support)

### Verification Script
Added `scripts/verify-dependencies.mjs` to check if all dependencies are installed:
```bash
pnpm run verify-deps
```

## Fresh Installation

To do a complete fresh install (after cloning):

```bash
# 1. Clean up old installations
rm -rf node_modules pnpm-lock.yaml

# 2. Install with fixed configuration
pnpm install

# 3. Verify all dependencies are installed
pnpm run verify-deps

# 4. Start development
pnpm dev
```

## Troubleshooting

### If dependencies are still missing:

```bash
# Force reinstall
pnpm install --force

# Then verify
pnpm run verify-deps
```

### If you see peer dependency warnings:

This is normal and expected. The `.npmrc` file is configured to allow them. If a dependency truly cannot be found:

```bash
# Check if the package exists
ls node_modules/<package-name>

# If it doesn't exist, manually add it
pnpm add <package-name>
```

### Specific Package Issues

If the UI components fail to load, they might be missing from node_modules. Run:

```bash
pnpm install --frozen-lockfile=false
```

This regenerates the lock file based on current package.json.

## Why Regenerating Lock File Works

The lock file (`pnpm-lock.yaml`) is like a snapshot of exact versions and their dependencies. When it gets corrupted or out of sync with `package.json`:

1. **Old lock file entry points to a version that doesn't exist**
   - pnpm tries to fetch it, fails silently, moves on
   - You end up with incomplete installations

2. **Regenerating creates a fresh snapshot**
   - pnpm re-resolves all dependencies from scratch
   - Finds compatible versions for React 19
   - Creates proper peer dependency links

## Best Practices Going Forward

1. **Always commit `pnpm-lock.yaml`** to version control
2. **Run `pnpm run verify-deps`** after pulling changes
3. **Update dependencies gradually** (not all at once)
4. **Check peer dependency warnings** when updating packages

## FAQ

**Q: Why do I need `.npmrc` if pnpm is installed globally?**  
A: Global `pnpm` settings don't always apply to projects. Project-level `.npmrc` ensures consistent behavior for all team members.

**Q: Can I delete `node_modules` and reinstall?**  
A: Yes! That's actually a good way to fix installation issues:
```bash
rm -rf node_modules && pnpm install && pnpm run verify-deps
```

**Q: What if `pnpm install` still fails?**  
A: Check the error message. Common causes:
- Network issues → retry with `pnpm install --no-network`
- Corrupted global pnpm cache → `pnpm store prune`
- Locked registry → check if npm registry is accessible

## Version History

- **v1.0** (Initial fix): React 19 compatibility, `.npmrc` configuration, lock file regeneration
