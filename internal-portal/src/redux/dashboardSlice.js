import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import initialDb from '../mock-data/db.json';
import { getApiUrl } from '../utils/config';

// --- NEW ASYNC THUNKS FOR INDIVIDUAL APIs ---
export const createOrderAPI = createAsyncThunk('dashboard/createOrder', async (orderData, { dispatch }) => {
  const res = await fetch(`${getApiUrl()}/api/orders`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(orderData) });
  dispatch(fetchDashboardData());
  return res.json();
});
export const updateOrderAPI = createAsyncThunk('dashboard/updateOrder', async ({ id, ...data }, { dispatch }) => {
  const res = await fetch(`${getApiUrl()}/api/orders/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
  dispatch(fetchDashboardData());
  return res.json();
});
export const deleteOrderAPI = createAsyncThunk('dashboard/deleteOrder', async (id, { dispatch }) => {
  const res = await fetch(`${getApiUrl()}/api/orders/${id}`, { method: 'DELETE' });
  dispatch(fetchDashboardData());
  return res.json();
});

export const createTechnicianAPI = createAsyncThunk('dashboard/createTechnician', async (techData, { dispatch }) => {
  const res = await fetch(`${getApiUrl()}/api/technicians`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(techData) });
  dispatch(fetchDashboardData());
  return res.json();
});
export const updateTechnicianAPI = createAsyncThunk('dashboard/updateTechnician', async ({ id, ...data }, { dispatch }) => {
  const res = await fetch(`${getApiUrl()}/api/technicians/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
  dispatch(fetchDashboardData());
  return res.json();
});
export const deleteTechnicianAPI = createAsyncThunk('dashboard/deleteTechnician', async (id, { dispatch }) => {
  const res = await fetch(`${getApiUrl()}/api/technicians/${id}`, { method: 'DELETE' });
  dispatch(fetchDashboardData());
  return res.json();
});

export const createPaymentAPI = createAsyncThunk('dashboard/createPayment', async (paymentData, { dispatch }) => {
  const res = await fetch(`${getApiUrl()}/api/payments`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(paymentData) });
  dispatch(fetchDashboardData());
  return res.json();
});
// ---------------------------------------------
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (_, { dispatch }) => {
    dispatch(dashboardSlice.actions.setLoading(true));
    try {
      const res = await fetch(`${getApiUrl()}/api/dashboard`);
      const data = await res.json();
      if (data.success && data.data) {
        dispatch(setDashboardData(data.data));
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      dispatch(dashboardSlice.actions.setLoading(false));
    }
  }
);

export const adminApproveJob = createAsyncThunk(
  'dashboard/adminApproveJob',
  async (jobId, { dispatch }) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs/${jobId}/admin-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh dashboard data to see updated statuses and queues
        dispatch(fetchDashboardData());
      }
      return data;
    } catch (err) {
      console.warn('Admin approve job error:', err);
      return { success: false, message: err.message };
    }
  }
);

const getInitialCustomers = (orders) => {
  const customersMap = {};
  orders.forEach((order, idx) => {
    const key = order.customer.toLowerCase().trim();
    if (!customersMap[key]) {
      customersMap[key] = {
        id: `CUST-0${idx + 1}`,
        name: order.customer,
        email: order.email || 'support@domain.com',
        phone: order.phone || '+91 99999 99999',
        location: order.location || 'Chennai Area',
        totalSpent: 0,
        installationsCount: 0,
      };
    }
    customersMap[key].totalSpent += order.amount || 0;
    customersMap[key].installationsCount += 1;
  });
  return Object.values(customersMap);
};

const initialQueries = [];
const initialAnnouncements = [];
const initialBanners = [];

const initialBrands = [
  {
    id: 'BRD-01',
    name: 'Hikvision',
    logoUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=300&auto=format&fit=crop',
    country: 'China',
    status: 'Active',
    supportContact: 'support@hikvision.com',
    description: 'Leading provider of security products and solutions, specializing in video surveillance technology.'
  },
  {
    id: 'BRD-02',
    name: 'Dahua',
    logoUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=300&auto=format&fit=crop',
    country: 'China',
    status: 'Active',
    supportContact: 'support@dahuasecurity.com',
    description: 'World-leading video-centric smart IoT solution and service provider.'
  },
  {
    id: 'BRD-03',
    name: 'CP Plus',
    logoUrl: 'https://images.unsplash.com/photo-1521791136368-1a851900d157?q=80&w=300&auto=format&fit=crop',
    country: 'India',
    status: 'Active',
    supportContact: 'support@cpplusworld.com',
    description: 'Comprehensive security solutions, offering NVRs, DVRs, IP cameras, and CCTV kits.'
  }
];

