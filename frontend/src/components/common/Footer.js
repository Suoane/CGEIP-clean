// frontend/src/components/common/Footer.js - COMPACT VERSION
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
              <li><a href="#about">About</a></li>
            </ul>
          </div>

          {/* For Students */}
          <div className="footer-section">
            <h4>For Students</h4>
            <ul className="footer-links">
              <li><a href="#courses">Browse Courses</a></li>
              <li><a href="#apply">Apply Now</a></li>
              <li><a href="#jobs">Job Opportunities</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contact</h4>
            <ul className="footer-contact">
              <li>
                <FaMapMarkerAlt />
                <span>Maseru, Lesotho</span>
              </li>
              <li>
                <FaPhone />
                <span>+266 5623 9921</span>
              </li>
              <li>
                <FaEnvelope />
                <span>info@cgeip.edu</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} CGEIP. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy-policy">Privacy</Link>
              <span className="separator">|</span>
              <Link to="/terms-of-service">Terms</Link>
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