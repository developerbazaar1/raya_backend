require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/shared/users.model');
const EmployeeInfo = require('./src/models/businessOwnerTeam/employeesInfo.model');
const { createAuthToken } = require('./src/helper/auth.helper');
const axios = require('axios');

async function runTest() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // 1. Find an active employee
    const employeeInfo = await EmployeeInfo.findOne({ isDeleted: false });
    if (!employeeInfo) {
      console.error('No active employee found in database.');
      process.exit(1);
    }

    const user = await User.findById(employeeInfo.userId);
    if (!user) {
      console.error('Corresponding employee User record not found.');
      process.exit(1);
    }

    console.log(`\nFound Employee: ${user.name} (ID: ${user._id})`);
    const originalTimezone = employeeInfo.timeZone || 'America/New_York';
    console.log(`Original Timezone: ${originalTimezone}`);

    // Generate JWT Auth Token
    const token = createAuthToken(user);
    console.log('Generated JWT Token successfully.');

    // Helper to fetch KPI history with query params
    const fetchKpiHistory = async (tz, periodType, startDate = '', endDate = '') => {
      console.log(`\n--- Fetching ${periodType} KPI History [TZ: ${tz}, Start: "${startDate}", End: "${endDate}"] ---`);
      // Update employee timezone in database
      await EmployeeInfo.updateOne({ userId: user._id }, { $set: { timeZone: tz } });
      
      try {
        let url = `http://localhost:8080/api/v1/business-owner-team/kpi/history?periodType=${periodType}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log(`Message: ${response.data.message}`);
        if (response.data.data && response.data.data.length > 0) {
          const firstKpi = response.data.data[0];
          console.log(`KPI: ${firstKpi.kpiName}`);
          firstKpi.history.forEach(hist => {
            console.log(`  - Period: ${hist.periodIdentifier} | Name: ${hist.periodName} | Start: ${hist.startDate} | End: ${hist.endDate}`);
          });
        } else {
          console.log('No historical records found.');
        }
      } catch (err) {
        console.error(`Error calling API: ${err.message}`);
        if (err.response) {
          console.error(err.response.data);
        }
      }
    };

    // 1. Test Weekly format with week numbers
    await fetchKpiHistory('America/New_York', 'weekly', '17', '18');

    // 2. Test Monthly format with MM/YYYY
    await fetchKpiHistory('America/New_York', 'monthly', '04/2026', '05/2026');

    // 3. Test Yearly format with YYYY
    await fetchKpiHistory('America/New_York', 'yearly', '2025', '2026');

    // Restore original timezone
    console.log(`\nRestoring original timezone: ${originalTimezone}...`);
    await EmployeeInfo.updateOne({ userId: user._id }, { $set: { timeZone: originalTimezone } });
    console.log('Restored!');

    await mongoose.disconnect();
    console.log('\nDisconnected from database. Test complete!');
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

runTest();