const defaultDailyLogs = {
  "PRJ-301": [
    {
      date: "May 22, 2024",
      status: "In Progress",
      report: "Completed wiring layout for 4 IP cameras on the ground floor. Checked connectivity with NVR switch. All connections are stable.",
      photos: [
        "https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=600&auto=format&fit=crop"
      ]
    },
    {
      date: "May 23, 2024",
      status: "Completed",
      report: "Installed and configured all dome cameras. Verified night vision infrared feeds. Configured remote viewing on admin smartphone app.",
      photos: [
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop"
      ]
    }
  ],
  "PRJ-302": [
    {
      date: "May 24, 2024",
      status: "In Progress",
      report: "Mounted outdoor bullet cameras on entrance and driveway. Cable routing completed through the ceiling ducts. Connected power line adapters.",
      photos: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop"
      ]
    }
  ],
  "PRJ-303": [
    {
      date: "May 21, 2024",
      status: "In Progress",
      report: "Conducted preliminary site inspection. Marked cable pathways for 16 IP cameras. Set up central server rack.",
      photos: [
        "https://images.unsplash.com/photo-1544006659-f0b21f02db1d?q=80&w=600&auto=format&fit=crop"
      ]
    },
    {
      date: "May 22, 2024",
      status: "Rework",
      report: "Encountered interference on Channel 5 and 6 coaxial cables. Need to reroute them away from high-voltage AC lines. Awaiting instruction.",
      photos: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop"
      ]
    }
  ]
};

