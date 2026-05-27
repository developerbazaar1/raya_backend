require('dotenv').config();
const mongoose = require('mongoose');
const KpiAssignment = require('../src/models/businessOwner/kpiAssignment.model');
const KpiHistory = require('../src/models/businessOwner/kpiHistory.model');
const EmployeeInfo = require('../src/models/businessOwnerTeam/employeesInfo.model');
const BusinessOwnerInfo = require('../src/models/businessOwner/businessOwnerInfo.model');
const Kpi = require('../src/models/businessOwner/kpis.model');
const KpiCategory = require('../src/models/businessOwner/kpiCategory.model');
const User = require('../src/models/shared/users.model');
const { processKpiRollovers } = require('../src/services/kpi.service');

async function executeSimulatedRolloverTest() {
  console.log('--- STARTING SIMULATED KPI ROLLOVER INTEGRATION TEST ---');
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    // 1. Create a dummy business owner and employee
    const ownerUserId = new mongoose.Types.ObjectId();
    const employeeUserId = new mongoose.Types.ObjectId();

    console.log('\nSeeding mock company configurations...');
    
    // Seed Business Owner Info (Timezone America/New_York)
    const ownerInfo = new BusinessOwnerInfo({
      userId: ownerUserId,
      businessName: 'Apex Test Corp',
      timeZone: 'America/New_York'
    });
    await ownerInfo.save();

    // Seed Employee Info (Timezone America/New_York)
    const employeeInfo = new EmployeeInfo({
      userId: employeeUserId,
      businessOwnerId: ownerUserId,
      timeZone: 'America/New_York'
    });
    await employeeInfo.save();

    // Seed KPI Category
    const category = new KpiCategory({
      categoryName: 'Operations',
      businessOwnerId: ownerUserId
    });
    await category.save();

    // Seed KPI Definition
    const kpi = new Kpi({
      kpiName: 'Delivery Speed',
      categoryId: category._id,
      businessOwnerId: ownerUserId,
      measurementType: new mongoose.Types.ObjectId() // Mock ID
    });
    await kpi.save();

    console.log('Dummy configurations seeded.');

    // 2. Create Simulated Assignments set in the PAST
    console.log('\nCreating simulated active KPI assignments with timestamps set in the past...');
    
    // Assignment A: Recurring Weekly (Last updated 10 days ago)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const assignmentA = new KpiAssignment({
      businessOwnerId: ownerUserId,
      categoryId: category._id,
      kpiId: kpi._id,
      goalValue: 100,
      resetFrequency: 'weekly',
      isRepeat: true,
      progress: 75,
      status: 'on_track',
      assignedUserId: employeeUserId
    });
    await assignmentA.save();
    
    // Force KpiAssignment A's updatedAt to be in the past to trigger rollover
    await KpiAssignment.updateOne(
      { _id: assignmentA._id },
      { $set: { updatedAt: tenDaysAgo } },
      { timestamps: false }
    );

    // Assignment B: Single-cycle Monthly (Last updated 40 days ago)
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const assignmentB = new KpiAssignment({
      businessOwnerId: ownerUserId,
      categoryId: category._id,
      kpiId: kpi._id,
      goalValue: 200,
      resetFrequency: 'monthly',
      isRepeat: false,
      progress: 120,
      status: 'need_attention',
      assignedUserId: employeeUserId
    });
    await assignmentB.save();
    
    // Force KpiAssignment B's updatedAt to be in the past to trigger rollover
    await KpiAssignment.updateOne(
      { _id: assignmentB._id },
      { $set: { updatedAt: fortyDaysAgo } },
      { timestamps: false }
    );

    console.log('Mock assignments successfully created and adjusted in the past.');

    // 3. Run the Rollover engine
    console.log('\nInvoking processKpiRollovers()...');
    const summary = await processKpiRollovers();
    console.log(`Rollover completed successfully:`, summary);

    // 4. Assert and verify the outcomes
    console.log('\n--- VERIFYING TEST OUTCOMES ---');

    // Query historical records created
    const weeklyHistory = await KpiHistory.findOne({
      kpiId: kpi._id,
      assignedUserId: employeeUserId,
      periodType: 'weekly'
    });

    if (weeklyHistory) {
      console.log('✔ WEEKLY HISTORY RECORD CREATED SUCCESSFULLY.');
      console.log(`  - Period: ${weeklyHistory.periodIdentifier}`);
      console.log(`  - Progress: ${weeklyHistory.actualValue} / ${weeklyHistory.goalValue} (${weeklyHistory.progressPercent}%)`);
      console.log(`  - Status: ${weeklyHistory.status}`);
      if (weeklyHistory.actualValue === 75 && weeklyHistory.goalValue === 100) {
        console.log('  ✔ WEEKLY METRICS MATCH EXACTLY.');
      } else {
        console.error('  ❌ ERROR: Weekly metrics do not match.');
      }
    } else {
      console.error('❌ ERROR: Weekly History record was NOT created.');
    }

    const monthlyHistory = await KpiHistory.findOne({
      kpiId: kpi._id,
      assignedUserId: employeeUserId,
      periodType: 'monthly'
    });

    if (monthlyHistory) {
      console.log('✔ MONTHLY HISTORY RECORD CREATED SUCCESSFULLY.');
      console.log(`  - Period: ${monthlyHistory.periodIdentifier}`);
      console.log(`  - Progress: ${monthlyHistory.actualValue} / ${monthlyHistory.goalValue} (${monthlyHistory.progressPercent}%)`);
      console.log(`  - Status: ${monthlyHistory.status}`);
      if (monthlyHistory.actualValue === 120 && monthlyHistory.goalValue === 200) {
        console.log('  ✔ MONTHLY METRICS MATCH EXACTLY.');
      } else {
        console.error('  ❌ ERROR: Monthly metrics do not match.');
      }
    } else {
      console.error('❌ ERROR: Monthly History record was NOT created.');
    }

    // Verify Active Assignments States
    const activeWeekly = await KpiAssignment.findById(assignmentA._id);
    if (activeWeekly) {
      if (activeWeekly.progress === 0 && activeWeekly.status === 'on_track') {
        console.log('✔ ACTIVE WEEKLY RECURRING ASSIGNMENT SUCCESSFULLY RESET TO 0.');
      } else {
        console.error(`❌ ERROR: Weekly assignment progress was not reset. (Progress: ${activeWeekly.progress})`);
      }
    } else {
      console.error('❌ ERROR: Active Weekly assignment was deleted instead of reset.');
    }

    const activeMonthly = await KpiAssignment.findById(assignmentB._id);
    if (!activeMonthly) {
      console.log('✔ ACTIVE MONTHLY SINGLE-CYCLE ASSIGNMENT SUCCESSFULLY DELETED FROM COLLECTION.');
    } else {
      console.error('❌ ERROR: Active Monthly assignment still exists in collection (should have been deleted).');
    }

    // 5. Clean up seeded data
    console.log('\nCleaning up seeded mock records...');
    await BusinessOwnerInfo.deleteOne({ userId: ownerUserId });
    await EmployeeInfo.deleteOne({ userId: employeeUserId });
    await KpiCategory.deleteOne({ _id: category._id });
    await Kpi.deleteOne({ _id: kpi._id });
    await KpiAssignment.deleteOne({ _id: assignmentA._id });
    if (weeklyHistory) await KpiHistory.deleteOne({ _id: weeklyHistory._id });
    if (monthlyHistory) await KpiHistory.deleteOne({ _id: monthlyHistory._id });
    console.log('Seeded data cleaned up.');

    console.log('\n--- SIMULATED KPI ROLLOVER INTEGRATION TEST COMPLETE (SUCCESS) ---');
  } catch (error) {
    console.error('\n❌ TEST SUITE RUNTIME EXCEPTION:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

executeSimulatedRolloverTest();
