// backend/src/services/notification.service.js
const { db } = require('../config/firebase');
const { sendEmail } = require('./email.service');
const autoMatching = require('./autoMatching.service');

class NotificationService {
  /**
   * Check for new course matches and notify students
   */
  async checkNewCourseMatches() {
    try {
      console.log('🔔 Checking for new course matches...');

      // Get all students who have uploaded documents
      const studentsSnapshot = await db.collection('students')
        .where('documents.transcript', '!=', null)
        .where('studyStatus', '==', 'applying')
        .get();

      let notificationsSent = 0;

      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = { id: studentDoc.id, ...studentDoc.data() };

        // Check notification preferences
        if (studentData.autoApplicationPreferences?.notificationsEnabled === false) {
          continue;
        }

        // Get student's last notification check time
        const lastCheck = studentData.lastMatchNotification?.toDate() || new Date(0);

        // Find new courses added since last check
        const newCoursesSnapshot = await db.collection('courses')
          .where('admissionStatus', '==', 'open')
          .where('createdAt', '>', lastCheck)
          .get();

        if (newCoursesSnapshot.empty) {
          continue;
        }

        // Check which new courses the student qualifies for
        const matchingResult = await autoMatching.findMatchingCourses(studentData);
        const newMatchedCourses = matchingResult.courses.filter(course => {
          const courseCreatedAt = course.createdAt?.toDate() || new Date(0);
          return courseCreatedAt > lastCheck && course.matchScore >= 70;
        });

        if (newMatchedCourses.length > 0) {
          await this.sendNewMatchNotification(studentData, newMatchedCourses);
          
          // Update last notification time
          await db.collection('students').doc(studentDoc.id).update({
            lastMatchNotification: new Date(),
            updatedAt: new Date()
          });

          notificationsSent++;
        }
      }

      console.log(`✓ Sent ${notificationsSent} match notifications`);
      return { success: true, notificationsSent };

    } catch (error) {
      console.error('Error checking new matches:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification about new matching courses
   */
  async sendNewMatchNotification(studentData, courses) {
    try {
      const email = studentData.personalInfo?.email;
      if (!email) return;

      const topCourses = courses.slice(0, 3);
      const courseList = topCourses.map((course, idx) => 
        `${idx + 1}. ${course.courseName} at ${course.institution?.name} (${course.matchScore}% match)`
      ).join('\n');

      await sendEmail({
        to: email,
        subject: `🎯 ${courses.length} New Course${courses.length > 1 ? 's' : ''} Match Your Profile!`,
        text: `Hi ${studentData.personalInfo?.firstName},

Great news! We found ${courses.length} new course${courses.length > 1 ? 's' : ''} that match your qualifications:

${courseList}

These courses were recently opened for admission and you qualify based on your transcript and academic background.

Login to your dashboard to review and apply before seats fill up!

Best regards,
Student Placement System`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 2rem;">🎯 New Matches Found!</h1>
            </div>
            
            <div style="padding: 2rem; background: white;">
              <p style="font-size: 1.125rem; color: #1f2937;">Hi ${studentData.personalInfo?.firstName},</p>
              <p style="color: #6b7280; line-height: 1.6;">
                Great news! We found <strong>${courses.length} new course${courses.length > 1 ? 's' : ''}</strong> 
                that match your qualifications:
              </p>

              <div style="margin: 1.5rem 0;">
                ${topCourses.map(course => `
                  <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${course.matchScore >= 85 ? '#10b981' : '#3b82f6'};">
                    <h3 style="margin: 0 0 0.5rem 0; color: #1f2937;">${course.courseName}</h3>
                    <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.9375rem;">
                      🏛️ ${course.institution?.name}
                    </p>
                    <div style="margin-top: 0.75rem;">
                      <span style="background: ${course.matchScore >= 85 ? '#d1fae5' : '#dbeafe'}; 
                                   color: ${course.matchScore >= 85 ? '#065f46' : '#1e40af'}; 
                                   padding: 0.25rem 0.75rem; 
                                   border-radius: 12px; 
                                   font-size: 0.875rem;
                                   font-weight: 600;">
                        ${course.matchScore}% Match
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>

              ${courses.length > 3 ? `
                <p style="color: #6b7280; font-size: 0.875rem; text-align: center;">
                  + ${courses.length - 3} more course${courses.length - 3 > 1 ? 's' : ''}
                </p>
              ` : ''}

              <p style="color: #6b7280; line-height: 1.6;">
                These courses were recently opened for admission and you qualify based on your transcript 
                and academic background. <strong>Don't miss out</strong> – admission seats fill up quickly!
              </p>

              <div style="text-align: center; margin-top: 2rem;">
                <a href="${process.env.FRONTEND_URL}/student/auto-apply" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 1rem 2rem; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block;
                          font-weight: 600;">
                  View & Apply Now →
                </a>
              </div>
            </div>

            <div style="background: #f9fafb; padding: 1.5rem; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">
                Don't want these notifications? 
                <a href="${process.env.FRONTEND_URL}/student/settings" style="color: #667eea;">Update your preferences</a>
              </p>
            </div>
          </div>
        `
      });

      // Create in-app notification
      await db.collection('notifications').add({
        userId: studentData.id,
        type: 'new_course_match',
        title: `${courses.length} New Course${courses.length > 1 ? 's' : ''} Match Your Profile!`,
        message: `We found ${courses.length} new courses that match your qualifications. Click to view and apply.`,
        data: {
          courses: topCourses.map(c => ({
            id: c.id,
            name: c.courseName,
            institution: c.institution?.name,
            matchScore: c.matchScore
          }))
        },
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      console.log(`✓ Notification sent to ${email}`);

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send application status update notification
   */
  async sendApplicationStatusUpdate(applicationId, newStatus) {
    try {
      const appDoc = await db.collection('applications').doc(applicationId).get();
      if (!appDoc.exists()) return;

      const appData = appDoc.data();
      const studentDoc = await db.collection('students').doc(appData.studentId).get();
      if (!studentDoc.exists()) return;

      const studentData = studentDoc.data();
      const courseDoc = await db.collection('courses').doc(appData.courseId).get();
      const courseData = courseDoc.exists() ? courseDoc.data() : null;

      const statusMessages = {
        accepted: {
          subject: '🎉 Application Accepted!',
          emoji: '🎉',
          color: '#10b981',
          message: 'Congratulations! Your application has been accepted.'
        },
        rejected: {
          subject: '📝 Application Update',
          emoji: '📝',
          color: '#ef4444',
          message: 'Thank you for your application. Unfortunately, it was not successful this time.'
        },
        under_review: {
          subject: '👀 Application Under Review',
          emoji: '👀',
          color: '#3b82f6',
          message: 'Your application is currently under review.'
        }
      };

      const statusInfo = statusMessages[newStatus] || statusMessages.under_review;

      await sendEmail({
        to: studentData.personalInfo?.email,
        subject: statusInfo.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${statusInfo.color}; color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">${statusInfo.emoji}</div>
              <h1 style="margin: 0;">${statusInfo.subject}</h1>
            </div>
            
            <div style="padding: 2rem; background: white;">
              <p style="font-size: 1.125rem; color: #1f2937;">Hi ${studentData.personalInfo?.firstName},</p>
              <p style="color: #6b7280; line-height: 1.6;">${statusInfo.message}</p>

              <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <h3 style="margin: 0 0 1rem 0; color: #1f2937;">Application Details</h3>
                <p style="margin: 0.5rem 0; color: #6b7280;"><strong>Course:</strong> ${courseData?.courseName || 'N/A'}</p>
                <p style="margin: 0.5rem 0; color: #6b7280;"><strong>Application #:</strong> ${appData.applicationNumber}</p>
                <p style="margin: 0.5rem 0; color: #6b7280;"><strong>Status:</strong> ${newStatus.toUpperCase()}</p>
              </div>

              ${newStatus === 'accepted' ? `
                <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 1rem; border-radius: 4px; margin: 1.5rem 0;">
                  <p style="margin: 0; color: #065f46; font-weight: 600;">Next Steps:</p>
                  <ul style="margin: 0.5rem 0 0 1rem; color: #065f46;">
                    <li>Check your email for enrollment instructions</li>
                    <li>Complete any required forms</li>
                    <li>Prepare necessary documents</li>
                  </ul>
                </div>
              ` : newStatus === 'rejected' ? `
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 4px; margin: 1.5rem 0;">
                  <p style="margin: 0; color: #92400e;">
                    Don't be discouraged! Check out other courses that match your profile and keep trying.
                  </p>
                </div>
              ` : ''}

              <div style="text-align: center; margin-top: 2rem;">
                <a href="${process.env.FRONTEND_URL}/student/applications" 
                   style="background: ${statusInfo.color}; 
                          color: white; 
                          padding: 1rem 2rem; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block;
                          font-weight: 600;">
                  View Application →
                </a>
              </div>
            </div>
          </div>
        `
      });

      // Create in-app notification
      await db.collection('notifications').add({
        userId: appData.studentId,
        type: 'application_status',
        title: statusInfo.subject,
        message: `Your application for ${courseData?.courseName} has been ${newStatus}.`,
        data: {
          applicationId: applicationId,
          courseId: appData.courseId,
          status: newStatus
        },
        read: false,
        createdAt: new Date()
      });

      console.log(`✓ Status update notification sent for application ${applicationId}`);

    } catch (error) {
      console.error('Error sending status update:', error);
    }
  }

  /**
   * Send deadline reminder notifications
   */
  async sendDeadlineReminders() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Find courses with upcoming deadlines
      const coursesSnapshot = await db.collection('courses')
        .where('admissionStatus', '==', 'open')
        .where('applicationDeadline', '<=', threeDaysFromNow)
        .get();

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = { id: courseDoc.id, ...courseDoc.data() };
        
        // Find students who haven't applied but match this course
        const studentsSnapshot = await db.collection('students')
          .where('documents.transcript', '!=', null)
          .get();

        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = { id: studentDoc.id, ...studentDoc.data() };

          // Check if student already applied
          const existingApp = await db.collection('applications')
            .where('studentId', '==', studentDoc.id)
            .where('courseId', '==', courseDoc.id)
            .get();

          if (!existingApp.empty) continue;

          // Check if student qualifies
          const matchResult = autoMatching.calculateCourseMatch(studentData, courseData);
          
          if (matchResult.isEligible && matchResult.matchScore >= 70) {
            await this.sendDeadlineReminder(studentData, courseData);
          }
        }
      }

    } catch (error) {
      console.error('Error sending deadline reminders:', error);
    }
  }

  /**
   * Send deadline reminder email
   */
  async sendDeadlineReminder(studentData, courseData) {
    try {
      const deadline = courseData.applicationDeadline?.toDate();
      const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

      await sendEmail({
        to: studentData.personalInfo?.email,
        subject: `⏰ Application Deadline: ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fbbf24; color: #92400e; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">⏰</div>
              <h1 style="margin: 0;">Deadline Approaching!</h1>
            </div>
            
            <div style="padding: 2rem; background: white;">
              <p style="font-size: 1.125rem; color: #1f2937;">Hi ${studentData.personalInfo?.firstName},</p>
              <p style="color: #6b7280; line-height: 1.6;">
                The application deadline for a course you qualify for is approaching in 
                <strong style="color: #dc2626;">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>!
              </p>

              <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <h3 style="margin: 0 0 1rem 0; color: #92400e;">${courseData.courseName}</h3>
                <p style="margin: 0.5rem 0; color: #92400e;">
                  <strong>Institution:</strong> ${courseData.institution?.name || 'N/A'}
                </p>
                <p style="margin: 0.5rem 0; color: #92400e;">
                  <strong>Deadline:</strong> ${deadline?.toLocaleDateString()}
                </p>
              </div>

              <p style="color: #6b7280; line-height: 1.6;">
                Don't miss this opportunity! Use our auto-apply feature to submit your application quickly.
              </p>

              <div style="text-align: center; margin-top: 2rem;">
                <a href="${process.env.FRONTEND_URL}/student/auto-apply" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 1rem 2rem; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block;
                          font-weight: 600;">
                  Apply Now →
                </a>
              </div>
            </div>
          </div>
        `
      });

    } catch (error) {
      console.error('Error sending deadline reminder:', error);
    }
  }
}

module.exports = new NotificationService();