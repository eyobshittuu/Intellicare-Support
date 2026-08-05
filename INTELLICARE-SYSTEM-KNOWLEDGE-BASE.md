# IntelliCare IT Support Ticketing System - Knowledge Base

## System Overview

IntelliCare Support is a comprehensive healthcare IT support ticketing system designed for managing technical support requests across multiple hospital locations. The system facilitates communication between users (healthcare staff) and IT administrators.

---

## USER ROLES

### 1. Regular Users (Staff/Clients)
- Submit support tickets for IT issues
- View their own ticket history
- Track ticket status and progress
- Receive updates from IT administrators
- Chat with assigned admins about their tickets
- Access AI assistant for system guidance

### 2. Admins
- View and manage assigned tickets only
- Update ticket status (pending, in progress, completed, rejected)
- Communicate with users via direct chat
- Add work logs and resolutions
- Set difficulty levels for tickets
- Access AI assistant for support guidance

### 3. Super Admins
- Full system access and oversight
- Approve new user registrations
- Assign hospitals to users during approval
- Assign tickets to admins
- Set ticket priorities (low, medium, high, urgent)
- Manage user accounts
- View all tickets and system statistics
- Create and manage communication channels
- Access performance analytics
- Review system logs

---

## KEY FEATURES

### Ticket Management

**Creating a Ticket (Users):**
1. Click "Create New Ticket" from dashboard
2. Fill in required fields:
   - Title: Brief summary of the issue
   - Category: Technical Issue, Training Request, or Other
   - Description: Detailed explanation of the problem
   - Hospital: Auto-filled from user profile
3. Attach files (optional): Images, documents, up to 5 files, 10MB each
4. Submit ticket
5. Ticket gets unique ticket number (e.g., TICK-2024-001)
6. Default priority: Medium (adjusted by super admin during assignment)

**Ticket Status Flow:**
- **Pending**: Newly created, awaiting assignment
- **In Progress**: Admin is working on it
- **Completed**: Issue resolved
- **Rejected**: Cannot be resolved or invalid request

**Viewing Tickets:**
- Users: See only their own tickets
- Admins: See only tickets assigned to them
- Super Admins: See all tickets in the system

### User Registration & Approval

**Registration Process:**
1. New user fills registration form (name, email, password)
2. User cannot login immediately (pending approval)
3. Super admin reviews registration in "Pending Registrations"
4. Super admin assigns user's hospital from 31 available hospitals
5. Super admin approves or rejects with reason
6. User receives email notification of approval
7. Approved users can now login

**Hospital Assignment:**
- Each user belongs to one hospital
- Hospital automatically appears on their tickets
- Cannot be changed by user (only super admin)

### Ticket Assignment (Super Admin)

**Assignment Process:**
1. Super admin views unassigned tickets
2. Clicks "Assign to Admin" button
3. Selects:
   - **Admin**: From list of active admins
   - **Priority**: Low, Medium, High, or Urgent
   - **Difficulty**: 1 (Very Easy) to 5 (Very Hard)
4. Ticket is assigned and admin receives notification

**Priority Levels:**
- **Low**: Can wait, non-urgent issues
- **Medium**: Normal priority, standard response
- **High**: Important, needs quick attention
- **Urgent**: Critical, immediate action required

**Difficulty Levels:**
- **1 - Very Easy**: Basic inquiries, simple issues
- **2 - Easy**: Common issues with known solutions
- **3 - Medium**: Requires investigation
- **4 - Hard**: Complex issues, multiple systems
- **5 - Very Hard**: Critical, unique, requires expertise

### Communication System

**Direct Messages:**
- Users can chat with admin assigned to their ticket
- Admins can chat with users about specific tickets
- Real-time messaging via chat interface
- File sharing in conversations
- Read receipts and typing indicators

**Channels (Admin/Super Admin Only):**
- Team communication channels
- Public or private channels
- Multi-user group conversations
- File and link sharing
- @mentions for specific users

**Ticket Chat:**
- Dedicated chat section in ticket details
- Communication history preserved
- Only between ticket creator and assigned admin

### Admin Dashboard Features

**Regular Admin View:**
- Dashboard shows only assigned tickets
- Displays active tickets (pending + in progress)
- Completed/rejected tickets hidden from dashboard
- Access via "View All Tickets" to see full history
- Quick actions: View tickets, access chat

**Super Admin View:**
- Full statistics dashboard
- All ticket counts by status
- User management panel
- Registration approvals
- Channel management
- Performance metrics
- System logs

### Work Logs & Documentation

**Admin Work Log Fields:**
- **Admin Notes**: Internal notes about the ticket
- **Diagnosis**: Problem identification
- **Actions Taken**: Steps performed to resolve
- **Resolution Steps**: Final solution details
- **Status Update**: Change ticket status
- **Priority Update**: Adjust priority if needed

