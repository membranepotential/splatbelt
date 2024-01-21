CREATE schema IF NOT EXISTS api;

CREATE TYPE api.analysis_state AS enum (
  'CONFIGURING',    -- initial state, config can still be changed
  'PENDING',        -- waiting for analysis, config is locked from here
  'RUNNING',        -- analysis is running
  'COMPLETE',       -- analysis completed
  'FAILED'          -- analysis failed
);

CREATE TYPE api.camera_setting AS (
  position numeric[3], 
  up numeric[3],
  center numeric[3],
  fov numeric
);

CREATE FUNCTION api.new_camera(
  _position numeric[] DEFAULT ARRAY[1, 0, 0],
  _up numeric[] DEFAULT ARRAY[0, 1, 0],
  _center numeric[] DEFAULT ARRAY[0, 0, 0],
  _fov numeric DEFAULT 50
)
RETURNS api.camera_setting AS $$
BEGIN
  RETURN (_position, _up, _center, _fov)::api.camera_setting;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS api.projects (
  id serial primary key,
  created TIMESTAMP DEFAULT now(),
  updated TIMESTAMP DEFAULT now(),
  name text NOT NULL,
  state api.analysis_state NOT NULL DEFAULT 'CONFIGURING',
  camera api.camera_setting DEFAULT NULL,
  shots jsonb NOT NULL DEFAULT '[]',
  config jsonb NOT NULL DEFAULT '{}',
  logs jsonb NOT NULL DEFAULT '[]'
);

-- Append a log entry for a project
CREATE OR REPLACE FUNCTION api.append_log_entry(project_id INT, log_entry TEXT)
RETURNS VOID AS $$
DECLARE
  log_object JSONB;
BEGIN
  log_object := jsonb_build_object(
    'date', now(),
    'entry', log_entry
  );
  UPDATE api.projects SET logs = logs || log_object WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- Validate project update
CREATE OR REPLACE FUNCTION api.validate_projects_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if id or created columns are being modified
  IF OLD.id IS DISTINCT FROM NEW.id OR
     OLD.created IS DISTINCT FROM NEW.created THEN
    RAISE EXCEPTION 'Modification of id or created timestamp is not allowed.';
  END IF;

  -- Check if config is modified when the state is 'pending' or beyond
  IF (OLD.state != 'CONFIGURING' AND
      OLD.config IS DISTINCT FROM NEW.config) THEN
    RAISE EXCEPTION 'Modification of config is not allowed when state is pending or beyond.';
  END IF;

  -- Check if camera is modified when the state is 'complete' or 'failed'
  IF (OLD.state IN ('COMPLETE', 'FAILED') AND
      OLD.camera IS DISTINCT FROM NEW.camera) THEN
    RAISE EXCEPTION 'Modification of camera is not allowed when state is complete or failed.';
  END IF;

  -- Check that camera is set when state is 'complete' or 'failed'
  IF (NEW.state IN ('COMPLETE', 'FAILED')) THEN
    IF (NEW.camera IS NULL) THEN
      RAISE EXCEPTION 'Camera is required when state is complete or failed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_projects_update
BEFORE UPDATE ON api.projects
FOR EACH ROW EXECUTE FUNCTION api.validate_projects_update();


-- Set updated timestamp on update
CREATE OR REPLACE FUNCTION api.set_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_timestamp
BEFORE UPDATE OF name, config, state
ON api.projects
FOR EACH ROW EXECUTE FUNCTION api.set_updated_timestamp();
