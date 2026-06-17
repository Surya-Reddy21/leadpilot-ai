import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

function App() {
  const [activeTab, setActiveTab] = useState('customer')
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi! I can answer questions about your services, pricing, availability, or help book a consultation.'
    }
  ])
  const [input, setInput] = useState('')
  const [faqText, setFaqText] = useState({ question: '', answer: '' })
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [bookingForm, setBookingForm] = useState({ customerName: '', email: '', date: '', time: '' })
  const [faqs, setFaqs] = useState([])
  const [leads, setLeads] = useState([])
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets] = useState([])
  const [analytics, setAnalytics] = useState({
    totalChats: 0,
    leadsGenerated: 0,
    appointmentsBooked: 0,
    supportTickets: 0,
    faqCount: 0
  })

  const loadAdminData = async () => {
    try {
      const [faqRes, leadRes, bookingRes, ticketRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/faqs`),
        fetch(`${API_URL}/api/leads`),
        fetch(`${API_URL}/api/bookings`),
        fetch(`${API_URL}/api/tickets`),
        fetch(`${API_URL}/api/analytics`)
      ])

      const faqData = await faqRes.json()
      const leadData = await leadRes.json()
      const bookingData = await bookingRes.json()
      const ticketData = await ticketRes.json()
      const analyticsData = await analyticsRes.json()

      setFaqs(faqData)
      setLeads(leadData)
      setBookings(bookingData)
      setTickets(ticketData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Failed to load admin data', error)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { sender: 'user', text: input }
    const currentInput = input
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput })
      })

      const data = await response.json()
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply || 'Sorry, something went wrong.' }])
      await loadAdminData()
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, I could not reach the server.' }])
    }
  }

  const addFaq = async (event) => {
    event.preventDefault()
    if (!faqText.question || !faqText.answer) return

    try {
      await fetch(`${API_URL}/api/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqText)
      })
      setFaqText({ question: '', answer: '' })
      await loadAdminData()
    } catch (error) {
      console.error('Failed to add FAQ', error)
    }
  }

  const saveLead = async (event) => {
    event.preventDefault()
    if (!leadForm.name || !leadForm.email) return

    try {
      await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm)
      })
      setLeadForm({ name: '', email: '', phone: '', notes: '' })
      await loadAdminData()
    } catch (error) {
      console.error('Failed to save lead', error)
    }
  }

  const saveBooking = async (event) => {
    event.preventDefault()
    if (!bookingForm.customerName || !bookingForm.email || !bookingForm.date || !bookingForm.time) return

    try {
      await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm)
      })
      setBookingForm({ customerName: '', email: '', date: '', time: '' })
      await loadAdminData()
    } catch (error) {
      console.error('Failed to save booking', error)
    }
  }

  const metricCards = [
    { label: 'Total chats', value: analytics.totalChats },
    { label: 'Leads generated', value: analytics.leadsGenerated },
    { label: 'Appointments booked', value: analytics.appointmentsBooked },
    { label: 'Support tickets', value: analytics.supportTickets }
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>LeadPilot AI</h1>
        <div>
          <button
            onClick={() => setActiveTab('customer')}
            style={{
              marginRight: 8,
              padding: '10px 14px',
              borderRadius: 999,
              border: activeTab === 'customer' ? 'none' : '1px solid #cbd5e1',
              background: activeTab === 'customer' ? '#0f172a' : '#fff',
              color: activeTab === 'customer' ? '#fff' : '#0f172a'
            }}
          >
            Customer chat
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '10px 14px',
              borderRadius: 999,
              border: activeTab === 'admin' ? 'none' : '1px solid #cbd5e1',
              background: activeTab === 'admin' ? '#0f172a' : '#fff',
              color: activeTab === 'admin' ? '#fff' : '#0f172a'
            }}
          >
            Admin dashboard
          </button>
        </div>
      </div>

      {activeTab === 'customer' ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, minHeight: 420 }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div
                  style={{
                    maxWidth: '75%',
                    background: msg.sender === 'user' ? '#0f172a' : '#eef2ff',
                    color: msg.sender === 'user' ? '#fff' : '#0f172a',
                    padding: '10px 14px',
                    borderRadius: 14
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about services, pricing, or availability"
              style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <button onClick={sendMessage} style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff' }}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {metricCards.map((card) => (
              <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)' }}>
                <div style={{ color: '#64748b', fontSize: 14 }}>{card.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>FAQ management</h3>
              <form onSubmit={addFaq} style={{ display: 'grid', gap: 8 }}>
                <input
                  value={faqText.question}
                  onChange={(e) => setFaqText({ ...faqText, question: e.target.value })}
                  placeholder="Question"
                  style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <textarea
                  value={faqText.answer}
                  onChange={(e) => setFaqText({ ...faqText, answer: e.target.value })}
                  placeholder="Answer"
                  rows={3}
                  style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <button type="submit" style={{ padding: '10px 12px', background: '#0f172a', color: '#fff', borderRadius: 8, border: 'none' }}>
                  Add FAQ
                </button>
              </form>
              <ul style={{ paddingLeft: 18, marginTop: 12 }}>
                {faqs.map((item) => (
                  <li key={item.id} style={{ marginBottom: 8 }}>
                    <strong>{item.question}</strong>
                    <div style={{ color: '#475569' }}>{item.answer}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Capture a lead</h3>
              <form onSubmit={saveLead} style={{ display: 'grid', gap: 8 }}>
                <input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Name" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="Email" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Phone" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <textarea value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} placeholder="Notes" rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <button type="submit" style={{ padding: '10px 12px', background: '#0f172a', color: '#fff', borderRadius: 8, border: 'none' }}>
                  Save lead
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Appointments</h3>
              <form onSubmit={saveBooking} style={{ display: 'grid', gap: 8 }}>
                <input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} placeholder="Customer name" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} placeholder="Email" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} type="date" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} type="time" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <button type="submit" style={{ padding: '10px 12px', background: '#0f172a', color: '#fff', borderRadius: 8, border: 'none' }}>
                  Save booking
                </button>
              </form>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Recent leads</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {leads.map((lead) => (
                  <div key={lead.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                    <strong>{lead.name}</strong>
                    <div>{lead.email}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{lead.phone || 'No phone provided'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Bookings</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {bookings.map((booking) => (
                  <div key={booking.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                    <strong>{booking.customerName}</strong>
                    <div>{booking.date} at {booking.time}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{booking.email}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Support tickets</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {tickets.map((ticket) => (
                  <div key={ticket.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                    <div>{ticket.message}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(ticket.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