**Finalizing Tickets:**
1. Admin completes work
2. Adds comprehensive work log
3. Writes summary of resolution
4. Changes status to "Completed"
5. User receives notification

### File Attachments

**Supported File Types:**
- Images: JPG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT
- Archives: ZIP, RAR, 7Z, TAR, GZ

**File Limits:**
- Maximum 5 files per ticket
- Maximum 10MB per file
- Files stored securely in cloud (Cloudinary)

### AI Assistant

**Purpose:**
- Help users understand the ticketing system
- Guide users through system features
- Answer questions about ticket workflow
- Explain system policies and procedures
- Assist with navigation and usage

**NOT for:**
- Technical troubleshooting of IT equipment
- Hardware repair instructions
- Direct issue resolution (create tickets instead)

---

## COMMON USER QUESTIONS

### "How do I create a ticket?"
1. Login to your account
2. Click "Create New Ticket" on dashboard or "Tickets" → "New"
3. Fill in title, category, and description
4. Add any relevant files/screenshots
5. Submit - you'll get a ticket number

### "Why can't I select my hospital?"
Your hospital is assigned by the super admin during account approval. It automatically appears on your tickets.

### "Who can I contact about my ticket?"
Once an admin is assigned to your ticket, you can chat with them directly through the ticket's chat feature.

### "What priority should my issue be?"
You don't select priority - the super admin assesses and sets the priority when assigning your ticket to an admin.

### "How do I check my ticket status?"
Go to "Tickets" page to see all your tickets with their current status (Pending, In Progress, Completed, Rejected).

### "Can I update my ticket after submission?"
You cannot edit the ticket directly, but you can add information by chatting with the assigned admin through the ticket's chat section.

### "How long until someone looks at my ticket?"
Tickets are reviewed by super admins who assign them to appropriate admins based on priority and expertise. High-priority tickets are handled faster.

---

## COMMON ADMIN QUESTIONS

### "How do I see my assigned tickets?"
Your dashboard automatically shows only tickets assigned to you. Click "View All Tickets" for complete history.

### "How do I update a ticket status?"
1. Open the ticket
2. Go to "Work Log" tab
3. Fill in work details
4. Select new status
5. Save changes

### "Can I see all tickets in the system?"
Regular admins only see their assigned tickets. Super admins see all tickets.

### "How do I chat with a user about their ticket?"
1. Open the ticket
2. Go to "Chat" tab
3. Type your message and send
4. User receives notification

### "What if I can't resolve a ticket?"
Update the work log with what you've tried, change status to "Rejected" with explanation, or contact super admin to reassign.

---

## COMMON SUPER ADMIN QUESTIONS

### "How do I approve new users?"
1. Go to "Registrations" page
2. Review pending user
3. Select their hospital from dropdown
4. Click "Approve" or "Reject"

### "How do I assign a ticket?"
1. View unassigned tickets
2. Click "Assign to Admin"
3. Select admin, set priority and difficulty
4. Save assignment

### "How do I create a channel?"
1. Go to "Channels" page
2. Click "Create Channel"
3. Enter name, description, type (public/private)
4. Add members
5. Save

### "How do I view system performance?"
Go to "Performance" page to see:
- Admin performance metrics
- Ticket resolution times
- Response rates
- Difficulty ratings

---

## SYSTEM NAVIGATION

### Main Menu Items:

**All Users:**
- Dashboard: Overview and quick access
- Tickets: View/manage tickets
- Profile: Update personal information

**Admins Only:**
- Direct Messages: Chat with users
- Channels: Team communication

**Super Admin Only:**
- Users: User management
- Registrations: Approve new users
- Channel Settings: Manage channels
- Performance: Analytics dashboard
- System Logs: Audit trail

---

## BEST PRACTICES

### For Users:
- Provide clear, detailed descriptions
- Include screenshots when possible
- Check ticket status regularly
- Respond to admin messages promptly
- Use chat for ticket-related questions only

### For Admins:
- Update ticket status regularly
- Document all work in work logs
- Communicate clearly with users
- Escalate complex issues when needed
- Mark tickets complete only when fully resolved

### For Super Admins:
- Review registrations promptly
- Assign tickets to appropriate admins
- Set accurate priorities
- Monitor system performance
- Maintain user accountability

---

## TECHNICAL SPECIFICATIONS

- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Responsive**: Yes, fully responsive design
- **Real-time Updates**: Socket.io for live notifications
- **File Storage**: Cloud-based (Cloudinary)
- **Security**: JWT authentication, HTTPS encryption
- **Notification System**: In-app and browser notifications

---

## SUPPORT & HELP

If you need help with the system:
1. Use the AI Assistant (available to all users)
2. Contact your assigned admin (for ticket-specific issues)
3. Super admins can review system logs for technical issues
4. Create a ticket for system bugs or feature requests

---

**Last Updated**: January 2024
**System Version**: 1.0
**Maintained By**: IntelliCare IT Support Team
