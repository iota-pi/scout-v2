# syntax = docker/dockerfile:experimental
ARG venv_image
FROM ${venv_image}

USER root
COPY poetry.lock pyproject.toml ./
RUN --mount=type=cache,mode=0755,target=/root/.cache/pip poetry install --no-interaction

ARG username=appuser
USER ${username}
