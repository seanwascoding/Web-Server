/* Create */
USE test;
CREATE TABLE Team (
  username VARCHAR(50) NOT NULL,
  room_key VARCHAR(50) NOT NULL
);

SHOW TABLES;
DESCRIBE account;

/** Search */
USE test;
SELECT * FROM Team;

/** Insert */
INSERT INTO Team (username, room_key)
VALUES ('sean', 'test');
       
/* Delete */
DELETE FROM Team;