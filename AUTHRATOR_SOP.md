# Authrator - Standard Operating Procedures (SOP)

## Table of Contents
1. [Code Build and Deployment](#code-build-and-deployment)
2. [Architecture](#architecture)
3. [Basic Troubleshooting](#basic-troubleshooting)
4. [Database Management](#database-management)
5. [Migration Procedures](#migration-procedures)

## Code Build and Deployment

### Environment Setup

1. **Prerequisites**:
   - Node.js (v16 or later)
   - npm (v8 or later)
   - MongoDB Atlas account or local MongoDB instance

2. **Repository Structure**:
   ```
   authrator/
   ├── authrator_frontend/      # React/Electron frontend
   └── backend/                 # Express.js backend services
   ```

### Frontend (Electron/React Application)

1. **Development Build**:
   ```bash
   cd authrator_frontend
   npm install
   npm start
   ```

2. **Production Build**:
   ```bash
   cd authrator_frontend
   npm install
   npm run build
   ```

3. **Electron Desktop Application Build**:
   ```bash
   cd authrator_frontend
   npm install
   npm run dist
   ```
   This will generate:
   - Windows: `Authrator-Portable-0.1.0.exe` in the build directory
   - Mac: `Authrator-0.1.0.dmg` in the build directory

4. **Deployment Checklist**:
   - Update version in `package.json`
   - Test builds on target platforms (Windows, Mac)
   - Ensure electron-builder configuration is correct
   - Test desktop application functionality
   - Verify auto-update configuration (if enabled)

### Backend Services

1. **Development Mode**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   This starts:
   - Main proxy server on port 5000
   - Database server on port 5001

2. **Production Deployment**:
   - Configure environment variables (MongoDB URI, Auth credentials)
   - Deploy to your hosting provider (e.g., AWS, Heroku)
   - Set up process manager (e.g., PM2) for reliability
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js
   pm2 start dbserver.js
   ```

## Architecture

### System Overview

Authrator is an API testing and management tool with a desktop client, following a three-tier architecture:

1. **Frontend**: Electron/React application
2. **Backend API Proxy**: Express.js server for API proxying
3. **Database Server**: MongoDB for persistent storage

### Component Architecture

```
┌───────────────────────┐
│   Electron Desktop    │
│       Application     │
└───────────┬───────────┘
            │
┌───────────▼───────────┐
│  React Frontend (UI)  │
└───────────┬───────────┘
            │
┌───────────▼───────────┐      ┌───────────────────┐
│    Express Backend    │◄────►│    MongoDB Atlas  │
│       (API Proxy)     │      │     Database      │
└───────────┬───────────┘      └───────────────────┘
            │
┌───────────▼───────────┐
│   External APIs and   │
│        Services       │
└───────────────────────┘
```

### Key Components

1. **Dashboard**: Main interface for creating and managing API requests
2. **Import/Export**: Handling Postman and Authrator collection formats
3. **Performance Testing**: Load testing tools for APIs
4. **Environment Manager**: Managing environment variables
5. **History**: Request history tracking and management

### Technologies Used

1. **Frontend**:
   - React 19.0.0
   - Tailwind CSS
   - Electron 33.4.1
   - Chart.js/React-chartjs-2 for visualizations
   - React Router 7.1.1

2. **Backend**:
   - Express.js
   - Node-fetch for proxy requests
   - CORS handling
   - Form-data processing
   - HTTPS server capabilities

3. **Database**:
   - MongoDB with Mongoose ODM
   - User authentication (JWT, Google OAuth)
   - Request history storage
   - Usage statistics tracking

## Basic Troubleshooting

### Frontend Issues

1. **Application Won't Start**:
   - Verify Node.js and npm versions
   - Check package.json for correct dependencies
   - Rebuild node modules: `npm rebuild`
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   
2. **Electron Packaging Fails**:
   - Verify electron-builder configuration in package.json
   - Check for native module compatibility issues
   - Ensure proper icon files are present in assets directory
   - Run with verbose logging: `npm run dist -- --debug`

3. **UI Rendering Problems**:
   - Check browser console for errors
   - Verify React component structure
   - Test in development mode with React DevTools
   - Check Tailwind CSS configuration

### Backend Issues

1. **Server Won't Start**:
   - Check for port conflicts (5000 and 5001)
   - Verify MongoDB connection string
   - Check for syntax errors in server code
   - Ensure all dependencies are installed

2. **API Proxy Errors**:
   - Check network connectivity
   - Verify request format
   - Check timeout settings
   - Review CORS configuration
   - Inspect error logs for specific error messages

3. **Database Connection Issues**:
   - Verify MongoDB Atlas credentials
   - Check network access settings in MongoDB Atlas
   - Test connection with mongo shell
   - Check for MongoDB service availability

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| 401 | Unauthorized | Check authentication credentials |
| 404 | Not Found | Verify API endpoint URLs |
| 408 | Request Timeout | Increase timeout settings or check network |
| 500 | Internal Server Error | Check server logs for details |
| 503 | Service Unavailable | Check external API status or retry later |

## Database Management

### MongoDB Configuration

1. **Connection Setup**:
   - MongoDB Atlas cloud database
   - Connection string format: `mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority`
   - Environment variables for secure credential storage

2. **Schema Structure**:
   - Users: Stores user authentication data
   - RequestHistory: Stores API request history
   - Stats: Tracks application usage statistics

3. **Indexes and Performance**:
   - RequestHistory has indexes on userId and timestamp
   - Regular cleanup of old request history (30 days retention)

4. **Backup Procedures**:
   - Use MongoDB Atlas automated backups
   - Schedule daily backups
   - Retention policy: 7 days

### Data Management

1. **Data Cleanup**:
   - Automatic cleanup of request history older than 30 days
   - Scheduled daily via the `cleanupOldRequestHistory` function

2. **Data Monitoring**:
   - Monitor collection size growth
   - Set up alerts for database performance issues
   - Regularly check index effectiveness

## Migration Procedures

### Schema Migration

1. **Adding New Fields**:
   - MongoDB's flexible schema allows adding fields without downtime
   - Update mongoose schemas in dbserver.js
   - Use update operations to populate new fields if needed
   - Test changes in development environment first

2. **Modifying Existing Fields**:
   - Create migration script for field transforms
   - Run migration during low-traffic periods
   - Validate data integrity post-migration

### Version Migration

1. **Frontend Version Update**:
   - Update version in package.json
   - Build new Electron packages
   - Distribute through appropriate channels
   - Consider implementing auto-update functionality

2. **Backend Version Update**:
   - Deploy new backend code
   - Run database migrations if needed
   - Monitor logs for any errors
   - Have rollback plan ready

### Application Data Migration

1. **Exporting Collections**:
   - Use the built-in export functionality in the UI
   - Save collections in Postman-compatible format
   - Store backups in secure location

2. **Importing Collections**:
   - Use the import functionality in the UI
   - Supports Postman v2.1 format
   - Supports Authrator format
   - Validate collection integrity after import

---

This document should be reviewed and updated regularly to reflect the latest changes to the Authrator application architecture and procedures.

Last Updated: [Current Date] 