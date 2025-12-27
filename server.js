// Simple Express server for Karunya Shaiji's Foundation
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const nodemailer = require('nodemailer');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;
const SUBMISSIONS_PATH = path.join(__dirname, 'data', 'submissions.json');

// Ensure submissions storage exists
if (!fs.existsSync(SUBMISSIONS_PATH)) {
  fs.mkdirSync(path.dirname(SUBMISSIONS_PATH), { recursive: true });
  fs.writeFileSync(SUBMISSIONS_PATH, '[]', 'utf8');
}

// Basic mail transport; override with real SMTP via environment
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/contact', label: 'Contact' }
];

// Make navigation data available to all templates
app.use((req, res, next) => {
  res.locals.navLinks = navLinks;
  res.locals.currentPath = req.path;
  next();
});

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/projects', (req, res) => {
  res.render('projects');
});

app.get('/contact', (req, res) => {
  res.render('contact', { status: null, error: null });
});

app.post('/contact', async (req, res) => {
  const {
    Name,
    Email,
    Phone,
    'How can we help?': Help,
    Message,
    'Contact preference': Preference,
    Consent
  } = req.body;

  const submission = {
    name: Name,
    email: Email,
    phone: Phone,
    help: Help,
    message: Message,
    preference: Preference,
    consent: !!Consent,
    receivedAt: new Date().toISOString()
  };

  // Persist submission locally
  try {
    const existing = JSON.parse(fs.readFileSync(SUBMISSIONS_PATH, 'utf8'));
    existing.push(submission);
    fs.writeFileSync(SUBMISSIONS_PATH, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error('Failed to store submission', err);
  }

  // Send notification email (best effort)
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@example.com',
      to: process.env.MAIL_TO || 'contact@example.com',
      subject: 'New Contact Form Submission',
      text: `Name: ${Name}
Email: ${Email}
Phone: ${Phone}
How can we help?: ${Help}
Message: ${Message}
Contact preference: ${Preference}
Consent: ${Consent ? 'Yes' : 'No'}`
    });

    res.render('contact', {
      status: 'Thank you—your message was sent.',
      error: null
    });
  } catch (err) {
    console.error('Mail send failed', err);
    res.render('contact', {
      status: null,
      error: 'We received your submission but could not send email. We will review it shortly.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
