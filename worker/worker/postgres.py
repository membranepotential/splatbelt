from postgres import Postgres
from pydantic import PrivateAttr

from dagster import ConfigurableResource


class PostgresDBResource(ConfigurableResource):
    user: str
    password: str
    host: str

    _db: Postgres = PrivateAttr()

    def setup_for_execution(self, context):
        url = f"postgres://{self.user}:{self.password}@{self.host}"
        self._db = Postgres(url)

    @property
    def projects(self):
        return self._db.all("SELECT * FROM api.projects;")

    def get_project(self, project_id: str) -> dict:
        sql = f"SELECT * FROM api.projects WHERE id={project_id};"
        return self._db.one(sql)
