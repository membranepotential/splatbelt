-- Test data
INSERT INTO api.projects (id, name) VALUES (1, 'test');

CREATE FUNCTION assert_config_is_readonly(value text)
RETURNS VOID AS $$
BEGIN
    UPDATE api.projects SET config = to_jsonb(value) WHERE id = 1;
    RAISE assert_failure;
EXCEPTION
    WHEN assert_failure THEN
        RAISE EXCEPTION 'Config should be readonly';
    WHEN OTHERS THEN    
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    next_state api.analysis_state;
BEGIN
    -- Updating config in initial state should succeed
    UPDATE api.projects SET config = '"configuring"' WHERE id = 1;

    -- Updating config after succeeding states should fail
    FOREACH next_state IN ARRAY enum_range('pending'::api.analysis_state, NULL)
    LOOP
        UPDATE api.projects SET state = next_state WHERE id = 1;
        PERFORM assert_config_is_readonly(next_state::text);
    END LOOP;
END;
$$ LANGUAGE plpgsql;



-- Delete test data
DELETE FROM api.projects;
