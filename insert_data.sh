#!/bin/bash
export PGPASSWORD="00005"
PSQL="psql -h localhost --username=postgres --dbname=notepod --no-align --tuples-only -c"

echo "Creating uuid-ossp extension if it does not exist..."
$PSQL "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "Truncating notes, password, todos, and users tables..."
$PSQL "TRUNCATE notes, password, todos"
echo "Tables truncated successfully"

echo "Inserting new values into users..."
#insert new values into the users table and return the userId
userIds=()
while IFS= read -r line; do
  userIds+=("$line")
done < <($PSQL "INSERT INTO users (id, username, email, password, \"createdAt\", \"updatedAt\")
VALUES
(uuid_generate_v4(), 'john_doe', 'john@example.com', 'hashedpassword123', NOW(), NOW()),
(uuid_generate_v4(), 'jane_smith', 'jane@example.com', 'hashedpassword456', NOW(), NOW()),
(uuid_generate_v4(), 'alex_brown', 'alex@example.com', 'hashedpassword789', NOW(), NOW()) RETURNING id;")

userId1=${userIds[0]}
userId2=${userIds[1]}
userId3=${userIds[2]}

echo "User IDs parsed: $userId1, $userId2, $userId3"

echo "Inserting new values into todos..."
$PSQL "INSERT INTO todos (id, title, body, \"isDeleted\", \"userId\", \"deletedAt\", \"createdAt\", \"updatedAt\", priority, \"dueDate\")
VALUES
(uuid_generate_v4(), 'Buy groceries', 'Buy milk, eggs, bread, and vegetables for the week', false, '$userId1', NULL, NOW(), NOW(), 'MEDIUM', '2024-10-05T18:00:00Z'),
(uuid_generate_v4(), 'Finish project report', 'Complete the quarterly project report for submission by end of day', false, '$userId2', NULL, NOW(), NOW(), 'HIGH', '2024-10-03T23:59:00Z'),
(uuid_generate_v4(), 'Clean the house', 'Do the laundry, vacuum the living room, and clean the bathroom', false, '$userId3', NULL, NOW(), NOW(), 'LOW', '2024-10-07T12:00:00Z');"

echo "Inserting new values into notes..."
$PSQL "INSERT INTO notes (id, title, body, \"isDeleted\", \"userId\", \"deletedAt\", \"createdAt\", \"updatedAt\")
VALUES
(uuid_generate_v4(), 'Meeting notes', 'Discussed project timelines and tasks for next week', false, '$userId1', NULL, NOW(), NOW()),
(uuid_generate_v4(), 'Shopping list', 'Apples, Bananas, Chicken, Rice, and Olive Oil', false, '$userId2', NULL, NOW(), NOW()),
(uuid_generate_v4(), 'Book ideas', 'Brainstorming ideas for a new sci-fi novel with futuristic elements', false, '$userId2', NULL, NOW(), NOW());"

echo "Inserting new passwords into the password table..."
$PSQL "INSERT INTO password (id, fieldname, email, password,\"isDeleted\", \"userId\", \"createdAt\", \"updatedAt\", username)
VALUES
(uuid_generate_v4(), 'email_password', 'user1@example.com', 'hashed_password1', false, '$userId1', NOW(), NOW(), 'john_doe'),
(uuid_generate_v4(), 'social_media_password', 'user2@example.com', 'hashed_password2', false, '$userId2', NOW(), NOW(), 'jane_smith'),
(uuid_generate_v4(), 'bank_password', 'user3@example.com', 'hashed_password3', false, '$userId3', NOW(), NOW(), 'alex_brown'),
(uuid_generate_v4(), 'shopping_site_password', 'user4@example.com', 'hashed_password4', false, '$userId1', NOW(), NOW(), 'mary_jane'),
(uuid_generate_v4(), 'work_email_password', 'user5@example.com', 'hashed_password5', false, '$userId1', NOW(), NOW(), 'peter_parker');"

echo "Data inserted successfully."
