# syntax = docker/dockerfile:experimental
ARG base_image
ARG venv_image

FROM ${venv_image} as poetry

USER root
COPY poetry.lock pyproject.toml ./
RUN --mount=type=cache,mode=0755,target=/root/.cache/pip poetry install --no-interaction --no-dev

FROM ${base_image} as runtime

COPY --from=poetry $VENV_PATH $VENV_PATH

ARG app_name
COPY ./src /${app_name}
