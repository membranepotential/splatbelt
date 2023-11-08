-- Test data
INSERT INTO api.projects (id, name) VALUES (1, 'name');


-- Test append log entry
SELECT api.append_log_entry(1, '{"message": "log entry"}');


-- Delete test data
DELETE FROM api.projects;
