// CREATE TABLE employee_leave_balances (
//    id INT PRIMARY KEY AUTO_INCREMENT,

//    employee_id INT NOT NULL,
//    leave_type_id INT NOT NULL,

//    year INT NOT NULL,

//    total_allocated DECIMAL(5,2),
//    carried_forward DECIMAL(5,2) DEFAULT 0,

//    used_days DECIMAL(5,2) DEFAULT 0,
//    remaining_days DECIMAL(5,2),

//    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       ON UPDATE CURRENT_TIMESTAMP
// );