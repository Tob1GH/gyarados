// Zero-dependency mock backend so the UI runs out of the box.
// Replace it with your real API: keep the same routes and JSON shapes (see README.md).
import http from 'node:http';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PORT = process.env.PORT || 4000;
const day = 86400000;
const ago = (d) => new Date(Date.now() - d * day).toISOString();
const ahead = (d) => new Date(Date.now() + d * day).toISOString();

const books = [
  { id: 'b1', title: "Clean Code", author: "Robert C. Martin", category: "Technology", year: 2008, copiesTotal: 5, copiesAvailable: 5, description: "A guide to writing readable, maintainable software.", coverImage: 'book-covers/clean-code.png' },
  { id: 'b2', title: "The Pragmatic Programmer", author: "Andrew Hunt and David Thomas", category: "Technology", year: 1999, copiesTotal: 5, copiesAvailable: 4, description: "Practical techniques for professional software development.", coverImage: '/book-covers/pragmatic-programmer.png' },
  { id: 'b3', title: "Introduction to Algorithms", author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, and Clifford Stein", category: "Technology", year: 1990, copiesTotal: 4, copiesAvailable: 3, description: "A comprehensive reference on algorithms and data structures.", coverImage: '/book-covers/introduction-to-algorithms.png' },
  { id: 'b4', title: "Computer Networking: A Top-Down Approach", author: "James Kurose and Keith Ross", category: "Technology", year: 2000, copiesTotal: 4, copiesAvailable: 4, description: "Explains computer networks, protocols, and internet technologies.", coverImage: '/book-covers/computer-networking.png' },
  { id: 'b5', title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell and Peter Norvig", category: "Technology", year: 1995, copiesTotal: 4, copiesAvailable: 3, description: "Covers AI concepts, intelligent agents, and machine learning.", coverImage: '/book-covers/artificial-intelligence.png' },
  { id: 'b6', title: "Cosmos", author: "Carl Sagan", category: "Science", year: 1980, copiesTotal: 4, copiesAvailable: 4, description: "Explores the universe, astronomy, and scientific discovery.", coverImage: '/book-covers/cosmos.png' },
  { id: 'b7', title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", year: 1988, copiesTotal: 4, copiesAvailable: 3, description: "Introduces cosmology, black holes, and the nature of time.", coverImage: '/book-covers/brief-history-of-time.png' },
  { id: 'b8', title: "The Selfish Gene", author: "Richard Dawkins", category: "Science", year: 1976, copiesTotal: 3, copiesAvailable: 2, description: "Explains evolution from the perspective of genes.", coverImage: '/book-covers/selfish-gene.png' },
  { id: 'b9', title: "Campbell Biology", author: "Lisa A. Urry and coauthors", category: "Science", year: 1987, copiesTotal: 4, copiesAvailable: 4, description: "A textbook covering cells, genetics, evolution, and ecology.", coverImage: '/book-covers/campbell-biology.png' },
  { id: 'b10', title: "The Feynman Lectures on Physics", author: "Richard P. Feynman, Robert B. Leighton, and Matthew Sands", category: "Science", year: 1964, copiesTotal: 3, copiesAvailable: 2, description: "A foundational series on physics and physical principles.", coverImage: '/book-covers/feynman-lectures-physics.png' },
  { id: 'b11', title: "The Design of Everyday Things", author: "Don Norman", category: "Design", year: 1988, copiesTotal: 4, copiesAvailable: 3, description: "Explains user-centered design and usability.", coverImage: '/book-covers/design-of-everyday-things.png' },
  { id: 'b12', title: "Don't Make Me Think", author: "Steve Krug", category: "Design", year: 2000, copiesTotal: 4, copiesAvailable: 4, description: "A practical guide to intuitive website usability.", coverImage: '/book-covers/dont-make-me-think.png' },
  { id: 'b13', title: "The Non-Designer's Design Book", author: "Robin Williams", category: "Design", year: 1994, copiesTotal: 3, copiesAvailable: 2, description: "Introduces basic principles of visual design and layout.", coverImage: '/book-covers/non-designers-design-book.png' },
  { id: 'b14', title: "Thinking with Type", author: "Ellen Lupton", category: "Design", year: 2004, copiesTotal: 3, copiesAvailable: 3, description: "Explores typography, text hierarchy, and graphic communication.", coverImage: '/book-covers/thinking-with-type.png' },
  { id: 'b15', title: "Grid Systems in Graphic Design", author: "Josef Müller-Brockmann", category: "Design", year: 1981, copiesTotal: 3, copiesAvailable: 2, description: "Teaches structured layouts and grid-based composition.", coverImage: '/book-covers/grid-systems.png' },
  { id: 'b16', title: "Guns, Germs, and Steel", author: "Jared Diamond", category: "History", year: 1997, copiesTotal: 4, copiesAvailable: 3, description: "Examines factors that shaped the development of human societies.", coverImage: '/book-covers/guns-germs-and-steel.png' },
  { id: 'b17', title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", category: "History", year: 2011, copiesTotal: 4, copiesAvailable: 4, description: "Explores the history and development of humankind.", coverImage: '/book-covers/sapiens.png' },
  { id: 'b18', title: "The Silk Roads", author: "Peter Frankopan", category: "History", year: 2015, copiesTotal: 3, copiesAvailable: 2, description: "Examines global history through trade routes and cultural exchange.", coverImage: '/book-covers/silk-roads.png' },
  { id: 'b19', title: "The Philippine Islands, 1493–1898", author: "Emma Helen Blair and James Alexander Robertson, editors", category: "History", year: 1903, copiesTotal: 3, copiesAvailable: 3, description: "A historical collection of documents about the Philippines.", coverImage: '/book-covers/philippine-islands.png' },
  { id: 'b20', title: "A People's History of the United States", author: "Howard Zinn", category: "History", year: 1980, copiesTotal: 3, copiesAvailable: 2, description: "Presents American history through the experiences of ordinary people.", coverImage: '/book-covers/peoples-history-united-states.png' },
  { id: 'b21', title: "Harry Potter and the Sorcerer's Stone", author: "J. K. Rowling", category: "Fiction", year: 1997, copiesTotal: 5, copiesAvailable: 4, description: "A young wizard discovers a magical world and his own abilities.", coverImage: '/book-covers/harry-potter-sorcerers-stone.png' },
  { id: 'b22', title: "The Hobbit", author: "J. R. R. Tolkien", category: "Fiction", year: 1937, copiesTotal: 4, copiesAvailable: 3, description: "A fantasy adventure featuring a hobbit on an unexpected journey.", coverImage: '/book-covers/the-hobbit.png' },
  { id: 'b23', title: "The Hunger Games", author: "Suzanne Collins", category: "Fiction", year: 2008, copiesTotal: 4, copiesAvailable: 4, description: "A dystopian story about survival, courage, and social inequality.", coverImage: '/book-covers/hunger-games.png' },
  { id: 'b24', title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", year: 1960, copiesTotal: 4, copiesAvailable: 2, description: "A novel exploring justice, prejudice, and compassion.", coverImage: '/book-covers/to-kill-a-mockingbird.png' },
  { id: 'b25', title: "The Little Prince", author: "Antoine de Saint-Exupéry", category: "Fiction", year: 1943, copiesTotal: 4, copiesAvailable: 3, description: "A philosophical tale about friendship, love, and human nature.", coverImage: '/book-covers/little-prince.png' },
  { id: 'b26', title: "Calculus: Early Transcendentals", author: "James Stewart", category: "Mathematics", year: 1995, copiesTotal: 4, copiesAvailable: 3, description: "Covers limits, derivatives, integrals, and calculus applications.", coverImage: '/book-covers/calculus-early-transcendentals.png' },
  { id: 'b27', title: "College Algebra", author: "Michael Sullivan", category: "Mathematics", year: 1992, copiesTotal: 4, copiesAvailable: 4, description: "Covers equations, functions, graphs, and algebraic concepts.", coverImage: '/book-covers/college-algebra.png' },
  { id: 'b28', title: "Introduction to Probability", author: "Dimitri P. Bertsekas and John N. Tsitsiklis", category: "Mathematics", year: 2002, copiesTotal: 3, copiesAvailable: 2, description: "Introduces probability theory and its applications.", coverImage: '/book-covers/introduction-to-probability.png' },
  { id: 'b29', title: "Elementary Linear Algebra", author: "Howard Anton and Chris Rorres", category: "Mathematics", year: 1973, copiesTotal: 3, copiesAvailable: 3, description: "Explains matrices, vectors, and systems of linear equations.", coverImage: '/book-covers/elementary-linear-algebra.png' },
  { id: 'b30', title: "Discrete Mathematics and Its Applications", author: "Kenneth H. Rosen", category: "Mathematics", year: 1984, copiesTotal: 4, copiesAvailable: 3, description: "Covers logic, sets, combinatorics, and graph theory.", coverImage: '/book-covers/discrete-mathematics.png' },
  { id: 'b31', title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki", category: "Business & Economics", year: 1997, copiesTotal: 4, copiesAvailable: 3, description: "Discusses financial education, assets, and money management.", coverImage: '/book-covers/rich-dad-poor-dad.png' },
  { id: 'b32', title: "The Lean Startup", author: "Eric Ries", category: "Business & Economics", year: 2011, copiesTotal: 4, copiesAvailable: 4, description: "Explains how businesses test ideas and develop products efficiently.", coverImage: '/book-covers/lean-startup.png' },
  { id: 'b33', title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Business & Economics", year: 2011, copiesTotal: 3, copiesAvailable: 2, description: "Examines decision-making, judgment, and cognitive biases.", coverImage: '/book-covers/thinking-fast-and-slow.png' },
  { id: 'b34', title: "Principles of Economics", author: "N. Gregory Mankiw", category: "Business & Economics", year: 1997, copiesTotal: 4, copiesAvailable: 3, description: "Introduces economic principles, markets, and public policy.", coverImage: '/book-covers/principles-of-economics.png' },
  { id: 'b35', title: "The Personal MBA", author: "Josh Kaufman", category: "Business & Economics", year: 2010, copiesTotal: 3, copiesAvailable: 3, description: "Introduces business fundamentals, marketing, and operations.", coverImage: '/book-covers/personal-mba.png' },
  { id: 'b36', title: "How Learning Works", author: "Susan A. Ambrose and coauthors", category: "Education", year: 2010, copiesTotal: 3, copiesAvailable: 3, description: "Explores research-based principles for effective teaching and learning.", coverImage: '/book-covers/how-learning-works.png' },
  { id: 'b37', title: "Make It Stick: The Science of Successful Learning", author: "Peter C. Brown, Henry L. Roediger III, and Mark A. McDaniel", category: "Education", year: 2014, copiesTotal: 4, copiesAvailable: 3, description: "Presents research-backed approaches to remembering and learning.", coverImage: '/book-covers/make-it-stick.png' },
  { id: 'b38', title: "Pedagogy of the Oppressed", author: "Paulo Freire", category: "Education", year: 1968, copiesTotal: 3, copiesAvailable: 2, description: "Examines critical education, dialogue, and social transformation.", coverImage: '/book-covers/pedagogy-of-the-oppressed.png' },
  { id: 'b39', title: "The First Days of School", author: "Harry K. Wong and Rosemary T. Wong", category: "Education", year: 1991, copiesTotal: 3, copiesAvailable: 3, description: "Provides practical strategies for classroom management and teaching.", coverImage: '/book-covers/first-days-of-school.png' },
  { id: 'b40', title: "Experience and Education", author: "John Dewey", category: "Education", year: 1938, copiesTotal: 3, copiesAvailable: 2, description: "Discusses experience, progressive education, and meaningful learning.", coverImage: '/book-covers/experience-and-education.png' },
  { id: 'b41', title: "Meditations", author: "Marcus Aurelius", category: "Philosophy & Ethics", year: 180, copiesTotal: 4, copiesAvailable: 3, description: "Reflections on self-discipline, virtue, and Stoic philosophy.", coverImage: '/book-covers/meditations.png' },
  { id: 'b42', title: "The Republic", author: "Plato", category: "Philosophy & Ethics", year: -380, copiesTotal: 3, copiesAvailable: 3, description: "Explores justice, knowledge, leadership, and the ideal society.", coverImage: '/book-covers/republic.png' },
  { id: 'b43', title: "Nicomachean Ethics", author: "Aristotle", category: "Philosophy & Ethics", year: -340, copiesTotal: 3, copiesAvailable: 2, description: "Examines virtue, moral character, and the good life.", coverImage: '/book-covers/nicomachean-ethics.png' },
  { id: 'b44', title: "Justice: What's the Right Thing to Do?", author: "Michael J. Sandel", category: "Philosophy & Ethics", year: 2009, copiesTotal: 4, copiesAvailable: 4, description: "Introduces ethical dilemmas and theories of justice.", coverImage: '/book-covers/justice-whats-the-right-thing-to-do.png' },
  { id: 'b45', title: "Man's Search for Meaning", author: "Viktor E. Frankl", category: "Philosophy & Ethics", year: 1946, copiesTotal: 4, copiesAvailable: 3, description: "Reflects on meaning, purpose, and human resilience.", coverImage: '/book-covers/mans-search-for-meaning.png' },
  { id: 'b46', title: "The Odyssey", author: "Homer", category: "Literature & Poetry", year: -700, copiesTotal: 3, copiesAvailable: 2, description: "An ancient epic poem about Odysseus's journey home.", coverImage: '/book-covers/odyssey.png' },
  { id: 'b47', title: "Leaves of Grass", author: "Walt Whitman", category: "Literature & Poetry", year: 1855, copiesTotal: 3, copiesAvailable: 3, description: "A poetry collection exploring nature, identity, and humanity.", coverImage: '/book-covers/leaves-of-grass.png' },
  { id: 'b48', title: "Romeo and Juliet", author: "William Shakespeare", category: "Literature & Poetry", year: 1597, copiesTotal: 4, copiesAvailable: 3, description: "A tragic play about two young people from rival families.", coverImage: '/book-covers/romeo-and-juliet.png' },
  { id: 'b49', title: "The Divine Comedy", author: "Dante Alighieri", category: "Literature & Poetry", year: 1320, copiesTotal: 3, copiesAvailable: 2, description: "An epic poem following a journey through the afterlife.", coverImage: '/book-covers/divine-comedy.png' },
  { id: 'b50', title: "Noli Me Tangere", author: "José Rizal", category: "Literature & Poetry", year: 1887, copiesTotal: 4, copiesAvailable: 4, description: "A Philippine literary classic addressing social injustice under Spanish colonial rule.", coverImage: '/book-covers/noli-me-tangere.png' },
];

const loans = [
  { id: 'l1', bookId: 'b2', member: 'Priya Nair', borrowedAt: ago(30), dueAt: ago(6), status: 'overdue' },
  { id: 'l2', bookId: 'b6', member: 'Tomás Ortega', borrowedAt: ago(12), dueAt: ahead(2), status: 'active' },
  { id: 'l3', bookId: 'b4', member: 'Mei Chen', borrowedAt: ago(8), dueAt: ahead(6), status: 'active' },
  { id: 'l4', bookId: 'b8', member: 'Alex Rivera', borrowedAt: ago(5), dueAt: ahead(9), status: 'active' },
  { id: 'l5', bookId: 'b1', member: 'Sam Okafor', borrowedAt: ago(40), dueAt: ago(26), returnedAt: ago(27), status: 'returned' },
  { id: 'l6', bookId: 'b13', member: 'Lena Fischer', borrowedAt: ago(20), dueAt: ahead(1), status: 'active' },
].map((l) => ({ ...l, bookTitle: books.find((b) => b.id === l.bookId).title }));

const assets = [
  ['Annual report 2025', 'document', 'pdf', 4200000, ['report', 'finance'], 'Governance'],
  ['Reading room floor plan', 'image', 'png', 2800000, ['architecture', 'plans'], 'Facilities'],
  ['Author talk: Kimmerer', 'video', 'mp4', 412000000, ['event', 'talk'], 'Events'],
  ['Oral history: Mrs Alvarez', 'audio', 'mp3', 38000000, ['archive', 'oral-history'], 'Archive'],
  ['Spring reading list', 'document', 'docx', 380000, ['marketing'], 'Marketing'],
  ['Atrium photo, north light', 'image', 'jpg', 5100000, ['photo', 'building'], 'Facilities'],
  ['Catalogue export, Q3', 'document', 'xlsx', 910000, ['catalogue'], 'Operations'],
  ['Summer reading poster', 'image', 'png', 7600000, ['poster', 'marketing'], 'Marketing'],
  ['Digitisation guide', 'document', 'pdf', 1900000, ['howto', 'archive'], 'Archive'],
  ['Open day highlights', 'video', 'mov', 220000000, ['event'], 'Events'],
].map(([title, type, format, sizeBytes, tags, collection], i) => ({
  id: `a${i + 1}`, title, type, format, sizeBytes, tags, collection,
  owner: ['Alex Rivera', 'Priya Nair', 'Mei Chen'][i % 3], createdAt: ago(i * 3 + 1),
  url: '#', thumbnailUrl: null,
}));

const send = (res, code, data) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(data === undefined ? '' : JSON.stringify(data));
};

const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
});

// Minimal multipart reader: pulls plain text fields only (the file bytes are ignored in this mock)
const field = (raw, name) => raw.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1] ?? '';

const typeFromMime = (mime, ext) =>
  mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : (ext ? 'document' : 'document');

const matches = (text, q) => text.toLowerCase().includes(q.toLowerCase());
const page = (list, limit) => ({ items: limit ? list.slice(0, Number(limit)) : list, total: list.length });

// ---- Accounts and sessions (in memory: restarting the mock clears new accounts and sign-ins) ----
const hashPassword = (password, salt = randomBytes(16).toString('hex')) =>
  ({ salt, hash: scryptSync(password, salt, 32).toString('hex') });
const checkPassword = (password, user) =>
  timingSafeEqual(Buffer.from(hashPassword(password, user.salt).hash, 'hex'), Buffer.from(user.hash, 'hex'));

const users = [{ id: 'u1', name: 'Alex Rivera', email: 'demo@gyarados.test', ...hashPassword('demo1234') }];
const sessions = new Map(); // token -> user
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });
const startSession = (u) => { const token = randomBytes(32).toString('hex'); sessions.set(token, u); return token; };
const readJson = async (req) => { try { return JSON.parse((await readBody(req)).toString() || '{}'); } catch { return {}; } };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname.replace(/^\/api/, '');
  const q = url.searchParams;
  if (req.method === 'OPTIONS') return send(res, 204);

  // ---- Public routes ----
  if (p === '/health') return send(res, 200, { status: 'ok', demoAccount: 'demo@gyarados.test' });
  if (p === '/auth/login' && req.method === 'POST') {
    const { email = '', password = '' } = await readJson(req);
    const user = users.find((u) => u.email === String(email).trim().toLowerCase());
    if (!user) return send(res, 401, { message: 'No account found for that email. The mock demo account is demo@gyarados.test.' });
    if (!checkPassword(String(password), user)) return send(res, 401, { message: 'That password is incorrect.' });
    return send(res, 200, { token: startSession(user), user: publicUser(user) });
  }
  if (p === '/auth/register' && req.method === 'POST') {
    const { name = '', email = '', password = '' } = await readJson(req);
    const cleanEmail = String(email).trim().toLowerCase();
    if (!String(name).trim()) return send(res, 400, { message: 'Enter your full name.' });
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return send(res, 400, { message: 'Enter a valid email address.' });
    if (String(password).length < 8) return send(res, 400, { message: 'Choose a password with at least 8 characters.' });
    if (users.some((u) => u.email === cleanEmail)) return send(res, 409, { message: 'An account with this email already exists. Try signing in.' });
    const user = { id: `u${randomUUID().slice(0, 6)}`, name: String(name).trim(), email: cleanEmail, ...hashPassword(String(password)) };
    users.push(user);
    return send(res, 201, { token: startSession(user), user: publicUser(user) });
  }

  // ---- Everything below needs a signed-in user ----
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const me = sessions.get(token);
  if (!me) return send(res, 401, { message: 'Please sign in to continue.' });
  if (p === '/auth/me') return send(res, 200, publicUser(me));
  if (p === '/auth/logout' && req.method === 'POST') { sessions.delete(token); return send(res, 204); }

  // GET /stats
  if (p === '/stats') {
    return send(res, 200, {
      totalBooks: books.length,
      availableCopies: books.reduce((n, b) => n + b.copiesAvailable, 0),
      activeLoans: loans.filter((l) => l.status !== 'returned').length,
      overdueLoans: loans.filter((l) => l.status === 'overdue').length,
      totalAssets: assets.length,
      storageUsedMb: Math.round(assets.reduce((n, a) => n + a.sizeBytes, 0) / 1048576),
      storageQuotaMb: 1024,
    });
  }

  if (p === '/categories') return send(res, 200, [...new Set(books.map((b) => b.category))].sort());

  // GET /books?q=&category=&status=
  if (p === '/books' && req.method === 'GET') {
    let list = books.filter((b) =>
      (!q.get('q') || matches(`${b.title} ${b.author}`, q.get('q'))) &&
      (!q.get('category') || b.category === q.get('category')) &&
      (!q.get('status') || (q.get('status') === 'available' ? b.copiesAvailable > 0 : b.copiesAvailable === 0)));
    return send(res, 200, page(list, q.get('limit')));
  }

  // POST /books/:id/borrow
  let m = p.match(/^\/books\/([^/]+)\/borrow$/);
  if (m && req.method === 'POST') {
    const book = books.find((b) => b.id === m[1]);
    if (!book) return send(res, 404, { message: 'Book not found.' });
    if (book.copiesAvailable < 1) return send(res, 409, { message: 'No copies are available.' });
    const body = JSON.parse((await readBody(req)).toString() || '{}');
    book.copiesAvailable -= 1;
    const loan = { id: `l${randomUUID().slice(0, 6)}`, bookId: book.id, bookTitle: book.title, member: me.name, borrowedAt: new Date().toISOString(), dueAt: ahead(14), status: 'active' };
    loans.unshift(loan);
    return send(res, 201, loan);
  }

  // GET /loans?status=&limit=
  if (p === '/loans' && req.method === 'GET') {
    let list = loans.filter((l) => !q.get('status') || l.status === q.get('status'));
    list = [...list].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    return send(res, 200, page(list, q.get('limit')));
  }

  // POST /loans/:id/return
  m = p.match(/^\/loans\/([^/]+)\/return$/);
  if (m && req.method === 'POST') {
    const loan = loans.find((l) => l.id === m[1]);
    if (!loan) return send(res, 404, { message: 'Loan not found.' });
    if (loan.status !== 'returned') {
      loan.status = 'returned';
      loan.returnedAt = new Date().toISOString();
      const book = books.find((b) => b.id === loan.bookId);
      if (book) book.copiesAvailable = Math.min(book.copiesTotal, book.copiesAvailable + 1);
    }
    return send(res, 200, loan);
  }

  // GET /assets?q=&type=&sort=recent&limit=
  if (p === '/assets' && req.method === 'GET') {
    let list = assets.filter((a) =>
      (!q.get('q') || matches(`${a.title} ${a.tags.join(' ')} ${a.collection}`, q.get('q'))) &&
      (!q.get('type') || a.type === q.get('type')));
    list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return send(res, 200, page(list, q.get('limit')));
  }

  // POST /assets (multipart/form-data)
  if (p === '/assets' && req.method === 'POST') {
    const raw = (await readBody(req)).toString('latin1');
    const filename = field(raw, 'filename') || 'untitled';
    const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : 'bin';
    const asset = {
      id: `a${randomUUID().slice(0, 6)}`,
      title: field(raw, 'title') || filename,
      type: typeFromMime(field(raw, 'mime'), ext),
      format: ext,
      sizeBytes: Number(field(raw, 'size')) || 0,
      tags: field(raw, 'tags').split(',').map((t) => t.trim()).filter(Boolean),
      collection: '', owner: me.name, createdAt: new Date().toISOString(), url: '#', thumbnailUrl: null,
    };
    assets.unshift(asset);
    return send(res, 201, asset);
  }

  // DELETE /assets/:id
  m = p.match(/^\/assets\/([^/]+)$/);
  if (m && req.method === 'DELETE') {
    const i = assets.findIndex((a) => a.id === m[1]);
    if (i === -1) return send(res, 404, { message: 'File not found.' });
    assets.splice(i, 1);
    return send(res, 204);
  }

  send(res, 404, { message: 'Not found.' });
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. An older copy of the mock is probably still running.`);
    console.error('Close every terminal running "npm run mock" (trash icon in VS Code), then start it again.\n');
  } else {
    console.error(err);
  }
  process.exit(1);
});
server.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}/api`);
  console.log('Demo account:  demo@gyarados.test  /  demo1234');
});
