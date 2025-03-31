# Golden Plate

Golden Plate is a web application for tracking clean and dirty plates at school cafeterias. It allows users to create sessions for different schools, count clean and dirty plates, and view statistics with visual charts.

## Features

- Create and manage multiple schools
- Track clean and dirty plates in real-time
- View statistics with pie charts showing the ratio of clean to dirty plates
- Browse and view previous sessions
- Responsive design that works on desktop and mobile devices
- Data persistence with Supabase backend

## Technologies Used

- HTML5, CSS3, and JavaScript
- [Supabase](https://supabase.com/) for backend database
- [Chart.js](https://www.chartjs.org/) for data visualization
- [Font Awesome](https://fontawesome.com/) for icons

## Setup Instructions

### 1. Database Setup

The application is already configured with a Supabase project. To set up the database tables:

1. Open the `setup.html` file in your browser
2. Click the "Setup Database" button to create the necessary tables
3. Once the setup is complete, you can start using the application

### 2. Application Configuration

The application is already configured with the following Supabase details:

```javascript
const SUPABASE_URL = 'https://ufuwsxtyvaeupqkzuuhb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdXdzeHR5dmFldXBxa3p1dWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNDI5MDQsImV4cCI6MjA1NzcxODkwNH0.hQS9uczPcIQSxYoX30wWItK1NvxGTzDHA68Ma8lUVVg';
```

### 3. Run the Application

You can run the application in several ways:

#### Option A: Local Server

If you have Node.js installed, you can use a simple HTTP server:

```bash
npx http-server
```

Or with Python:

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

#### Option B: VS Code Live Server

If you're using Visual Studio Code:

1. Install the "Live Server" extension
2. Right-click on `index.html` and select "Open with Live Server"

#### Option C: Directly Open the HTML File

You can simply open the `index.html` file in your browser, but some browsers may have security restrictions for local files accessing external APIs.

## Database Structure

The application uses the following database structure in Supabase:

### Schools Table

| Column Name   | Type      | Default | Notes                   |
|---------------|-----------|---------|-------------------------|
| id            | uuid      | uuid_generate_v4() | Primary Key |
| name          | text      | -       | Not Null, Unique       |
| created_at    | timestamp | now()   | Not Null               |

### Sessions Table

| Column Name   | Type      | Default | Notes                   |
|---------------|-----------|---------|-------------------------|
| id            | uuid      | uuid_generate_v4() | Primary Key |
| school_id     | uuid      | -       | Foreign Key (schools.id) |
| clean_plates  | integer   | 0       | Not Null               |
| dirty_plates  | integer   | 0       | Not Null               |
| created_at    | timestamp | now()   | Not Null               |

### Plates Table

| Column Name   | Type      | Default | Notes                   |
|---------------|-----------|---------|-------------------------|
| id            | uuid      | uuid_generate_v4() | Primary Key |
| session_id    | uuid      | -       | Foreign Key (sessions.id) |
| is_clean      | boolean   | -       | Not Null               |
| created_at    | timestamp | now()   | Not Null               |

## How to Use

### Managing Schools

1. Enter a school name in the input field on the home page
2. Click the "+" button to add the school
3. Click on a school to view its details and sessions

### Creating a New Session

1. From the school details page, click "Start New Session"
2. You'll be taken to the session view

### Tracking Plates

1. Click "Clean Plate" each time a clean plate is returned
2. Click "Dirty Plate" each time a dirty plate is returned
3. The counters will update in real-time

### Viewing Results

1. When you're done counting plates, click "End Session"
2. You'll see a pie chart showing the ratio of clean to dirty plates
3. The summary will show the total count and percentages

### Managing Sessions

- Click the back arrow to return to the previous screen
- Click "New Session" to start a new session for the current school
- Click "Back to Home" to return to the home screen
- On the home or school screen, you can view previous sessions by clicking on them

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by school cafeteria waste reduction programs
- Thanks to the Supabase team for providing a great backend service 