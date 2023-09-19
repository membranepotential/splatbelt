from pathlib import Path

from dagster import OpExecutionContext, file_relative_path
from dagster_shell import execute_shell_command

BINPATH = file_relative_path(__file__, "../bin")
CWD = str(Path.cwd())


def execute_command_in_context(command: str, context: OpExecutionContext):
    execute_shell_command(command, output_logging="STREAM", log=context.log, cwd=CWD)


def execute_script(command: str, context: OpExecutionContext):
    ext = command.split(maxsplit=1)[0].split(".")[-1]
    if ext == "py":
        runner = "python"
    elif ext == "sh":
        runner = "bash"
    else:
        raise ValueError(f"Unknown script extension: {ext}")

    execute_command_in_context(f"{runner} {BINPATH}/{command}", context)
