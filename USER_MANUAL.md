# Authrator User Manual

Welcome to Authrator, a powerful API testing tool designed to help you build, test, and document your APIs. This user manual provides comprehensive instructions for using all features of Authrator effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Making API Requests](#making-api-requests)
4. [Working with Collections](#working-with-collections)
5. [Environment Management](#environment-management)
6. [Performance Testing](#performance-testing)
7. [Request History](#request-history)
8. [Authentication](#authentication)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

1. **Windows**:
   - Download the latest `.exe` file from the releases page
   - Run the installer or portable executable

2. **Building from Source**:
   - Clone the repository
   - Navigate to the project directory
   - Run `npm install` and then `npm run dist`

### First Launch

Upon first launch, you'll see the main dashboard interface. Authrator doesn't require any initial setup, so you can start making API requests immediately.

## Interface Overview

The Authrator interface consists of several key areas:

1. **Main Request Panel**: Central area where you configure and send requests
2. **Collections Sidebar**: Left sidebar for managing request collections
3. **Environment Selector**: Dropdown in the top right for selecting environments
4. **Response Panel**: Displays the response of API requests
5. **Tabs Bar**: Allows working with multiple requests simultaneously

## Making API Requests

### Creating a New Request

1. Click the "+" button in the tabs bar or press Ctrl+T (Cmd+T on Mac)
2. Select the HTTP method (GET, POST, PUT, DELETE, etc.) from the dropdown
3. Enter the request URL in the URL bar
4. Configure headers, query parameters, or body if needed
5. Click "Send" to execute the request

### Request Configuration

#### Headers

1. Navigate to the "Headers" tab in the request panel
2. Click "Add Header" to add a new header
3. Enter the header name and value
4. Toggle the checkbox to enable/disable a header

#### Query Parameters

1. Navigate to the "Params" tab in the request panel
2. Click "Add Parameter" to add a new query parameter
3. Enter the parameter name and value
4. Toggle the checkbox to enable/disable a parameter

#### Request Body

1. Navigate to the "Body" tab in the request panel
2. Select the body type (JSON, Form, Text, etc.)
3. Enter the request body content
4. For JSON, use the JSON editor for formatted input

### Viewing Responses

After sending a request, the response is displayed in the response panel, which includes:

1. **Status Code**: HTTP status of the response
2. **Response Time**: Time taken to receive the response
3. **Size**: Size of the response data
4. **Headers**: Response headers tab
5. **Body**: Response body in various formats (JSON, XML, Text)

## Working with Collections

Collections help organize related requests together for easier management.

### Creating a Collection

1. Click "Collections" in the sidebar
2. Click "Create Collection"
3. Enter a name for the collection
4. Click "Create"

### Adding Requests to Collections

1. Send a request or configure a new one
2. Click "Save" 
3. Select a collection from the dropdown
4. Enter a name for the request
5. Click "Save to Collection"

### Managing Collections

1. **Rename**: Right-click a collection and select "Rename"
2. **Delete**: Right-click a collection and select "Delete"
3. **Export Single Collection**: Click the three dots (⋮) menu next to a collection and select "Export"
4. **Export All Collections**: Scroll to the "Import & Export" section at the bottom of the Collections sidebar and click "Export All"
5. **Import Collections**: Click "Import" in the Import & Export section to import collections from Postman or Authrator

#### Supported Import Formats

- **Postman Collections** (v2.1 format)
- **Authrator Export** format

#### Importing Collections

1. Click the "Import" button in the Import & Export section
2. In the modal that appears:
   - Drag and drop your collection file onto the drop area, OR
   - Click "Browse files" to select a file from your system
3. Wait for the import to complete - a success message will appear when done

#### Exporting Collections

Exporting collections allows you to:
- Share your API configurations with team members
- Create backups of your work
- Transfer collections between Authrator instances

The exported files are in JSON format and compatible with Postman v2.1 collection format.

## Environment Management

Environments allow you to define variables that can be reused across requests.

### Creating an Environment

1. Click the environment dropdown in the top right
2. Select "Manage Environments"
3. Click "Add Environment"
4. Enter a name for the environment
5. Add variables and their values
6. Click "Save"

### Using Environment Variables

1. In any field (URL, headers, body), use the syntax `{{variable_name}}` to reference a variable
2. Select the appropriate environment from the dropdown
3. When the request is sent, variables will be replaced with their values

### Managing Variables

1. **Add**: In the environment editor, click "Add Variable"
2. **Edit**: Change the value in the variable field
3. **Delete**: Click the trash icon next to a variable

## Performance Testing

Performance testing allows you to evaluate API performance under load.

### Setting Up a Test

1. Click the "Performance Testing" tab or icon
2. Select the APIs to test from your collections
3. Configure test parameters:
   - **Iterations**: Number of requests to send
   - **Concurrent Users**: Number of simultaneous requests
   - **Ramp-up Period**: Time to gradually increase load
   - **Delay**: Delay between requests

### Running a Test

1. After configuration, click "Start Test"
2. The test will run and show real-time progress
3. You can stop the test at any time by clicking "Stop"

### Analyzing Results

After the test completes, you'll see:

1. **Response Time Chart**: Shows response times over the test duration
2. **Error Rate Chart**: Shows percentage of failed requests
3. **Throughput Chart**: Shows requests per second
4. **Summary Statistics**:
   - Average response time
   - Min/Max response times
   - Error rate
   - Total requests processed

### Generating Reports

1. Click "JSON Report" to download a detailed JSON report
2. Click "PDF Report" to generate and download a PDF report with charts and metrics

## Request History

History keeps track of all requests you've made for easy reference.

### Viewing History

1. Click the "History" tab in the sidebar
2. Browse through your previous requests
3. Click on any entry to view details

### Managing History

1. **Search**: Use the search bar to filter history entries
2. **Clear**: Click "Clear History" to remove all entries
3. **Reuse**: Click "Use" on any entry to load it as a new request

## Authentication

Authrator supports various authentication methods for API requests.

### Setting Up Authentication

1. In the request panel, click the "Auth" tab
2. Select the authentication type:
   - **None**: No authentication
   - **Basic Auth**: Username and password
   - **Bearer Token**: JWT or OAuth token
   - **API Key**: Key-based authentication
   - **OAuth 2.0**: Complete OAuth flow

### Saving Authentication Templates

1. Configure authentication settings
2. Click "Save as Template"
3. Enter a name for the template
4. Click "Save"

### Using Authentication Templates

1. Click "Auth Templates" 
2. Select a saved template
3. The authentication details will be applied to your request

## Keyboard Shortcuts

Authrator provides several keyboard shortcuts to improve your workflow:

- **Ctrl+N** (Cmd+N): New request
- **Ctrl+S** (Cmd+S): Save request
- **Ctrl+Enter**: Send request
- **Ctrl+Tab**: Switch between tabs
- **Ctrl+F** (Cmd+F): Find in response
- **Ctrl+/**: Toggle sidebar
- **Ctrl+E** (Cmd+E): Focus environment selector
- **Ctrl+P** (Cmd+P): Open performance testing

## Troubleshooting

### Common Issues

1. **Request Fails to Send**
   - Check your internet connection
   - Verify the URL is correct and accessible
   - Check if authentication details are correct

2. **Environment Variables Not Working**
   - Ensure you're using the correct syntax `{{variable_name}}`
   - Verify the variable exists in the selected environment
   - Check that the correct environment is selected

3. **Performance Test Not Starting**
   - Make sure you've selected at least one API to test
   - Verify test parameters are within acceptable ranges
   - Check that the APIs being tested are accessible

### Getting Help

If you encounter issues not covered in this manual:

1. Check the [GitHub repository](https://github.com/yourusername/authrator) for known issues
2. Submit a new issue with detailed information about your problem
3. Contact the development team through the support channels

## Appendix

### Supported Request Methods

- GET
- POST
- PUT
- DELETE
- PATCH
- HEAD
- OPTIONS

### Supported Body Formats

- JSON
- Form Data
- URL Encoded
- XML
- Raw Text
- Binary

