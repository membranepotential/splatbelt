CREATE schema IF NOT EXISTS api;

CREATE TYPE api.analysis_state AS enum (
  'configuring',    -- initial state, config can still be changed
  'pending',        -- waiting for analysis, config is locked from here
  'running',        -- analysis is running
  'failed',         -- analysis failed
  'complete'       -- analysis completed
);

CREATE TABLE IF NOT EXISTS api.projects (
  id serial primary key,
  created TIMESTAMP DEFAULT now(),
  updated TIMESTAMP DEFAULT now(),
  name text NOT NULL,
  state api.analysis_state NOT NULL DEFAULT 'configuring',
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

  -- Check if config is being modified when the state is 'pending' or beyond
  IF (OLD.state != 'configuring' AND
      OLD.config IS DISTINCT FROM NEW.config) THEN
    RAISE EXCEPTION 'Modification of config is not allowed when state is pending or beyond.';
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
