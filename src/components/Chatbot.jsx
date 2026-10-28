import { useState } from 'react';
import { api } from '../api/client.js';
import './Chatbot.css';

const SUPABASE_URL = 'https://prbjvvuzimqrlbhdrcaq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_2tggeC0CbX4EygbE09rROw_lvhmvl2m';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your Gyarados AI library assistant. Describe a book plot or ask me to find a digital asset.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();

    const text = query.trim();
    if (!text || loading) return;

    setMessages(previous => [
      ...previous,
      { role: 'user', text }
    ]);
    setQuery('');
    setLoading(true);

    try {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/library-ai`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify({
              action: 'search',
              query: text
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || `AI search failed (${response.status}).`);
        }

        setMessages(previous => [
          ...previous,
          {
            role: 'assistant',
            text: data.message || 'Here are your matching books.',
            books: data.books || []
          }
        ]);
      } catch (aiError) {
        console.warn('AI library search failed; falling back to catalog search:', aiError);
        const { items } = await api.books({ q: text, limit: 5 });

        setMessages(previous => [
          ...previous,
          {
            role: 'assistant',
            text: items.length
              ? 'AI search is unavailable, so here are catalog matches by title or author.'
              : 'AI search is unavailable, and no catalog matches were found by title or author.',
            books: items
          }
        ]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          text: `I could not search the library: ${error.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gyarados-chatbot">
      {open && (
        <section className="gyarados-chat-window">
          <header className="gyarados-chat-header">
            <div>
              <strong>Gyarados AI</strong>
              <p>Library & Digital Asset Assistant</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </header>

          <div className="gyarados-chat-messages">
            {messages.map((message, index) => (
              <div key={index}>
                <div className={`gyarados-message ${message.role}`}>
                  {message.text}
                </div>

                {message.books?.map(book => (
                  <article className="gyarados-book-result" key={book.id}>
                    <strong>{book.title}</strong>
                    <p>By {book.author}</p>
                    <p>
                      {book.summary || book.description}
                    </p>
                    {book.category && (
                      <small>{book.category}</small>
                    )}
                  </article>
                ))}
              </div>
            ))}

            {loading && (
              <div className="gyarados-message assistant">
                Searching the library...
              </div>
            )}
          </div>

          <form
            className="gyarados-chat-form"
            onSubmit={sendMessage}
          >
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Describe a book plot..."
              maxLength={1000}
              aria-label="Describe a book plot"
              disabled={loading}
            />

            <button type="submit" disabled={loading || !query.trim()}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="gyarados-chat-toggle"
        onClick={() => setOpen(previous => !previous)}
      >
        {open ? 'Close chat' : '✦ Ask Gyarados AI'}
      </button>
    </div>
  );
}