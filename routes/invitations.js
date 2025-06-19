import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Project from '../models/Project.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Test route to verify routes are working
router.get('/test', auth, (req, res) => {
  res.json({ 
    message: 'Invitation routes are working!',
    user: req.user.email 
  });
});

// Test email configuration
router.get('/test-email', auth, async (req, res) => {
  try {
    const transporter = createEmailTransporter();
    
    // Verify email configuration
    await transporter.verify();
    
    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: req.user.email,
      subject: 'Test Email from Project Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Test Email Success!</h2>
          <p>Hi ${req.user.name},</p>
          <p>Your email configuration is working correctly!</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Sent at: ${new Date().toLocaleString()}</li>
            <li>From: ${process.env.EMAIL_FROM}</li>
            <li>To: ${req.user.email}</li>
          </ul>
          <p>You can now send project invitations!</p>
        </div>
      `
    });

    res.json({ 
      success: true,
      message: 'Test email sent successfully! Check your inbox.',
      messageId: info.messageId,
      recipient: req.user.email
    });
    
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ 
      success: false,
      message: 'Email test failed', 
      error: error.message,
      details: 'Check your email configuration in .env file'
    });
  }
});

// Send invitation
router.post('/send', auth, async (req, res) => {
  try {
    const { projectId, email } = req.body;
    
    // Validation
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    
    // Check if project exists and user is owner
    const project = await Project.findById(projectId).populate('owner', 'name email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can send invitations' });
    }
    
    // Check if user already exists and is a member
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      const isAlreadyMember = project.teamMembers?.some(
        member => member.user && member.user.toString() === existingUser._id.toString()
      );

      if (isAlreadyMember) {
        return res.status(400).json({ message: 'User is already a team member' });
      }
    }
    
    // Check if invitation already sent
    const existingInvitation = project.invitations?.find(
      inv => inv.email === email && inv.status === 'pending'
    );
    
    if (existingInvitation) {

      return res.status(400).json({ 
        message: 'Invitation already sent to this email',
        existingInvitation: {
          sentAt: existingInvitation.createdAt,
          expiresAt: existingInvitation.expiresAt
        }
      });
    }
    
    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Initialize invitations array if it doesn't exist
    if (!project.invitations) {
      project.invitations = [];
    }
    
    // Add invitation to project
    const newInvitation = {
      email,
      token,
      invitedBy: req.user._id,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    project.invitations.push(newInvitation);
    await project.save();
    
    // Send email
    try {
      const transporter = createEmailTransporter();
      
      // Create invitation link
      const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${token}`;   
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Invitation</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 10px; 
              overflow: hidden; 
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #007bff, #0056b3); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 300; 
            }
            .content { 
              padding: 30px; 
            }
            .project-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #007bff;
            }
            .button { 
              display: inline-block; 
              padding: 15px 30px; 
              background: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 25px; 
              font-weight: bold;
              margin: 20px 0;
              transition: background 0.3s;
            }
            .button:hover {
              background: #0056b3;
            }
            .footer { 
              padding: 20px; 
              text-align: center; 
              color: #666; 
              font-size: 14px; 
              background: #f8f9fa;
            }
            .link-fallback {
              word-break: break-all;
              background: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
              font-family: monospace;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Project Invitation</h1>
            </div>
            <div class="content">
              <h2>You're invited to collaborate!</h2>
              <p>Hi there! 👋</p>
              <p><strong>${req.user.name}</strong> has invited you to join an exciting project.</p>
              
              <div class="project-info">
                <h3>📋 Project Details</h3>
                <p><strong>Project Name:</strong> ${project.title}</p>
                <p><strong>Description:</strong> ${project.description}</p>
                <p><strong>Invited by:</strong> ${req.user.name} (${req.user.email})</p>
              </div>
              
              <p>Click the button below to accept this invitation and start collaborating:</p>
              
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>
              
              <p><strong>Can't click the button?</strong> Copy and paste this link in your browser:</p>
              <div class="link-fallback">
                ${invitationLink}
              </div>
              
              <p><strong>⏰ Important:</strong> This invitation will expire on <strong>${newInvitation.expiresAt.toLocaleDateString()}</strong>.</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p><small>💡 <strong>New to our platform?</strong> You'll need to create an account with this email address (${email}) to accept the invitation.</small></p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>© 2025 Project Manager | Making collaboration simple</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const info = await transporter.sendMail({
        from: `"${req.user.name} via Project Manager" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `🚀 You're invited to join "${project.title}" project!`,
        html: emailHtml
      });

      res.json({ 
        success: true,
        message: 'Invitation sent successfully!',
        emailSent: true,
        invitation: {
          email,
          projectTitle: project.title,
          expiresAt: newInvitation.expiresAt,
          messageId: info.messageId
        }
      });
      
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      
      // Email failed, but invitation is saved in DB
      res.status(207).json({ // 207 = Multi-Status (partial success)
        success: false,
        message: 'Invitation saved but email could not be sent',
        emailSent: false,
        invitation: {
          email,
          projectTitle: project.title,
          expiresAt: newInvitation.expiresAt,
          token: token.substring(0, 10) + "..." // For manual testing
        },
        error: emailError.message,
        troubleshooting: 'Check your email configuration in .env file'
      });
    }
    
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send invitation', 
      error: error.message 
    });
  }
});

