CREATE FUNCTION updated_timestamp_changed(column_name text, value text)
RETURNS BOOLEAN AS $$
DECLARE
    new_timestamp TIMESTAMP;
BEGIN
    INSERT INTO api.projects (id, name, updated) VALUES (1, 'test', 'epoch') ON CONFLICT (id) DO UPDATE SET updated = EXCLUDED.updated;
    EXECUTE format('UPDATE api.projects SET %I = %L WHERE id = 1', column_name, value);
    SELECT updated into new_timestamp FROM api.projects WHERE id = 1;
    return new_timestamp > 'epoch'::timestamp;
END;
$$ LANGUAGE plpgsql;

-- Test all columns
DO $$ BEGIN
    assert updated_timestamp_changed('name', 'test');
    assert updated_timestamp_changed('config', '{"key": "value"}');
    assert updated_timestamp_changed('state', 'PENDING');
    assert not updated_timestamp_changed('logs', '[{"message": "log entry"}]');
END;
$$ LANGUAGE plpgsql;

-- Delete test data
DELETE FROM api.projects;
