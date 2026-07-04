// In-memory data store instead of a database
let requests = [];
let chats = [
  {
    id: 1,
    sender_name: 'Admin',
    message: 'Welcome to AK E-Services! How can we help you today?',
    is_admin: 1,
    timestamp: new Date().toISOString()
  }
];
let customers = [];

let nextRequestId = 1;
let nextChatId = 2;
let nextCustomerId = 1;

// --- Requests Controller Actions ---

export const getAllRequests = async (req, res) => {
  try {
    // Return requests ordered by created_at DESC
    const sorted = [...requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(sorted);
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
    const newRequest = {
      id: nextRequestId++,
      service_type,
      customer_name,
      contact_number,
      document_number,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    requests.push(newRequest);
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
    const request = requests.find(r => r.id === parseInt(id));
    if (!request) {
      return res.status(404).json({ error: 'Service request not found.' });
    }
    
    request.status = status;
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const index = requests.findIndex(r => r.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    requests.splice(index, 1);
    res.json({ message: 'Request removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const inProgress = requests.filter(r => r.status === 'in_progress').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    
    res.json({
      total,
      pending,
      in_progress: inProgress,
      completed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Chats Controller Actions ---

export const getAllChats = async (req, res) => {
  try {
    // Chats order ASC by timestamp
    const sorted = [...chats].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(sorted);
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
    const newMsg = {
      id: nextChatId++,
      sender_name,
      message,
      is_admin: is_admin ? 1 : 0,
      timestamp: new Date().toISOString()
    };
    chats.push(newMsg);
    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAllChats = async (req, res) => {
  try {
    chats = [];
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
    const newCustomer = {
      id: nextCustomerId++,
      customer_name,
      contact_number,
      registered_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const sorted = [...customers].sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

