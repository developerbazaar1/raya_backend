// CREATE TABLE time_off_requests (
//     id INT PRIMARY KEY AUTO_INCREMENT,

//     business_owner_id INT NOT NULL,
//     employee_id INT NOT NULL,

//     reason TEXT,
//     start_date DATE NOT NULL,
//     end_date DATE NOT NULL,
//     total_days INT,

//     status ENUM(
//         'pending',
//         'approved',
//         'rejected',
//         'change_requested'
//     ) DEFAULT 'pending',

//     owner_comment TEXT,

//     requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

//     FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
//     FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
// );
