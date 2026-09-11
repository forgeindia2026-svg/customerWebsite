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
      const cleanId = String(orderId || '').replace(/^#/, '').trim().toLowerCase();
      orderToAssign = nextState.orders.find(o => {
        const oId = String(o.id || '').replace(/^#/, '').trim().toLowerCase();
        const oNum = String(o.orderNumber || '').replace(/^#/, '').trim().toLowerCase();
        return oId === cleanId || oNum === cleanId;
      });
    } else if (action.type === 'dashboard/editOrder') {
      const updatedOrder = action.payload;
      const cleanId = String(updatedOrder.id || '').replace(/^#/, '').trim().toLowerCase();
      const prevOrder = prevState.orders.find(o => {
        const oId = String(o.id || '').replace(/^#/, '').trim().toLowerCase();
        const oNum = String(o.orderNumber || '').replace(/^#/, '').trim().toLowerCase();
        return oId === cleanId || oNum === cleanId;
      });
      const isTechChanged = updatedOrder.assignedTechnician && 
        updatedOrder.assignedTechnician !== 'Unassigned' && 
        (!prevOrder || prevOrder.assignedTechnician !== updatedOrder.assignedTechnician);
      if (isTechChanged) {
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

      // Sync job assignment to backend
      const rawOrderId = orderToAssign.id || orderToAssign.orderNumber;
      const cleanOrderId = String(rawOrderId || '').replace(/^#/, '').trim();
      fetch(`${getApiUrl()}/api/jobs/${encodeURIComponent(cleanOrderId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'role': 'admin'
        },
        body: JSON.stringify({
          assignedTechnicians: [{ id: techId, name: orderToAssign.assignedTechnician }],
          status: 'ASSIGNED'
        })
      }).catch(() => {});
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
