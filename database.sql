/* Create */
CREATE TABLE account_game (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(50) NOT NULL,
  /* email VARCHAR(100) NOT NULL, */
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
SHOW TABLES;
DESCRIBE account;

/** Search */
USE test;
SELECT * FROM account_game;

/** Insert */
INSERT INTO account (username, password)
VALUES ('test', 'password');
       
/* Delete */
DELETE FROM account;