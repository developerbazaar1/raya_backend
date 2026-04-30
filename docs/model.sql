CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('business_owner', 'employee') NOT NULL,
    user_profile TEXT,
    dateOfJoining date,
    owner
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE business_owners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE, 
    business_name VARCHAR(100),
    business_type VARCHAR(50),
    address TEXT,
    country VARCHAR(50),
    state VARCHAR(50),
    city VARCHAR(50),
    zip_code VARCHAR(50),
    website VARCHAR(100),
    company_logo TEXT,
    total_time_off VARCHAR(100),
    notification BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(255),
    what_brings_you_there VARCHAR(255),
    what_brings_you_there_other VARCHAR(255),
    how_did_you_hear_about_us VARCHAR(255),
    how_did_you_hear_about_us_other VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone_no Int(20),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE employee_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    business_owner_id INT NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE
);



CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    business_owner_id INT NOT NULL,
    employee_role_id INT,
    hiring_date DATE,
    department VARCHAR(100),
    designation VARCHAR(100),
    gender VARCHAR(20),
    birth_date DATE,
    address TEXT,
    timezone VARCHAR(255),
    notification BOOLEAN DEFAULT FALSE,

    spouse_name VARCHAR(100),
    spouse_anniversary DATE,
    spouse_gender VARCHAR(50),

    kids_name VARCHAR(100),
    kids_birthday DATE,
    kids_gender VARCHAR(50),

    pet_name VARCHAR(100),
    pet_age VARCHAR(50),

    fav_flowers VARCHAR(100),
    fav_cake_flower VARCHAR(100),
    fav_online_store VARCHAR(100),
    fav_local_business VARCHAR(100),
    fav_restaurants VARCHAR(100),

    totaltimeoff default 15;


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_role_id) REFERENCES employee_roles(id) ON DELETE SET NULL
);

-- Not clear some requirements are pending
CREATE TABLE plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE, 
    plan_name VARCHAR(100),
    price Int(20),
    description TEXT,
    feature VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



-- Not clear some requirements are pending


-- DONE
CREATE TABLE time_off_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,

    business_owner_id INT NOT NULL,
    employee_id INT NOT NULL,

    reason TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT,

    status ENUM(
        'pending',
        'approved',
        'rejected',
        'change_requested'
    ) DEFAULT 'pending',

    owner_comment TEXT,

    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);


-- DONE
CREATE TABLE team_meetings (
    id INT PRIMARY KEY AUTO_INCREMENT,

    business_owner_id INT NOT NULL,
    created_by_user_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    invited_members VARCHAR(150)

    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);




-- DONE
CREATE TABLE calendar_events (
    id INT PRIMARY KEY AUTO_INCREMENT,

    business_owner_id INT NOT NULL,
    created_by_user_id INT NOT NULL,

    event_name VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,

    favorite VARCHAR(150),

    is_all_day BOOLEAN DEFAULT FALSE,

    status ENUM('active', 'cancelled') DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE todos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    business_owner_id INT NOT NULL,
    created_by_user_id INT NOT NULL,
    assigned_to_employee_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT,

    due_date DATE,

    repetition ENUM('none', 'daily', 'weekly', 'monthly') DEFAULT 'none',

    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',

    progress INT DEFAULT 0, -- 0 to 100

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_employee_id) REFERENCES employees(id) ON DELETE CASCADE
);




 /* assesments */
CREATE TABLE assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,

    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_by_admin_id INT NOT NULL,
    questions JSON NOT NULL, /* it contains questions and options */
    is_visible_to_business_owner BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE CASCADE
);


/* business_owner_assessments */
CREATE TABLE business_owner_assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,

    business_owner_id INT NOT NULL,
    assessment_id INT NOT NULL,

    is_required BOOLEAN DEFAULT FALSE,
    is_visible_to_employees BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,

    UNIQUE (business_owner_id, assessment_id)
);


/* employee_assessment_attempts */

CREATE TABLE employee_assessment_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,

    employee_id INT NOT NULL,
    assessment_id INT NOT NULL,
    business_owner_id INT NOT NULL,

    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',

    answers JSON,

    started_at TIMESTAMP NULL,
    submitted_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,

    UNIQUE (employee_id, assessment_id)
);




CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,

    business_owner_id INT NOT NULL,
    created_by_user_id INT NOT NULL,

    project_name VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE,

    add_member VARCHAR(150),
    status ENUM('active', 'completed', 'pending', 'cancelled') DEFAULT 'active',
    progress INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);





CREATE TABLE project_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,

    project_id INT NOT NULL,
    created_by_user_id INT NOT NULL,

    task_name VARCHAR(150) NOT NULL,
    description TEXT,

    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE,

    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE project_task_assignees (
    id INT PRIMARY KEY AUTO_INCREMENT,

    project_task_id INT NOT NULL,
    employee_id INT NOT NULL,
    project_upload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,

    UNIQUE (project_task_id, employee_id)
);