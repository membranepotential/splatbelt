INSERT INTO api.projects (id, name) VALUES (1, 'test');

CREATE FUNCTION assert_camera_required()
RETURNS VOID AS $$
BEGIN
    UPDATE api.projects SET state = 'COMPLETE' WHERE id = 1;
    RAISE assert_failure;
EXCEPTION
    WHEN assert_failure THEN
        RAISE EXCEPTION 'State update should fail without camera';
    WHEN OTHERS THEN    
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION assert_camera_readonly()
RETURNS VOID AS $$
BEGIN
    UPDATE api.projects SET camera = api.new_camera(ARRAY[2, 0, 0]) WHERE id = 1;
    RAISE assert_failure;
EXCEPTION
    WHEN assert_failure THEN
        RAISE EXCEPTION 'Camera should be readonly';
    WHEN OTHERS THEN
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    next_state api.analysis_state;
BEGIN
    -- Updating camera in initial state should succeed
    UPDATE api.projects SET camera = api.new_camera() WHERE id = 1;
    UPDATE api.projects SET camera = NULL WHERE id = 1;

    -- Updating state without camera should fail
    PERFORM assert_camera_required();

    -- Updating state with camera should succeed
    UPDATE api.projects SET state = 'COMPLETE', camera = api.new_camera() WHERE id = 1;

    -- Updating camera in completed state should fail
    PERFORM assert_camera_readonly();
END;
$$ LANGUAGE plpgsql;

DELETE FROM api.projects;
