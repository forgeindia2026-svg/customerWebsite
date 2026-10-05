const mongoose = require('mongoose');

const uri = "mongodb+srv://cctvappdatabase:2JhhMOTXf7iIVQ53@cluster0.nqenjqu.mongodb.net/cctv-ecommerce?retryWrites=true&w=majority&appName=Cluster0";

async function bulkApprove() {
  try {
    await mongoose.connect(uri, {
      
      
    });
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;

    // Define cutoff date: End of Sept 29, 2026 IST
    const cutoffDate = new Date('2026-09-29T23:59:59.999Z');

    const financials = {
      salesValue: 0,
      purchaseValue: 0,
      totalValue: 0,
      companyProfit: 0,
      technicianEarning: 0,
      approvedAt: new Date(),
      approvedBy: 'System Auto-Approval'
    };

    console.log("Updating Jobs...");
    const jobResult = await db.collection('jobs').updateMany(
      { 
        createdAt: { $lte: cutoffDate },
        status: { $nin: ['APPROVED', 'CANCELLED'] }
      },
      { 
        $set: { 
          status: 'APPROVED',
          financials: financials,
          updatedAt: new Date()
        } 
      }
    );
    console.log(`Jobs updated: ${jobResult.modifiedCount}`);

    console.log("Updating Orders...");
    const orderResult = await db.collection('orders').updateMany(
      { 
        createdAt: { $lte: cutoffDate },
        orderStatus: { $nin: ['DELIVERED', 'CANCELLED'] }
      },
      { 
        $set: { 
          orderStatus: 'DELIVERED',
          status: 'Approved',
          financials: financials,
          updatedAt: new Date()
        } 
      }
    );
    console.log(`Orders updated: ${orderResult.modifiedCount}`);

    console.log("Updating Dashboard Orders & Projects...");
    const dashboards = await db.collection('dashboards').find({}).toArray();
    for (const dashboard of dashboards) {
      let changed = false;

      if (Array.isArray(dashboard.orders)) {
        dashboard.orders.forEach(order => {
          const dStr = order.createdAt || order.date || order.submissionDate;
          const oDate = new Date(dStr);
          if (!isNaN(oDate.getTime()) && oDate <= cutoffDate) {
            if (order.status !== 'Approved' && order.status !== 'Completed' && order.status !== 'Cancelled') {
              order.status = 'Approved';
              changed = true;
            }
          }
        });
      }

      if (Array.isArray(dashboard.projects)) {
        dashboard.projects.forEach(project => {
          const dStr = project.createdAt || project.submissionDate || project.date;
          const pDate = new Date(dStr);
          if (!isNaN(pDate.getTime()) && pDate <= cutoffDate) {
            if (project.status !== 'Approved' && project.status !== 'Completed' && project.status !== 'Cancelled') {
              project.status = 'Approved';
              changed = true;
            }
          }
        });
      }

      if (changed) {
        await db.collection('dashboards').updateOne(
          { _id: dashboard._id },
          { $set: { orders: dashboard.orders, projects: dashboard.projects } }
        );
        console.log(`Dashboard ${dashboard._id} orders & projects updated.`);
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

bulkApprove();
