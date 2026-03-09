-- ============================================================================
-- ATS Optimization Suite - MySQL Database Schema
-- ============================================================================
-- This file contains the complete MySQL schema for storing user profiles,
-- uploaded resumes, and generated analysis reports for historical tracking.
--
-- Author: Senior Full-Stack Engineer
-- Version: 2.0.0
-- ============================================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ats_optimizer 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE ats_optimizer;

-- ============================================================================
-- TABLE: user_profiles
-- Stores user account information for the platform
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255),
    phone               VARCHAR(50),
    linkedin_url        VARCHAR(500),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active           BOOLEAN DEFAULT TRUE,
    
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: analysis_reports
-- Stores all resume analysis reports with comprehensive scoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_reports (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    user_id                 INT,
    filename                VARCHAR(255) NOT NULL,
    file_path               VARCHAR(500),
    file_size               INT,
    file_type               ENUM('pdf', 'txt') DEFAULT 'pdf',
    
    -- Overall Score
    overall_score           INT NOT NULL,
    grade                   ENUM('Excellent', 'Good', 'Average', 'Needs Work') DEFAULT 'Average',
    
    -- Four Core Metrics
    tone_style_score        INT DEFAULT 0,
    content_score           INT DEFAULT 0,
    structure_score         INT DEFAULT 0,
    skills_match_score      INT DEFAULT 0,
    
    -- Analysis Details
    word_count              INT DEFAULT 0,
    skill_count             INT DEFAULT 0,
    impact_verb_count       INT DEFAULT 0,
    
    -- Job Targeting
    job_role                VARCHAR(255),
    company                 VARCHAR(255),
    job_description         TEXT,
    job_match_percentage     DECIMAL(5,2) DEFAULT 0.00,
    
    -- Metadata
    ai_provider             VARCHAR(50),
    analysis_method         ENUM('local', 'ai_embedding', 'ai_api') DEFAULT 'local',
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_overall_score (overall_score),
    INDEX idx_created_at (created_at),
    INDEX idx_job_role (job_role),
    INDEX idx_company (company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: extracted_skills
-- Stores skills extracted from resumes during analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS extracted_skills (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    report_id           INT NOT NULL,
    skill_name          VARCHAR(255) NOT NULL,
    skill_type          ENUM('hard', 'soft', 'domain') DEFAULT 'hard',
    domain              VARCHAR(100),
    
    FOREIGN KEY (report_id) REFERENCES analysis_reports(id) ON DELETE CASCADE,
    
    INDEX idx_report_id (report_id),
    INDEX idx_skill_name (skill_name),
    INDEX idx_skill_type (skill_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: ai_recommendations
-- Stores AI-generated recommendations for each analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    report_id           INT NOT NULL,
    category            ENUM('tone_style', 'content', 'structure', 'skills', 'general') DEFAULT 'general',
    priority            ENUM('high', 'medium', 'low') DEFAULT 'medium',
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    is_implemented      BOOLEAN DEFAULT FALSE,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES analysis_reports(id) ON DELETE CASCADE,
    
    INDEX idx_report_id (report_id),
    INDEX idx_category (category),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: detected_sections
-- Stores section detection results (Experience, Education, Skills, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS detected_sections (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    report_id           INT NOT NULL,
    section_name        VARCHAR(50) NOT NULL,
    is_detected         BOOLEAN DEFAULT FALSE,
    position            INT,
    
    FOREIGN KEY (report_id) REFERENCES analysis_reports(id) ON DELETE CASCADE,
    
    INDEX idx_report_id (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: contact_info
-- Stores extracted contact information from resumes
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_info (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    report_id           INT NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(50),
    linkedin_url        VARCHAR(500),
    location            VARCHAR(255),
    website             VARCHAR(500),
    
    FOREIGN KEY (report_id) REFERENCES analysis_reports(id) ON DELETE CASCADE,
    
    INDEX idx_report_id (report_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: editor_sessions
-- Stores editor sessions for version tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS editor_sessions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT,
    report_id           INT,
    raw_text            LONGTEXT NOT NULL,
    score               INT,
    job_description     TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (report_id) REFERENCES analysis_reports(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_report_id (report_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: improvement_history
-- Tracks user improvement over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS improvement_history (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    report_id           INT NOT NULL,
    previous_score      INT,
    new_score           INT,
    score_change        INT,
    time_diff_days      INT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES analysis_reports(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Sample Data: Test User (for development)
-- ============================================================================
-- INSERT INTO user_profiles (email, password_hash, full_name)
-- VALUES ('demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pKvW', 'Demo User');

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Recent analyses with scores
CREATE OR REPLACE VIEW v_recent_analyses AS
SELECT 
    ar.id,
    ar.filename,
    ar.overall_score,
    ar.grade,
    ar.job_role,
    ar.company,
    ar.created_at,
    up.full_name
FROM analysis_reports ar
LEFT JOIN user_profiles up ON ar.user_id = up.id
ORDER BY ar.created_at DESC;

-- View: User improvement summary
CREATE OR REPLACE VIEW v_user_improvement AS
SELECT 
    up.id AS user_id,
    up.full_name,
    COUNT(ar.id) AS total_analyses,
    AVG(ar.overall_score) AS avg_score,
    MAX(ar.overall_score) AS best_score,
    MIN(ar.overall_score) AS first_score,
    MAX(ar.created_at) AS last_analysis
FROM user_profiles up
LEFT JOIN analysis_reports ar ON up.id = ar.user_id
GROUP BY up.id, up.full_name;

-- ============================================================================
-- Stored Procedure: Calculate Improvement
-- ============================================================================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_calculate_improvement(
    IN p_user_id INT
)
BEGIN
    DECLARE v_prev_score INT DEFAULT NULL;
    DECLARE v_new_score INT;
    DECLARE v_report_id INT;
    DECLARE v_done BOOLEAN DEFAULT FALSE;
    
    DECLARE cur_reports CURSOR FOR 
        SELECT id, overall_score 
        FROM analysis_reports 
        WHERE user_id = p_user_id 
        ORDER BY created_at ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    OPEN cur_reports;
    
    REPEAT
        FETCH cur_reports INTO v_report_id, v_new_score;
        
        IF NOT v_done THEN
            IF v_prev_score IS NOT NULL THEN
                INSERT INTO improvement_history (user_id, report_id, previous_score, new_score, score_change)
                VALUES (p_user_id, v_report_id, v_prev_score, v_new_score, v_new_score - v_prev_score);
            END IF;
            SET v_prev_score = v_new_score;
        END IF;
        
    UNTIL v_done END REPEAT;
    
    CLOSE cur_reports;
END //

DELIMITER ;

-- ============================================================================
-- End of Schema
-- ============================================================================
