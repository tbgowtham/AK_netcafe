import db from '../config/db.js';

// Helper to run query with promise (all)
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Helper to run query with promise (get)
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to run write command (run)
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// --- Requests Controller Actions ---

export const getAllRequests = async (req, res) => {
  try {
    const sql = `SELECT * FROM requests ORDER BY created_at DESC`;
    const requests = await dbAll(sql);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRequest = async (req, res) => {
  const { service_type, customer_name, contact_number, document_number } = req.body;
  
  if (!service_type || !customer_name || !contact_number || !document_number) {
    return res.status(400).json({ error: 'All fields (service_type, customer_name, contact_number, document_number) are required.' });
  }
  
  try {
    const createdAt = new Date().toISOString();
    const result = await dbRun(
      `INSERT INTO requests (service_type, customer_name, contact_number, document_number, status, created_at) 
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [service_type, customer_name, contact_number, document_number, createdAt]
    );
    
    const newRequest = await dbGet('SELECT * FROM requests WHERE id = ?', [result.lastID]);
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }
  
  try {
    const request = await dbGet('SELECT * FROM requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ error: 'Service request not found.' });
    }
    
    await dbRun('UPDATE requests SET status = ? WHERE id = ?', [status, id]);
    const updatedRequest = await dbGet('SELECT * FROM requests WHERE id = ?', [id]);
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await dbGet('SELECT * FROM requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    await dbRun('DELETE FROM requests WHERE id = ?', [id]);
    res.json({ message: 'Request removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = await dbGet('SELECT COUNT(*) as count FROM requests');
    const pending = await dbGet('SELECT COUNT(*) as count FROM requests WHERE status = "pending"');
    const inProgress = await dbGet('SELECT COUNT(*) as count FROM requests WHERE status = "in_progress"');
    const completed = await dbGet('SELECT COUNT(*) as count FROM requests WHERE status = "completed"');
    
    res.json({
      total: total.count,
      pending: pending.count,
      in_progress: inProgress.count,
      completed: completed.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Chats Controller Actions ---

export const getAllChats = async (req, res) => {
  try {
    const sql = `SELECT * FROM chats ORDER BY timestamp ASC`;
    const chats = await dbAll(sql);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChatMessage = async (req, res) => {
  const { sender_name, message, is_admin } = req.body;
  
  if (!sender_name || !message) {
    return res.status(400).json({ error: 'sender_name and message are required.' });
  }
  
  try {
    const timestamp = new Date().toISOString();
    const isAdminVal = is_admin ? 1 : 0;
    
    const result = await dbRun(
      `INSERT INTO chats (sender_name, message, is_admin, timestamp) VALUES (?, ?, ?, ?)`,
      [sender_name, message, isAdminVal, timestamp]
    );
    
    const newMessage = await dbGet('SELECT * FROM chats WHERE id = ?', [result.lastID]);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAllChats = async (req, res) => {
  try {
    await dbRun('DELETE FROM chats');
    res.json({ message: 'All chats cleared successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Customers Controller Actions ---

export const registerCustomer = async (req, res) => {
  const { customer_name, contact_number } = req.body;

  if (!customer_name || !contact_number) {
    return res.status(400).json({ error: 'customer_name and contact_number are required.' });
  }

  try {
    const registeredAt = new Date().toISOString();
    const result = await dbRun(
      `INSERT INTO customers (customer_name, contact_number, registered_at) VALUES (?, ?, ?)`,
      [customer_name, contact_number, registeredAt]
    );

    const newCustomer = await dbGet('SELECT * FROM customers WHERE id = ?', [result.lastID]);
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await dbAll('SELECT * FROM customers ORDER BY registered_at DESC');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
