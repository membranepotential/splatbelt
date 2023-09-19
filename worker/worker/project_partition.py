import warnings
from dagster import (
    DynamicPartitionsDefinition,
    ExperimentalWarning,
)

warnings.filterwarnings("ignore", category=ExperimentalWarning)
project_partition = DynamicPartitionsDefinition(name="project_id")
