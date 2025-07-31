# Authrator - A Powerful API Testing Tool

Authrator is a comprehensive API testing and development tool, similar to Postman, designed to help developers test, document, and share APIs. Built with React and Electron, it provides a feature-rich desktop application that combines powerful functionality with a user-friendly interface.

![Authrator Logo](icon.png)

## Features

### API Request Management
- **Multiple Request Methods** - Support for GET, POST, PUT, PATCH, DELETE, and other HTTP methods
- **Request Building** - Configure headers, query parameters, request body, and authentication
- **Request History** - Automatically save and access your request history
- **Collections** - Organize your requests into collections for better organization
- **Environment Variables** - Define and manage environment variables for different development stages

### Response Handling
- **Response Visualization** - View responses in formatted JSON, XML, HTML, and raw text
- **Response Headers** - Examine response headers and status codes
- **Response Time** - Track response time and size metrics

### Authentication
- **Multiple Auth Types** - Support for Basic Auth, Bearer Token, OAuth 2.0, and custom authentication
- **Auth Templates** - Save and reuse authentication configurations
- **JWT Testing** - Built-in JWT generation, validation, and testing capabilities

### Performance Testing
- **Load Testing** - Test API performance under load with configurable concurrent users and iterations
- **Response Metrics** - Measure and analyze response times, error rates, and throughput
- **Visual Reports** - View performance metrics with interactive charts
- **Report Generation** - Export detailed reports in JSON and PDF formats

### User Experience
- **Intuitive UI** - Clean and modern interface with dark and light mode
- **Tabs Interface** - Work with multiple requests simultaneously using tabs
- **Request Grouping** - Organize related requests together
- **Keyboard Shortcuts** - Increase productivity with keyboard shortcuts

## Deployment Options

### Web Application
Authrator is available as a web application, accessible from any modern browser. The web version provides a seamless experience with cloud synchronization of your collections and settings.

### Desktop Application
For users who prefer a native experience or need to work offline, Authrator is available as a desktop application for Windows, macOS, and Linux. The desktop version provides all the features of the web application, plus:

- **Offline Mode** - Work without an internet connection
- **Local Storage** - Store your collections and requests locally
- **Enhanced Performance** - Native performance for faster response times
- **System Integration** - Better integration with your operating system

## New Landing Page

The new landing page provides quick access to both the web client and desktop application download. Features include:

- **Modern UI** - Clean, responsive design with Tailwind CSS
- **Quick Access** - Direct links to web client and desktop downloads
- **Feature Showcase** - Highlights of Authrator's key features
- **Automatic OS Detection** - Automatically detects user's operating system for appropriate download

## Desktop Client Download

The desktop client download system:

- **OS Detection** - Automatically detects the user's operating system
- **Direct Download** - Provides the appropriate executable for Windows, macOS, or Linux
- **Portable Windows Executable** - No installation required for Windows users
- **Analytics Integration** - Tracks download metrics for product improvement

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### From Source
1. Clone the repository
   ```
   git clone https://github.com/yourusername/authrator.git
   cd authrator
   ```

2. Install dependencies
   ```
   cd authratorfrontnew
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Build the desktop application
   ```
   npm run build
   npm run dist
   ```

### Using Pre-built Binaries
1. Download the latest release from the [Releases](https://github.com/yourusername/authrator/releases) page
2. Extract the archive and run the executable

## Usage

### Making API Requests

1. **Creating a Request**
   - Select the HTTP method from the dropdown
   - Enter the request URL
   - Configure headers, query parameters, and body as needed
   - Click "Send" to execute the request

2. **Using Collections**
   - Create a new collection using the Collections sidebar
   - Add requests to collections
   - Organize collections into folders

3. **Using Environments**
   - Create environments for development, staging, production, etc.
   - Define environment variables using `{{variable_name}}` syntax
   - Switch environments as needed

### Performance Testing

1. **Setting Up a Test**
   - Navigate to the Performance Testing tab
   - Select APIs to test
   - Configure test parameters (iterations, concurrent users, etc.)

2. **Running Tests**
   - Click "Start Test" to begin the performance test
   - View real-time results as the test progresses

3. **Generating Reports**
   - After test completion, click "JSON Report" to download a JSON report
   - Click "PDF Report" to generate and download a PDF report with charts and metrics

## File Formats

### Collections

Collections are stored in JSON format with the following structure:

```json
{
  "name": "Collection Name",
  "requests": [
    {
      "name": "Request Name",
      "method": "GET",
      "url": "https://api.example.com/endpoint",
      "headers": {},
      "body": null
    }
  ],
  "folders": []
}
```

### Environments

Environments are stored in JSON format with the following structure:

```json
{
  "name": "Environment Name",
  "variables": {
    "base_url": "https://api.example.com",
    "api_key": "your_api_key"
  }
}
```

## Development

### Project Structure

- `src/` - React application source code
  - `App.js` - Main application component
  - `Dashboard.jsx` - Main dashboard view
  - `PerformanceTesting.jsx` - Performance testing functionality
  - `EnvironmentManager.jsx` - Environment management
  - `History.jsx` - Request history
  - `ResponseAnalytics.jsx` - Response analytics

### Adding New Features

1. Fork the repository
2. Create a feature branch
3. Add your feature
4. Write tests
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **API requests failing**
   - Check network connectivity
   - Verify the URL is correct
   - Ensure headers and authentication are properly configured

2. **Performance tests not running**
   - Check that the API endpoints are accessible
   - Verify test configuration parameters
   - Ensure sufficient system resources

3. **Application crashes**
   - Check the console for error messages
   - Verify all dependencies are installed
   - Restart the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- Your Name - Initial work and maintenance

## Acknowledgments

- Inspired by Postman
- Built with React and Electron
- Uses Recharts for data visualization
- Uses jsPDF for PDF generation
