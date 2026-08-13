import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './dashboardSlice';
import { getApiUrl } from '../utils/config';

const dashboardSyncMiddleware = store => next => action => {
  const prevState = store.getState().dashboard;
  const result = next(action);
  const nextState = store.getState().dashboard;

  const ignoreActions = [
    'dashboard/setDashboardData',
    'dashboard/setDarkMode',
    'dashboard/toggleDarkMode',
    'dashboard/setLoading',
    'dashboard/fetchDashboardData/pending',
    'dashboard/fetchDashboardData/fulfilled',
    'dashboard/fetchDashboardData/rejected'
  ];

  if (action.type.startsWith('dashboard/') && !ignoreActions.includes(action.type)) {
    fetch(`${getApiUrl()}/api/dashboard`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nextState)
    }).catch(err => console.error('Failed to sync dashboard to backend:', err));

    // Check if a technician was assigned to an order
    let orderToAssign = null;

    if (action.type === 'dashboard/assignTechnicianToOrder') {
      const { orderId, technicianName } = action.payload;
      orderToAssign = nextState.orders.find(o => o.id === orderId);
    } else if (action.type === 'dashboard/editOrder') {
      const updatedOrder = action.payload;
      const prevOrder = prevState.orders.find(o => o.id === updatedOrder.id);
      const wasUnassigned = !prevOrder || prevOrder.assignedTechnician === 'Unassigned' || !prevOrder.assignedTechnician;
      const isNowAssigned = updatedOrder.assignedTechnician && updatedOrder.assignedTechnician !== 'Unassigned';
      if (wasUnassigned && isNowAssigned) {
        orderToAssign = updatedOrder;
      }
    }

    if (orderToAssign && orderToAssign.assignedTechnician !== 'Unassigned') {
      const technician = nextState.technicians.find(t => t.name === orderToAssign.assignedTechnician);
      const techId = technician ? (technician.id || technician._id) : 'tech-01';

      // Auto-generate scope of work based on order type
      let scopeOfWork = ["Equipment routine diagnostic check", "Submit daily shift report logs"];
      const typeLower = (orderToAssign.type || '').toLowerCase();
      if (typeLower.includes('installation') || typeLower.includes('camera') || typeLower.includes('cctv')) {
        scopeOfWork = [
          "Site mapping & placement assessment",
          "Cable routing & switch deployment",
          "Camera installation & alignment",
          "NVR configure & app connection test"
        ];
      } else if (typeLower.includes('amc') || typeLower.includes('audit')) {
        scopeOfWork = [
          "Check camera connectivity & power",
          "Clean dome enclosures & lens covers",
          "Validate backup recording cycles",
          "Submit system health audit report"
        ];
      }

      // POST new job to backend
      fetch(`${import.meta.env.VITE_API_URL || 'https://cctvwebsite.onrender.com'}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: orderToAssign.type || 'Field Service Request',
          category: orderToAssign.type || 'General Service',
          status: 'PENDING',
          priority: 'MEDIUM',
          scheduledDate: new Date().toISOString().split('T')[0],
          assignedTechnician: {
            id: techId,
            name: orderToAssign.assignedTechnician
          },
          customer: {
            name: orderToAssign.customer,
            phone: orderToAssign.phone || '+91 99999 99999',
            email: orderToAssign.email || 'customer@sktechnology.in',
            address: orderToAssign.location || 'Chennai Area',
            city: 'Chennai',
            postalCode: '600032'
          },
          scopeOfWork
        })
      })
      .then(res => res.json())
      .then(data => console.log('Successfully created live technician job:', data))
      .catch(err => console.error('Failed to create technician job:', err));
    }
  }
  return result;
};

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(dashboardSyncMiddleware),
});
