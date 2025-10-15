# Hello World Form Template

A Raycast extension template using the Form view with validation and submission handling.

## Features

- Text field with validation
- Email field with format validation
- Text area for longer input
- Dropdown selection
- Checkbox
- Form submission handling
- Toast notifications
- Error handling

## Getting Started

1. Copy this template to your extensions directory
2. Run `npm install && npm run dev`
3. Open Raycast and search for "Hello World Form"
4. Fill out the form and submit

## Structure

```
hello-world-form/
├── src/
│   └── index.tsx       # Main form command
├── package.json        # Extension metadata
└── README.md          # This file
```

## Key Features Demonstrated

### Validation
- Required field validation
- Email format validation
- Real-time error display
- OnBlur validation

### Form Components
- TextField: Single-line text input
- TextArea: Multi-line text input
- Dropdown: Select from options
- Checkbox: Boolean input
- Description: Help text

### Submission
- Form validation before submit
- Toast notifications
- Logging form values
- Closing the command after success

## Customization

Edit `src/index.tsx` to:
- Add more form fields
- Implement API calls on submit
- Add more validation rules
- Customize error messages
- Store data locally
- Navigate to different views

## Resources

- [Form Component Docs](https://developers.raycast.com/api-reference/user-interface/form)
- [Validation Guide](https://developers.raycast.com/api-reference/user-interface/form#form-validation)
- [Toast Notifications](https://developers.raycast.com/api-reference/feedback/toast)
