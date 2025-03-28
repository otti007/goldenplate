# Name Input Visibility Fix Guide

If you can't see the input box for student names in the name tracker, follow these steps to fix the issue:

## Option 1: Use the Simplified Tracker

I've created a simplified version of the name tracker that always shows the name input field:

1. Open the `simplified_tracker.html` file in your browser
2. This alternative version has a clearer layout with the name input always visible
3. Follow the same steps as before: select a school, select or create a session, then enter student names

## Option 2: Fix the Standard Tracker

If you prefer to use the original tracker, follow these steps:

1. Make sure you've selected a school and a session
2. Open your browser's developer console (right-click > Inspect > Console)
3. Check for any error messages that might indicate why the UI isn't updating
4. If you see CSS-related errors, make sure the styles.css file is correctly loaded

## Debugging CSS Issues

The visibility problem might be related to CSS styling:

1. The name input section has `style="display: none;"` by default
2. It should become visible (`display: block`) when a session is selected
3. Check if any CSS variables are missing in your styles.css file:
   - `--border-color`
   - `--card-background`
   - `--success-color` 
   - `--error-color`
   - `--text-primary`
   - `--text-secondary`

## Technical Explanation

The issue occurs because the original tracker hides the name input section until a session is selected, and then shows it with:

```javascript
nameEntrySection.style.display = 'block';
```

If this visibility change isn't working, it could be due to:
1. JavaScript errors preventing the code from running
2. CSS issues with the display property
3. DOM structure problems where the element IDs don't match

The simplified tracker avoids this problem by always showing the name input section and just disabling the buttons until a session is selected. 