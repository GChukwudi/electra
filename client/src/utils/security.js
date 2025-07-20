export const security = {
  
  // ==================== INPUT VALIDATION ====================
  
  validateInput: {
    /**
     * Validate candidate ID
     * @param {number|string} candidateId - Candidate ID to validate
     * @returns {Object} Validation result
     */
    candidateId(candidateId) {
      const id = parseInt(candidateId);
      
      if (isNaN(id)) {
        return { isValid: false, error: 'Candidate ID must be a number' };
      }
      
      if (id <= 0) {
        return { isValid: false, error: 'Candidate ID must be positive' };
      }
      
      if (id > 1000) {
        return { isValid: false, error: 'Invalid candidate ID' };
      }
      
      return { isValid: true, value: id };
    },
    
    /**
     * Validate candidate name
     * @param {string} name - Candidate name to validate
     * @returns {Object} Validation result
     */
    candidateName(name) {
      if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Candidate name is required' };
      }
      
      const trimmedName = name.trim();
      
      if (trimmedName.length === 0) {
        return { isValid: false, error: 'Candidate name cannot be empty' };
      }
      
      if (trimmedName.length < 2) {
        return { isValid: false, error: 'Candidate name must be at least 2 characters' };
      }
      
      if (trimmedName.length > 100) {
        return { isValid: false, error: 'Candidate name must be less than 100 characters' };
      }
      
      // Check for valid characters (letters, spaces, apostrophes, hyphens)
      if (!/^[a-zA-Z\s'\-\.]+$/.test(trimmedName)) {
        return { isValid: false, error: 'Candidate name contains invalid characters' };
      }
      
      return { isValid: true, value: trimmedName };
    },
    
    /**
     * Validate party name
     * @param {string} party - Party name to validate
     * @returns {Object} Validation result
     */
    partyName(party) {
      if (!party || typeof party !== 'string') {
        return { isValid: false, error: 'Party name is required' };
      }
      
      const trimmedParty = party.trim();
      
      if (trimmedParty.length === 0) {
        return { isValid: false, error: 'Party name cannot be empty' };
      }
      
      if (trimmedParty.length < 2) {
        return { isValid: false, error: 'Party name must be at least 2 characters' };
      }
      
      if (trimmedParty.length > 150) {
        return { isValid: false, error: 'Party name must be less than 150 characters' };
      }
      
      // Allow letters, numbers, spaces, and common punctuation
      if (!/^[a-zA-Z0-9\s'\-\.\(\)&]+$/.test(trimmedParty)) {
        return { isValid: false, error: 'Party name contains invalid characters' };
      }
      
      return { isValid: true, value: trimmedParty };
    },
    
    /**
     * Validate manifesto text
     * @param {string} manifesto - Manifesto to validate
     * @returns {Object} Validation result
     */
    manifesto(manifesto) {
      if (!manifesto || typeof manifesto !== 'string') {
        return { isValid: false, error: 'Manifesto is required' };
      }
      
      const trimmedManifesto = manifesto.trim();
      
      if (trimmedManifesto.length === 0) {
        return { isValid: false, error: 'Manifesto cannot be empty' };
      }
      
      if (trimmedManifesto.length < 10) {
        return { isValid: false, error: 'Manifesto must be at least 10 characters' };
      }
      
      if (trimmedManifesto.length > 2000) {
        return { isValid: false, error: 'Manifesto must be less than 2000 characters' };
      }
      
      return { isValid: true, value: trimmedManifesto };
    },
    
    /**
     * Validate election title
     * @param {string} title - Election title to validate
     * @returns {Object} Validation result
     */
    electionTitle(title) {
      if (!title || typeof title !== 'string') {
        return { isValid: false, error: 'Election title is required' };
      }
      
      const trimmedTitle = title.trim();
      
      if (trimmedTitle.length === 0) {
        return { isValid: false, error: 'Election title cannot be empty' };
      }
      
      if (trimmedTitle.length < 5) {
        return { isValid: false, error: 'Election title must be at least 5 characters' };
      }
      
      if (trimmedTitle.length > 200) {
        return { isValid: false, error: 'Election title must be less than 200 characters' };
      }
      
      return { isValid: true, value: trimmedTitle };
    },
    
    /**
     * Validate election description
     * @param {string} description - Election description to validate
     * @returns {Object} Validation result
     */
    electionDescription(description) {
      if (!description || typeof description !== 'string') {
        return { isValid: false, error: 'Election description is required' };
      }
      
      const trimmedDescription = description.trim();
      
      if (trimmedDescription.length === 0) {
        return { isValid: false, error: 'Election description cannot be empty' };
      }
      
      if (trimmedDescription.length < 10) {
        return { isValid: false, error: 'Election description must be at least 10 characters' };
      }
      
      if (trimmedDescription.length > 1000) {
        return { isValid: false, error: 'Election description must be less than 1000 characters' };
      }
      
      return { isValid: true, value: trimmedDescription };
    },
    
    /**
     * Validate timestamp
     * @param {number|string} timestamp - Timestamp to validate
     * @returns {Object} Validation result
     */
    timestamp(timestamp) {
      const ts = parseInt(timestamp);
      
      if (isNaN(ts)) {
        return { isValid: false, error: 'Invalid timestamp' };
      }
      
      if (ts < 0) {
        return { isValid: false, error: 'Timestamp cannot be negative' };
      }
      
      const now = Math.floor(Date.now() / 1000);
      const maxFuture = now + (365 * 24 * 60 * 60); // 1 year in future
      
      if (ts > maxFuture) {
        return { isValid: false, error: 'Timestamp too far in the future' };
      }
      
      return { isValid: true, value: ts };
    },
    
    /**
     * Validate Ethereum address
     * @param {string} address - Address to validate
     * @returns {Object} Validation result
     */
    ethereumAddress(address) {
      if (!address || typeof address !== 'string') {
        return { isValid: false, error: 'Address is required' };
      }
      
      const trimmedAddress = address.trim();
      
      if (trimmedAddress === '0x0000000000000000000000000000000000000000') {
        return { isValid: false, error: 'Cannot use zero address' };
      }
      
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
        return { isValid: false, error: 'Invalid Ethereum address format' };
      }
      
      return { isValid: true, value: trimmedAddress };
    }
  },
  
  // ==================== RATE LIMITING ====================
  
  rateLimit: {
    // Store for rate limiting data
    _storage: new Map(),
    
    /**
     * Check if action is rate limited
     * @param {string} action - Action name
     * @param {string} identifier - User identifier (address)
     * @param {number} maxAttempts - Maximum attempts allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Object} Rate limit status
     */
    check(action, identifier, maxAttempts = 5, windowMs = 60000) {
      const key = `${action}:${identifier}`;
      const now = Date.now();
      
      if (!this._storage.has(key)) {
        this._storage.set(key, { attempts: 1, firstAttempt: now });
        return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
      }
      
      const data = this._storage.get(key);
      
      // Reset if window has passed
      if (now - data.firstAttempt > windowMs) {
        this._storage.set(key, { attempts: 1, firstAttempt: now });
        return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
      }
      
      // Check if limit exceeded
      if (data.attempts >= maxAttempts) {
        return { 
          allowed: false, 
          remaining: 0, 
          resetTime: data.firstAttempt + windowMs,
          retryAfter: (data.firstAttempt + windowMs) - now
        };
      }
      
      // Increment attempts
      data.attempts++;
      this._storage.set(key, data);
      
      return { 
        allowed: true, 
        remaining: maxAttempts - data.attempts, 
        resetTime: data.firstAttempt + windowMs 
      };
    },
    
    /**
     * Record an attempt (for logging purposes)
     * @param {string} action - Action name
     * @param {string} identifier - User identifier
     */
    recordAttempt(action, identifier = 'anonymous') {
      const result = this.check(action, identifier, 10, 60000); // Default limits
      
      if (!result.allowed) {
        console.warn(`Rate limit exceeded for ${action} by ${identifier}`);
      }
      
      return result;
    },
    
    /**
     * Clear rate limit data for a specific key
     * @param {string} action - Action name
     * @param {string} identifier - User identifier
     */
    clear(action, identifier) {
      const key = `${action}:${identifier}`;
      this._storage.delete(key);
    },
    
    /**
     * Clear all rate limit data
     */
    clearAll() {
      this._storage.clear();
    }
  },
  
  // ==================== SANITIZATION ====================
  
  sanitize: {
    /**
     * Sanitize text input
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    text(input) {
      if (!input || typeof input !== 'string') return '';
      
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: urls
        .replace(/data:/gi, '') // Remove data: urls
        .replace(/vbscript:/gi, '') // Remove vbscript: urls
        .replace(/on\w+=/gi, '') // Remove event handlers
        .slice(0, 5000); // Limit length
    },
    
    /**
     * Sanitize HTML content
     * @param {string} html - HTML to sanitize
     * @returns {string} Sanitized HTML
     */
    html(html) {
      if (!html || typeof html !== 'string') return '';
      
      // Simple HTML sanitization - in production use a proper library like DOMPurify
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');
    }
  },
  
  // ==================== SECURITY CHECKS ====================
  
  checks: {
    /**
     * Check if user agent appears to be a bot
     * @returns {boolean} Whether user agent appears to be a bot
     */
    isBot() {
      if (typeof navigator === 'undefined') return true;
      
      const userAgent = navigator.userAgent.toLowerCase();
      const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper', 'headless',
        'phantom', 'selenium', 'webdriver', 'automated'
      ];
      
      return botPatterns.some(pattern => userAgent.includes(pattern));
    },
    
    /**
     * Check if environment appears to be development
     * @returns {boolean} Whether environment is development
     */
    isDevelopment() {
      return (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('dev') ||
         window.location.port !== '')
      );
    },
    
    /**
     * Check if connection is secure (HTTPS)
     * @returns {boolean} Whether connection is secure
     */
    isSecureConnection() {
      return (
        typeof window !== 'undefined' &&
        (window.location.protocol === 'https:' || this.isDevelopment())
      );
    },
    
    /**
     * Validate election timing constraints
     * @param {Object} times - Object with registration, start, and end times
     * @returns {Object} Validation result
     */
    validateElectionTiming(times) {
      const { registrationDeadline, startTime, endTime } = times;
      const now = Math.floor(Date.now() / 1000);
      
      // Basic validation
      if (registrationDeadline <= now) {
        return { isValid: false, error: 'Registration deadline must be in the future' };
      }
      
      if (startTime <= registrationDeadline) {
        return { isValid: false, error: 'Voting must start after registration deadline' };
      }
      
      if (endTime <= startTime) {
        return { isValid: false, error: 'Voting end time must be after start time' };
      }
      
      // Minimum durations
      const minRegistrationTime = 24 * 60 * 60; // 24 hours
      const minVotingTime = 1 * 60 * 60; // 1 hour
      const maxVotingTime = 30 * 24 * 60 * 60; // 30 days
      
      if (registrationDeadline - now < minRegistrationTime) {
        return { isValid: false, error: 'Registration period must be at least 24 hours' };
      }
      
      const votingDuration = endTime - startTime;
      if (votingDuration < minVotingTime) {
        return { isValid: false, error: 'Voting period must be at least 1 hour' };
      }
      
      if (votingDuration > maxVotingTime) {
        return { isValid: false, error: 'Voting period cannot exceed 30 days' };
      }
      
      return { isValid: true };
    },
    
    /**
     * Check for suspicious patterns in text
     * @param {string} text - Text to check
     * @returns {Object} Check result
     */
    checkSuspiciousContent(text) {
      if (!text || typeof text !== 'string') {
        return { isSuspicious: false };
      }
      
      const suspiciousPatterns = [
        /(.)\1{20,}/g, // Repeated characters
        /<script/gi, // Script tags
        /javascript:/gi, // JavaScript URLs
        /eval\s*\(/gi, // Eval functions
        /document\./gi, // DOM access
        /window\./gi, // Window access
        /alert\s*\(/gi, // Alert functions
        /prompt\s*\(/gi, // Prompt functions
        /confirm\s*\(/gi, // Confirm functions
        /\.innerHTML/gi, // innerHTML access
        /\.outerHTML/gi, // outerHTML access
        /on(click|load|error|focus|blur|change|submit)/gi // Event handlers
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(text)) {
          return { 
            isSuspicious: true, 
            reason: 'Contains potentially malicious content',
            pattern: pattern.source
          };
        }
      }
      
      return { isSuspicious: false };
    }
  },
  
  // ==================== ENCRYPTION/HASHING UTILITIES ====================
  
  crypto: {
    /**
     * Generate a simple hash (for non-cryptographic purposes)
     * @param {string} input - Input to hash
     * @returns {string} Hash string
     */
    simpleHash(input) {
      if (!input) return '';
      
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(16);
    },
    
    /**
     * Generate a random string
     * @param {number} length - Length of random string
     * @returns {string} Random string
     */
    randomString(length = 32) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      return result;
    },
    
    /**
     * Generate a UUID v4
     * @returns {string} UUID string
     */
    uuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },
  
  // ==================== SESSION SECURITY ====================
  
  session: {
    /**
     * Generate session token
     * @returns {string} Session token
     */
    generateToken() {
      const timestamp = Date.now().toString();
      const random = security.crypto.randomString(16);
      return security.crypto.simpleHash(timestamp + random);
    },
    
    /**
     * Validate session token format
     * @param {string} token - Token to validate
     * @returns {boolean} Whether token is valid format
     */
    validateToken(token) {
      return typeof token === 'string' && /^[a-f0-9]{8,}$/.test(token);
    },
    
    /**
     * Check if session is expired
     * @param {number} timestamp - Session start timestamp
     * @param {number} maxAge - Maximum age in milliseconds
     * @returns {boolean} Whether session is expired
     */
    isExpired(timestamp, maxAge = 24 * 60 * 60 * 1000) {
      return Date.now() - timestamp > maxAge;
    }
  },
  
  // ==================== CONTENT SECURITY ====================
  
  content: {
    /**
     * Check if content is appropriate
     * @param {string} content - Content to check
     * @returns {Object} Content check result
     */
    checkContent(content) {
      if (!content || typeof content !== 'string') {
        return { isAppropriate: true };
      }
      
      // Simple inappropriate content detection
      const inappropriateWords = [
        // Add appropriate filtering words for your context
        'spam', 'phishing', 'scam', 'fraud'
      ];
      
      const lowerContent = content.toLowerCase();
      
      for (const word of inappropriateWords) {
        if (lowerContent.includes(word)) {
          return {
            isAppropriate: false,
            reason: 'Contains inappropriate content',
            flaggedWord: word
          };
        }
      }
      
      return { isAppropriate: true };
    },
    
    /**
     * Calculate content similarity (simple implementation)
     * @param {string} content1 - First content
     * @param {string} content2 - Second content
     * @returns {number} Similarity score (0-1)
     */
    similarity(content1, content2) {
      if (!content1 || !content2) return 0;
      
      const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const norm1 = normalize(content1);
      const norm2 = normalize(content2);
      
      if (norm1 === norm2) return 1;
      
      const longer = norm1.length > norm2.length ? norm1 : norm2;
      const shorter = norm1.length > norm2.length ? norm2 : norm1;
      
      if (longer.length === 0) return 1;
      
      const editDistance = this._levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    },
    
    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Edit distance
     */
    _levenshteinDistance(str1, str2) {
      const matrix = [];
      
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[str2.length][str1.length];
    }
  },
  
  // ==================== LOGGING & MONITORING ====================
  
  log: {
    /**
     * Log security event
     * @param {string} event - Event type
     * @param {Object} details - Event details
     */
    securityEvent(event, details = {}) {
      const logData = {
        timestamp: new Date().toISOString(),
        event,
        details,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };
      
      console.warn('Security Event:', logData);
      
      // In production, send to logging service
      // this.sendToLoggingService(logData);
    },
    
    /**
     * Log failed attempt
     * @param {string} action - Action attempted
     * @param {string} reason - Failure reason
     * @param {Object} context - Additional context
     */
    failedAttempt(action, reason, context = {}) {
      this.securityEvent('failed_attempt', {
        action,
        reason,
        context
      });
    },
    
    /**
     * Log suspicious activity
     * @param {string} activity - Suspicious activity
     * @param {Object} details - Activity details
     */
    suspiciousActivity(activity, details = {}) {
      this.securityEvent('suspicious_activity', {
        activity,
        details
      });
    }
  }
};