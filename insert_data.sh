#!/bin/bash
PSQL="psql -X --username=postgres --dbname=notepod --no-align --tuples-only -c"

echo "Creating uuid-ossp extension if it does not exist..."
$PSQL "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "Truncating notes, password, todos, and users tables..."
$PSQL "TRUNCATE notes, password, todos"
echo "Tables truncated successfully"

# echo "Inserting new values into users..."
# $PSQL "INSERT INTO users (id, username, email, password, \"createdAt\", \"updatedAt\")
# VALUES
# (uuid_generate_v4(), 'john_doe', 'john@example.com', 'hashedpassword123', NOW(), NOW()),
# (uuid_generate_v4(), 'jane_smith', 'jane@example.com', 'hashedpassword456', NOW(), NOW()),
# (uuid_generate_v4(), 'alex_brown', 'alex@example.com', 'hashedpassword789', NOW(), NOW());"

echo "Inserting new values into todos..."
$PSQL "INSERT INTO todos (id, title, body, \"isDeleted\", \"userId\", \"deletedAt\", \"createdAt\", \"updatedAt\", priority, \"dueDate\")
VALUES
(uuid_generate_v4(), 'Buy groceries', 'Buy milk, eggs, bread, and vegetables for the week', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NULL, NOW(), NOW(), 'MEDIUM', '2024-10-05T18:00:00Z'),
(uuid_generate_v4(), 'Finish project report', 'Complete the quarterly project report for submission by end of day', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NULL, NOW(), NOW(), 'HIGH', '2024-10-03T23:59:00Z'),
(uuid_generate_v4(), 'Clean the house', 'Do the laundry, vacuum the living room, and clean the bathroom', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NULL, NOW(), NOW(), 'LOW', '2024-10-07T12:00:00Z');"

echo "Inserting new values into notes..."
$PSQL "INSERT INTO notes (id, title, body, \"isDeleted\", \"userId\", \"deletedAt\", \"createdAt\", \"updatedAt\")
VALUES
(uuid_generate_v4(), 'Meeting notes', 'Discussed project timelines and tasks for next week', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NULL, NOW(), NOW()),
(uuid_generate_v4(), 'Shopping list', 'Apples, Bananas, Chicken, Rice, and Olive Oil', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NULL, NOW(), NOW()),
(uuid_generate_v4(), 'Book ideas', 'Brainstorming ideas for a new sci-fi novel with futuristic elements', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NULL, NOW(), NOW());"

echo "Inserting new passwords into the password table..."
$PSQL "INSERT INTO password (id, fieldname, email, password,\"isDeleted\", \"userId\", \"createdAt\", \"updatedAt\", username)
VALUES
(uuid_generate_v4(), 'email_password', 'user1@example.com', 'hashed_password1', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NOW(), NOW(), 'john_doe'),
(uuid_generate_v4(), 'social_media_password', 'user2@example.com', 'hashed_password2', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NOW(), NOW(), 'jane_smith'),
(uuid_generate_v4(), 'bank_password', 'user3@example.com', 'hashed_password3', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NOW(), NOW(), 'alex_brown'),
(uuid_generate_v4(), 'shopping_site_password', 'user4@example.com', 'hashed_password4', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NOW(), NOW(), 'mary_jane'),
(uuid_generate_v4(), 'work_email_password', 'user5@example.com', 'hashed_password5', false, '24992fef-d16c-4e63-be0b-b169cf9b93f9', NOW(), NOW(), 'peter_parker');"

echo "Data inserted successfully."