// Accept invitation
router.post('/accept/:token', auth, async (req, res) => {
  try {
    const { token } = req.params;   
    // Find project with this invitation token
    const project = await Project.findOne({
      'invitations.token': token,
      'invitations.status': 'pending'
    }).populate('owner', 'name email');
    
    if (!project) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired invitation' 
      });
    }
    
    // Find the specific invitation
    const invitation = project.invitations.find(
      inv => inv.token === token && inv.status === 'pending'
    );
    
    if (!invitation) {
      return res.status(400).json({ 
        success: false,
        message: 'Invitation not found or already processed' 
      });
    }
    
    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await project.save();
      return res.status(400).json({ 
        success: false,
        message: 'Invitation has expired' 
      });
    }
    
    // Check if the user accepting matches the invited email
    if (req.user.email !== invitation.email) {
      return res.status(403).json({ 
        success: false,
        message: 'This invitation was sent to a different email address' 
      });
    }
    
    // Check if user is already a team member
    const isAlreadyMember = project.teamMembers.some(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (isAlreadyMember) {
      invitation.status = 'accepted';
      await project.save();
      return res.status(400).json({ 
        success: false,
        message: 'You are already a team member' 
      });
    }

    // Add user to team members
    project.teamMembers.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date()
    });
    
    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    
    await project.save();
    res.json({
      success: true,
      message: 'Invitation accepted successfully! Welcome to the team! 🎉',
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        owner: project.owner.name
      }
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to accept invitation', 
      error: error.message 
    });
  }
});

// Get pending invitations for current user
router.get('/pending', auth, async (req, res) => {
  try {

    // Find all projects with pending invitations for this user's email
    const projects = await Project.find({
      'invitations.email': req.user.email,
      'invitations.status': 'pending'
    }).populate('owner', 'name email');
    
    const pendingInvitations = [];
    
    projects.forEach(project => {
      const userInvitations = project.invitations.filter(
        inv => inv.email === req.user.email && 
               inv.status === 'pending' && 
               new Date() <= inv.expiresAt
      );
      
      userInvitations.forEach(invitation => {
        pendingInvitations.push({
          id: invitation._id,
          token: invitation.token,
          projectId: project._id,
          projectTitle: project.title,
          projectDescription: project.description,
          invitedBy: project.owner,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt
        });
      });
    });
    
    res.json({
      success: true,
      count: pendingInvitations.length,
      invitations: pendingInvitations
    });
    
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch pending invitations', 
      error: error.message 
    });
  }
});

// Get project invitations (for project owners)
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log("🔍 Getting invitations for project:", projectId);
    
    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('invitations.invitedBy', 'name email')
      .populate('teamMembers.user', 'name email');
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    // Only owner can see invitations
    if (project.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }
    
    res.json({
      success: true,
      projectTitle: project.title,
      invitations: project.invitations || [],
      teamMembers: project.teamMembers || []
    });
    
  } catch (error) {
    console.error('Error fetching project invitations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch project invitations', 
      error: error.message 
    });
  }
});

// Resend invitation
router.post('/resend', auth, async (req, res) => {
  try {
    const { projectId, email } = req.body;
    
    const project = await Project.findById(projectId).populate('owner', 'name email');
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    // Only owner can resend invitations
    if (project.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Only project owner can resend invitations' 
      });
    }
    
    // Find existing invitation
    const existingInvitation = project.invitations.find(
      inv => inv.email === email && inv.status === 'pending'
    );
    
    if (!existingInvitation) {
      return res.status(404).json({ 
        success: false,
        message: 'No pending invitation found for this email' 
      });
    }
    
    // Update the expiration date
    existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await project.save();
    
    // Send email again
    try {
      const transporter = createEmailTransporter();
      const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${existingInvitation.token}`;
      
      await transporter.sendMail({
        from: `"${req.user.name} via Project Manager" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `🔄 Reminder: You're invited to join "${project.title}" project!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Invitation Reminder</h2>
            <p>Hi there,</p>
            <p>This is a friendly reminder that you have a pending invitation to join the project "<strong>${project.title}</strong>".</p>
            <p><a href="${invitationLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
            <p>This invitation will expire on ${existingInvitation.expiresAt.toLocaleDateString()}.</p>
          </div>
        `
      });
      
      res.json({ 
        success: true,
        message: 'Invitation resent successfully' 
      });
      
    } catch (emailError) {
      res.status(207).json({ 
        success: false,
        message: 'Invitation updated but email could not be sent',
        error: emailError.message 
      });
    }
    
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error resending invitation',
      error: error.message 
    });
  }
});

// Cancel invitation (for project owners)
router.delete('/cancel', auth, async (req, res) => {
  try {
    const { projectId, email } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    // Only owner can cancel invitations
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Only project owner can cancel invitations' 
      });
    }
    
    // Find and remove invitation
    const invitationIndex = project.invitations.findIndex(
      inv => inv.email === email && inv.status === 'pending'
    );
    
    if (invitationIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'No pending invitation found for this email' 
      });
    }
    
    project.invitations.splice(invitationIndex, 1);
    await project.save();
    
    res.json({ 
      success: true,
      message: 'Invitation cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error cancelling invitation',
      error: error.message 
    });
  }
});

export default router;