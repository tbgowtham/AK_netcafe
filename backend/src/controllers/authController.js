// Admin credentials — stored server-side
const ADMIN_USERNAME = 'ajikeek';
const ADMIN_PASSWORD = 'ajithakcafe';

export const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true, message: 'Login successful', user: { username } });
  }

  return res.status(401).json({ error: 'Invalid username or password.' });
};
