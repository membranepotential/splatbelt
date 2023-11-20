#!/usr/bin/env python3
import os
from pathlib import Path
import subprocess
from typing import Iterator, Literal
import logging

import click
import psycopg
from psycopg.sql import SQL


class Projects:
    fetch_query = SQL(
        """
        SELECT id::text, config::text
        FROM api.projects
        WHERE state = 'pending'
        ORDER BY created ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
        """
    )
    get_query = SQL("SELECT config::text FROM api.projects WHERE id = %s;")
    update_query = SQL("UPDATE api.projects SET state = %s WHERE id = %s;")
    log_query = SQL("SELECT api.append_log_entry(%s, %s);")

    def __init__(self, db_uri):
        self.conn = psycopg.connect(db_uri)
        self.conn.autocommit = True
        self.cursor = self.conn.cursor()

    def __iter__(self) -> Iterator[tuple[str, str]]:
        while True:
            self.cursor.execute(self.fetch_query)
            project = self.cursor.fetchone()

            if project is None:
                break

            yield project

    def get_project(self, project_id: str) -> tuple[str, str]:
        self.cursor.execute(self.get_query, (project_id,))
        config = self.cursor.fetchone()[0]
        return project_id, config

    def update_state(
        self,
        project_id: str,
        state: Literal["running", "complete", "failed"],
    ):
        self.cursor.execute(self.update_query, (state, project_id))

    def append_log_entry(self, project_id: str, message: str):
        self.cursor.execute(self.log_query, (project_id, message))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.cursor.close()
        self.conn.close()


class MakeProcess:
    def __init__(self, project_id: str, config: str, makefile: str = "/Makefile"):
        makefile = str(Path(makefile).absolute())

        workdir = Path.cwd() / project_id
        workdir.mkdir(exist_ok=True)

        cmd = f"make -f {makefile}"
        env = os.environ | {"PROJECT_ID": project_id, "CONFIG": config}

        self.process = subprocess.Popen(
            cmd,
            env=env,
            cwd=workdir,
            text=True,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )

    def wait(self) -> int:
        return self.process.wait()

    def __iter__(self) -> Iterator[str]:
        for line in iter(self.process.stdout.readline, ""):
            line = line.strip()
            if line:
                print(line, flush=True)
                yield line


def process_project(project_id: str, config: str, projects: Projects, makefile: str):
    logging.info("Process project %s", project_id)
    try:
        projects.update_state(project_id, "running")

        process = MakeProcess(project_id, config, makefile)
        for line in process:
            projects.append_log_entry(project_id, line)

        retcode = process.wait()
        if retcode != 0:
            projects.update_state(project_id, "failed")
        else:
            projects.update_state(project_id, "complete")

    except Exception as e:
        projects.append_log_entry(project_id, str(e))
        projects.update_state(project_id, "failed")
        raise


@click.command()
@click.argument("db-uri", required=False)
@click.option("-p", "--project-id", default=None)
@click.option("-f", "--makefile", default="/Makefile")
def main(db_uri, project_id, makefile):
    if db_uri is None:
        db_uri = os.environ["POSTGRES_URL"]

    with Projects(db_uri) as projects:
        if project_id is not None:
            project_id, config = projects.get_project(project_id)
            process_project(project_id, config, projects, makefile)
        else:
            for project_id, config in projects:
                process_project(project_id, config, projects, makefile)
            else:
                print("No projects to process")


if __name__ == "__main__":
    main()
