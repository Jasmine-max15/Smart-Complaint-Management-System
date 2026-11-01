const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Clearing old collections...');
    await User.deleteMany();
    await Complaint.deleteMany();
    await Notification.deleteMany();

    console.log('[Seeder] Creating demo users...');
    // Create Admin
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@complaint.gov',
      phone: '+91 98765 43210',
      password: 'Admin@123',
      address: 'Municipal Corporation Headquarters, Civic Center',
      role: 'admin',
      isActive: true,
    });

    // Create Citizen 1
    const citizen1 = await User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91 98111 22334',
      password: 'User@123',
      address: 'Flat 402, Sunshine Apartments, Sector 14',
      role: 'user',
      isActive: true,
    });

    // Create Citizen 2
    const citizen2 = await User.create({
      name: 'Sarah Smith',
      email: 'sarah.smith@example.com',
      phone: '+91 98222 33445',
      password: 'User@123',
      address: 'House 88, Lakeview Residency, Hill Road',
      role: 'user',
      isActive: true,
    });

    console.log('[Seeder] Creating realistic complaints...');
    const complaintsData = [
      {
        complaintId: 'CMP-20261025-1042',
        title: 'Frequent Voltage Fluctuations and Power Outages',
        description: 'Severe voltage fluctuations occurring every evening between 7 PM and 10 PM in Sector 14. Multiple home appliances are getting damaged due to unstable surge.',
        category: 'Electricity',
        location: 'Sector 14, Power Substation Grid Area',
        department: 'Electricity Board',
        priority: 'High',
        status: 'In Progress',
        userId: citizen1._id,
        assignedTo: 'Eng. Ramesh Verma (Grid Substation)',
        adminRemarks: 'Transformer feeder line inspected. Component replacement scheduled for tonight.',
        statusHistory: [
          {
            status: 'Submitted',
            remarks: 'Complaint registered by citizen.',
            updatedBy: citizen1._id,
            updaterRole: 'user',
            updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'Pending',
            remarks: 'Forwarded to Electrical Grid Operations division.',
            updatedBy: adminUser._id,
            updaterRole: 'admin',
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'In Progress',
            remarks: 'Technician team dispatched to inspect transformer load distribution.',
            updatedBy: adminUser._id,
            updaterRole: 'admin',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: 'CMP-20261026-2104',
        title: 'Major Water Pipeline Burst near Main Market',
        description: 'Clean drinking water is overflowing on the main street due to an underground supply pipe burst. Severe water wastage and road waterlogging occurring.',
        category: 'Water Supply',
        location: 'Central Market Road, Opposite Gate #2',
        department: 'Water & Sewerage Department',
        priority: 'High',
        status: 'Resolved',
        userId: citizen1._id,
        assignedTo: 'Water Works Maintenance Squad',
        adminRemarks: 'Main valve replaced, pipeline joint sealed and pressure tested. Normal supply restored.',
        statusHistory: [
          {
            status: 'Submitted',
            remarks: 'Emergency water leak reported.',
            updatedBy: citizen1._id,
            updaterRole: 'user',
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'In Progress',
            remarks: 'Excavation team dispatched to isolate the leaking segment.',
            updatedBy: adminUser._id,
            updaterRole: 'admin',
            updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'Resolved',
            remarks: 'Repair completed, joint reinforced with high-durability sleeve.',
            updatedBy: adminUser._id,
            updaterRole: 'admin',
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: 'CMP-20261028-3190',
        title: 'Dangerous Potholes on MG Road Flyover Descent',
        description: 'Large and deep potholes on the flyover descent slope are causing vehicles to swerve dangerously, causing multiple near-miss accidents for two-wheelers.',
        category: 'Road and Transport',
        location: 'MG Road Flyover North Descent, Near Pillar 42',
        department: 'Public Works Department (PWD)',
        priority: 'High',
        status: 'Pending',
        userId: citizen2._id,
        assignedTo: 'PWD Road Infrastructure Team',
        adminRemarks: 'Inspection team scheduled site audit for tomorrow morning.',
        statusHistory: [
          {
            status: 'Submitted',
            remarks: 'Citizen reported hazardous potholes.',
            updatedBy: citizen2._id,
            updaterRole: 'user',
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'Pending',
            remarks: 'Work order #PWD-842 created and waiting for asphalt patching crew.',
            updatedBy: adminUser._id,
            updaterRole: 'admin',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: 'CMP-20261029-4115',
        title: 'Garbage Dump Overflow and Foul Odor at Community Bin',
        description: 'The municipal dumpster has not been cleared for over 4 days. Waste is spilling across the sidewalk creating severe sanitary concerns and stray animal menace.',
        category: 'Sanitation',
        location: 'Green Park 3rd Cross, Community Bin #12',
        department: 'Municipal Sanitation & Waste Mgmt',
        priority: 'Medium',
        status: 'Submitted',
        userId: citizen2._id,
        assignedTo: 'Sanitation Ward 18 Team',
        adminRemarks: 'Complaint received and queued for daily morning collection route.',
        statusHistory: [
          {
            status: 'Submitted',
            remarks: 'Complaint registered by citizen.',
            updatedBy: citizen2._id,
            updaterRole: 'user',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: 'CMP-20261030-5021',
        title: 'Non-functional Streetlights on Ring Road Stretch',
        description: 'A 500-meter stretch of streetlights has been pitch dark for three consecutive nights, posing a safety risk for pedestrians and night commuters.',
        category: 'Public Safety',
        location: 'Ring Road Outer Circle, Between Pole 110 and 125',
        department: 'Public Safety & Lighting Unit',
        priority: 'High',
        status: 'In Progress',
        userId: citizen1._id,
        assignedTo: 'City Electrical Maintenance Crew',
        adminRemarks: 'Burnt underground cable identified; repair crew active on site.',
        statusHistory: [
          {
            status: 'Submitted',
            remarks: 'Complaint submitted by citizen.',
            updatedBy: citizen1._id,
            updaterRole: 'user',
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'In Progress',
            remarks: 'Technicians testing lighting circuits on Outer Circle.',
            updatedBy: adminUser._id,
            updaterRole: 'admin',
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: 'CMP-20261030-6110',
        title: 'Municipal Free Wi-Fi Zone Down at Central Library',
        description: 'Public Wi-Fi router hotspot shows authentication timeout for all students and library visitors since Monday morning.',
        category: 'Internet and Technology',
        location: 'District Central Library, 2nd Floor Study Hall',
        department: 'IT & Telecommunications Cell',
        priority: 'Low',
        status: 'Resolved',
        userId: citizen2._id,
        assignedTo: 'Network Operations Desk',
        adminRemarks: 'Fiber switch rebooted and gateway firmware patched. Connection restored.',
        statusHistory: [
          {
            status: 'Submitted',
            remarks: 'Complaint registered.',
            updatedBy: citizen2._id,
            updaterRole: 'user',
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            status: 'Resolved',
            remarks: 'Gateway reset executed and verified speed 100Mbps.',
            updatedBy: adminUser._id,
            updaterRole: 'admin',
            updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];

    const createdComplaints = await Complaint.insertMany(complaintsData);

    console.log('[Seeder] Creating sample notifications...');
    await Notification.create([
      {
        userId: citizen1._id,
        complaintId: createdComplaints[1]._id,
        title: 'Complaint Resolved: Water Pipeline Leakage',
        message: 'Your complaint CMP-20261026-2104 regarding "Major Water Pipeline Burst" has been marked as RESOLVED by the administration.',
        type: 'status_update',
        isRead: false,
      },
      {
        userId: citizen1._id,
        complaintId: createdComplaints[0]._id,
        title: 'Status Update: Power Outage Complaint',
        message: 'Your complaint CMP-20261025-1042 status changed to "In Progress". Assigned to Eng. Ramesh Verma.',
        type: 'status_update',
        isRead: true,
      },
      {
        userId: citizen2._id,
        complaintId: createdComplaints[5]._id,
        title: 'Complaint Resolved: Public Wi-Fi Down',
        message: 'Your complaint CMP-20261030-6110 regarding "Municipal Free Wi-Fi Zone" has been RESOLVED.',
        type: 'status_update',
        isRead: false,
      },
      {
        userId: citizen2._id,
        complaintId: createdComplaints[2]._id,
        title: 'Complaint Under Review: Potholes on MG Road',
        message: 'Your complaint CMP-20261028-3190 has been forwarded to Public Works Department (PWD).',
        type: 'status_update',
        isRead: false,
      },
    ]);

    console.log('----------------------------------------------------');
    console.log('✅ SEEDING COMPLETE SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Admin Account:');
    console.log('  Email:    admin@complaint.gov');
    console.log('  Password: Admin@123');
    console.log('');
    console.log('User Accounts:');
    console.log('  Email:    john.doe@example.com');
    console.log('  Password: User@123');
    console.log('  Email:    sarah.smith@example.com');
    console.log('  Password: User@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error in seeder:', error);
    process.exit(1);
  }
};

seedData();