const initialState = {
  isLoading: false,
  orders: [],
  customers: [],
  technicians: [],
  projects: [],
  serviceRequests: [],
  products: [],
  inventory: [],
  payments: [],
  notifications: [],
  settings: {},
  chartData: [],
  queries: [],
  announcements: [],
  qrCodes: [],
  banners: [],
  brands: [],
  darkMode: false,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading: (state, action) => { state.isLoading = action.payload; },
    setDashboardData: (state, action) => {
      const payload = action.payload || {};
      const rawOrders = Array.isArray(payload.orders) ? payload.orders : (state.orders || []);
      const normalizedOrders = rawOrders.map(o => ({
        ...o,
        id: o.id || o.orderNumber || o._id,
        customer: o.customer || o.customerName || 'Customer Client',
        amount: parseFloat(o.amount || o.totalAmount) || 0,
        status: o.status || (o.orderStatus === 'DELIVERED' ? 'Completed' : o.orderStatus === 'PROCESSING' ? 'In Progress' : o.orderStatus) || 'Pending',
        date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today')
      }));

      return {
        ...state,
        ...payload,
        orders: normalizedOrders,
        payments: Array.isArray(payload.payments) ? payload.payments : (state.payments || []),
        customers: Array.isArray(payload.customers) ? payload.customers : (state.customers || []),
        technicians: Array.isArray(payload.technicians) ? payload.technicians : (state.technicians || []),
        products: Array.isArray(payload.products) ? payload.products : (state.products || []),
        projects: Array.isArray(payload.projects) ? payload.projects : (state.projects || []),
        darkMode: state.darkMode
      };
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
    },
    // Orders actions
    addOrder: (state, action) => {
      const newOrder = {
        id: `ORD-${Date.now().toString().slice(-4)}`,
        status: 'Pending',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ...action.payload,
      };
      state.orders.unshift(newOrder);
      // Increment orders in current month (May)
      const mayData = state.chartData.find(d => d.month === 'May');
      if (mayData) {
        mayData.orders += 1;
      }
      // Find or create customer
      const key = newOrder.customer.toLowerCase().trim();
      const existingCust = state.customers.find(c => c.name.toLowerCase().trim() === key);
      if (existingCust) {
        existingCust.totalSpent += newOrder.amount || 0;
        existingCust.installationsCount += 1;
      } else {
        state.customers.unshift({
          id: `CUST-${Date.now().toString().slice(-4)}`,
          name: newOrder.customer,
          email: newOrder.email || 'support@domain.com',
          phone: newOrder.phone || '+91 99999 99999',
          location: newOrder.location || 'Chennai Area',
          totalSpent: newOrder.amount || 0,
          installationsCount: 1,
        });
      }
      // Add notification
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: 'New Offline Order Created',
        message: `Order ${newOrder.id} has been created for ${newOrder.customer}.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'Order',
        read: false
      });
    },
    approveOrder: (state, action) => {
      const payload = action.payload;
      const orderId = typeof payload === 'string' ? payload : payload.id;
      const order = state.orders.find(o => o.id === orderId);
      
      if (order) {
        order.status = 'Approved';
        
        if (typeof payload === 'object') {
          order.orderCategory = payload.orderCategory;
          order.requiredTechniciansCount = payload.requiredTechniciansCount;
          order.estimatedDays = payload.estimatedDays;
          order.startDate = payload.startDate;
          order.targetCompletionDate = payload.targetCompletionDate;
        }
        
        // Broadcast notification to all technicians
        state.notifications.unshift({
          id: `NTF-${Date.now()}`,
          title: `Broadcast: Order ${order.id} Approved`,
          message: `Order for ${order.customer} (${order.type}) is approved. Notification broadcasted to all technicians.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
          category: 'System',
          read: false
        });

        // Simulate 2 technicians accepting/applying for this order
        const candidates = state.technicians.slice(0, 2).map(t => t.name);
        order.acceptedBy = candidates;

        // Also update the associated project status to Approved to prevent sync reverting
        const associatedProject = state.projects.find(p => p.id === order.id || p.customer?.toLowerCase() === order.customer?.toLowerCase());
        if (associatedProject) {
          associatedProject.status = 'Approved';
        }
      }
    },
    assignTechnicianToOrder: (state, action) => {
      const { orderId, technicianName } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.assignedTechnician = technicianName;
        order.status = 'In Progress';

        // Also update the associated project status to Approved and assign technician to prevent sync reverting
        const associatedProject = state.projects.find(p => p.id === order.id || p.customer?.toLowerCase() === order.customer?.toLowerCase());
        if (associatedProject) {
          associatedProject.status = 'Approved';
          associatedProject.technician = technicianName;
          associatedProject.assignedTech = technicianName;
        }

        // Check if there is an associated project or create a new one
        const projectExists = state.projects.some(p => p.id === `PRJ-${orderId.slice(-4)}` || p.customer?.toLowerCase() === order.customer?.toLowerCase());
        if (!projectExists) {
          state.projects.unshift({
            id: `PRJ-${orderId.slice(-4)}`,
            name: `${order.customer} Project`,
            customer: order.customer,
            type: order.type,
            status: 'In Progress',
            progress: 10,
            technician: technicianName,
            assignedTech: technicianName,
            submissionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dailyLogs: [
              {
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                status: 'In Progress',
                report: 'Project initiated. Installation details verified. Rerouting team dispatched to site.',
                photos: [
                  'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=600&auto=format&fit=crop'
                ]
              }
            ]
          });
        }

        // Set technician status to busy
        const tech = state.technicians.find(t => t.name === technicianName);
        if (tech) {
          tech.status = 'Busy';
          tech.currentProject = `${order.customer} Project`;
        }

        // Add notification
        state.notifications.unshift({
          id: `NTF-${Date.now()}`,
          title: 'Technician Assigned',
          message: `${technicianName} accepted and was assigned to Order ${orderId}.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
          category: 'System',
          read: false
        });
      }
    },
    // Technicians actions
    addTechnician: (state, action) => {
      const newTech = {
        id: `TECH-0${state.technicians.length + 1}`,
        status: 'Available',
        currentProject: 'None',
        rating: 5.0,
        ...action.payload,
      };
      state.technicians.push(newTech);
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: 'New Technician Added',
        message: `Technician ${newTech.name} has been added to the system.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'System',
        read: false
      });
    },
    updateTechnicianStatus: (state, action) => {
      const { id, status } = action.payload;
      const tech = state.technicians.find(t => t.id === id);
      if (tech) {
        tech.status = status;
        if (status === 'Offline' || status === 'Leave') {
          tech.currentProject = 'None';
        }
      }
    },
    editTechnician: (state, action) => {
      const { id, name, phone, email, specialization, avatarUrl, password } = action.payload;
      const tech = state.technicians.find(t => t.id === id);
      if (tech) {
        tech.name = name;
        tech.phone = phone;
        tech.email = email;
        tech.specialization = specialization;
        if (avatarUrl !== undefined) {
          tech.avatarUrl = avatarUrl;
        }
        if (password !== undefined) {
          tech.password = password;
        }
      }
    },
    deleteTechnician: (state, action) => {
      state.technicians = state.technicians.filter(t => t.id !== action.payload);
      try { localStorage.setItem('sk_admin_dashboard_cache', JSON.stringify(state)); } catch(e){}
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: 'Technician Deleted',
        message: `A technician has been removed from the system.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'System',
        read: false
      });
    },
    toggleTechnicianActivation: (state, action) => {
      const { id, isActive } = action.payload;
      const tech = state.technicians.find(t => t.id === id);
      if (tech) {
        tech.isActive = isActive;
        if (!isActive) {
          tech.status = 'Offline'; // automatically set to offline when deactivated
          tech.currentProject = 'None';
        }
        try { localStorage.setItem('sk_admin_dashboard_cache', JSON.stringify(state)); } catch(e){}
      }
    },
    // Projects actions
    approveProject: (state, action) => {
      const project = state.projects.find(p => p.id === action.payload);
      if (project) {
        project.status = 'Approved';
        // Add to notifications
        state.notifications.unshift({
          id: `NTF-${Date.now()}`,
          title: 'Project Approved',
          message: `Project "${project.name}" has been approved by administrator.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
          category: 'Alert',
          read: false
        });
      }
    },
    reworkProject: (state, action) => {
      const project = state.projects.find(p => p.id === action.payload);
      if (project) {
        project.status = 'Rework';
        // Add to notifications
        state.notifications.unshift({
          id: `NTF-${Date.now()}`,
          title: 'Project Sent for Rework',
          message: `Project "${project.name}" has been returned to ${project.technician} for rework.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
          category: 'Alert',
          read: false
        });
      }
    },
    // Products actions
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    addProduct: (state, action) => {
      const newProd = {
        id: `PROD-00${state.products.length + 1}`,
        ...action.payload,
      };
      state.products.push(newProd);
      // Also add to inventory
      state.inventory.push({
        id: `INV-00${state.inventory.length + 1}`,
        productName: newProd.name,
        sku: newProd.name.slice(0, 3).toUpperCase() + '-' + newProd.category.slice(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-3),
        category: newProd.category,
        totalStock: Number(newProd.stock),
        reorderLevel: 5,
        status: Number(newProd.stock) > 5 ? 'In Stock' : 'Low Stock',
      });
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: 'New Product Added',
        message: `Product ${newProd.name} added to inventory.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'System',
        read: false
      });
    },
    deleteProduct: (state, action) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    // Notifications actions
    markNotificationAsRead: (state, action) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) {
        notif.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => {
        n.read = true;
      });
    },
    // Settings actions
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    // Service Requests
    updateServiceRequestStatus: (state, action) => {
      const { id, status } = action.payload;
      const request = state.serviceRequests.find(r => r.id === id);
      if (request) {
        request.status = status;
      }
    },
    addServiceRequest: (state, action) => {
      const newReq = {
        id: `REQ-${Date.now().toString().slice(-4)}`,
        status: 'Open',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ...action.payload,
      };
      state.serviceRequests.unshift(newReq);
    },
    // Customers actions
    addCustomer: (state, action) => {
      const newCust = {
        id: `CUST-${Date.now().toString().slice(-4)}`,
        totalSpent: 0,
        installationsCount: 0,
        ...action.payload,
      };
      state.customers.unshift(newCust);
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: 'New Customer Registered',
        message: `Customer ${newCust.name} has been added to the system.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'System',
        read: false
      });
    },
    // Queries actions
    addQuery: (state, action) => {
      const newQuery = {
        id: `QRY-${Date.now().toString().slice(-3)}`,
        status: 'Open',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        messages: [
          { sender: action.payload.raisedBy, text: action.payload.description, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
        ],
        ...action.payload,
      };
      state.queries.unshift(newQuery);
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: `New Support Query: ${newQuery.id}`,
        message: `Query raised by ${newQuery.raisedBy} regarding "${newQuery.subject}".`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'Request',
        read: false
      });
    },
    updateQueryStatus: (state, action) => {
      const { id, status } = action.payload;
      const qry = state.queries.find(q => q.id === id);
      if (qry) {
        qry.status = status;
      }
    },
    addQueryResponse: (state, action) => {
      const { id, sender, text } = action.payload;
      const qry = state.queries.find(q => q.id === id);
      if (qry) {
        qry.messages.push({
          sender,
          text,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
      }
    },
    // Announcements actions
    addAnnouncement: (state, action) => {
      const newAnn = {
        id: `ANN-${Date.now().toString().slice(-2)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ...action.payload,
      };
      state.announcements.unshift(newAnn);
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: 'New Technician Announcement',
        message: `Announcement: "${newAnn.title}" has been published.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'System',
        read: false
      });
    },
    // Banners actions
    addBanner: (state, action) => {
      const newBanner = {
        id: `BNR-${Date.now().toString().slice(-2)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ...action.payload,
      };
      state.banners.unshift(newBanner);
      state.notifications.unshift({
        id: `NTF-${Date.now()}`,
        title: 'New Web Banner Created',
        message: `Banner: "${newBanner.title}" has been published.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
        category: 'System',
        read: false
      });
    },
    deleteBanner: (state, action) => {
      state.banners = state.banners.filter(b => b.id !== action.payload);
    },
    toggleBannerStatus: (state, action) => {
      const banner = state.banners.find(b => b.id === action.payload);
      if (banner) {
        banner.status = banner.status === 'Active' ? 'Inactive' : 'Active';
      }
    },
    addBrand: (state, action) => {
      const newBrand = {
        id: `BRD-${Date.now().toString().slice(-2)}`,
        ...action.payload,
      };
      state.brands.unshift(newBrand);
    },
    deleteBrand: (state, action) => {
      state.brands = state.brands.filter(b => b.id !== action.payload);
    },
    toggleBrandStatus: (state, action) => {
      const brand = state.brands.find(b => b.id === action.payload);
      if (brand) {
        brand.status = brand.status === 'Active' ? 'Inactive' : 'Active';
      }
    },
    editBrand: (state, action) => {
      const { id, name, logoUrl, country, status, supportContact, description } = action.payload;
      const brand = state.brands.find(b => b.id === id);
      if (brand) {
        brand.name = name;
        brand.logoUrl = logoUrl;
        brand.country = country;
        brand.status = status;
        brand.supportContact = supportContact;
        brand.description = description;
      }
    },
    editOrder: (state, action) => {
      const { id, customer, type, assignedTechnician, amount, status } = action.payload;
      const order = state.orders.find(o => o.id === id);
      if (order) {
        order.customer = customer;
        order.type = type;
        order.assignedTechnician = assignedTechnician;
        order.amount = amount;
        order.status = status;
      }
      
      const project = state.projects?.find(p => p.id === id);
      if (project) {
        project.customer = customer;
        if (type) project.name = type;
        if (assignedTechnician !== undefined) {
          project.technician = assignedTechnician;
        }
      }
    },
    editCustomer: (state, action) => {
      const { id, name, email, phone, location } = action.payload;
      const cust = state.customers.find(c => c.id === id);
      if (cust) {
        cust.name = name;
        cust.email = email;
        cust.phone = phone;
        cust.location = location;
      }
    },
    editAnnouncement: (state, action) => {
      const { id, title, content, priority, target } = action.payload;
      const ann = state.announcements.find(a => a.id === id);
      if (ann) {
        ann.title = title;
        ann.content = content;
        ann.priority = priority;
        ann.target = target;
      }
    },
    editServiceRequest: (state, action) => {
      const { id, clientName, type, priority, technician, description, status } = action.payload;
      const req = state.serviceRequests.find(r => r.id === id);
      if (req) {
        req.clientName = clientName;
        req.type = type;
        req.priority = priority;
        req.technician = technician;
        req.description = description;
        req.status = status;
      }
    },
    editProduct: (state, action) => {
      const { 
        id, name, brand, category, subCategory, model, price, stock, description, imageUrl, imageUrls,
        discount, delivery, warranty, rating, offers, isNew, isBestSeller, offerPrice, isFlashDeal,
        features, offersList, relatedProducts
      } = action.payload;
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        prod.name = name;
        if (brand !== undefined) prod.brand = brand;
        if (subCategory !== undefined) prod.subCategory = subCategory;
        prod.category = category;
        prod.model = model;
        prod.price = price;
        prod.stock = stock;
        prod.description = description;
        prod.imageUrl = imageUrl;
        prod.imageUrls = imageUrls;
        prod.discount = discount;
        prod.delivery = delivery;
        prod.warranty = warranty;
        prod.rating = rating;
        prod.offers = offers;
        prod.isNew = isNew;
        prod.isBestSeller = isBestSeller;
        prod.offerPrice = offerPrice;
        prod.isFlashDeal = isFlashDeal;
        prod.features = features;
        prod.offersList = offersList;
        prod.relatedProducts = relatedProducts;

        // Also update inventory
        const inv = state.inventory.find(i => i.productName === name || i.sku.includes(id.slice(-3)));
        if (inv) {
          inv.productName = name;
          inv.category = category;
          inv.totalStock = Number(stock);
          inv.status = Number(stock) > 5 ? 'In Stock' : 'Low Stock';
        }
      }
    },
    editBanner: (state, action) => {
      const { id, title, linkUrl, position, status, imageUrl } = action.payload;
      const banner = state.banners.find(b => b.id === id);
      if (banner) {
        banner.title = title;
        banner.linkUrl = linkUrl;
        banner.position = position;
        banner.status = status;
        banner.imageUrl = imageUrl;
      }
    },
    addPayment: (state, action) => {
      const newPayment = {
        id: `PAY-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        ...action.payload,
      };
      if (!state.payments) state.payments = [];
      state.payments.unshift(newPayment);
    },
    updatePaymentStatus: (state, action) => {
      const { id, status } = action.payload;
      const payment = state.payments.find(p => p.id === id);
      if (payment) {
        payment.status = status;
        try {
          const cached = JSON.parse(localStorage.getItem('sk_admin_dashboard_cache') || '{}');
          if (cached) {
            cached.payments = state.payments;
            localStorage.setItem('sk_admin_dashboard_cache', JSON.stringify(cached));
          }
        } catch (e) {}
      }
    },
    addQRCode: (state, action) => {
      if (!state.qrCodes) state.qrCodes = [];
      state.qrCodes.unshift(action.payload);
      try {
        const cached = JSON.parse(localStorage.getItem('sk_admin_dashboard_cache') || '{}');
        if (cached) {
          cached.qrCodes = state.qrCodes;
          localStorage.setItem('sk_admin_dashboard_cache', JSON.stringify(cached));
        }
      } catch(e) {}
    },
    removeQRCode: (state, action) => {
      if (!state.qrCodes) state.qrCodes = [];
      state.qrCodes = state.qrCodes.filter(qr => qr.id !== action.payload);
      try {
        const cached = JSON.parse(localStorage.getItem('sk_admin_dashboard_cache') || '{}');
        if (cached) {
          cached.qrCodes = state.qrCodes;
          localStorage.setItem('sk_admin_dashboard_cache', JSON.stringify(cached));
        }
      } catch(e) {}
    }
  },
});

export const {
  setDashboardData,
  toggleDarkMode,
  setDarkMode,
  addOrder,
  approveOrder,
  addTechnician,
  updateTechnicianStatus,
  approveProject,
  reworkProject,
  setProducts,
  addProduct,
  deleteProduct,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateSettings,
  updateServiceRequestStatus,
  addServiceRequest,
  addCustomer,
  editTechnician,
  addQuery,
  updateQueryStatus,
  addQueryResponse,
  addAnnouncement,
  addBanner,
  deleteBanner,
  toggleBannerStatus,
  assignTechnicianToOrder,
  editOrder,
  editCustomer,
  editAnnouncement,
  editServiceRequest,
  editProduct,
  editBanner,
  addBrand,
  deleteBrand,
  toggleBrandStatus,
  editBrand,
  deleteTechnician,
  toggleTechnicianActivation,
  addPayment,
  updatePaymentStatus,
  addQRCode,
  removeQRCode
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
