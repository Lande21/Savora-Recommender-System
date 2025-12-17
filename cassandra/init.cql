CREATE KEYSPACE IF NOT EXISTS recommendations WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
USE recommendations;

CREATE TABLE IF NOT EXISTS restaurant_recommendations (
    user_id INT PRIMARY KEY,
    restaurant_id INT
);
