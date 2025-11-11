// frontend/src/components/common/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaGraduationCap
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* About Section */}
          <div className="footer-section">
            <div className="footer-logo">
              <FaGraduationCap className="footer-logo-icon" />
              <h3>CGEIP</h3>
            </div>
            <p className="footer-description">
              Centralized Gateway for Education and Industry Placement - 
              Connecting students, educational institutions, and industry for a brighter future.
            </p>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          {/* For Students */}
          <div className="footer-section">
            <h4>For Students</h4>
            <ul className="footer-links">
              <li><a href="#institutions">Browse Institutions</a></li>
              <li><a href="#courses">Available Courses</a></li>
              <li><a href="#apply">How to Apply</a></li>
              <li><a href="#job-opportunities">Job Opportunities</a></li>
              <li><a href="#student-support">Student Support</a></li>
            </ul>
          </div>

          {/* For Institutions & Companies */}
          <div className="footer-section">
            <h4>For Partners</h4>
            <ul className="footer-links">
              <li><a href="#register-institution">Register Institution</a></li>
              <li><a href="#register-company">Register Company</a></li>
              <li><a href="#post-jobs">Post Jobs</a></li>
              <li><a href="#find-talent">Find Talent</a></li>
              <li><a href="#partner-benefits">Partner Benefits</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <ul className="footer-contact">
              <li>
                <FaMapMarkerAlt />
                <span>Maseru, Lesotho</span>
              </li>
              <li>
                <FaPhone />
                <span>+266 XXXX XXXX</span>
              </li>
              <li>
                <FaEnvelope />
                <span>info@cgeip.edu</span>
              </li>
            </ul>
            <div className="office-hours">
              <h5>Office Hours</h5>
              <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
              <p>Saturday: 9:00 AM - 1:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} CGEIP. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span className="separator">|</span>
              <Link to="/terms-of-service">Terms of Service</Link>
              <span className="separator">|</span>
              <Link to="/cookie-policy">Cookie Policy</Link>
              <span className="separator">|</span>
              <Link to="/accessibility">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;