# Contact Form Setup Guide

The contact form is set up to send emails to **agna.desai@gmail.com** without displaying the email address on the website.

## Setup Instructions

### Option 1: Formspree (Recommended - Free)

1. **Sign up for Formspree** (free account):
   - Go to https://formspree.io
   - Click "Sign Up" and create a free account
   - Free tier allows 50 submissions per month

2. **Create a new form**:
   - After logging in, click "New Form"
   - Name it "AI Games Contact Form"
   - Set the email to: **agna.desai@gmail.com**
   - Copy the form endpoint (looks like: `https://formspree.io/f/xxxxxxxxxx`)

3. **Update contact.html**:
   - Open `contact.html`
   - Find this line (around line 145):
     ```html
     <form id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
     ```
   - Replace `YOUR_FORM_ID` with your actual Formspree form ID
   - Example: `https://formspree.io/f/xjvqkzpn`

4. **Test the form**:
   - Open `contact.html` in your browser
   - Fill out and submit the form
   - Check your email (agna.desai@gmail.com) for the submission

### Option 2: EmailJS (Alternative - Free)

If you prefer EmailJS instead:

1. **Sign up for EmailJS**:
   - Go to https://www.emailjs.com
   - Create a free account (200 emails/month free)

2. **Set up EmailJS**:
   - Add your email service (Gmail recommended)
   - Create an email template
   - Get your Service ID, Template ID, and Public Key

3. **Update contact.html**:
   - Replace the form action with EmailJS JavaScript code
   - Add EmailJS script: `<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>`
   - Update the form submission handler

### Option 3: Netlify Forms (If deploying to Netlify)

If you're deploying to Netlify:

1. **Update the form**:
   - Change form action to: `action="/"` or remove it
   - Add `netlify` attribute: `<form netlify>`
   - Add hidden input: `<input type="hidden" name="_to" value="agna.desai@gmail.com">`

2. **Configure in Netlify**:
   - Netlify will automatically detect the form
   - Go to Site settings → Forms
   - Set up email notifications to agna.desai@gmail.com

## Current Status

⚠️ **Action Required**: The contact form currently has a placeholder Formspree endpoint. You need to:
1. Sign up for Formspree (or another service)
2. Replace `YOUR_FORM_ID` in `contact.html` with your actual form ID

## Testing

After setup:
1. Open `contact.html` in your browser
2. Fill out the form
3. Submit and check agna.desai@gmail.com
4. You should receive an email with the form submission

## Security Note

The email address (agna.desai@gmail.com) is **not displayed** on the website. It's only configured in the form service backend, keeping it private from visitors.





