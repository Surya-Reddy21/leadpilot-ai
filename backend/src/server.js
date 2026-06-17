const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { Pool } = require('pg')

dotenv.config()

const app = express()
const port = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const defaultFaqs = [
  {
    id: 1,
    question: 'What services do you offer?',
    answer: 'We offer website design, SEO support, automation setup, and customer support consulting for small businesses.'
  },
  {
    id: 2,
    question: 'What are your prices?',
    answer: 'Our packages start with a starter plan for small teams, plus custom options for growing businesses. We can share a tailored quote after a quick consultation.'
  },
  {
    id: 3,
    question: 'When are you available?',
    answer: 'We are available Monday through Friday from 9:00 AM to 6:00 PM, and we respond to messages within one business day.'
  },
  {
    id: 4,
    question: 'How can I contact you?',
    answer: 'You can reach us by email at hello@leadpilot.ai or by submitting a request here and we will follow up shortly.'
  }
]

const state = {
  faqs: [...defaultFaqs],
  leads: [],
  bookings: [],
  tickets: []
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function matchFaq(message) {
  const normalized = message.toLowerCase()

  for (const item of state.faqs) {
    if (normalized.includes(item.question.toLowerCase())) {
      return item.answer
    }
  }

  const keywordMap = [
    {
      keywords: ['price', 'pricing', 'cost', 'quote'],
      answer: 'Our pricing depends on the scope of work. We usually recommend a starter package for most small businesses and can provide a custom quote after a short discovery call.'
    },
    {
      keywords: ['service', 'services', 'offer', 'help'],
      answer: 'We help with customer support automation, lead capture, appointment booking, website chat, and small business workflow setup.'
    },
    {
      keywords: ['available', 'hours', 'when', 'schedule'],
      answer: 'We are typically available Monday to Friday from 9:00 AM to 6:00 PM, and we can arrange meetings outside those hours when needed.'
    },
    {
      keywords: ['contact', 'email', 'phone', 'call', 'reach'],
      answer: 'You can email us at hello@leadpilot.ai or leave your details here and we will follow up with you soon.'
    }
  ]

  for (const item of keywordMap) {
    if (item.keywords.some((keyword) => normalized.includes(keyword))) {
      return item.answer
    }
  }

  return null
}

function detectLeadIntent(message) {
  const normalized = message.toLowerCase()
  return [
    'interested',
    'contact me',
    'follow up',
    'tell me more',
    'i want to learn more',
    'book a consultation',
    'schedule a call'
  ].some((phrase) => normalized.includes(phrase))
}

function detectBookingIntent(message) {
  const normalized = message.toLowerCase()
  return [
    'book',
    'appointment',
    'schedule',
    'meeting',
    'consultation'
  ].some((phrase) => normalized.includes(phrase))
}

function detectEscalation(message) {
  const normalized = message.toLowerCase()
  return [
    'talk to a person',
    'human',
    'agent',
    'speak to someone',
    'real person'
  ].some((phrase) => normalized.includes(phrase))
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    return res.json({
      status: 'ok',
      database: 'offline',
      message: 'Database not connected. Using in-memory demo data.'
    })
  }
})

app.post('/api/chat', (req, res) => {
  const { message } = req.body

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const text = message.trim()
  const faqReply = matchFaq(text)

  if (detectEscalation(text)) {
    const ticket = {
      id: createId('ticket'),
      message: text,
      createdAt: new Date().toISOString()
    }
    state.tickets.push(ticket)

    return res.json({
      reply: 'I have created a support ticket for your request and a member of our team will follow up shortly.'
    })
  }

  if (detectBookingIntent(text)) {
    return res.json({
      reply: 'Absolutely. I can help you book a consultation. Please share your preferred date and time, and I will save the request.'
    })
  }

  if (detectLeadIntent(text)) {
    return res.json({
      reply: 'Thanks for your interest. Please share your name, email, and phone number so we can follow up with you.'
    })
  }

  if (faqReply) {
    return res.json({ reply: faqReply })
  }

  return res.json({
    reply: 'Thanks for your message. I can help with pricing, services, availability, booking a consultation, or connecting you with a person.'
  })
})

app.get('/api/faqs', (req, res) => {
  res.json(state.faqs)
})

app.post('/api/faqs', (req, res) => {
  const { question, answer } = req.body

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' })
  }

  const newFaq = {
    id: createId('faq'),
    question,
    answer
  }

  state.faqs.push(newFaq)
  res.status(201).json(newFaq)
})

app.get('/api/leads', (req, res) => {
  res.json(state.leads)
})

app.post('/api/leads', (req, res) => {
  const { name, email, phone, notes } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }

  const lead = {
    id: createId('lead'),
    name,
    email,
    phone: phone || '',
    notes: notes || '',
    createdAt: new Date().toISOString()
  }

  state.leads.push(lead)
  res.status(201).json(lead)
})

app.get('/api/bookings', (req, res) => {
  res.json(state.bookings)
})

app.post('/api/bookings', (req, res) => {
  const { customerName, email, date, time } = req.body

  if (!customerName || !email || !date || !time) {
    return res.status(400).json({ error: 'Customer name, email, date, and time are required' })
  }

  const booking = {
    id: createId('booking'),
    customerName,
    email,
    date,
    time,
    createdAt: new Date().toISOString()
  }

  state.bookings.push(booking)
  res.status(201).json(booking)
})

app.get('/api/tickets', (req, res) => {
  res.json(state.tickets)
})

app.get('/api/analytics', (req, res) => {
  res.json({
    totalChats: state.tickets.length + state.leads.length + state.bookings.length,
    leadsGenerated: state.leads.length,
    appointmentsBooked: state.bookings.length,
    supportTickets: state.tickets.length,
    faqCount: state.faqs.length
  })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
